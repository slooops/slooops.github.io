from __future__ import annotations

import base64
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
REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMATICS_ROOT = REPO_ROOT / "revenue-monitoring-ui" / "angular-app" / "schematics" / "monitoring-dashboard" / "files"

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
    baseBranch: str = "develop"
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


def _render_monitoring_schematic_template(relative_path: str, assignment_filter_key: str) -> str | None:
    feature_match = re.match(r"src/app/([^/]+)/\1\.component\.(ts|html|css|spec\.ts)$", relative_path)
    if not feature_match:
        return None

    feature_name, ext = feature_match.groups()
    template_name = f"__name@dasherize__.component.{ext}.template"
    template_path = SCHEMATICS_ROOT / template_name
    if not template_path.exists():
        return None

    content = template_path.read_text(encoding="utf-8")
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
    return match.group(1).strip()


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
    }

    if marker in marker_patterns:
        pattern = marker_patterns[marker]
        if not pattern.search(content):
            raise ValueError(f"Marker block '{marker}' not found in {file_path}")
        return pattern.sub(replacement, content, count=1)

    line_pattern = re.compile(rf"^.*{re.escape(marker)}.*$", re.MULTILINE)
    marker_match = line_pattern.search(content)
    if not marker_match:
        raise ValueError(f"Marker line '{marker}' not found in {file_path}")

    insert_at = marker_match.end()
    snippet = "\n" + replacement.rstrip() + "\n"
    return content[:insert_at] + snippet + content[insert_at:]


def _apply_routing_update(content: str, import_path: str, component_class: str, route_path: str) -> str:
    import_line = f"import {{ {component_class} }} from '{import_path}';"
    if import_line not in content:
        import_matches = list(re.finditer(r"^import .*;$", content, re.MULTILINE))
        if not import_matches:
            raise ValueError("No import section found in routing module")
        insert_at = import_matches[-1].end()
        content = content[:insert_at] + "\n" + import_line + content[insert_at:]

    route_snippet = (
        "  {\n"
        f"    path: '{route_path}',\n"
        f"    component: {component_class},\n"
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

        operations = frontend.get("operations") if isinstance(frontend.get("operations"), list) else []
        if not operations:
            errors.append("frontend.operations cannot be empty")
        else:
            first_op = operations[0]
            if first_op.get("op") != "replace_text":
                errors.append("frontend.operations[0] must set assignmentUsersFilterKey via replace_text")

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
                include_tests = not _command_skips_tests(command)
                materialized_files: list[str] = []
                if feature_name:
                    for relative_path in _monitoring_schematic_paths(feature_name, include_tests):
                        content = _render_monitoring_schematic_template(
                            relative_path,
                            "FILTER_KEY_PLACEHOLDER",
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
                updated = current + str(operation.get("content"))
            elif op == "create_or_replace":
                updated = str(operation.get("content"))
            elif op == "replace_text":
                replacement = operation.get("content") or {}
                find_text = str(replacement.get("find"))
                replace_text = str(replacement.get("replace"))
                if find_text not in current:
                    raise ValueError(f"Text to replace not found in {relative_path}")
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
                include_tests = not _command_skips_tests(command)
                materialized_files: list[str] = []
                if feature_name:
                    for relative_path in _monitoring_schematic_paths(feature_name, include_tests):
                        content = _render_monitoring_schematic_template(
                            relative_path,
                            "FILTER_KEY_PLACEHOLDER",
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
                )
                write_changed(root_path, routing_file, updated)
                steps.append({
                    "type": "preStep",
                    "target": target,
                    "op": step_op,
                    "status": "applied",
                    "path": f"{root_path}/{routing_file}",
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
                updated = current + str(operation.get("content"))
            elif op == "create_or_replace":
                updated = str(operation.get("content"))
            elif op == "replace_text":
                replacement = operation.get("content") or {}
                find_text = str(replacement.get("find"))
                replace_text_val = str(replacement.get("replace"))
                if find_text not in current:
                    raise ValueError(f"replace_text: pattern not found in {relative_path}")
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

    normalized_file_operations = _normalize_file_operations(payload.fileOperations)
    validation_errors, validation_warnings = _validate_grouped_file_operations(
        normalized_file_operations
    )
    if validation_errors:
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
        return {"ok": False, "stage": "get_base_sha", "error": str(exc)}

    try:
        if await _github_branch_exists(
            payload.owner, payload.repo, new_branch, installation_token
        ):
            return {
                "ok": False,
                "stage": "branch_collision",
                "error": f"Branch '{new_branch}' already exists.",
                "branch": new_branch,
                "resolution": "Use a different featureName or enable branch suffix strategy.",
            }
    except Exception as exc:
        return {"ok": False, "stage": "check_branch_exists", "error": str(exc), "branch": new_branch}

    try:
        await _github_create_branch(
            payload.owner, payload.repo, new_branch, base_sha, installation_token
        )
    except Exception as exc:
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
        return {
            "ok": False,
            "stage": "create_pr",
            "error": str(exc),
            "branch": new_branch,
            "commitSha": commit_sha,
        }

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
    normalized_ops = _normalize_file_operations(ops)
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
