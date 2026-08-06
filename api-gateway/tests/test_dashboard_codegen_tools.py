import asyncio

import dashboard_codegen_agent as agent
from dashboard_codegen_agent import (
    DashboardApplyTriggerRequest,
    _simulate_grouped_file_operations,
    _validate_grouped_file_operations,
    build_backend_handoff,
    derive_names,
    extract_update_where_placeholders,
    extract_where_placeholders,
)


def _sample_payload(param_aliases=None, summary_update_override=None):
    return {
        "componentName": "AIT Jobs",
        "featureName": "ait-monitoring",
        "queries": {
            "summary": "SELECT period_name, ctm_folder, job_name, job_status, run_date, assigned_to, comments FROM arfinro.ait_job_summary",
            "details": "SELECT period_name, ctm_folder, job_name, job_status, run_date FROM arfinro.ait_job_details",
            "detailsFiltered": "SELECT period_name, ctm_folder, job_name, job_status, run_date FROM arfinro.ait_job_details WHERE TRUNC(run_date)=TRUNC(TO_DATE(?,'YYYY-MM-DD')) AND ctm_folder=?",
            "summaryUpdate": summary_update_override
            or "UPDATE t SET assigned_to=?, comments=?, assigned_by=?, assigned_date=SYSDATE WHERE ctm_folder=? AND job_name=?",
        },
        "paramAliases": param_aliases or {},
        "assignmentUsersKey": "AIT",
        "summaryColumns": ["PERIOD_NAME", "CTM_FOLDER", "JOB_NAME", "JOB_STATUS", "RUN_DATE"],
        "detailsTableFilters": [
            {"columnName": "RUN_DATE", "type": "text"},
            {"columnName": "CTM_FOLDER", "type": "select"},
        ],
        "roleName": "AIT_JOBS",
    }


def test_derive_names_expected_forms():
    names = derive_names.func("AIT Jobs")
    assert names["upper_snake"] == "AIT_JOBS"
    assert names["dot"] == "ait.jobs"
    assert names["camel"] == "aitJobs"
    assert names["pascal"] == "AitJobs"
    assert names["kebab"] == "ait-jobs"


def test_extract_where_placeholders_expected_order():
    sql = (
        "SELECT * FROM t WHERE TRUNC(run_date)=TRUNC(TO_DATE(?,'YYYY-MM-DD')) "
        "AND ctm_folder=?"
    )
    assert extract_where_placeholders.func(sql) == ["run_date", "ctm_folder"]


def test_extract_update_where_placeholders_where_only():
    sql = (
        "UPDATE t SET assigned_to=?, comments=?, assigned_by=?, assigned_date=SYSDATE "
        "WHERE ctm_folder=? AND job_name=?"
    )
    assert extract_update_where_placeholders.func(sql) == ["ctm_folder", "job_name"]


def test_build_backend_handoff_baseline():
    payload = _sample_payload()
    handoff = build_backend_handoff.func(payload)

    assert handoff["featureName"] == "ait-monitoring"
    assert handoff["keysToMap"] == ["run_date", "ctm_folder"]
    assert handoff["submitKeysToMap"] == ["ctm_folder", "job_name"]
    assert handoff["webexKeysToMap"] == ["ctm_folder", "job_name"]
    assert handoff["uiEndpointMap"]["summaryUrl"] == "ait-jobs-summary"


def test_build_backend_handoff_param_aliases_mapping():
    update_sql = (
        "UPDATE t SET assigned_to=?, comments=? WHERE entity_name=? AND ctm_folder=?"
    )
    payload = _sample_payload(
        param_aliases={"entity_name": "org_name"},
        summary_update_override=update_sql,
    )

    handoff = build_backend_handoff.func(payload)
    assert handoff["submitKeysToMap"] == ["org_name", "ctm_folder"]
    assert handoff["webexKeysToMap"] == ["org_name", "ctm_folder"]


def _grouped_file_operations():
    return [
        {
            "target": "backend",
            "rootPath": "revenue-monitoring-server",
            "preSteps": [],
            "operations": [
                {
                    "path": "envfile.json",
                    "op": "json_merge",
                    "content": {"AIT_JOBS_SUMMARY_Q": "SELECT 1 FROM dual"},
                    "description": "merge env var",
                }
            ],
        },
        {
            "target": "frontend",
            "rootPath": "revenue-monitoring-ui/angular-app",
            "preSteps": [
                {
                    "op": "run_command",
                    "command": "ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard ait-monitoring",
                    "description": "generate feature scaffold",
                },
                {
                    "op": "update_routing_module",
                    "filePath": "src/app/app-routing.module.ts",
                    "importPath": "./ait-monitoring/ait-monitoring.component",
                    "componentClass": "AitMonitoringComponent",
                    "routePath": "ait-monitoring",
                    "description": "register route",
                },
            ],
            "operations": [
                {
                    "path": "src/app/ait-monitoring/ait-monitoring.component.ts",
                    "op": "replace_text",
                    "content": {
                        "find": "assignmentUsersFilterKey: 'FILTER_KEY_PLACEHOLDER'",
                        "replace": "assignmentUsersFilterKey: 'AIT'",
                    },
                    "description": "set assignment key",
                },
                {
                    "path": "src/app/ait-monitoring/ait-monitoring.component.ts",
                    "op": "replace_marker_block",
                    "marker": "VISIBLE_TABS",
                    "content": "visibleTabs: {\n  label: string;\n  component: string;\n  role: string[];\n  disabled?: boolean;\n}[] = [];",
                    "description": "replace marker",
                },
            ],
        },
    ]


def test_validate_grouped_file_operations_accepts_expected_shape():
    errors, warnings = _validate_grouped_file_operations(_grouped_file_operations())

    assert errors == []
    assert warnings == []


def test_validate_grouped_file_operations_requires_frontend_prestep_order():
    payload = _grouped_file_operations()
    payload[1]["preSteps"] = [payload[1]["preSteps"][1], payload[1]["preSteps"][0]]

    errors, _ = _validate_grouped_file_operations(payload)

    assert "frontend.preSteps[0] must be run_command" in errors
    assert "frontend.preSteps[1] must be update_routing_module" in errors


def test_simulate_grouped_file_operations_returns_changed_files():
    preview = _simulate_grouped_file_operations(
        _grouped_file_operations(),
        {"assignmentUsersKey": "AIT"},
    )

    assert preview["changedFileCount"] >= 3
    assert any(path.endswith("app-routing.module.ts") for path in preview["changedFiles"])
    assert any(step["op"] == "update_routing_module" for step in preview["steps"])
    assert any(step["op"] == "replace_text" for step in preview["steps"])


def test_github_branch_exists_true(monkeypatch):
    async def _fake_list_branch_names(owner: str, repo: str, token: str):
        return {"main", "codegen/ait-monitoring"}

    monkeypatch.setattr(agent, "_github_list_branch_names", _fake_list_branch_names)

    exists = asyncio.run(
        agent._github_branch_exists("octo-org", "octo-repo", "codegen/ait-monitoring", "token")
    )

    assert exists is True


def test_github_branch_exists_false(monkeypatch):
    async def _fake_list_branch_names(owner: str, repo: str, token: str):
        return {"main", "develop"}

    monkeypatch.setattr(agent, "_github_list_branch_names", _fake_list_branch_names)

    exists = asyncio.run(
        agent._github_branch_exists("octo-org", "octo-repo", "codegen/ait-monitoring", "token")
    )

    assert exists is False


def test_apply_with_agent_returns_branch_collision_stage(monkeypatch):
    async def _fake_get_github_installation_token():
        return "installation-token"

    class _FakeRepoResp:
        def raise_for_status(self):
            return None

        def json(self):
            return {"default_branch": "main", "permissions": {"push": True}}

    async def _fake_http_get(url, headers=None, params=None):
        return _FakeRepoResp()

    async def _fake_get_branch_sha(owner: str, repo: str, branch: str, token: str):
        return "base-sha"

    async def _fake_branch_exists(owner: str, repo: str, branch: str, token: str):
        return True

    monkeypatch.setattr(agent, "_get_github_installation_token", _fake_get_github_installation_token)
    monkeypatch.setattr(agent._http_client, "get", _fake_http_get)
    monkeypatch.setattr(agent, "_github_get_branch_sha", _fake_get_branch_sha)
    monkeypatch.setattr(agent, "_github_branch_exists", _fake_branch_exists)

    payload = DashboardApplyTriggerRequest(
        owner="octo-org",
        repo="octo-repo",
        baseBranch="main",
        dryRun=False,
        backendDocument="backend-doc",
        uiDocument="ui-doc",
        backendHandoff={
            "featureName": "ait-monitoring",
            "assignmentUsersKey": "AIT",
        },
        fileOperations=_grouped_file_operations(),
    )

    result = asyncio.run(agent.dashboard_codegen_apply_with_agent(payload))

    assert result["ok"] is False
    assert result["stage"] == "branch_collision"
    assert result["branch"] == "codegen/ait-monitoring"
