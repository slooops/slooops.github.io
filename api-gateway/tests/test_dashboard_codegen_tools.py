from dashboard_codegen_agent import (
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
