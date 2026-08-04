from __future__ import annotations

import json
import os
import re
import inspect
import time
import hmac
import hashlib
from pathlib import Path
from typing import Any, Literal, TypedDict

import httpx
from fastapi import APIRouter, Request
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field


PROMPT_DIR = Path(__file__).resolve().parent
BACKEND_PROMPT_FILE = PROMPT_DIR / "backend-code-generation-prompt.md"
UI_PROMPT_FILE = PROMPT_DIR / "ui-code-generation-prompt.md"
OPERATIONS_PROMPT_FILE = PROMPT_DIR / "code-apply-operations-prompt.md"
DEFAULT_CODEGEN_MODEL = os.getenv("DASHBOARD_CODEGEN_MODEL", "gpt-5-nano")

router = APIRouter()

_http_client = httpx.AsyncClient(timeout=30.0)

# ── GitHub App configuration ───────────────────────────────────────
GITHUB_APP_ID: str = os.getenv("GITHUB_APP_ID", "").strip()
GITHUB_APP_PRIVATE_KEY: str = os.getenv("GITHUB_APP_PRIVATE_KEY", "").strip()
GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "").strip()
GITHUB_APP_INSTALLATION_ID: str = os.getenv("GITHUB_APP_INSTALLATION_ID", "").strip()
GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "").strip()
GITHUB_API_BASE_URL: str = os.getenv("GITHUB_API_BASE_URL", "https://api.github.com").rstrip("/")


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
    fileOperations: list[dict[str, Any]] = Field(default_factory=list)


class GitHubSmokeTestRequest(BaseModel):
    owner: str
    repo: str


class DashboardApplyTriggerRequest(BaseModel):
    """Payload sent by UI button click to initiate apply workflow.

    Accepts the already-generated output from POST /api/dashboard-codegen.
    Does NOT re-run code generation.
    """

    owner: str
    repo: str
    baseBranch: str = "main"
    dryRun: bool = True
    backendDocument: str
    uiDocument: str
    backendHandoff: dict[str, Any]
    fileOperations: list[dict[str, Any]] = Field(default_factory=list)


class DashboardCodegenState(TypedDict, total=False):
    input: dict[str, Any]
    backend_document: str
    backend_handoff: dict[str, Any]
    ui_document: str
    file_operations: list[dict[str, Any]]


def _github_missing_config() -> list[str]:
    missing: list[str] = []
    if not GITHUB_APP_ID:
        missing.append("GITHUB_APP_ID")
    if not GITHUB_APP_PRIVATE_KEY:
        missing.append("GITHUB_APP_PRIVATE_KEY")
    if not GITHUB_WEBHOOK_SECRET:
        missing.append("GITHUB_WEBHOOK_SECRET")
    if not GITHUB_APP_INSTALLATION_ID:
        missing.append("GITHUB_APP_INSTALLATION_ID")
    return missing


def _normalize_private_key(raw_key: str) -> str:
    return raw_key.replace("\\n", "\n").strip()


def _build_github_app_jwt() -> str:
    try:
        import jwt  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "PyJWT is required for GitHub App auth. Install with: pip install pyjwt"
        ) from exc

    now = int(time.time())
    payload = {
        "iat": now - 60,
        "exp": now + 540,
        "iss": GITHUB_APP_ID,
    }
    token = jwt.encode(payload, _normalize_private_key(GITHUB_APP_PRIVATE_KEY), algorithm="RS256")
    return token if isinstance(token, str) else token.decode("utf-8")


async def _get_github_installation_token() -> str:
    missing = _github_missing_config()
    if missing:
        raise RuntimeError(f"Missing GitHub App config: {', '.join(missing)}")

    jwt_token = _build_github_app_jwt()
    url = f"{GITHUB_API_BASE_URL}/app/installations/{GITHUB_APP_INSTALLATION_ID}/access_tokens"
    resp = await _http_client.post(
        url,
        headers={
            "Authorization": f"Bearer {jwt_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    resp.raise_for_status()
    data = resp.json()
    token = data.get("token", "")
    if not token:
        raise RuntimeError("GitHub installation token response did not include 'token'.")
    return token


def _verify_github_webhook_signature(raw_body: bytes, signature_header: str | None) -> bool:
    if not GITHUB_WEBHOOK_SECRET:
        return False
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(
        GITHUB_WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


@router.get("/github-app/health")
async def github_app_health() -> dict[str, Any]:
    missing = _github_missing_config()
    return {
        "configured": len(missing) == 0,
        "missing": missing,
        "hasClientId": bool(GITHUB_CLIENT_ID),
        "hasClientSecret": bool(GITHUB_CLIENT_SECRET),
        "installationId": GITHUB_APP_INSTALLATION_ID or None,
    }


@router.post("/github-app/smoke-test")
async def github_app_smoke_test(payload: GitHubSmokeTestRequest) -> dict[str, Any]:
    try:
        installation_token = await _get_github_installation_token()
    except Exception as exc:
        return {"ok": False, "stage": "token_exchange", "error": str(exc)}

    repo_url = f"{GITHUB_API_BASE_URL}/repos/{payload.owner}/{payload.repo}"
    try:
        repo_resp = await _http_client.get(
            repo_url,
            headers={
                "Authorization": f"token {installation_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        repo_resp.raise_for_status()
        repo_data = repo_resp.json()
    except Exception as exc:
        return {"ok": False, "stage": "repo_read", "error": str(exc)}

    return {
        "ok": True,
        "repo": f"{payload.owner}/{payload.repo}",
        "defaultBranch": repo_data.get("default_branch"),
        "permissions": {
            "admin": (repo_data.get("permissions") or {}).get("admin", False),
            "push": (repo_data.get("permissions") or {}).get("push", False),
            "pull": (repo_data.get("permissions") or {}).get("pull", False),
        },
    }


@router.post("/api/github/webhooks")
async def github_webhook(request: Request) -> dict[str, Any]:
    raw_body = await request.body()
    sig_header = request.headers.get("X-Hub-Signature-256")
    event = request.headers.get("X-GitHub-Event", "unknown")
    delivery = request.headers.get("X-GitHub-Delivery", "")

    if not _verify_github_webhook_signature(raw_body, sig_header):
        return {"ok": False, "error": "invalid_signature"}

    payload = json.loads(raw_body.decode("utf-8") or "{}")
    return {
        "ok": True,
        "event": event,
        "action": payload.get("action"),
        "delivery": delivery,
    }


@router.post("/api/dashboard-codegen/apply-with-agent")
async def dashboard_codegen_apply_with_agent(payload: DashboardApplyTriggerRequest) -> dict[str, Any]:
    """Endpoint triggered by UI button click to start/preview automated apply flow."""
    try:
        installation_token = await _get_github_installation_token()
    except Exception as exc:
        return {"ok": False, "stage": "token_exchange", "error": str(exc)}

    repo_url = f"{GITHUB_API_BASE_URL}/repos/{payload.owner}/{payload.repo}"
    try:
        repo_resp = await _http_client.get(
            repo_url,
            headers={
                "Authorization": f"token {installation_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        repo_resp.raise_for_status()
        repo_data = repo_resp.json()
    except Exception as exc:
        return {"ok": False, "stage": "repo_read", "error": str(exc)}

    if not payload.fileOperations:
        return {
            "ok": False,
            "stage": "validate_payload",
            "error": "fileOperations is required. First call /api/dashboard-codegen and pass its fileOperations into apply-with-agent.",
        }

    return {
        "ok": True,
        "triggered": True,
        "dryRun": payload.dryRun,
        "repo": f"{payload.owner}/{payload.repo}",
        "baseBranch": payload.baseBranch,
        "defaultBranch": repo_data.get("default_branch"),
        "backendDocument": payload.backendDocument,
        "uiDocument": payload.uiDocument,
        "backendHandoff": payload.backendHandoff,
        "fileOperations": payload.fileOperations,
        "fileOperationCount": len(payload.fileOperations),
        "next": "Implement branch/create-commit/PR job execution using fileOperations.",
    }


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


def _extract_json_object(text: str) -> dict[str, Any]:
    """Extract first JSON object from plain or fenced model output."""
    text = text.strip()
    if not text:
        return {}

    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL)
    candidate = fenced.group(1).strip() if fenced else text

    if candidate.startswith("{") and candidate.endswith("}"):
        try:
            parsed = json.loads(candidate)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            pass

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start >= 0 and end > start:
        try:
            parsed = json.loads(candidate[start : end + 1])
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


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


async def operations_generation_node(state: DashboardCodegenState) -> DashboardCodegenState:
    llm = await _get_codegen_llm()
    operations_prompt = _load_prompt_file(OPERATIONS_PROMPT_FILE)

    payload = {
        "input": state["input"],
        "backendHandoff": state["backend_handoff"],
        "backendDocument": state["backend_document"],
        "uiDocument": state["ui_document"],
    }

    response = await llm.ainvoke(
        [
            SystemMessage(content=operations_prompt),
            HumanMessage(content=json.dumps(payload)),
        ]
    )

    raw = _content_to_text(response.content)
    parsed = _extract_json_object(raw)
    ops = parsed.get("fileOperations", []) if isinstance(parsed, dict) else []
    if not isinstance(ops, list):
        ops = []
    normalized_ops = [op for op in ops if isinstance(op, dict)]
    return {"file_operations": normalized_ops}


def _build_graph():
    graph = StateGraph(DashboardCodegenState)
    graph.add_node("backend_generation_node", backend_generation_node)
    graph.add_node("compute_handoff_node", compute_handoff_node)
    graph.add_node("ui_generation_node", ui_generation_node)
    graph.add_node("operations_generation_node", operations_generation_node)

    graph.add_edge(START, "backend_generation_node")
    graph.add_edge("backend_generation_node", "compute_handoff_node")
    graph.add_edge("compute_handoff_node", "ui_generation_node")
    graph.add_edge("ui_generation_node", "operations_generation_node")
    graph.add_edge("operations_generation_node", END)

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
        fileOperations=final_state.get("file_operations", []) or [],
    )
