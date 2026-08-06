import json
from datetime import datetime

import requests

BASE = "http://127.0.0.1:8000"
OWNER = "cisco-it-finance"
REPO = "rev-ops-monitoring"
BASE_BRANCH = "develop"

stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
feature = f"copilot-smoke-{stamp}"
component_class = "".join(part.capitalize() for part in feature.split("-")) + "Component"
component_path = f"src/app/{feature}/{feature}.component.ts"

payload = {
    "owner": OWNER,
    "repo": REPO,
    "baseBranch": BASE_BRANCH,
    "dryRun": True,
    "backendDocument": "smoke-backend-doc",
    "uiDocument": "smoke-ui-doc",
    "backendHandoff": {
        "featureName": feature,
        "assignmentUsersKey": "AIT",
    },
    "fileOperations": [
        {
            "target": "backend",
            "rootPath": "revenue-monitoring-server",
            "preSteps": [],
            "operations": [
                {
                    "path": "envfile.json",
                    "op": "json_merge",
                    "content": {f"COPILOT_SMOKE_{stamp}": "SELECT 1 FROM dual"},
                    "description": "smoke merge",
                }
            ],
        },
        {
            "target": "frontend",
            "rootPath": "revenue-monitoring-ui/angular-app",
            "preSteps": [
                {
                    "op": "run_command",
                    "command": f"ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard {feature}",
                    "description": "generate feature scaffold",
                },
                {
                    "op": "update_routing_module",
                    "filePath": "src/app/app-routing.module.ts",
                    "importPath": f"./{feature}/{feature}.component",
                    "componentClass": component_class,
                    "routePath": feature,
                    "description": "register route",
                },
            ],
            "operations": [
                {
                    "path": component_path,
                    "op": "replace_text",
                    "content": {
                        "find": "assignmentUsersFilterKey: 'FILTER_KEY_PLACEHOLDER'",
                        "replace": "assignmentUsersFilterKey: 'AIT'",
                    },
                    "description": "set assignment key",
                },
                {
                    "path": component_path,
                    "op": "replace_marker_block",
                    "marker": "VISIBLE_TABS",
                    "content": "visibleTabs: {\n  label: string;\n  component: string;\n  role: string[];\n  disabled?: boolean;\n}[] = [];",
                    "description": "replace marker",
                },
            ],
        },
    ],
}


def call_apply(dry_run: bool):
    body = dict(payload)
    body["dryRun"] = dry_run
    response = requests.post(f"{BASE}/api/dashboard-codegen/apply-with-agent", json=body, timeout=180)
    return response.status_code, response.json()


step4_code, step4 = call_apply(True)
step6_code, step6 = call_apply(False)
step5_code, step5 = call_apply(False)

print(json.dumps({
    "feature": feature,
    "step4": {
        "status": step4_code,
        "ok": step4.get("ok"),
        "stage": step4.get("stage"),
        "changedFileCount": (step4.get("executionPreview") or {}).get("changedFileCount"),
        "error": step4.get("error"),
    },
    "step6": {
        "status": step6_code,
        "ok": step6.get("ok"),
        "stage": step6.get("stage"),
        "branch": step6.get("branch"),
        "prUrl": step6.get("prUrl"),
        "commitSha": step6.get("commitSha"),
        "changedFileCount": step6.get("changedFileCount"),
        "error": step6.get("error"),
    },
    "step5": {
        "status": step5_code,
        "ok": step5.get("ok"),
        "stage": step5.get("stage"),
        "branch": step5.get("branch"),
        "error": step5.get("error"),
        "resolution": step5.get("resolution"),
    },
}, indent=2))
