# Code Apply Operations Prompt

You generate a machine-readable apply manifest from codegen outputs.

## Goal

Return JSON only (no prose) with a deterministic apply plan grouped by **backend** and **frontend** roots.

## Input

You receive:

```json
{
  "input": { "componentName": "...", "featureName": "...", "queries": { ... } },
  "backendHandoff": { ... },
  "backendDocument": "...markdown from backend prompt...",
  "uiDocument": "...markdown from ui prompt..."
}
```

## Output Contract (strict)

Return a single JSON object with this exact top-level shape:

```json
{
  "fileOperations": [
    {
      "target": "backend",
      "rootPath": "revenue-monitoring-server",
      "preSteps": [],
      "operations": [
        {
          "path": "string",
          "op": "create_or_replace|append|replace_marker_block|json_merge|replace_text",
          "content": "string or object",
          "marker": "optional marker label",
          "description": "short explanation"
        }
      ]
    },
    {
      "target": "frontend",
      "rootPath": "revenue-monitoring-ui/angular-app",
      "preSteps": [
        {
          "op": "run_command|update_routing_module|update_menu_component",
          "description": "short explanation"
        }
      ],
      "operations": [
        {
          "path": "string",
          "op": "create_or_replace|append|replace_marker_block|json_merge|replace_text",
          "content": "string or object",
          "marker": "optional marker label",
          "description": "short explanation"
        }
      ]
    }
  ]
}
```

- Output must be valid JSON.
- Do not use markdown code fences.
- Do not include comments.
- **Content strings must contain REAL characters, not escaped literals.** Each `content` value is written verbatim to a file. Represent line breaks as actual newline characters inside the JSON string (the JSON encoder escapes them once as `\n`). Do **NOT** hand-write a double-escaped `\\n`, `\\t`, or `\\"` — that lands in the file as a literal backslash-n / backslash-quote and breaks compilation. Never collapse a multi-line code block onto a single line of `\n` sequences.
- Keep execution order:
  1. backend.preSteps
  2. backend.operations
  3. frontend.preSteps
  4. frontend.operations
- `path` values are **relative to each group rootPath**, not repo root.
- Always emit both `backend` and `frontend` objects, even if one side has empty `operations`.

## Parsing rules

1. Parse both `backendDocument` and `uiDocument`.
2. For each section with a `Copy to:` label and a following code block, create one operation.
3. Preserve code block content exactly.
4. Resolve placeholder paths to real values whenever a concrete value is inferable from input.
5. Parse `uiDocument` for any prerequisite command steps (for example Angular schematic generation) and emit them in `frontend.preSteps` **before** any frontend file operations.

## Path and op mapping rules

### Backend document (`target=backend`, `rootPath=revenue-monitoring-server`)

- `Copy to: envfile.json — add ...`  
  -> `{ "path": "envfile.json", "op": "json_merge", "content": { ... } }`
  - Convert the JSON snippet into a JSON object as `content`.

- `Copy to: src/main/resources/queries.properties — add ...`  
  -> `{ "path": "src/main/resources/queries.properties", "op": "append", "content": "..." }`

- `Copy to: src/main/java/.../config/QueryConfigs.java — add ...`  
  -> `append` to real path:
  `src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/configs/QueryConfigs.java`

- `Copy to: src/main/java/.../services/<FeaturePascalCase>Service.java — create this file`  
  -> `create_or_replace` with real path in this repo:
  `src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/<FeaturePascalCase>Service.java`

- `Copy to: src/main/java/.../controllers/<FeaturePascalCase>Controller.java — create this file`  
  -> `create_or_replace` with real path in this repo:
  `src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/controllers/<FeaturePascalCase>Controller.java`

### UI document (`target=frontend`, `rootPath=revenue-monitoring-ui/angular-app`)

#### Required pre-step handling (Angular schematic)

- If `uiDocument` contains any command step such as `ng generate ...`, `ng g ...`, `npm run ng -- g ...`, or an explicit “run schematic first” instruction, emit it as the **first** entry in `frontend.preSteps`:

```json
{
  "op": "run_command",
  "command": "<exact command from uiDocument>",
  "description": "Run Angular schematic before applying UI file operations"
}
```

- Immediately after the schematic command, emit a second pre-step to register the new component in routing:

```json
{
  "op": "update_routing_module",
  "filePath": "src/app/app-routing.module.ts",
  "importPath": "./<featureName>/<featureName>.component",
  "componentClass": "<FeatureNamePascalCase>Component",
  "routePath": "<featureName>",
  "routeData": {
    "title": "Finance-IT Control Tower",
    "header": "Finance-IT Control Tower",
    "subHeader": "Continuous Monitoring > <Component Title-Case Label>",
    "supportsDarkMode": true
  },
  "description": "Add route entry (with data block) and import for generated monitoring dashboard component"
}
```

> The `routeData` block is **required**. Without it the generated route has no `header`, and AppComponent's `@if (header.length > 0)` throws on direct URL load, blanking the entire app. Always emit `title`, `header`, `subHeader`, and `supportsDarkMode`.

- Immediately after the routing pre-step, emit a third pre-step to add the dashboard to the left side-navigation:

```json
{
  "op": "update_menu_component",
  "filePath": "src/app/menu/menu.component.ts",
  "label": "<Component Title-Case Label>",
  "routePath": "<featureName>",
  "icon": "phosphorPulseBold",
  "roles": ["ADMIN", "MONITORING_<ROLE_NAME>", "MONITORING_<ROLE_NAME>_ADMIN"],
  "description": "Add side-nav entry for generated monitoring dashboard under Continuous Monitoring"
}
```

> `roles` MUST follow the `MONITORING_` convention: `["ADMIN", "MONITORING_<ROLE_NAME>", "MONITORING_<ROLE_NAME>_ADMIN"]`. `icon` must be an already-registered phosphor icon (default `phosphorPulseBold`).

- If `src/app/app-routing.module.ts` does not exist but `src/app/app.routes.ts` exists, use `filePath: "src/app/app.routes.ts"` and add an equivalent route entry in that file format.
- Routing and menu pre-steps must always come **after** schematic generation and **before** frontend marker replacements.

- If no explicit command is present but UI paths imply a new Angular component/module scaffold, infer one `ng generate` command using `featureName` and include it in `frontend.preSteps`.
- When inferring or preserving the schematic command for monitoring dashboards, use:

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard <featureName>
```

- The schematic template already contains the assignment key line under an `// ASSIGNMENT_FILTER_KEY` marker comment:

```ts
// ASSIGNMENT_FILTER_KEY (set by codegen apply step)
assignmentUsersFilterKey: '<%= assignmentFilterKey %>',
```

Set the assignment key via a **frontend code operation** immediately after scaffolding, using `replace_marker_block` with the `ASSIGNMENT_FILTER_KEY` marker (do **NOT** use `replace_text` with a `FILTER_KEY_PLACEHOLDER` find-string — that literal is never present in the rendered file):

```json
{
  "path": "src/app/<featureName>/<featureName>.component.ts",
  "op": "replace_marker_block",
  "marker": "ASSIGNMENT_FILTER_KEY",
  "content": "assignmentUsersFilterKey: '<assignmentUsersKey>',",
  "description": "Set assignmentUsersFilterKey in generated userContextData"
}
```

- Emit this `replace_marker_block` operation as the **first frontend operation** before the other marker replacements.

Use `featureName` from `input` for file names:

- `Copy to: <featureName>.component.ts` and mention marker `VISIBLE_TABS`  
  -> `{ "path": "src/app/<featureName>/<featureName>.component.ts", "op": "replace_marker_block", "marker": "VISIBLE_TABS", "content": "..." }`

- same for markers: `FIELD_CONFIG`, `FILTER_CONFIGS`, `KEYS_TO_MAP`, `URL_MAPS`

- `Copy to: <featureName>.component.html` with marker `DASHBOARD_CASES`  
  -> `replace_marker_block` on:
  `src/app/<featureName>/<featureName>.component.html`

## Marker names

Supported markers are exactly:

- `ASSIGNMENT_FILTER_KEY`
- `VISIBLE_TABS`
- `FIELD_CONFIG`
- `FILTER_CONFIGS`
- `KEYS_TO_MAP`
- `URL_MAPS`
- `DASHBOARD_CASES`

## Validation requirements

- Do not emit empty `content` in any `operations` item.
- Ensure every `replace_marker_block` includes `marker`.
- Ensure every `target` object has `rootPath`, `preSteps`, and `operations`.
- Ensure every `path` is relative to that target's `rootPath`.
- Keep all generated endpoint slugs / arrays exactly as produced in documents.
- Do not place frontend file operations before required schematic `preSteps`.
- Ensure frontend `preSteps` includes both:
  1. schematic generation command, and
  2. routing-module update step (with a `routeData` block), and
  3. menu-component update step (side-nav entry).
- Ensure frontend `operations` includes a `replace_marker_block` with `marker: "ASSIGNMENT_FILTER_KEY"` that sets `assignmentUsersFilterKey` to input `assignmentUsersKey` (emitted as the first frontend operation).
