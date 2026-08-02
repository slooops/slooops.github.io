from __future__ import annotations

import json
import os
import re
import inspect
from pathlib import Path
from typing import Any, Literal, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field


PROMPT_DIR = Path(__file__).resolve().parent
BACKEND_PROMPT_FILE = PROMPT_DIR / "backend-code-generation-prompt.md"
UI_PROMPT_FILE = PROMPT_DIR / "ui-code-generation-prompt.md"
DEFAULT_CODEGEN_MODEL = os.getenv("DASHBOARD_CODEGEN_MODEL", "gpt-5-nano")


async def _get_llm():
    """Lazy import to avoid circular dependency with main.py."""
    from main import get_llm

    return await get_llm()


class DashboardQueries(BaseModel):
    summary: str
    details: str
    detailsFiltered: str
    summaryUpdate: str


class DashboardDetailsFilter(BaseModel):
    columnName: str
    type: Literal["select", "text"]


class DashboardCodegenRequest(BaseModel):
    componentName: str
    featureName: str
    queries: DashboardQueries
    paramAliases: dict[str, str] = Field(default_factory=dict)
    assignmentUsersKey: str
    summaryColumns: list[str]
    detailsTableFilters: list[DashboardDetailsFilter]
    roleName: str
    userName: str | None = None
    userEmail: str | None = None


class DashboardCodegenResult(BaseModel):
    backendDocument: str
    uiDocument: str
    backendHandoff: dict[str, Any]


class DashboardCodegenState(TypedDict, total=False):
    input: dict[str, Any]
    backend_document: str
    backend_handoff: dict[str, Any]
    ui_document: str


def _load_prompt_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            chunk.get("text", "") if isinstance(chunk, dict) else str(chunk)
            for chunk in content
        )
    return str(content)


async def _get_codegen_llm(model_name: str = DEFAULT_CODEGEN_MODEL):
    from main import get_llm

    get_llm_sig = inspect.signature(get_llm)
    if "model" in get_llm_sig.parameters:
        try:
            llm = await get_llm(model=model_name)  # type: ignore[call-arg]
        except TypeError:
            llm = await _get_llm()
    else:
        llm = await _get_llm()

    current_model = (
        getattr(llm, "model_name", None)
        or getattr(llm, "model", None)
        or getattr(llm, "deployment_name", None)
    )
    if current_model == model_name:
        return llm

    if hasattr(llm, "bind"):
        return llm.bind(model=model_name)

    return llm


def _strip_balanced_wrappers(expr: str) -> str:
    wrappers = ("trunc", "to_date", "nvl", "coalesce", "upper", "lower", "trim", "cast")
    s = expr.strip()
    changed = True
    while changed:
        changed = False
        for fn in wrappers:
            prefix = f"{fn}("
            if s.lower().startswith(prefix) and s.endswith(")"):
                inner = s[len(prefix) : -1].strip()
                depth = 0
                first_arg_end = None
                for idx, ch in enumerate(inner):
                    if ch == "(":
                        depth += 1
                    elif ch == ")":
                        depth = max(0, depth - 1)
                    elif ch == "," and depth == 0:
                        first_arg_end = idx
                        break
                s = inner if first_arg_end is None else inner[:first_arg_end].strip()
                changed = True
    return s


def _normalize_column_name(expr: str) -> str:
    s = _strip_balanced_wrappers(expr)
    s = s.strip().strip("\"'")

    if "." in s:
        s = s.split(".")[-1]

    ident = re.search(r"([A-Za-z_][A-Za-z0-9_]*)$", s)
    if ident:
        s = ident.group(1)

    s = re.sub(r"[^A-Za-z0-9_]", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s.lower()


def _where_clause(sql: str) -> str:
    match = re.search(
        r"\bwhere\b(.*?)(\border\s+by\b|\bgroup\s+by\b|\bhaving\b|\bfetch\b|\bunion\b|$)",
        sql,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return match.group(1) if match else ""


def _extract_column_for_placeholder(condition: str) -> str:
    condition = condition.strip().strip("()")

    for op in ("=", ">=", "<=", "<>", "!=", ">", "<"):
        if op in condition:
            left, right = condition.split(op, 1)
            left_has_q = "?" in left
            right_has_q = "?" in right
            if left_has_q and not right_has_q:
                return _normalize_column_name(right)
            if right_has_q and not left_has_q:
                return _normalize_column_name(left)

    prior_text = condition.split("?", 1)[0]
    ident = re.findall(r"([A-Za-z_][A-Za-z0-9_\.]*)", prior_text)
    return _normalize_column_name(ident[-1] if ident else "")


@tool
def derive_names(component_name: str) -> dict[str, str]:
    """Derive naming variants from a dashboard component name."""
    words = re.findall(r"[A-Za-z0-9]+", component_name)
    if not words:
        return {
            "upper_snake": "",
            "dot": "",
            "camel": "",
            "pascal": "",
            "kebab": "",
        }

    lower_words = [w.lower() for w in words]
    return {
        "upper_snake": "_".join(w.upper() for w in lower_words),
        "dot": ".".join(lower_words),
        "camel": lower_words[0] + "".join(w.title() for w in lower_words[1:]),
        "pascal": "".join(w.title() for w in lower_words),
        "kebab": "-".join(lower_words),
    }


@tool
def extract_where_placeholders(sql: str) -> list[str]:
    """Extract ordered snake_case columns mapped to '?' in SQL WHERE clause."""
    where_part = _where_clause(sql)
    if not where_part:
        return []

    conditions = re.split(r"\bAND\b|\bOR\b", where_part, flags=re.IGNORECASE)
    result: list[str] = []

    for cond in conditions:
        count = cond.count("?")
        if count <= 0:
            continue
        col = _extract_column_for_placeholder(cond)
        if not col:
            continue
        result.extend([col] * count)

    return result


@tool
def extract_update_where_placeholders(update_sql: str) -> list[str]:
    """Extract ordered snake_case columns mapped to '?' in UPDATE ... WHERE clause only."""
    return extract_where_placeholders.func(update_sql)


@tool
def build_backend_handoff(payload: dict[str, Any]) -> dict[str, Any]:
    """Build deterministic backend handoff payload for UI generation."""
    component_name = payload["componentName"]
    queries = payload["queries"]
    aliases = payload.get("paramAliases") or {}

    names = derive_names.func(component_name)
    keys_to_map = extract_where_placeholders.func(queries["detailsFiltered"])

    submit_keys = extract_update_where_placeholders.func(queries["summaryUpdate"])
    mapped_submit = [aliases.get(col, col) for col in submit_keys]

    handoff = {
        "componentName": component_name,
        "featureName": payload["featureName"],
        "roleName": payload["roleName"],
        "assignmentUsersKey": payload["assignmentUsersKey"],
        "summaryColumns": payload["summaryColumns"],
        "detailsTableFilters": payload["detailsTableFilters"],
        "uiEndpointMap": {
            "summaryUrl": f"{names['kebab']}-summary",
            "detailsUrl": f"{names['kebab']}-details",
            "filteredDetailsUrl": f"{names['kebab']}-details-filtered",
            "summaryUpdateUrl": f"{names['kebab']}-summary-update",
        },
        "keysToMap": keys_to_map,
        "submitKeysToMap": mapped_submit,
        "webexKeysToMap": mapped_submit,
    }

    return handoff


async def backend_generation_node(state: DashboardCodegenState) -> DashboardCodegenState:
    llm = await _get_codegen_llm()
    backend_prompt = _load_prompt_file(BACKEND_PROMPT_FILE)
    payload = state["input"]

    response = await llm.ainvoke(
        [
            SystemMessage(content=backend_prompt),
            HumanMessage(content=json.dumps(payload)),
        ]
    )

    return {"backend_document": _content_to_text(response.content)}


async def compute_handoff_node(state: DashboardCodegenState) -> DashboardCodegenState:
    return {"backend_handoff": build_backend_handoff.func(state["input"])}


async def ui_generation_node(state: DashboardCodegenState) -> DashboardCodegenState:
    llm = await _get_codegen_llm()
    ui_prompt = _load_prompt_file(UI_PROMPT_FILE)

    payload = state["input"].copy()
    payload["backendHandoff"] = state["backend_handoff"]

    response = await llm.ainvoke(
        [
            SystemMessage(content=ui_prompt),
            HumanMessage(content=json.dumps(payload)),
        ]
    )

    return {"ui_document": _content_to_text(response.content)}


def _build_graph():
    graph = StateGraph(DashboardCodegenState)
    graph.add_node("backend_generation_node", backend_generation_node)
    graph.add_node("compute_handoff_node", compute_handoff_node)
    graph.add_node("ui_generation_node", ui_generation_node)

    graph.add_edge(START, "backend_generation_node")
    graph.add_edge("backend_generation_node", "compute_handoff_node")
    graph.add_edge("compute_handoff_node", "ui_generation_node")
    graph.add_edge("ui_generation_node", END)

    return graph.compile()


_dashboard_codegen_graph = _build_graph()


async def run_dashboard_codegen(payload: DashboardCodegenRequest) -> DashboardCodegenResult:
    final_state = await _dashboard_codegen_graph.ainvoke(
        {"input": payload.model_dump(mode="json")}
    )

    return DashboardCodegenResult(
        backendDocument=final_state.get("backend_document", ""),
        uiDocument=final_state.get("ui_document", ""),
        backendHandoff=final_state.get("backend_handoff", {}),
    )
