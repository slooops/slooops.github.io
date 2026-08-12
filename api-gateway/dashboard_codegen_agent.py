from __future__ import annotations

import asyncio
import base64
import json
import os
import re
import inspect
import time
import hmac
import hashlib
import functools
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Literal, TypedDict
from uuid import uuid4

import httpx
from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field


PROMPT_DIR = Path(__file__).resolve().parent
BACKEND_PROMPT_FILE = PROMPT_DIR / "backend-code-generation-prompt.md"
UI_PROMPT_FILE = PROMPT_DIR / "ui-code-generation-prompt.md"
OPERATIONS_PROMPT_FILE = PROMPT_DIR / "code-apply-operations-prompt.md"
DEFAULT_CODEGEN_MODEL = os.getenv("DASHBOARD_CODEGEN_MODEL", "gpt-5-nano")
REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMATICS_ROOT = REPO_ROOT / "revenue-monitoring-ui" / "angular-app" / "schematics" / "monitoring-dashboard" / "files"

router = APIRouter()

_http_client = httpx.AsyncClient(timeout=30.0)

# ── Demo in-memory job store (DB-free polling) ─────────────────────────────
_demo_jobs: dict[str, dict[str, Any]] = {}
_demo_jobs_lock = asyncio.Lock()

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
    sessionId: str | None = None
    backendDocument: str
    uiDocument: str
    backendHandoff: dict[str, Any]
    fileOperations: list[dict[str, Any]] = Field(default_factory=list)
    warnings: list[dict[str, Any]] = Field(default_factory=list)


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
    baseBranch: str = "develop"
    dryRun: bool = True
    backendDocument: str
    uiDocument: str
    backendHandoff: dict[str, Any]
    fileOperations: list[dict[str, Any]] = Field(default_factory=list)


class DashboardCodegenState(TypedDict, total=False):
    input: dict[str, Any]
    session_id: str | None
    backend_document: str
    backend_handoff: dict[str, Any]
    ui_document: str
    file_operations: list[dict[str, Any]]
    warnings: list[dict[str, Any]]


def _session_id_from_handoff(handoff: dict[str, Any] | None) -> str | None:
    if not isinstance(handoff, dict):
        return None
    raw = handoff.get("sessionId")
    if not isinstance(raw, str):
        return None
    value = raw.strip()
    return value or None


async def _persist_generation_failure(
    state: DashboardCodegenState,
    *,
    error: Exception,
    error_code: str,
) -> None:
    """Demo mode: DB persistence disabled for generation failures."""
    # DB persistence intentionally disabled for demo.
    session_id = state.get("session_id")
    if session_id:
        print(
            f"[codegen] Demo mode generation failure (session={session_id}, code={error_code}): {error}"
        )


async def _persist_apply_failure(
    *,
    session_id: str | None,
    user_id: str | None,
    component_name: str | None,
    stage: str,
    error: str,
    model_version: str | None = DEFAULT_CODEGEN_MODEL,
) -> None:
    """Demo mode: DB persistence disabled for apply failures."""
    # DB persistence intentionally disabled for demo.
    if session_id:
        print(
            f"[codegen] Demo mode apply failure (session={session_id}, stage={stage}): {error}"
        )


async def _resolve_codegen_user_email(
    *,
    session_id: str | None,
    backend_handoff: dict[str, Any],
) -> str | None:
    """Resolve the codegen requester's email for post-apply notifications."""
    raw_email = backend_handoff.get("userEmail")
    if isinstance(raw_email, str) and raw_email.strip():
        return raw_email.strip()

    raw_user_name = backend_handoff.get("userName")
    if isinstance(raw_user_name, str) and raw_user_name.strip():
        return f"{raw_user_name.strip().lower()}@cisco.com"

    if session_id:
        async with _demo_jobs_lock:
            job = _demo_jobs.get(session_id)
        if isinstance(job, dict):
            payload = job.get("payload")
            if isinstance(payload, dict):
                payload_email = payload.get("userEmail")
                if isinstance(payload_email, str) and payload_email.strip():
                    return payload_email.strip()
                payload_user = payload.get("userName")
                if isinstance(payload_user, str) and payload_user.strip():
                    return f"{payload_user.strip().lower()}@cisco.com"

    return None


async def _notify_codegen_pr_created(
    *,
    session_id: str | None,
    backend_handoff: dict[str, Any],
    owner: str,
    repo: str,
    base_branch: str,
    generated_branch: str,
    pr_url: str,
    changed_file_count: int,
) -> bool:
    """Send a Webex DM after a successful PR creation (best effort)."""
    recipient_email = await _resolve_codegen_user_email(
        session_id=session_id,
        backend_handoff=backend_handoff,
    )
    if not recipient_email:
        print("[codegen] Webex notify skipped: requester email unavailable")
        return False

    component_name = str(backend_handoff.get("componentName") or "Dashboard")
    feature_name = str(backend_handoff.get("featureName") or "dashboard")
    message = (
        f"🎉 Great news! Your **{component_name}** dashboard code has been generated and is ready for onboarding onto the Control Tower.\n\n"
        f"A pull request has been created with {changed_file_count} file(s) generated:\n"
        f"📋 **PR:** {pr_url}\n"
        f"🌿 **Branch:** {generated_branch}\n\n"
        f"Next steps:\n"
        f"1. Review the generated code in the PR\n"
        f"2. Get it approved by your team\n"
        f"3. Merge to trigger deployment to dev environment\n\n"
        f"Once deployed, access your dashboard at:\n"
        f"🔗 https://operations-control-tower-dev.cisco.com/{feature_name}\n\n"
        f"Questions or issues? Reach out to the Control Tower team!"
    )

    try:
        from control_tower_admin_agent import send_webex_dm

        await send_webex_dm(recipient_email, message)
        print(f"[codegen] Webex notify sent to {recipient_email}")
        return True
    except Exception as exc:
        print(f"[codegen] Webex notify failed for {recipient_email}: {exc}")
        return False


def _title_case_kebab(value: str) -> str:
    return " ".join(part.capitalize() for part in value.split("-") if part)


def _classify_kebab(value: str) -> str:
    return "".join(part.capitalize() for part in value.split("-") if part)


def _is_safe_relative_path(path: str) -> bool:
    if not path or Path(path).is_absolute():
        return False
    parts = Path(path).parts
    return all(part not in ("..", "") for part in parts)


def _resolve_group_file(root_path: str, relative_path: str, repo_root: Path = REPO_ROOT) -> Path:
    if not _is_safe_relative_path(root_path) or not _is_safe_relative_path(relative_path):
        raise ValueError(f"Unsafe path: {root_path}/{relative_path}")
    return (repo_root / root_path / relative_path).resolve()


@functools.lru_cache(maxsize=16)
def _read_schematic_template(template_name: str) -> str | None:
    # Schematic template files are static at runtime; cache reads (C4).
    template_path = SCHEMATICS_ROOT / template_name
    if not template_path.exists():
        return None
    return template_path.read_text(encoding="utf-8")


def _render_monitoring_schematic_template(relative_path: str, assignment_filter_key: str) -> str | None:
    feature_match = re.match(r"src/app/([^/]+)/\1\.component\.(ts|html|css|spec\.ts)$", relative_path)
    if not feature_match:
        return None

    feature_name, ext = feature_match.groups()
    template_name = f"__name@dasherize__.component.{ext}.template"
    content = _read_schematic_template(template_name)
    if content is None:
        return None

    replacements = {
        "<%= selectorPrefix %>": "app-",
        "<%= dasherize(name) %>": feature_name,
        "<%= classify(name) %>": _classify_kebab(feature_name),
        "<%= title %>": _title_case_kebab(feature_name),
        "<%= assignmentFilterKey %>": assignment_filter_key,
    }
    for key, value in replacements.items():
        content = content.replace(key, value)
    return content


def _extract_monitoring_schematic_name(command: str) -> str | None:
    match = re.search(r"monitoring-dashboard\s+([^\s]+)", command)
    if not match:
        return None
    return match.group(1).strip().strip("\"'")


def _extract_assignment_filter_key(command: str) -> str | None:
    """Extract --assignmentFilterKey value from schematic command.

    Supports both forms:
    - --assignmentFilterKey=value
    - --assignmentFilterKey "value"
    """
    if not isinstance(command, str) or not command.strip():
        return None

    inline = re.search(r"--assignmentFilterKey=(?:\"([^\"]+)\"|'([^']+)'|([^\s]+))", command)
    if inline:
        value = inline.group(1) or inline.group(2) or inline.group(3)
        if isinstance(value, str) and value.strip():
            return value.strip()

    spaced = re.search(r"--assignmentFilterKey\s+(?:\"([^\"]+)\"|'([^']+)'|([^\s]+))", command)
    if spaced:
        value = spaced.group(1) or spaced.group(2) or spaced.group(3)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def _monitoring_schematic_paths(feature_name: str, include_tests: bool) -> list[str]:
    base = f"src/app/{feature_name}/{feature_name}.component"
    paths = [
        f"{base}.ts",
        f"{base}.html",
        f"{base}.css",
    ]
    if include_tests:
        paths.append(f"{base}.spec.ts")
    return paths


def _command_skips_tests(command: str) -> bool:
    return "--skip-tests" in command or "--skipTests" in command


def _replace_marker_block(content: str, marker: str, replacement: str, file_path: str) -> str:
    marker_patterns = {
        "VISIBLE_TABS": re.compile(r"visibleTabs:\s*\{.*?\}\[\]\s*=\s*\[\];", re.DOTALL),
        "FIELD_CONFIG": re.compile(r"fieldConfig:\s*\{.*?\}\[\]\s*=\s*\[\];", re.DOTALL),
        "ASSIGNMENT_FILTER_KEY": re.compile(r"assignmentUsersFilterKey:\s*['\"][^'\"]*['\"],?"),
    }

    # ASSIGNMENT_FILTER_KEY is self-healing and never hard-fails: the schematic
    # `run_command` preStep already renders the component with the correct
    # assignmentUsersFilterKey value (via --assignmentFilterKey), so this op is
    # only a best-effort re-assertion. Hard-failing here (the historical bug)
    # blocks the entire apply when the component pre-exists on the base branch
    # or the seeded content diverges. Strategy:
    #   1. If the `assignmentUsersFilterKey: '...'` line exists -> replace it.
    #   2. Else if the `// ASSIGNMENT_FILTER_KEY` comment marker exists ->
    #      insert the property immediately after it.
    #   3. Else -> return content unchanged (key already set upstream).
    if marker == "ASSIGNMENT_FILTER_KEY":
        value_pattern = marker_patterns["ASSIGNMENT_FILTER_KEY"]
        if value_pattern.search(content):
            return value_pattern.sub(lambda _m: replacement, content, count=1)
        comment_pattern = re.compile(r"^[ \t]*//[ \t]*ASSIGNMENT_FILTER_KEY.*$", re.MULTILINE)
        comment_match = comment_pattern.search(content)
        if comment_match:
            replacement_normalized = replacement.strip()
            if replacement_normalized and replacement_normalized in content:
                return content
            indent_match = re.match(r"^([ \t]*)", comment_match.group(0))
            indent = indent_match.group(1) if indent_match else ""
            insert_at = comment_match.end()
            snippet = "\n" + indent + replacement.strip()
            return content[:insert_at] + snippet + content[insert_at:]
        # Neither the value line nor the comment marker is present. The key was
        # already materialized by the schematic template render; do not fail.
        return content

    if marker in marker_patterns:
        pattern = marker_patterns[marker]
        if not pattern.search(content):
            raise ValueError(f"Marker block '{marker}' not found in {file_path}")
        # Use callable replacement so backslashes in code are preserved
        # literally (no regex backreference expansion like \1).
        return pattern.sub(lambda _m: replacement, content, count=1)

    line_pattern = re.compile(rf"^.*{re.escape(marker)}.*$", re.MULTILINE)
    marker_match = line_pattern.search(content)
    if not marker_match:
        raise ValueError(f"Marker line '{marker}' not found in {file_path}")

    replacement_normalized = replacement.strip()
    if replacement_normalized and replacement_normalized in content:
        # Idempotency: if the block is already present, do not insert again.
        return content

    insert_at = marker_match.end()
    snippet = "\n" + replacement.rstrip() + "\n"
    return content[:insert_at] + snippet + content[insert_at:]


def _ts_string_literal(value: str) -> str:
    """Render a value as a single-quoted TS string literal, escaping quotes."""
    return "'" + str(value).replace("\\", "\\\\").replace("'", "\\'") + "'"


def _build_route_data_block(route_path: str, route_data: dict[str, Any] | None) -> str:
    """Build the `data: { ... }` block for a generated route.

    Every generated route MUST carry a `data` block with at least `header`,
    otherwise AppComponent's `@if (header.length > 0)` throws on direct URL
    load and blanks the entire app shell. Defaults are supplied here and can be
    overridden by an optional `route_data` map from the preStep.
    """
    default_sub_header = f"Continuous Monitoring > {_title_case_kebab(route_path)}"
    data: dict[str, Any] = {
        "title": "Finance-IT Control Tower",
        "header": "Finance-IT Control Tower",
        "subHeader": default_sub_header,
        "supportsDarkMode": True,
    }
    if route_data:
        data.update({k: v for k, v in route_data.items() if v is not None})

    lines = ["    data: {\n"]
    for key, value in data.items():
        if isinstance(value, bool):
            rendered = "true" if value else "false"
        else:
            rendered = _ts_string_literal(value)
        lines.append(f"      {key}: {rendered},\n")
    lines.append("    },\n")
    return "".join(lines)


QUERY_BEANS_MARKER = "GENERATED_QUERY_BEANS"


def _insert_before_class_close(content: str, snippet: str) -> str:
    """Insert Java class members into a class body.

    Preferred: splice immediately above the GENERATED_QUERY_BEANS marker line
    (robust anchor, matching the menu/UI marker pattern). Fallback: if no
    marker is present, insert before the class-closing brace (last `}`).

    Appending generated `@Value`/`@Bean` members to the raw end of the file
    places them *after* the final `}`, outside the class body (a compile
    error). Both strategies keep blank-line separation so members never glue
    onto the previous `;` or the closing brace (`;@Bean` / `}@Value`).
    """
    body = snippet.strip("\n")

    marker_match = re.search(
        rf"^[ \t]*.*{re.escape(QUERY_BEANS_MARKER)}.*$", content, re.MULTILINE
    )
    if marker_match:
        insert_at = marker_match.start()
        before = content[:insert_at].rstrip()
        return before + "\n\n" + body + "\n\n" + content[insert_at:]

    idx = content.rfind("}")
    if idx == -1:
        return content.rstrip() + "\n\n" + body.strip() + "\n"
    before = content[:idx].rstrip()
    after = content[idx:]  # begins with the class-closing brace
    return before + "\n\n" + body + "\n" + after


def _apply_append_operation(relative_path: str, current: str, content: str) -> str:
    """Append content, but for Java files insert before the class-closing brace."""
    if relative_path.endswith(".java"):
        return _insert_before_class_close(current, content)
    return current + content


MENU_NAV_MARKER = "GENERATED_MONITORING_NAV_ITEMS"


def _build_nav_item_block(
    label: str,
    route_path: str,
    icon: str,
    roles: list[str],
    indent: str,
) -> str:
    prop_indent = indent + "  "
    roles_literal = "[" + ", ".join(_ts_string_literal(r) for r in roles) + "]"
    return (
        f"{indent}{{\n"
        f"{prop_indent}label: {_ts_string_literal(label)},\n"
        f"{prop_indent}icon: {_ts_string_literal(icon)},\n"
        f"{prop_indent}route: '/{route_path}',\n"
        f"{prop_indent}roles: {roles_literal},\n"
        f"{indent}}},\n"
    )


def _apply_menu_update(
    content: str,
    label: str,
    route_path: str,
    icon: str,
    roles: list[str],
) -> str:
    """Insert a side-nav child item into the Continuous Monitoring group.

    The new NavItem is spliced in immediately before the
    GENERATED_MONITORING_NAV_ITEMS marker line so generated dashboards appear
    in the left navigation. Idempotent: a route already present is left as-is.
    """
    if f"route: '/{route_path}'" in content:
        return content
    marker_match = re.search(
        rf"^([ \t]*).*{re.escape(MENU_NAV_MARKER)}.*$", content, re.MULTILINE
    )
    if not marker_match:
        raise ValueError(
            f"Menu nav marker '{MENU_NAV_MARKER}' not found in menu.component.ts"
        )
    indent = marker_match.group(1)
    block = _build_nav_item_block(label, route_path, icon, roles, indent)
    insert_at = marker_match.start()
    return content[:insert_at] + block + content[insert_at:]


def _apply_routing_update(
    content: str,
    import_path: str,
    component_class: str,
    route_path: str,
    route_data: dict[str, Any] | None = None,
) -> str:
    import_line = f"import {{ {component_class} }} from '{import_path}';"
    if import_line not in content:
        import_matches = list(re.finditer(r"^import .*;$", content, re.MULTILINE))
        if not import_matches:
            raise ValueError("No import section found in routing module")
        insert_at = import_matches[-1].end()
        content = content[:insert_at] + "\n" + import_line + content[insert_at:]

    data_block = _build_route_data_block(route_path, route_data)
    route_snippet = (
        "  {\n"
        f"    path: '{route_path}',\n"
        f"    component: {component_class},\n"
        f"{data_block}"
        "  },\n"
    )
    if f"path: '{route_path}'" not in content and f'path: "{route_path}"' not in content:
        routes_match = re.search(r"export const routes: Routes = \[(.*?)\n\];", content, re.DOTALL)
        if not routes_match:
            raise ValueError("Routes array not found in routing module")
        insert_at = routes_match.end() - 3
        content = content[:insert_at] + route_snippet + content[insert_at:]

    return content


def _validate_grouped_file_operations(file_operations: list[dict[str, Any]]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not file_operations:
        errors.append("fileOperations must contain backend/frontend groups")
        return errors, warnings

    groups_by_target = {group.get("target"): group for group in file_operations if isinstance(group, dict)}
    for target, expected_root in (("backend", "revenue-monitoring-server"), ("frontend", "revenue-monitoring-ui/angular-app")):
        group = groups_by_target.get(target)
        if not isinstance(group, dict):
            errors.append(f"Missing '{target}' fileOperations group")
            continue
        if group.get("rootPath") != expected_root:
            errors.append(f"{target}.rootPath must be '{expected_root}'")
        if not isinstance(group.get("preSteps"), list):
            errors.append(f"{target}.preSteps must be a list")
        if not isinstance(group.get("operations"), list):
            errors.append(f"{target}.operations must be a list")

    frontend = groups_by_target.get("frontend")
    if isinstance(frontend, dict):
        pre_steps = frontend.get("preSteps") if isinstance(frontend.get("preSteps"), list) else []
        if len(pre_steps) < 2:
            errors.append("frontend.preSteps must include schematic run_command and update_routing_module")
        else:
            if pre_steps[0].get("op") != "run_command":
                errors.append("frontend.preSteps[0] must be run_command")
            if pre_steps[1].get("op") != "update_routing_module":
                errors.append("frontend.preSteps[1] must be update_routing_module")
            run_command = pre_steps[0].get("command") if isinstance(pre_steps[0], dict) else None
            if not isinstance(run_command, str) or not _extract_assignment_filter_key(run_command):
                errors.append("frontend.preSteps[0].command must include --assignmentFilterKey=<value>")

        operations = frontend.get("operations") if isinstance(frontend.get("operations"), list) else []
        if not operations:
            errors.append("frontend.operations cannot be empty")

    for group in file_operations:
        if not isinstance(group, dict):
            errors.append("Each fileOperations group must be an object")
            continue
        target = group.get("target", "unknown")
        pre_steps = group.get("preSteps") if isinstance(group.get("preSteps"), list) else []
        for index, step in enumerate(pre_steps):
            if not isinstance(step, dict):
                errors.append(f"{target}.preSteps[{index}] must be an object")
                continue
            step_op = step.get("op")
            if step_op == "run_command":
                if not isinstance(step.get("command"), str) or not step.get("command", "").strip():
                    errors.append(f"{target}.preSteps[{index}].command is required")
            elif step_op == "update_routing_module":
                required = ("filePath", "importPath", "componentClass", "routePath")
                for field_name in required:
                    if not isinstance(step.get(field_name), str) or not step.get(field_name, "").strip():
                        errors.append(f"{target}.preSteps[{index}].{field_name} is required")
                file_path = step.get("filePath")
                if isinstance(file_path, str) and not _is_safe_relative_path(file_path):
                    errors.append(f"Unsafe routing filePath: {file_path}")
            elif step_op == "update_menu_component":
                required = ("filePath", "label", "routePath")
                for field_name in required:
                    if not isinstance(step.get(field_name), str) or not step.get(field_name, "").strip():
                        errors.append(f"{target}.preSteps[{index}].{field_name} is required")
                file_path = step.get("filePath")
                if isinstance(file_path, str) and not _is_safe_relative_path(file_path):
                    errors.append(f"Unsafe menu filePath: {file_path}")
                if not isinstance(step.get("roles"), list) or not step.get("roles"):
                    errors.append(f"{target}.preSteps[{index}].roles must be a non-empty list")
            else:
                errors.append(f"Unsupported preStep op '{step_op}' in {target}.preSteps[{index}]")

        operations = group.get("operations") if isinstance(group.get("operations"), list) else []
        for index, operation in enumerate(operations):
            if not isinstance(operation, dict):
                errors.append(f"{target}.operations[{index}] must be an object")
                continue
            op = operation.get("op")
            path = operation.get("path")
            if not isinstance(path, str) or not path.strip():
                errors.append(f"{target}.operations[{index}].path is required")
                continue
            if not _is_safe_relative_path(path):
                errors.append(f"Unsafe path in {target}.operations[{index}]: {path}")
            if op not in {"json_merge", "append", "create_or_replace", "replace_text", "replace_marker_block"}:
                errors.append(f"Unsupported op '{op}' in {target}.operations[{index}]")
            if op == "replace_marker_block" and not operation.get("marker"):
                errors.append(f"{target}.operations[{index}].marker is required for replace_marker_block")
            if op == "replace_text":
                content = operation.get("content")
                if not isinstance(content, dict) or not content.get("find") or not content.get("replace"):
                    errors.append(f"{target}.operations[{index}].content must include find/replace for replace_text")
            elif op != "json_merge":
                if operation.get("content") in (None, ""):
                    errors.append(f"{target}.operations[{index}].content cannot be empty")
            if op == "json_merge" and not isinstance(operation.get("content"), dict):
                errors.append(f"{target}.operations[{index}].content must be an object for json_merge")

    return errors, warnings


def _simulate_grouped_file_operations(
    file_operations: list[dict[str, Any]],
    backend_handoff: dict[str, Any],
    repo_root: Path = REPO_ROOT,
) -> dict[str, Any]:
    simulated_files: dict[Path, str] = {}
    steps: list[dict[str, Any]] = []
    changed_files: list[str] = []
    warnings: list[str] = []

    assignment_users_key = str(backend_handoff.get("assignmentUsersKey") or "FILTER_KEY_PLACEHOLDER")

    def read_or_seed(root_path: str, relative_path: str) -> str:
        absolute_path = _resolve_group_file(root_path, relative_path, repo_root)
        if absolute_path in simulated_files:
            return simulated_files[absolute_path]
        if absolute_path.exists():
            content = absolute_path.read_text(encoding="utf-8")
        else:
            content = _render_monitoring_schematic_template(relative_path, "FILTER_KEY_PLACEHOLDER")
            if content is None:
                content = ""
        simulated_files[absolute_path] = content
        return content

    def write_simulated(root_path: str, relative_path: str, content: str) -> None:
        absolute_path = _resolve_group_file(root_path, relative_path, repo_root)
        simulated_files[absolute_path] = content
        relative_to_repo = absolute_path.relative_to(repo_root).as_posix()
        if relative_to_repo not in changed_files:
            changed_files.append(relative_to_repo)

    for group in file_operations:
        target = str(group.get("target"))
        root_path = str(group.get("rootPath"))
        for pre_step in group.get("preSteps", []):
            step_op = pre_step.get("op")
            if step_op == "run_command":
                command = str(pre_step.get("command"))
                feature_name = _extract_monitoring_schematic_name(command)
                assignment_filter_key = (
                    _extract_assignment_filter_key(command) or "FILTER_KEY_PLACEHOLDER"
                )
                include_tests = not _command_skips_tests(command)
                materialized_files: list[str] = []
                if feature_name:
                    for relative_path in _monitoring_schematic_paths(feature_name, include_tests):
                        content = _render_monitoring_schematic_template(
                            relative_path,
                            assignment_filter_key,
                        )
                        if content is None:
                            continue
                        write_simulated(root_path, relative_path, content)
                        materialized_files.append(f"{root_path}/{relative_path}")
                steps.append({
                    "type": "preStep",
                    "target": target,
                    "op": step_op,
                    "status": "simulated",
                    "command": command,
                    "materializedFiles": materialized_files,
                    "description": pre_step.get("description", ""),
                })
            elif step_op == "update_routing_module":
                routing_file = str(pre_step.get("filePath"))
                current = read_or_seed(root_path, routing_file)
                updated = _apply_routing_update(
                    current,
                    str(pre_step.get("importPath")),
                    str(pre_step.get("componentClass")),
                    str(pre_step.get("routePath")),
                    pre_step.get("routeData") if isinstance(pre_step.get("routeData"), dict) else None,
                )
                write_simulated(root_path, routing_file, updated)
                steps.append({
                    "type": "preStep",
                    "target": target,
                    "op": step_op,
                    "status": "simulated",
                    "path": f"{root_path}/{routing_file}",
                    "description": pre_step.get("description", ""),
                })
            elif step_op == "update_menu_component":
                menu_file = str(pre_step.get("filePath"))
                current = read_or_seed(root_path, menu_file)
                updated = _apply_menu_update(
                    current,
                    str(pre_step.get("label")),
                    str(pre_step.get("routePath")),
                    str(pre_step.get("icon") or "phosphorPulseBold"),
                    list(pre_step.get("roles") or []),
                )
                write_simulated(root_path, menu_file, updated)
                steps.append({
                    "type": "preStep",
                    "target": target,
                    "op": step_op,
                    "status": "simulated",
                    "path": f"{root_path}/{menu_file}",
                    "description": pre_step.get("description", ""),
                })

        for operation in group.get("operations", []):
            relative_path = str(operation.get("path"))
            op = str(operation.get("op"))
            current = read_or_seed(root_path, relative_path)
            updated = current
            if op == "json_merge":
                existing_obj = json.loads(current) if current.strip() else {}
                if not isinstance(existing_obj, dict):
                    raise ValueError(f"Existing JSON content is not an object for {relative_path}")
                existing_obj.update(operation.get("content") or {})
                updated = json.dumps(existing_obj, indent=2, sort_keys=True) + "\n"
            elif op == "append":
                updated = _apply_append_operation(relative_path, current, str(operation.get("content")))
            elif op == "create_or_replace":
                updated = str(operation.get("content"))
            elif op == "replace_text":
                replacement = operation.get("content") or {}
                find_text = str(replacement.get("find"))
                replace_text = str(replacement.get("replace"))
                if find_text not in current:
                    # Tolerant: the target text is often already materialized by
                    # the schematic template render (e.g. the assignment key), so
                    # a missing find-string is a no-op, not a fatal error.
                    warnings.append(
                        f"replace_text find-string not present in {relative_path}; skipped (already applied)"
                    )
                    updated = current
                else:
                    updated = current.replace(find_text, replace_text, 1)
            elif op == "replace_marker_block":
                updated = _replace_marker_block(current, str(operation.get("marker")), str(operation.get("content")), relative_path)

            write_simulated(root_path, relative_path, updated)
            steps.append({
                "type": "operation",
                "target": target,
                "op": op,
                "status": "simulated",
                "path": f"{root_path}/{relative_path}",
                "description": operation.get("description", ""),
            })

    return {
        "steps": steps,
        "changedFiles": changed_files,
        "changedFileCount": len(changed_files),
        "warnings": warnings,
        "assignmentUsersKey": assignment_users_key,
    }


def _github_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _codegen_branch_name(backend_handoff: dict[str, Any]) -> str:
    feature = backend_handoff.get("featureName") or "dashboard"
    safe = re.sub(r"[^a-z0-9-]", "-", feature.lower()).strip("-")
    return f"codegen/{safe}"


async def _github_get_branch_sha(owner: str, repo: str, branch: str, token: str) -> str:
    url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/git/ref/heads/{branch}"
    resp = await _http_client.get(url, headers=_github_headers(token))
    resp.raise_for_status()
    return resp.json()["object"]["sha"]


async def _github_list_branch_names(owner: str, repo: str, token: str) -> set[str]:
    branch_names: set[str] = set()
    page = 1
    per_page = 100

    while True:
        url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/branches"
        resp = await _http_client.get(
            url,
            params={"per_page": per_page, "page": page},
            headers=_github_headers(token),
        )
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list) or not data:
            break

        for item in data:
            if isinstance(item, dict):
                name = item.get("name")
                if isinstance(name, str) and name.strip():
                    branch_names.add(name)

        if len(data) < per_page:
            break
        page += 1

    return branch_names


async def _github_branch_exists(owner: str, repo: str, branch: str, token: str) -> bool:
    branches = await _github_list_branch_names(owner, repo, token)
    return branch in branches


async def _github_create_branch(owner: str, repo: str, new_branch: str, sha: str, token: str) -> None:
    url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/git/refs"
    resp = await _http_client.post(
        url,
        json={"ref": f"refs/heads/{new_branch}", "sha": sha},
        headers=_github_headers(token),
    )
    resp.raise_for_status()


async def _github_create_blob(owner: str, repo: str, content: str, token: str) -> str:
    url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/git/blobs"
    resp = await _http_client.post(
        url,
        json={
            "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
            "encoding": "base64",
        },
        headers=_github_headers(token),
    )
    resp.raise_for_status()
    return resp.json()["sha"]


async def _github_create_tree(
    owner: str,
    repo: str,
    base_tree_sha: str,
    file_blobs: list[dict[str, Any]],
    token: str,
) -> str:
    url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/git/trees"
    resp = await _http_client.post(
        url,
        json={"base_tree": base_tree_sha, "tree": file_blobs},
        headers=_github_headers(token),
    )
    resp.raise_for_status()
    return resp.json()["sha"]


async def _github_create_commit(
    owner: str,
    repo: str,
    message: str,
    tree_sha: str,
    parent_sha: str,
    token: str,
) -> str:
    url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/git/commits"
    resp = await _http_client.post(
        url,
        json={"message": message, "tree": tree_sha, "parents": [parent_sha]},
        headers=_github_headers(token),
    )
    resp.raise_for_status()
    return resp.json()["sha"]


async def _github_update_ref(owner: str, repo: str, branch: str, commit_sha: str, token: str) -> None:
    url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/git/refs/heads/{branch}"
    resp = await _http_client.patch(
        url,
        json={"sha": commit_sha, "force": False},
        headers=_github_headers(token),
    )
    resp.raise_for_status()


async def _github_create_pr(
    owner: str,
    repo: str,
    head: str,
    base: str,
    title: str,
    body: str,
    token: str,
) -> str:
    url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/pulls"
    resp = await _http_client.post(
        url,
        json={"title": title, "body": body, "head": head, "base": base},
        headers=_github_headers(token),
    )
    resp.raise_for_status()
    return resp.json()["html_url"]


async def _execute_grouped_file_operations(
    file_operations: list[dict[str, Any]],
    backend_handoff: dict[str, Any],
    owner: str,
    repo: str,
    base_branch: str,
    token: str,
) -> tuple[dict[str, str], list[dict[str, Any]]]:
    """Apply grouped file operations against live GitHub content.

    Returns:
        changed_files: repo-relative path → final file content
        steps: log of each operation applied
    """
    file_cache: dict[str, str] = {}
    changed_files: dict[str, str] = {}
    steps: list[dict[str, Any]] = []

    async def fetch_or_seed(root_path: str, relative_path: str) -> str:
        repo_relative = f"{root_path}/{relative_path}"
        if repo_relative in file_cache:
            return file_cache[repo_relative]
        url = f"{GITHUB_API_BASE_URL}/repos/{owner}/{repo}/contents/{repo_relative}"
        try:
            resp = await _http_client.get(
                url,
                params={"ref": base_branch},
                headers=_github_headers(token),
            )
            if resp.status_code == 200:
                raw = resp.json()
                content = base64.b64decode(
                    raw["content"].replace("\n", "")
                ).decode("utf-8")
                file_cache[repo_relative] = content
                return content
        except Exception:
            pass
        # New file — seed from schematic template
        content = _render_monitoring_schematic_template(relative_path, "FILTER_KEY_PLACEHOLDER") or ""
        file_cache[repo_relative] = content
        return content

    def write_changed(root_path: str, relative_path: str, content: str) -> None:
        repo_relative = f"{root_path}/{relative_path}"
        file_cache[repo_relative] = content
        changed_files[repo_relative] = content

    for group in file_operations:
        target = str(group.get("target"))
        root_path = str(group.get("rootPath"))

        for pre_step in group.get("preSteps", []):
            step_op = pre_step.get("op")
            if step_op == "run_command":
                command = str(pre_step.get("command", ""))
                feature_name = _extract_monitoring_schematic_name(command)
                assignment_filter_key = (
                    _extract_assignment_filter_key(command) or "FILTER_KEY_PLACEHOLDER"
                )
                include_tests = not _command_skips_tests(command)
                materialized_files: list[str] = []
                if feature_name:
                    for relative_path in _monitoring_schematic_paths(feature_name, include_tests):
                        content = _render_monitoring_schematic_template(
                            relative_path,
                            assignment_filter_key,
                        )
                        if content is None:
                            continue
                        write_changed(root_path, relative_path, content)
                        materialized_files.append(f"{root_path}/{relative_path}")

                # Angular schematic cannot run against a remote repo — component files are materialized from templates
                steps.append({
                    "type": "preStep",
                    "target": target,
                    "op": step_op,
                    "status": "template_seeded",
                    "command": command,
                    "note": "Schematic not executed remotely; component files materialized from templates",
                    "materializedFiles": materialized_files,
                })
            elif step_op == "update_routing_module":
                routing_file = str(pre_step.get("filePath"))
                current = await fetch_or_seed(root_path, routing_file)
                updated = _apply_routing_update(
                    current,
                    str(pre_step.get("importPath")),
                    str(pre_step.get("componentClass")),
                    str(pre_step.get("routePath")),
                    pre_step.get("routeData") if isinstance(pre_step.get("routeData"), dict) else None,
                )
                write_changed(root_path, routing_file, updated)
                steps.append({
                    "type": "preStep",
                    "target": target,
                    "op": step_op,
                    "status": "applied",
                    "path": f"{root_path}/{routing_file}",
                })
            elif step_op == "update_menu_component":
                menu_file = str(pre_step.get("filePath"))
                current = await fetch_or_seed(root_path, menu_file)
                updated = _apply_menu_update(
                    current,
                    str(pre_step.get("label")),
                    str(pre_step.get("routePath")),
                    str(pre_step.get("icon") or "phosphorPulseBold"),
                    list(pre_step.get("roles") or []),
                )
                write_changed(root_path, menu_file, updated)
                steps.append({
                    "type": "preStep",
                    "target": target,
                    "op": step_op,
                    "status": "applied",
                    "path": f"{root_path}/{menu_file}",
                })

        for operation in group.get("operations", []):
            relative_path = str(operation.get("path"))
            op = str(operation.get("op"))
            current = await fetch_or_seed(root_path, relative_path)

            if op == "json_merge":
                existing_obj = json.loads(current) if current.strip() else {}
                existing_obj.update(operation.get("content") or {})
                updated = json.dumps(existing_obj, indent=2, sort_keys=True) + "\n"
            elif op == "append":
                updated = _apply_append_operation(relative_path, current, str(operation.get("content")))
            elif op == "create_or_replace":
                updated = str(operation.get("content"))
            elif op == "replace_text":
                replacement = operation.get("content") or {}
                find_text = str(replacement.get("find"))
                replace_text_val = str(replacement.get("replace"))
                if find_text not in current:
                    # Tolerant: the assignment key (and similar targets) may
                    # already be materialized by the schematic template render,
                    # so a missing find-string is a no-op rather than a hard
                    # failure that aborts the whole apply.
                    updated = current
                else:
                    updated = current.replace(find_text, replace_text_val, 1)
            elif op == "replace_marker_block":
                updated = _replace_marker_block(
                    current,
                    str(operation.get("marker")),
                    str(operation.get("content")),
                    relative_path,
                )
            else:
                updated = current

            write_changed(root_path, relative_path, updated)
            steps.append({
                "type": "operation",
                "target": target,
                "op": op,
                "status": "applied",
                "path": f"{root_path}/{relative_path}",
            })

    return changed_files, steps


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

    installation_repo_access: dict[str, Any] = {
        "checked": False,
        "accessible": None,
        "visibleRepositoryCount": None,
    }
    try:
        installation_repos_resp = await _http_client.get(
            f"{GITHUB_API_BASE_URL}/installation/repositories",
            headers={
                "Authorization": f"token {installation_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        if installation_repos_resp.status_code == 200:
            installation_repo_access["checked"] = True
            repositories = installation_repos_resp.json().get("repositories", [])
            visible_repo_names = {
                f"{item.get('owner', {}).get('login')}/{item.get('name')}"
                for item in repositories
                if isinstance(item, dict)
            }
            installation_repo_access["accessible"] = (
                f"{payload.owner}/{payload.repo}" in visible_repo_names
            )
            installation_repo_access["visibleRepositoryCount"] = len(repositories)
    except Exception:
        # Keep smoke-test non-fatal if installation repository listing fails
        pass

    return {
        "ok": True,
        "repo": f"{payload.owner}/{payload.repo}",
        "defaultBranch": repo_data.get("default_branch"),
        "repoAccessible": True,
        "installationRepoAccess": installation_repo_access,
        "permissions": {
            "admin": (repo_data.get("permissions") or {}).get("admin", False),
            "push": (repo_data.get("permissions") or {}).get("push", False),
            "pull": (repo_data.get("permissions") or {}).get("pull", False),
        },
        "permissionsNote": (
            "For GitHub App installation tokens, repository 'permissions' booleans can be false/empty "
            "even when app permissions are correctly configured."
        ),
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
    session_id = _session_id_from_handoff(payload.backendHandoff)
    component_name = payload.backendHandoff.get("componentName")
    user_id = payload.backendHandoff.get("userName")

    try:
        installation_token = await _get_github_installation_token()
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="token_exchange",
            error=str(exc),
        )
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
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="repo_read",
            error=str(exc),
        )
        return {"ok": False, "stage": "repo_read", "error": str(exc)}

    if not payload.fileOperations:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="validate_payload",
            error="fileOperations is required",
        )
        return {
            "ok": False,
            "stage": "validate_payload",
            "error": "fileOperations is required. First call /api/dashboard-codegen and pass its fileOperations into apply-with-agent.",
        }

    normalized_file_operations = _normalize_file_operations(payload.fileOperations)
    validation_errors, validation_warnings = _validate_grouped_file_operations(
        normalized_file_operations
    )
    if validation_errors:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="validate_payload",
            error="; ".join(validation_errors),
        )
        return {
            "ok": False,
            "stage": "validate_payload",
            "errors": validation_errors,
            "warnings": validation_warnings,
            "repo": f"{payload.owner}/{payload.repo}",
            "baseBranch": payload.baseBranch,
        }

    if payload.dryRun:
        try:
            preview = _simulate_grouped_file_operations(
                normalized_file_operations,
                payload.backendHandoff,
            )
        except Exception as exc:
            return {
                "ok": False,
                "stage": "dry_run_apply",
                "error": str(exc),
                "repo": f"{payload.owner}/{payload.repo}",
                "baseBranch": payload.baseBranch,
                "defaultBranch": repo_data.get("default_branch"),
            }

        return {
            "ok": True,
            "triggered": True,
            "dryRun": True,
            "stage": "dry_run_apply",
            "repo": f"{payload.owner}/{payload.repo}",
            "baseBranch": payload.baseBranch,
            "defaultBranch": repo_data.get("default_branch"),
            "connection": {
                "githubAuthenticated": True,
                "repoAccessible": True,
            },
            "validation": {
                "passed": True,
                "warnings": validation_warnings,
            },
            "executionPreview": preview,
            "fileOperations": normalized_file_operations,
            "nextSteps": [
                "Reuse GitHub App installation token flow for real apply execution.",
                "Create a working branch from the requested base branch.",
                "Execute backend preSteps and operations in order.",
                "Execute frontend schematic, routing update, and code operations in order.",
                "Create commit(s), push branch, and open a pull request.",
                "Return final PR link and changed-file summary to the UI.",
            ],
        }

    # ── Real apply: branch → blobs → tree → commit → PR ──────────────────────
    feature_name: str = str(payload.backendHandoff.get("featureName") or "dashboard")
    new_branch = _codegen_branch_name(payload.backendHandoff)

    try:
        base_sha = await _github_get_branch_sha(
            payload.owner, payload.repo, payload.baseBranch, installation_token
        )
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="get_base_sha",
            error=str(exc),
        )
        return {"ok": False, "stage": "get_base_sha", "error": str(exc)}

    try:
        if await _github_branch_exists(
            payload.owner, payload.repo, new_branch, installation_token
        ):
            await _persist_apply_failure(
                session_id=session_id,
                user_id=user_id if isinstance(user_id, str) else None,
                component_name=component_name if isinstance(component_name, str) else None,
                stage="branch_collision",
                error=f"Branch '{new_branch}' already exists.",
            )
            return {
                "ok": False,
                "stage": "branch_collision",
                "error": f"Branch '{new_branch}' already exists.",
                "branch": new_branch,
                "resolution": "Use a different featureName or enable branch suffix strategy.",
            }
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="check_branch_exists",
            error=str(exc),
        )
        return {"ok": False, "stage": "check_branch_exists", "error": str(exc), "branch": new_branch}

    try:
        await _github_create_branch(
            payload.owner, payload.repo, new_branch, base_sha, installation_token
        )
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="create_branch",
            error=str(exc),
        )
        return {"ok": False, "stage": "create_branch", "error": str(exc), "branch": new_branch}

    try:
        changed_files, apply_steps = await _execute_grouped_file_operations(
            normalized_file_operations,
            payload.backendHandoff,
            payload.owner,
            payload.repo,
            payload.baseBranch,
            installation_token,
        )
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="execute_operations",
            error=str(exc),
        )
        return {"ok": False, "stage": "execute_operations", "error": str(exc), "branch": new_branch}

    try:
        tree_entries: list[dict[str, Any]] = []
        for repo_path, file_content in changed_files.items():
            blob_sha = await _github_create_blob(
                payload.owner, payload.repo, file_content, installation_token
            )
            tree_entries.append({
                "path": repo_path,
                "mode": "100644",
                "type": "blob",
                "sha": blob_sha,
            })
        tree_sha = await _github_create_tree(
            payload.owner, payload.repo, base_sha, tree_entries, installation_token
        )
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="create_tree",
            error=str(exc),
        )
        return {"ok": False, "stage": "create_tree", "error": str(exc), "branch": new_branch}

    commit_sha: str = ""
    try:
        commit_message = (
            f"feat: codegen {feature_name} dashboard\n\n"
            f"Generated by dashboard-codegen agent.\n"
            f"Changed files: {len(changed_files)}"
        )
        commit_sha = await _github_create_commit(
            payload.owner, payload.repo, commit_message, tree_sha, base_sha, installation_token
        )
        await _github_update_ref(
            payload.owner, payload.repo, new_branch, commit_sha, installation_token
        )
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="create_commit",
            error=str(exc),
        )
        return {"ok": False, "stage": "create_commit", "error": str(exc), "branch": new_branch}

    try:
        pr_title = f"feat: codegen {_title_case_kebab(feature_name)} dashboard"
        file_list = "\n".join(f"- `{f}`" for f in changed_files)
        pr_body = (
            f"## Dashboard Codegen — `{feature_name}`\n\n"
            f"Generated by the automated dashboard-codegen agent.\n\n"
            f"### Changed files ({len(changed_files)})\n"
            f"{file_list}\n\n"
            f"> Review and merge after confirming component behaviour in staging."
        )
        pr_url = await _github_create_pr(
            payload.owner, payload.repo,
            new_branch, payload.baseBranch,
            pr_title, pr_body,
            installation_token,
        )
    except Exception as exc:
        await _persist_apply_failure(
            session_id=session_id,
            user_id=user_id if isinstance(user_id, str) else None,
            component_name=component_name if isinstance(component_name, str) else None,
            stage="create_pr",
            error=str(exc),
        )
        return {
            "ok": False,
            "stage": "create_pr",
            "error": str(exc),
            "branch": new_branch,
            "commitSha": commit_sha,
        }

    # Demo mode: DB persistence intentionally disabled.

    webex_notified = await _notify_codegen_pr_created(
        session_id=session_id,
        backend_handoff=payload.backendHandoff,
        owner=payload.owner,
        repo=payload.repo,
        base_branch=payload.baseBranch,
        generated_branch=new_branch,
        pr_url=pr_url,
        changed_file_count=len(changed_files),
    )

    return {
        "ok": True,
        "triggered": True,
        "dryRun": False,
        "stage": "apply_complete",
        "repo": f"{payload.owner}/{payload.repo}",
        "branch": new_branch,
        "baseBranch": payload.baseBranch,
        "prUrl": pr_url,
        "commitSha": commit_sha,
        "changedFiles": list(changed_files.keys()),
        "changedFileCount": len(changed_files),
        "steps": apply_steps,
        "webexNotificationSent": webex_notified,
    }


@functools.lru_cache(maxsize=8)
def _load_prompt_file(path: Path) -> str:
    # Prompt files are static at runtime; cache to avoid re-reading on every
    # request (C4).
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


def _repair_double_escaped(text: str) -> str:
    """Repair a string that was double-escaped by the operations LLM.

    When the model hand-writes JSON it sometimes emits literal backslash
    sequences (``\\n``, ``\\"``) instead of real characters, so a multi-line
    code block lands in the file as one line containing literal ``\n``. A
    genuine multi-line block always contains real newlines, so we only repair
    strings that carry escape sequences *and* have no real newline. This keeps
    legitimate code (e.g. a regex like ``/\\s+/``) untouched.
    """
    if "\n" in text:
        return text
    if "\\n" not in text and "\\t" not in text and '\\"' not in text:
        return text
    return (
        text.replace("\\r\\n", "\n")
        .replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace('\\"', '"')
        .replace("\\'", "'")
    )


def _deep_repair_escaped(value: Any) -> Any:
    """Recursively apply :func:`_repair_double_escaped` to all string leaves."""
    if isinstance(value, str):
        return _repair_double_escaped(value)
    if isinstance(value, list):
        return [_deep_repair_escaped(item) for item in value]
    if isinstance(value, dict):
        return {key: _deep_repair_escaped(item) for key, item in value.items()}
    return value


def _iter_operation_contents(file_operations: list[dict[str, Any]]):
    """Yield (target, path, content_str) for every operation with string content."""
    for group in file_operations:
        if not isinstance(group, dict):
            continue
        target = str(group.get("target", "unknown"))
        for operation in group.get("operations", []) or []:
            if not isinstance(operation, dict):
                continue
            content = operation.get("content")
            if isinstance(content, str):
                yield target, str(operation.get("path", "")), content


def _validate_generated_artifacts(
    file_operations: list[dict[str, Any]],
    expected_filter_params: list[str] | None = None,
    expected_jdbc_suffix: str | None = None,
) -> list[dict[str, Any]]:
    """Deterministic backstop checks over the assembled apply manifest.

    Returns a list of structured warnings (never raises) so the UI can surface
    issues without blocking generation. Covers the failure modes that the
    prompt-only fixes cannot guarantee: residual escaped literals, Java import
    semicolons, leaked angle-bracket placeholders, the @RequestParam
    pluralization contract, and UPPER_SNAKE key casing.
    """
    warnings: list[dict[str, Any]] = []

    def warn(code: str, path: str, message: str) -> None:
        warnings.append({"code": code, "path": path, "message": message})

    for target, path, content in _iter_operation_contents(file_operations):
        # 1) Residual double-escaped literals (should be repaired already).
        if "\n" not in content and ("\\n" in content or '\\"' in content):
            warn("escaped_literal", path,
                 "Content appears double-escaped (literal \\n or \\\" on a single line).")

        # 2) Leaked angle-bracket template placeholders.
        if re.search(r"<[A-Za-z][A-Za-z0-9]*(?:PascalCase|CamelCase|Name|SNAKE)[^>]*>", content):
            warn("leaked_placeholder", path,
                 "Unresolved <...> template placeholder left in generated content.")

        # 3) Java-specific checks.
        if path.endswith(".java"):
            for line in content.splitlines():
                stripped = line.strip()
                if stripped.startswith("import ") and not stripped.endswith(";"):
                    warn("java_import_semicolon", path,
                         f"Import statement missing trailing ';': {stripped}")
            if content.count("{") != content.count("}"):
                warn("java_brace_balance", path,
                     "Unbalanced braces in generated Java file.")

        # 3b) Service must call the datasource-specific JdbcManager methods.
        if path.endswith("Service.java"):
            for bare in ("queryForList", "queryForListWithParams", "executeUpdate"):
                if re.search(rf"jdbcManager\.{bare}\s*\(", content):
                    warn("jdbc_datasource_method", path,
                         f"Service calls generic 'jdbcManager.{bare}(...)'. Use the "
                         "datasource-specific variant (…Primary for ARFINRO, "
                         "…Secondary for FINISRO).")
            if expected_jdbc_suffix:
                wrong = "Secondary" if expected_jdbc_suffix == "Primary" else "Primary"
                if re.search(rf"jdbcManager\.\w+{wrong}\s*\(", content):
                    warn("jdbc_datasource_method", path,
                         f"Service uses '…{wrong}' JdbcManager methods but the query "
                         f"schema selects '…{expected_jdbc_suffix}'.")

        # 4) @RequestParam names must match the deterministic contract.
        if path.endswith("Controller.java") and expected_filter_params:
            for expected in expected_filter_params:
                if re.search(r"@RequestParam\b", content) and expected not in content:
                    warn("request_param_contract", path,
                         f"Expected @RequestParam name '{expected}' not found "
                         f"(frontend sends this exact key).")

        # 5) keysToMap / submit / webex arrays must be UPPER_SNAKE_CASE.
        if path.endswith(".component.ts"):
            for m in re.finditer(r"(KeysToMap|submitKeysToMap|webexKeysToMap)\b[^=]*=\s*\[([^\]]*)\]", content):
                for token in re.findall(r"['\"]([^'\"]+)['\"]", m.group(2)):
                    if token and not re.fullmatch(r"[A-Z0-9_]+", token):
                        warn("key_casing", path,
                             f"Key '{token}' is not UPPER_SNAKE_CASE.")

        # 6) Split array-type annotation `}\n[] =` (ASI compile error).
        if path.endswith(".ts") and _SPLIT_ARRAY_TYPE_RE.search(content):
            warn("ts_array_type_split", path,
                 "Array-type annotation is split across lines (`}` then `[] =`), "
                 "which is a TypeScript ASI compile error.")

    return warnings


# ── response_format capability probe (cached) ──────────────────────
_json_mode_supported: bool | None = None


def _bind_json_mode(llm: Any) -> Any:
    """Bind response_format=json_object when supported; probe once and cache.

    Avoids silently re-attempting an unsupported parameter on every request and
    logs the outcome a single time so degradation is visible.
    """
    global _json_mode_supported
    if _json_mode_supported is False or not hasattr(llm, "bind"):
        return llm
    try:
        bound = llm.bind(response_format={"type": "json_object"})
        if _json_mode_supported is None:
            _json_mode_supported = True
            print("[dashboard-codegen] response_format=json_object enabled.")
        return bound
    except Exception as exc:  # pragma: no cover
        if _json_mode_supported is None:
            _json_mode_supported = False
            print(f"[dashboard-codegen] response_format unsupported, "
                  f"falling back to text+repair: {exc}")
        return llm


def _normalize_file_operations(raw_ops: Any) -> list[dict[str, Any]]:
    """Normalize fileOperations payloads to a list of dicts.

    Supports:
    1) legacy flat list of operation dicts
    2) grouped list with target/rootPath/operations objects
    3) grouped object map: {"backend": {...}, "frontend": {...}}
    """
    if isinstance(raw_ops, list):
        return [op for op in raw_ops if isinstance(op, dict)]

    if isinstance(raw_ops, dict):
        grouped: list[dict[str, Any]] = []

        # object-map grouped form
        for target in ("backend", "frontend"):
            section = raw_ops.get(target)
            if isinstance(section, dict):
                item = dict(section)
                item.setdefault("target", target)
                grouped.append(item)

        if grouped:
            return grouped

        # single grouped object fallback
        if any(k in raw_ops for k in ("target", "rootPath", "operations", "preSteps")):
            return [raw_ops]

    return []


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
    # UPPER_SNAKE_CASE is the contract for keysToMap / submitKeysToMap /
    # webexKeysToMap. The frontend camelCase() lowercases its input before
    # building request-param names, so uppercasing here is safe for the
    # filter contract while giving the UI the required UPPER_SNAKE keys.
    return s.upper()


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

    conditions = re.split(r"\bAND\b|\bOR\b|,", where_part, flags=re.IGNORECASE)
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


def _camel_plural(column: str) -> str:
    """Mirror the frontend camelCase() contract: camelCase(column) + a single 's'.

    This matches `camelCase()` in data-formatting.service.ts, which lowercases
    the column, camelCases on underscores, then appends exactly one 's'. It is a
    MECHANICAL append (never English pluralization): CTM_STATUS -> ctmStatuss.
    """
    lowered = column.lower()
    camel = re.sub(r"_([a-z0-9])", lambda m: m.group(1).upper(), lowered)
    return f"{camel}s"


def _expected_filter_param_names(details_filtered_sql: str) -> list[str]:
    """Deterministically compute the controller @RequestParam names.

    These are the exact query-param names the frontend sends for the filtered
    details endpoint. Computing them in Python removes any reliance on the LLM
    to pluralize correctly (see Bug 3).
    """
    cols = extract_where_placeholders.func(details_filtered_sql)
    seen: set[str] = set()
    ordered: list[str] = []
    for col in cols:
        name = _camel_plural(col)
        if name not in seen:
            seen.add(name)
            ordered.append(name)
    return ordered


# ── JDBC data-source routing (primary=ARFINRO, secondary=FINISRO) ───
#
# JdbcManager exposes two parallel method families backed by two datasources:
#   primary   -> ARFINRO schema  -> executeQueryForListPrimary /
#                executeQueryForListWithParamsPrimary / executeUpdatePrimary
#   secondary -> FINISRO schema  -> executeQueryForListSecondary /
#                executeQueryForListWithParamsSecondary / executeUpdateSecondary
# The correct family is selected by the schema qualifier that appears in the
# generated SQL (e.g. `ARFINRO.XXCFI_...` vs `finisro.xxcfi_...`).
_SCHEMA_DATASOURCE = {"arfinro": "primary", "finisro": "secondary"}
_SCHEMA_RE = re.compile(r"\b(arfinro|finisro)\s*\.", re.IGNORECASE)

# Method family per datasource: (select, selectWithParams, update).
_JDBC_METHODS = {
    "primary": (
        "executeQueryForListPrimary",
        "executeQueryForListWithParamsPrimary",
        "executeUpdatePrimary",
    ),
    "secondary": (
        "executeQueryForListSecondary",
        "executeQueryForListWithParamsSecondary",
        "executeUpdateSecondary",
    ),
}


def _detect_query_datasource(queries: dict[str, Any]) -> str:
    """Pick the JdbcManager datasource family from the SQL schema qualifier.

    Scans every query for an `ARFINRO.`/`FINISRO.` schema prefix. Returns
    "primary" (ARFINRO) or "secondary" (FINISRO). When no qualifier is present,
    or both appear, it defaults to "primary" — the app team can still adjust,
    and the backstop validator surfaces a warning on mismatch.
    """
    found: set[str] = set()
    for value in (queries or {}).values():
        if not isinstance(value, str):
            continue
        for match in _SCHEMA_RE.findall(value):
            found.add(_SCHEMA_DATASOURCE[match.lower()])
    if found == {"secondary"}:
        return "secondary"
    return "primary"


def _jdbc_method_suffix(data_source: str) -> str:
    return "Secondary" if data_source == "secondary" else "Primary"


# ── Phase 3: deterministic markdown → fileOperations parser ─────────
#
# The stage-3 "operations" LLM re-transcribes the backend/UI markdown into JSON
# fileOperations. That re-transcription is the single largest source of bugs
# (double-escaped newlines, dropped Java semicolons, mis-pluralized params)
# because the model rewrites code it should copy verbatim. These helpers extract
# the `Copy to:` labels + fenced code blocks directly in Python and assemble the
# apply manifest deterministically, so on the happy path the LLM never touches
# the code. If parsing is incomplete or fails validation, the caller falls back
# to the LLM path — so this is strictly zero-regression.

_FRONTEND_MARKERS = (
    "VISIBLE_TABS",
    "FIELD_CONFIG",
    "FILTER_CONFIGS",
    "KEYS_TO_MAP",
    "URL_MAPS",
    "DASHBOARD_CASES",
)

_COPY_TO_RE = re.compile(r"copy\s+to\s*:\s*(.+)$", re.IGNORECASE)
_PATH_RE = re.compile(r"[\w./@-]+\.(?:java|json|properties|ts|html|css)")
_FENCE_RE = re.compile(r"^\s*```")
# A .properties assignment line (e.g. `ait.jobs.summary.q=${AIT_JOBS_SUMMARY_Q}`).
# Property lines are unambiguous (never prose), so they can be captured even
# when the model forgets to wrap them in a code fence.
_PROP_LINE_RE = re.compile(r"^\s*[A-Za-z0-9_][\w.\-]*\s*=")


def _clean_label(raw: str) -> str:
    """Strip markdown emphasis / backticks / trailing em-dash noise from a label."""
    text = raw.replace("**", "").replace("`", "")
    # Normalize the various dash characters used before the instruction clause.
    return text.strip()


def _extract_copy_to_blocks(document: str) -> list[dict[str, str]]:
    """Extract ordered (label, lang, code) triples from a codegen markdown doc.

    Rules:
    - A label is any line that, once leading blockquote markers (`>`) and
      markdown emphasis are stripped, starts with `Copy to:`.
    - The code for a label is the FIRST fenced code block that follows it on
      lines that are NOT blockquoted (so the 💡 "Adding a tab later" tip blocks,
      which live inside `>` blockquotes, are ignored).
    """
    lines = document.splitlines()
    blocks: list[dict[str, str]] = []
    pending_label: str | None = None
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.lstrip()
        is_blockquote = stripped.startswith(">")
        # Strip leading blockquote markers for label detection only.
        deblock = stripped
        while deblock.startswith(">"):
            deblock = deblock[1:].lstrip()
        deblock_clean = _clean_label(deblock)

        label_match = _COPY_TO_RE.match(deblock_clean)
        if label_match:
            pending_label = _clean_label(label_match.group(1))
            i += 1
            continue

        # Unfenced .properties capture: the prompt asks for a fenced block, but
        # the model frequently emits bare `key=value` lines instead. Those lines
        # are unambiguous (never prose), so when the pending label targets a
        # .properties file we capture consecutive assignment lines directly.
        # This runs BEFORE the fence check, and only when no fence is present
        # (a fence line does not match _PROP_LINE_RE), so a properly fenced
        # block still flows through the standard path below.
        if (
            pending_label is not None
            and not is_blockquote
            and ".properties" in pending_label.lower()
            and _PROP_LINE_RE.match(line)
        ):
            prop_lines: list[str] = []
            while i < n and _PROP_LINE_RE.match(lines[i]):
                prop_lines.append(lines[i].rstrip("\r\n"))
                i += 1
            blocks.append(
                {
                    "label": pending_label,
                    "lang": "properties",
                    "code": "\n".join(prop_lines),
                }
            )
            pending_label = None
            continue

        # A non-blockquote opening fence closes a pending label into a block.
        if pending_label is not None and not is_blockquote and _FENCE_RE.match(line):
            lang = stripped[3:].strip()
            code_lines: list[str] = []
            i += 1
            while i < n and not _FENCE_RE.match(lines[i]):
                code_lines.append(lines[i])
                i += 1
            # Skip the closing fence.
            i += 1
            blocks.append(
                {
                    "label": pending_label,
                    "lang": lang,
                    "code": "\n".join(code_lines),
                }
            )
            pending_label = None
            continue

        i += 1

    return blocks


def _label_path(label: str) -> str | None:
    match = _PATH_RE.search(label)
    return match.group(0) if match else None


# A split array-type annotation where the model put a newline between the object
# type's closing `}` and the `[]` array operator, e.g.
#     aitJobsFilters: {
#       ...
#     }
#     [] = [ ... ];
# In a class body this triggers ASI: the `}` ends the property and `[]` is then
# parsed as a computed member name -> `TS1005 ';' expected` / `TS1109`. The fix
# is purely mechanical: pull the `[]` back onto the `}` line. This is safe
# because `}` immediately followed by a line starting with `[]` never occurs in
# valid generated code other than this exact split.
_SPLIT_ARRAY_TYPE_RE = re.compile(r"\}[ \t]*\r?\n[ \t]*\[\][ \t]*=")


def _normalize_ts_array_type_split(code: str) -> str:
    """Collapse a `}\\n[] =` split array-type annotation back to `}[] =`."""
    return _SPLIT_ARRAY_TYPE_RE.sub("}[] =", code)


def _repair_ts_array_type_splits(
    file_operations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Apply the split array-type repair to every .ts operation's string content.

    Runs on the LLM-fallback path so both code-assembly routes are protected.
    Idempotent: the regex cannot match already-joined `}[] =`.
    """
    for group in file_operations:
        if not isinstance(group, dict):
            continue
        for operation in group.get("operations", []) or []:
            if not isinstance(operation, dict):
                continue
            path = str(operation.get("path", ""))
            content = operation.get("content")
            if path.endswith(".ts") and isinstance(content, str):
                operation["content"] = _normalize_ts_array_type_split(content)
    return file_operations


def _deterministic_backend_group(
    backend_document: str,
) -> dict[str, Any] | None:
    """Assemble the backend fileOperations group from the backend markdown.

    Returns None (deferring to the LLM) unless EVERY essential backend artifact
    is present and unambiguous. Failing safe here is what makes the deterministic
    path leak-proof: a partial parse never reaches the apply layer.
    """
    operations: list[dict[str, Any]] = []
    present: set[str] = set()
    for block in _extract_copy_to_blocks(backend_document):
        label = block["label"]
        code = block["code"]
        path = _label_path(label)
        if not path or not code.strip():
            continue

        base = path.rsplit("/", 1)[-1]

        if base == "envfile.json":
            try:
                content: Any = json.loads(code)
            except json.JSONDecodeError:
                return None  # cannot safely merge — defer to LLM
            if not isinstance(content, dict) or not content:
                return None
            operations.append(
                {
                    "path": "envfile.json",
                    "op": "json_merge",
                    "content": content,
                    "description": "Add query env vars",
                }
            )
            present.add("envfile")
        elif base == "queries.properties":
            operations.append(
                {
                    "path": "src/main/resources/queries.properties",
                    "op": "append",
                    "content": code,
                    "description": "Add query property keys",
                }
            )
            present.add("queries")
        elif base == "QueryConfigs.java":
            # Two sub-steps (3a @Value fields, 3b @Bean getters) legitimately
            # share this path+op; both are appended in document order.
            operations.append(
                {
                    "path": path,
                    "op": "append",
                    "content": code,
                    "description": "Add @Value fields / @Bean getters",
                }
            )
            present.add("queryconfigs")
        elif base.endswith("Service.java") or base.endswith("Controller.java"):
            # Guard against a leaked angle-bracket placeholder collapsing to a
            # bare filename (e.g. "<FeaturePascalCase>Service.java" -> the regex
            # only captures "Service.java", which would create a file at the
            # backend root). Require the real package directory in the path.
            # NOTE: we intentionally do NOT require the words "create this file"
            # in the label — real model output often emits just the path.
            expected_dir = "/services/" if base.endswith("Service.java") else "/controllers/"
            if expected_dir not in path or "<" in label or ">" in label:
                return None
            operations.append(
                {
                    "path": path,
                    "op": "create_or_replace",
                    "content": code,
                    "description": f"Create {base}",
                }
            )
            present.add("service" if base.endswith("Service.java") else "controller")

    required = {"envfile", "queries", "queryconfigs", "service", "controller"}
    if not required.issubset(present):
        return None

    return {
        "target": "backend",
        "rootPath": "revenue-monitoring-server",
        "preSteps": [],
        "operations": operations,
    }


def _deterministic_frontend_group(
    payload: dict[str, Any],
    handoff: dict[str, Any],
    ui_document: str,
) -> dict[str, Any] | None:
    """Assemble the frontend group: data-driven preSteps + parsed marker blocks."""
    feature_name = str(payload["featureName"])
    component_name = str(payload["componentName"])
    role_upper = derive_names.func(payload["roleName"]).get("upper_snake", "")
    assignment_key = str(payload["assignmentUsersKey"])
    feature_pascal = _classify_kebab(feature_name)
    component_title = _title_case_kebab(derive_names.func(component_name)["kebab"])

    roles = ["ADMIN", f"MONITORING_{role_upper}", f"MONITORING_{role_upper}_ADMIN"]

    pre_steps: list[dict[str, Any]] = [
        {
            "op": "run_command",
            "command": (
                "ng generate @rev-ops-monitoring/dashboard-schematics:"
                f"monitoring-dashboard {feature_name} --assignmentFilterKey=\"{assignment_key}\""
            ),
            "description": "Run Angular schematic before applying UI file operations",
        },
        {
            "op": "update_routing_module",
            "filePath": "src/app/app-routing.module.ts",
            "importPath": f"./{feature_name}/{feature_name}.component",
            "componentClass": f"{feature_pascal}Component",
            "routePath": feature_name,
            "routeData": {
                "title": "Finance-IT Control Tower",
                "header": "Finance-IT Control Tower",
                "subHeader": f"Continuous Monitoring > {component_title}",
                "supportsDarkMode": True,
            },
            "description": "Add route entry and import for generated dashboard component",
        },
        {
            "op": "update_menu_component",
            "filePath": "src/app/menu/menu.component.ts",
            "label": component_title,
            "routePath": feature_name,
            "icon": "phosphorPulseBold",
            "roles": roles,
            "description": "Add side-nav entry under Continuous Monitoring",
        },
    ]

    component_ts = f"src/app/{feature_name}/{feature_name}.component.ts"
    component_html = f"src/app/{feature_name}/{feature_name}.component.html"

    operations: list[dict[str, Any]] = [
        {
            "path": component_ts,
            "op": "replace_marker_block",
            "marker": "ASSIGNMENT_FILTER_KEY",
            "content": f"assignmentUsersFilterKey: {_ts_string_literal(assignment_key)},",
            "description": "Set assignmentUsersFilterKey in generated userContextData",
        }
    ]

    seen_markers: set[str] = set()
    for block in _extract_copy_to_blocks(ui_document):
        label = block["label"]
        code = block["code"]
        if not code.strip():
            continue
        marker = next((m for m in _FRONTEND_MARKERS if m in label), None)
        if marker is None or marker in seen_markers:
            continue
        seen_markers.add(marker)
        target_path = component_html if marker == "DASHBOARD_CASES" else component_ts
        # Repair the `}\n[] =` split array-type annotation the model sometimes
        # emits (a hard TS compile error) before writing it verbatim.
        if target_path.endswith(".ts"):
            code = _normalize_ts_array_type_split(code)
        operations.append(
            {
                "path": target_path,
                "op": "replace_marker_block",
                "marker": marker,
                "content": code,
                "description": f"Fill {marker} marker",
            }
        )

    # Require the FULL set of marker blocks before trusting the deterministic
    # parse. A missing marker would otherwise leave the scaffold's empty
    # placeholder in the shipped component, so fall back to the LLM instead.
    if set(_FRONTEND_MARKERS) - seen_markers:
        return None

    return {
        "target": "frontend",
        "rootPath": "revenue-monitoring-ui/angular-app",
        "preSteps": pre_steps,
        "operations": operations,
    }


def _deterministic_file_operations(
    payload: dict[str, Any],
    handoff: dict[str, Any],
    backend_document: str,
    ui_document: str,
) -> list[dict[str, Any]] | None:
    """Build the full apply manifest deterministically, or None to defer to LLM.

    Returns the grouped fileOperations only when both groups parse AND the
    result passes the same structural validation used by the apply layer, so a
    successful return is guaranteed to be at least as valid as the LLM output.
    """
    backend_group = _deterministic_backend_group(backend_document)
    frontend_group = _deterministic_frontend_group(payload, handoff, ui_document)
    if backend_group is None or frontend_group is None:
        return None

    file_operations = [backend_group, frontend_group]
    errors, _warnings = _validate_grouped_file_operations(file_operations)
    if errors:
        return None
    return file_operations


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
        "userName": payload.get("userName"),
        "userEmail": payload.get("userEmail"),
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
        "filterParamNames": _expected_filter_param_names(queries["detailsFiltered"]),
        "dataSource": _detect_query_datasource(queries),
        "jdbcMethodSuffix": _jdbc_method_suffix(_detect_query_datasource(queries)),
    }

    return handoff


async def create_session_node(state: DashboardCodegenState) -> DashboardCodegenState:
    """Create a demo session id when one is not already provided."""
    existing_session_id = state.get("session_id")
    if existing_session_id:
        return {"session_id": existing_session_id}

    return {"session_id": str(uuid4())}


async def backend_generation_node(state: DashboardCodegenState) -> DashboardCodegenState:
    llm = await _get_codegen_llm()
    backend_prompt = _load_prompt_file(BACKEND_PROMPT_FILE)
    payload = dict(state["input"])

    # Deterministically supply the exact @RequestParam names so the model does
    # not have to (mis)pluralize them itself (Bug 3 backstop, data-driven).
    try:
        payload["filterParamNames"] = _expected_filter_param_names(
            payload["queries"]["detailsFiltered"]
        )
    except Exception:
        pass

    # Deterministically select the JdbcManager datasource family (ARFINRO ->
    # primary, FINISRO -> secondary) from the SQL schema qualifier so the model
    # calls the correct executeQueryForList*/executeUpdate* variant.
    try:
        data_source = _detect_query_datasource(payload["queries"])
        payload["dataSource"] = data_source
        payload["jdbcMethodSuffix"] = _jdbc_method_suffix(data_source)
    except Exception:
        pass

    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=backend_prompt),
                HumanMessage(content=json.dumps(payload)),
            ]
        )
    except Exception as exc:
        await _persist_generation_failure(
            state,
            error=exc,
            error_code="backend_generation_failed",
        )
        raise

    return {"backend_document": _content_to_text(response.content)}


async def compute_handoff_node(state: DashboardCodegenState) -> DashboardCodegenState:
    handoff = build_backend_handoff.func(state["input"])
    session_id = state.get("session_id")
    if session_id:
        handoff["sessionId"] = session_id
    return {"backend_handoff": handoff}


async def ui_generation_node(state: DashboardCodegenState) -> DashboardCodegenState:
    llm = await _get_codegen_llm()
    ui_prompt = _load_prompt_file(UI_PROMPT_FILE)

    payload = state["input"].copy()
    payload["backendHandoff"] = state["backend_handoff"]

    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=ui_prompt),
                HumanMessage(content=json.dumps(payload)),
            ]
        )
    except Exception as exc:
        await _persist_generation_failure(
            state,
            error=exc,
            error_code="ui_generation_failed",
        )
        raise

    return {"ui_document": _content_to_text(response.content)}


async def operations_generation_node(state: DashboardCodegenState) -> DashboardCodegenState:
    expected_params = state["backend_handoff"].get("filterParamNames") or []
    expected_jdbc_suffix = state["backend_handoff"].get("jdbcMethodSuffix") or None

    # Phase 3: try to assemble the apply manifest deterministically from the
    # already-generated markdown. When this succeeds the stage-3 LLM is skipped
    # entirely, which eliminates the whole class of re-transcription bugs
    # (double-escaped newlines, dropped Java semicolons, mis-pluralized params).
    try:
        deterministic_ops = _deterministic_file_operations(
            state["input"],
            state["backend_handoff"],
            state["backend_document"],
            state["ui_document"],
        )
    except Exception as exc:
        await _persist_generation_failure(
            state,
            error=exc,
            error_code="operations_deterministic_failed",
        )
        raise
    accumulated_backend = state.get("backend_document", "")
    accumulated_ui = state.get("ui_document", "")

    if deterministic_ops is not None:
        if not deterministic_ops:
            raise ValueError("Generated fileOperations are empty (deterministic path).")
        warnings = _validate_generated_artifacts(deterministic_ops, expected_params, expected_jdbc_suffix)
        warnings.append(
            {
                "code": "operations_source",
                "severity": "info",
                "message": "fileOperations assembled deterministically (stage-3 LLM skipped)",
            }
        )

        # Demo mode: DB persistence intentionally disabled.

        return {"file_operations": deterministic_ops, "warnings": warnings}

    llm = await _get_codegen_llm()
    operations_prompt = _load_prompt_file(OPERATIONS_PROMPT_FILE)

    # Ask the model for a strict JSON object so escaping is handled once by the
    # JSON generator instead of hand-written (which double-escapes newlines and
    # quotes into file content). Support is probed once and cached; if the
    # gateway rejects it we fall back to text parsing + the repair pass below.
    llm = _bind_json_mode(llm)

    payload = {
        "input": state["input"],
        "backendHandoff": state["backend_handoff"],
        "backendDocument": state["backend_document"],
        "uiDocument": state["ui_document"],
    }

    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=operations_prompt),
                HumanMessage(content=json.dumps(payload)),
            ]
        )

        raw = _content_to_text(response.content)
        parsed = _extract_json_object(raw)
        ops = parsed.get("fileOperations", []) if isinstance(parsed, dict) else []
        normalized_ops = _normalize_file_operations(ops)
        # Safety net: repair any residual double-escaped content before it is
        # written verbatim to files by the apply layer.
        repaired_ops = [_deep_repair_escaped(group) for group in normalized_ops]
        # Repair the `}\n[] =` split array-type annotation in any .ts content
        # (hard TS ASI compile error) so both paths stay leak-proof.
        repaired_ops = _repair_ts_array_type_splits(repaired_ops)
        if not repaired_ops:
            raise ValueError("Generated fileOperations are empty (LLM path).")
        generated_errors, _generated_warnings = _validate_grouped_file_operations(repaired_ops)
        if generated_errors:
            raise ValueError(
                "Invalid generated fileOperations: " + "; ".join(generated_errors)
            )
        # Deterministic backstop validation (non-blocking, surfaced to the UI).
        warnings = _validate_generated_artifacts(repaired_ops, expected_params, expected_jdbc_suffix)
    except Exception as exc:
        await _persist_generation_failure(
            state,
            error=exc,
            error_code="operations_generation_failed",
        )
        raise

    # Demo mode: DB persistence intentionally disabled.

    return {"file_operations": repaired_ops, "warnings": warnings}


def _build_graph():
    graph = StateGraph(DashboardCodegenState)
    graph.add_node("create_session_node", create_session_node)
    graph.add_node("backend_generation_node", backend_generation_node)
    graph.add_node("compute_handoff_node", compute_handoff_node)
    graph.add_node("ui_generation_node", ui_generation_node)
    graph.add_node("operations_generation_node", operations_generation_node)

    # create_session runs first (ensures a session id before any LLM work).
    # compute_handoff and backend/ui generation fan out from there.
    graph.add_edge(START, "create_session_node")
    graph.add_edge("create_session_node", "compute_handoff_node")
    graph.add_edge("compute_handoff_node", "backend_generation_node")
    graph.add_edge("compute_handoff_node", "ui_generation_node")
    graph.add_edge("backend_generation_node", "operations_generation_node")
    graph.add_edge("ui_generation_node", "operations_generation_node")
    graph.add_edge("operations_generation_node", END)

    return graph.compile()


_dashboard_codegen_graph = _build_graph()


async def run_dashboard_codegen(payload: DashboardCodegenRequest) -> DashboardCodegenResult:
    final_state = await _dashboard_codegen_graph.ainvoke(
        {"input": payload.model_dump(mode="json")}
    )

    backend_handoff = dict(final_state.get("backend_handoff", {}) or {})
    if final_state.get("session_id") and "sessionId" not in backend_handoff:
        backend_handoff["sessionId"] = final_state.get("session_id")

    return DashboardCodegenResult(
        sessionId=final_state.get("session_id"),
        backendDocument=final_state.get("backend_document", ""),
        uiDocument=final_state.get("ui_document", ""),
        backendHandoff=backend_handoff,
        fileOperations=final_state.get("file_operations", []) or [],
        warnings=final_state.get("warnings", []) or [],
    )


# Human-readable stage labels for the streaming progress feed. Keys are graph
# node names; values are (short stage id, user-facing message).
_CODEGEN_STAGE_LABELS: dict[str, tuple[str, str]] = {
    "create_session_node": ("session", "Session recorded"),
    "compute_handoff_node": ("handoff", "Computed backend handoff contract"),
    "backend_generation_node": ("backend", "Generated backend design"),
    "ui_generation_node": ("ui", "Generated UI design"),
    "operations_generation_node": ("operations", "Generated file operations"),
}


async def stream_dashboard_codegen(
    payload: DashboardCodegenRequest,
) -> AsyncGenerator[dict[str, Any], None]:
    """Run the codegen graph and yield progress events as each stage lands.

    Because backend and UI generation run concurrently (C1), a single graph
    update may carry more than one completed node. Each yielded dict is a
    JSON-serializable event of the form:

      {"type": "progress", "stage": "backend", "message": "...", "done": [...]}
      {"type": "result", "result": <DashboardCodegenResult as dict>}
      {"type": "error", "error": "..."}

    Implementation note: LangGraph 0.4.x has a bug where yielding from inside
    an ``async for ... astream(...)`` loop causes the internal ``FuturesDict``
    callback slot to become ``None`` (``TypeError: 'NoneType' object is not
    callable``) when the outer generator is suspended at the ``yield``. The
    fix is to run the graph in a background asyncio task that pushes events
    onto a queue; the generator then yields from the queue without ever
    suspending *inside* the astream iteration.
    """
    queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()

    async def _run_graph() -> None:
        try:
            async for update in _dashboard_codegen_graph.astream(
                {"input": payload.model_dump(mode="json")},
                stream_mode="updates",
            ):
                await queue.put(("update", update))
        except Exception as exc:
            await queue.put(("error", exc))
        finally:
            await queue.put(("done", None))

    task = asyncio.ensure_future(_run_graph())

    accumulated: dict[str, Any] = {}
    completed: list[str] = []
    try:
        while True:
            kind, data = await queue.get()
            if kind == "done":
                break
            if kind == "error":
                yield {"type": "error", "error": str(data)}
                return
            # kind == "update": data is a node_name -> state_delta mapping
            for node_name, delta in (data or {}).items():
                if isinstance(delta, dict):
                    accumulated.update(delta)
                stage_id, message = _CODEGEN_STAGE_LABELS.get(
                    node_name, (node_name, f"Completed {node_name}")
                )
                if stage_id not in completed:
                    completed.append(stage_id)
                yield {
                    "type": "progress",
                    "stage": stage_id,
                    "message": message,
                    "done": list(completed),
                }
    finally:
        # Ensure the background task is always awaited to avoid a warning.
        if not task.done():
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

    backend_handoff = dict(accumulated.get("backend_handoff", {}) or {})
    if accumulated.get("session_id") and "sessionId" not in backend_handoff:
        backend_handoff["sessionId"] = accumulated.get("session_id")

    result = DashboardCodegenResult(
        sessionId=accumulated.get("session_id"),
        backendDocument=accumulated.get("backend_document", ""),
        uiDocument=accumulated.get("ui_document", ""),
        backendHandoff=backend_handoff,
        fileOperations=accumulated.get("file_operations", []) or [],
        warnings=accumulated.get("warnings", []) or [],
    )
    yield {"type": "result", "result": result.model_dump()}


def _job_result_from_state(job_state: dict[str, Any]) -> DashboardCodegenResult | None:
    result_raw = job_state.get("result")
    if not isinstance(result_raw, dict):
        return None
    try:
        return DashboardCodegenResult.model_validate(result_raw)
    except Exception:
        return None


async def _run_dashboard_codegen_job(
    payload_data: dict[str, Any],
    session_id: str,
) -> None:
    state: DashboardCodegenState = {
        "input": payload_data,
        "session_id": session_id,
    }
    try:
        payload = DashboardCodegenRequest.model_validate(payload_data)
        graph_result = await _dashboard_codegen_graph.ainvoke(
            {
                "input": payload.model_dump(mode="json"),
                "session_id": session_id,
            }
        )
        backend_handoff = dict(graph_result.get("backend_handoff", {}) or {})
        if "sessionId" not in backend_handoff:
            backend_handoff["sessionId"] = session_id

        final_result = DashboardCodegenResult(
            sessionId=session_id,
            backendDocument=graph_result.get("backend_document", ""),
            uiDocument=graph_result.get("ui_document", ""),
            backendHandoff=backend_handoff,
            fileOperations=graph_result.get("file_operations", []) or [],
            warnings=graph_result.get("warnings", []) or [],
        ).model_dump(mode="json")

        async with _demo_jobs_lock:
            job = _demo_jobs.get(session_id)
            if job is not None:
                job["status"] = "generated"
                job["updatedAt"] = datetime.now(timezone.utc).isoformat()
                job["result"] = final_result
                job["error"] = None
    except Exception as exc:
        async with _demo_jobs_lock:
            job = _demo_jobs.get(session_id)
            if job is not None:
                job["status"] = "failed"
                job["updatedAt"] = datetime.now(timezone.utc).isoformat()
                job["error"] = str(exc)
        try:
            await _persist_generation_failure(
                state,
                error=exc,
                error_code="background_job_failed",
            )
        except Exception:
            pass
        print(f"[codegen] Background job failed for session {session_id}: {exc}")


@router.post("/api/dashboard-codegen/jobs")
async def start_dashboard_codegen_job(
    payload: DashboardCodegenRequest,
) -> dict[str, Any]:
    """Create a session/job id and run codegen asynchronously in-process."""
    payload_data = payload.model_dump(mode="json")

    session_id = str(uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    async with _demo_jobs_lock:
        _demo_jobs[session_id] = {
            "sessionId": session_id,
            "status": "pending",
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "payload": payload_data,
            "result": None,
            "error": None,
        }

    asyncio.create_task(_run_dashboard_codegen_job(payload_data, session_id))

    return {
        "ok": True,
        "sessionId": session_id,
        "status": "pending",
    }


@router.get("/api/dashboard-codegen/jobs/{session_id}")
async def get_dashboard_codegen_job(session_id: str) -> dict[str, Any]:
    """Poll dashboard codegen status and fetch result when available."""
    async with _demo_jobs_lock:
        row = _demo_jobs.get(session_id)

    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    status = str(row.get("status") or "pending").strip().lower() or "pending"
    response: dict[str, Any] = {
        "ok": True,
        "sessionId": session_id,
        "status": status,
        "createdAt": row.get("createdAt"),
        "updatedAt": row.get("updatedAt"),
    }

    error_message = row.get("error")
    if isinstance(error_message, str) and error_message.strip():
        response["error"] = error_message.strip()

    if status in {"generated", "applied"}:
        result = _job_result_from_state(row)
        if result is not None:
            response["result"] = result.model_dump(mode="json")

    return response
