import asyncio
import json

from langchain_core.messages import AIMessage

import dashboard_codegen_agent as agent


class FakeLLM:
    def __init__(self):
        self.calls = []

    def bind(self, **kwargs):
        return self

    async def ainvoke(self, messages):
        self.calls.append(messages)
        system_text = messages[0].content
        user_payload = json.loads(messages[1].content)

        if "backend" in system_text.lower():
            return AIMessage(content=f"BACKEND DOC for {user_payload['componentName']}")

        return AIMessage(content=f"UI DOC for {user_payload['componentName']}")


def _payload():
    return agent.DashboardCodegenRequest(
        componentName="AIT Jobs",
        featureName="ait-monitoring",
        queries=agent.DashboardQueries(
            summary="SELECT * FROM summary_t",
            details="SELECT * FROM details_t",
            detailsFiltered=(
                "SELECT * FROM details_t WHERE TRUNC(run_date)=TRUNC(TO_DATE(?,'YYYY-MM-DD')) "
                "AND ctm_folder=?"
            ),
            summaryUpdate=(
                "UPDATE t SET assigned_to=?, comments=?, assigned_by=?, assigned_date=SYSDATE "
                "WHERE ctm_folder=? AND job_name=?"
            ),
        ),
        paramAliases={},
        assignmentUsersKey="AIT",
        summaryColumns=["PERIOD_NAME", "CTM_FOLDER", "JOB_NAME", "JOB_STATUS", "RUN_DATE"],
        detailsTableFilters=[
            agent.DashboardDetailsFilter(columnName="RUN_DATE", type="text"),
            agent.DashboardDetailsFilter(columnName="CTM_FOLDER", type="select"),
        ],
        roleName="AIT_JOBS",
        userName="AVUDUTHA",
        userEmail="avuduthax@cisco.com",
    )


def test_run_dashboard_codegen_with_mocked_llm(monkeypatch):
    fake = FakeLLM()

    async def _fake_get_llm():
        return fake

    monkeypatch.setattr(agent, "_get_llm", _fake_get_llm)

    result = asyncio.run(agent.run_dashboard_codegen(_payload()))

    assert result.backendDocument.startswith("BACKEND DOC")
    assert result.uiDocument.startswith("UI DOC")
    assert result.backendHandoff["keysToMap"] == ["run_date", "ctm_folder"]
    assert result.backendHandoff["featureName"] == "ait-monitoring"
    assert result.backendHandoff["submitKeysToMap"] == ["ctm_folder", "job_name"]
    assert result.backendHandoff["webexKeysToMap"] == ["ctm_folder", "job_name"]
    assert len(fake.calls) == 2
