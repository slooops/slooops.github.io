# Angular UI Config Generation Prompt

You are generating the UI configuration code that fills the marker sections of a
monitoring-dashboard component **already scaffolded by the Angular schematic**.

The schematic produces a working component shell with empty, clearly-labelled
marker sections. Your job is to produce the exact code blocks the app team pastes
into those markers — nothing else. Do not regenerate the scaffold, imports,
constructor, lifecycle, or event handlers.

The app team will:

1. paste the generated blocks into the marked locations,
2. commit changes,
3. create a PR to main.

Do not include any instructions about post-PR build operations.

> **Orchestration:** This is the **second** step of a three-prompt sequence, run automatically right after the backend prompt in the same agent run. The `backendHandoff` object is supplied **silently by the agent** from the backend step. After this UI document is generated, a third machine-oriented prompt runs to produce structured `fileOperations` apply artifacts for automated GitHub application.

---

## Input Object

You will receive the original form-data input **plus** the backend handoff
metadata produced by the backend prompt:

```json
{
  "componentName": "<Component Name>",
  "roleName": "<ROLE_NAME>",
  "assignmentUsersKey": "<ASSIGNMENT_USERS_KEY>",
  "summaryColumns": [
    "<COLUMN_1>",
    "<COLUMN_2>",
    "<COLUMN_3>",
    "<COLUMN_4>",
    "<COLUMN_5>"
  ],
  "detailsTableFilters": [
    { "columnName": "<COLUMN_NAME>", "type": "select|text" }
  ],
  "backendHandoff": {
    "componentName": "<Component Name>",
    "featureName": "<feature-name-kebab-case>",
    "uiEndpointMap": {
      "summaryUrl": "<...>",
      "detailsUrl": "<...>",
      "filteredDetailsUrl": "<...>",
      "summaryUpdateUrl": "<...>"
    },
    "keysToMap": ["<key1>", "<key2>"],
    "submitKeysToMap": ["<key1>", "<key2>"],
    "webexKeysToMap": ["<key1>", "<key2>"]
  }
}
```

---

## Naming Derivation Rules

From `componentName`, derive:

- `Title-Case` label (e.g. `Test Tracker` → `Test-Tracker`; preserve the hyphenated form used as the tab label)
- `component-kebab-case` (e.g. `test-tracker`)
- `componentCamelCase` (e.g. `testTracker`) — used as the prefix for **every** generated field/array/object name (`<componentCamelCase>FieldConfig`, `<componentCamelCase>Filters`, `<componentCamelCase>KeysToMap`, `<componentCamelCase>Urls`)

The component selector is always `app-<component-kebab-case>`.

From `featureName`, derive **only** the schematic-generation command argument shown in Step 1 (the `ng generate` command below). `featureName` is supplied by the user in the input object already in **kebab-case** (e.g. `ait-monitoring`) and is used **verbatim** as the schematic `name` argument — do not transform it.

From `assignmentUsersKey`, generate a **code update** in the feature component that sets `userContextData.assignmentUsersFilterKey` to that value after scaffolding. Do not rely on schematic CLI options for this value.

> **featureName validation (UI form concern):** the input form / request layer validates `featureName` against `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` and rejects non-kebab-case values with an error before this prompt runs, so you may assume `featureName` is already valid kebab-case here.

> **Target component file (important):** the schematic in Step 1 scaffolds the component from `featureName`, producing `<featureName>.component.ts` and `<featureName>.component.html` (e.g. `ait-monitoring.component.ts`). **All generated `.ts` config blocks (VISIBLE_TABS, FIELD_CONFIG, FILTER_CONFIGS, KEYS_TO_MAP, URL_MAPS) and the `.html` `@case` block are copied into that same `<featureName>` component file** — never into a `componentName`-named file. The `componentName`-derived names (selector `app-<component-kebab-case>`, label, and the `<componentCamelCase>*` array/object names) are used only as the identifiers **inside** that feature component. This lets multiple dashboard tabs live in one feature component: adding a new tab means appending another set of `<componentCamelCase>*` blocks (and another `@case`) to the same `<featureName>.component.*` files.

---

## Required Output

Generate one UI implementation document that any developer (including a first-timer with no prior context) can follow from top to bottom. The document must be broken into clearly-labelled **phases**, each introduced with a short plain-English explanation of _what_ you are doing and _why_, before showing the code block.

**Strict output contract (mandatory):**

- Output only these sections, in this exact order: `Overview`, `Step 1`, `Step 2`, `Step 3`, `Step 4`, `Step 5`, `Step 6`, `Step 7`.
- For **each of Steps 2–7**, include exactly one blockquote line that starts with `Copy to:` immediately before the code block.
- The line must use this exact prefix: `> Copy to:` (same style as backend output).
- Do not omit or rename `Copy to:` labels.
- Do not add extra top-level sections.

### Document structure (follow exactly in order)

---

### Overview

Open with a brief (3–5 sentence) plain-English paragraph that tells the app team:

- what component is being wired up and into which feature file,
- that the schematic scaffolds the component shell and all they need to do is paste the generated blocks into the markers,
- which two files will be modified.

> **CRITICAL — placeholder rule:** Every time you see `<featureName>`, `<componentCamelCase>`, or any other angle-bracket template string in these instructions, **replace it with the actual derived value before writing it in your output.** For example, if `featureName = "ait-monitoring"`, write `ait-monitoring.component.ts` — not `<featureName>.component.ts`. **Never emit angle-bracket placeholders literally in your output.**

---

### Step 1 — Scaffold the component

Explain: _"Run this command once in your Angular workspace to generate the empty `<featureName>` component shell. The schematic creates the `.ts` and `.html` files with clearly-labelled marker comments that the blocks below fill in."_

Show the command in a `bash` code fence:

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard <featureName>
```

Use `featureName` **verbatim** — no quotes, no transformation.

After the command, add one short validation sentence:

> Update `userContextData.assignmentUsersFilterKey` in `<featureName>.component.ts` to `<assignmentUsersKey>` as a code change in the generated block steps below.

After the command, add a small **Files created** note:

> This generates (substitute the actual `featureName` value — e.g. `ait-monitoring`):
>
> - `<featureName>.component.ts` — paste all `.ts` blocks from Steps 2–6 into this file
> - `<featureName>.component.html` — paste the `@case` block from Step 7 into this file

---

### Step 2 — VISIBLE_TABS

Short explanation: _"This array tells the dashboard shell which tabs to render and which roles can see each tab. One object = one tab."_

> Copy to: <resolved-featureName>.component.ts — replace the empty array under the // ─── VISIBLE_TABS marker

Use the actual `featureName` value in the `Copy to:` line above (example: `ait-monitoring.component.ts`).

Emit the full `visibleTabs` declaration in a `typescript` code fence.

Directly after the block add the **Adding a tab later** note:

> 💡 **Adding another tab to this same feature component later?** Do NOT re-declare `visibleTabs`. Instead append a new object to the existing array:
>
> ```typescript
> {
>   label: '<Title-Case label>',
>   component: 'app-<component-kebab-case>',
>   role: ['ADMIN', 'MONITORING_<ROLE_NAME>', 'MONITORING_<ROLE_NAME>_ADMIN'],
> },
> ```
>
> A second `visibleTabs` declaration is a **duplicate-member compile error**.

---

### Step 3 — FIELD_CONFIG

Short explanation: _"This array configures the assignment dialog form fields — one entry per form control. The first five entries map to the summary table columns (read-only). The last two (`assignedTo` and `comments`) are always appended and are the editable fields."_

> Copy to: <resolved-featureName>.component.ts — replace the empty array under the // ─── FIELD_CONFIG marker

Use the actual `featureName` value in the `Copy to:` line above (example: `ait-monitoring.component.ts`).

Emit the `<componentCamelCase>FieldConfig` array in a `typescript` code fence.

After the block add:

> 💡 `Validators` is already imported by the scaffold — do not add a duplicate import.

---

### Step 4 — FILTER_CONFIGS

Short explanation: _"This array configures the filter controls shown above the details table. Each entry maps a column name to its form control and filter type (`select` shows a dropdown, `text` shows a free-text input)."_

> Copy to: <resolved-featureName>.component.ts — replace the empty array under the // ─── FILTER_CONFIGS marker

Use the actual `featureName` value in the `Copy to:` line above (example: `ait-monitoring.component.ts`).

Emit the `<componentCamelCase>Filters` array in a `typescript` code fence.

---

### Step 5 — KEYS_TO_MAP

Short explanation: _"This array tells the dashboard which URL query-parameter keys to build when the user applies a filter. The order must match the `?` placeholder order in the `detailsFiltered` SQL query — it is computed from the backend SQL and passed through automatically."_

> Copy to: <resolved-featureName>.component.ts — replace the empty array under the // ─── KEYS_TO_MAP marker

Use the actual `featureName` value in the `Copy to:` line above (example: `ait-monitoring.component.ts`).

Emit the `<componentCamelCase>KeysToMap` string array in a `typescript` code fence.

> ⚠️ Keep values in **snake_case** exactly as shown — do not convert to camelCase.

---

### Step 6 — URL_MAPS

Short explanation: _"This object holds the backend API endpoint slugs the dashboard component calls. The four core URLs are derived from the backend controller paths. Leave the extra URL keys as empty strings unless your feature uses charts or Webex messaging."_

> Copy to: <resolved-featureName>.component.ts — replace the empty object under the // ─── URL_MAPS marker

Use the actual `featureName` value in the `Copy to:` line above (example: `ait-monitoring.component.ts`).

Emit the `<componentCamelCase>Urls` object in a `typescript` code fence.

After the block add an **Endpoint reference table**:

| Key                  | Endpoint slug                             | Method |
| -------------------- | ----------------------------------------- | ------ |
| `summaryUrl`         | `<component-kebab-case>-summary`          | GET    |
| `detailsUrl`         | `<component-kebab-case>-details`          | GET    |
| `filteredDetailsUrl` | `<component-kebab-case>-details-filtered` | GET    |
| `summaryUpdateUrl`   | `<component-kebab-case>-summary-update`   | POST   |

---

### Step 7 — DASHBOARD_CASES (HTML)

Short explanation: _"This `@case` block wires the shared `<app-monitoring-dashboard>` component to the config objects defined in Steps 2–6. It is placed inside the `@switch` block in the HTML file — one `@case` per tab."_

> Copy to: <resolved-featureName>.component.html — add inside the @switch block under the // ─── DASHBOARD_CASES marker

Use the actual `featureName` value in the `Copy to:` line above (example: `ait-monitoring.component.html`).

Emit the `@case` block in an `html` code fence.

---

## 1) VISIBLE_TABS (from componentName + roleName)

Build a single-tab array. Derive from `componentName` and `roleName`:

- `label` = Title-Case form of `componentName`
- `component` = `app-<component-kebab-case>`
- `role` = `['ADMIN', 'MONITORING_<ROLE_NAME>', 'MONITORING_<ROLE_NAME>_ADMIN']`

> 🔑 **Role convention (mandatory):** every generated role guard uses the `MONITORING_` prefix on the base `roleName`, plus its `_ADMIN` variant, and **always** includes the global `ADMIN` role. For `roleName: "AIT_TEST"` the array is `['ADMIN', 'MONITORING_AIT_TEST', 'MONITORING_AIT_TEST_ADMIN']`. Never emit the bare `roleName` without the `MONITORING_` prefix.

Example — `componentName: "test-tracker"`, `roleName: "TEST_TRACKER"`:

```typescript
visibleTabs: {
  label: string;
  component: string;
  role: string[];
  disabled?: boolean;
}[] = [
  {
    label: 'Test-Tracker',
    component: 'app-test-tracker',
    role: ['ADMIN', 'MONITORING_TEST_TRACKER', 'MONITORING_TEST_TRACKER_ADMIN'],
  },
];
```

> **Adding a tab to an existing feature component:** if the `<featureName>.component.ts` already declares a `visibleTabs` array (from a previously generated tab), **do not** re-declare it. Instead, **add a new object** to the existing array. Only emit the full `visibleTabs: {...}[] = [ ... ];` declaration for the **first** tab in a fresh component. In the generated document, note this explicitly next to the block (e.g. `If visibleTabs already exists in this component, append just this object instead of the whole declaration:`) and show the single object on its own:
>
> ```typescript
> {
>   label: 'AIT-Jobs',
>   component: 'app-ait-jobs',
>   role: ['ADMIN', 'MONITORING_AIT_JOBS', 'MONITORING_AIT_JOBS_ADMIN'],
> },
> ```

---

## 2) FIELD_CONFIG (from summaryColumns)

Use the **first five** entries of `summaryColumns`. For each column, the AI derives
`controlName` and `label` from the `sourceKey`:

- `sourceKey` = the column value as-is (UPPER_SNAKE_CASE)
- `controlName` = camelCase of the sourceKey (`COLUMN_1` → `column1`)
- `label` = Title Case of the sourceKey (`COLUMN_1` → `Column 1`)
- `disabled: true` for all five summary columns

Then **always append** two fixed entries:

- `assignedTo` — `disabled: 'dynamic'`, `validators: [Validators.required]`
- `comments` — no `disabled`, no `validators`

Produce one array named `<componentCamelCase>FieldConfig`.

Example (`componentCamelCase: "testTracker"`):

```typescript
testTrackerFieldConfig = [
  {
    controlName: "column1",
    label: "Column 1",
    sourceKey: "COLUMN_1",
    disabled: true,
  },
  {
    controlName: "column2",
    label: "Column 2",
    sourceKey: "COLUMN_2",
    disabled: true,
  },
  {
    controlName: "column3",
    label: "Column 3",
    sourceKey: "COLUMN_3",
    disabled: true,
  },
  {
    controlName: "column4",
    label: "Column 4",
    sourceKey: "COLUMN_4",
    disabled: true,
  },
  {
    controlName: "column5",
    label: "Column 5",
    sourceKey: "COLUMN_5",
    disabled: true,
  },
  {
    controlName: "assignedTo",
    label: "Assigned To",
    sourceKey: "ASSIGNED_TO",
    disabled: "dynamic",
    validators: [Validators.required],
  },
  { controlName: "comments", label: "Comments", sourceKey: "COMMENTS" },
];
```

> `Validators` is already imported in the scaffold. Do not add another import.

---

## 3) FILTER_CONFIGS (from detailsTableFilters)

Produce one array named `<componentCamelCase>Filters`. For each entry in
`detailsTableFilters`:

- `columnName` = the provided `columnName` (UPPER_SNAKE_CASE, as-is)
- `type` = the provided `type` (`select` or `text`, as-is)
- `formControlName` = camelCase of the `columnName`
- `subAppMapping: false`

Example — `detailsTableFilters: [{ "columnName": "PROCESS_FLOW", "type": "select" }, { "columnName": "ORG_NAME", "type": "select" }, { "columnName": "TRANSACTION_ID", "type": "text" }]`:

```typescript
testTrackerFilters: {
  formControlName: string;
  columnName: string;
  type: string;
  subAppMapping: boolean;
}
[] = [
  {
    columnName: "PROCESS_FLOW",
    formControlName: "processFlow",
    type: "select",
    subAppMapping: false,
  },
  {
    columnName: "ORG_NAME",
    formControlName: "orgName",
    type: "select",
    subAppMapping: false,
  },
  {
    columnName: "TRANSACTION_ID",
    formControlName: "transactionId",
    type: "text",
    subAppMapping: false,
  },
];
```

---

## 4) KEYS_TO_MAP (from backendHandoff.keysToMap)

Produce an array named `<componentCamelCase>KeysToMap` using the backend-derived
`keysToMap` **verbatim** (preserve order, keep snake_case as provided — do NOT
convert to camelCase).

```typescript
testTrackerKeysToMap: string[] = ['run_date', 'ctm_folder'];
```

---

## 5) URL_MAPS (from backendHandoff.uiEndpointMap)

Produce an object named `<componentCamelCase>Urls`. Use the backend endpoint
slugs for the four core URLs. Emit the remaining keys as empty strings unless the
backend explicitly provided them:

```typescript
testTrackerUrls: { [key: string]: string } = {
  summaryUrl: 'test-tracker-summary',
  detailsUrl: 'test-tracker-details',
  filteredDetailsUrl: 'test-tracker-details-filtered',
  summaryUpdateUrl: 'test-tracker-summary-update',
  webexMessageUrl: '',
  chartTotalsUrl: '',
  chartDetailsUrl: '',
};
```

---

## 6) DASHBOARD_CASES (html, one @case block)

Produce a single `@case` block wiring the shared `MonitoringDashboardComponent`.

- `[urls]` = `<componentCamelCase>Urls`
- `[keysToMap]` = `<componentCamelCase>KeysToMap`
- `[columnsToFilter]` = `<componentCamelCase>Filters`
- `[assignmentDialogFieldConfig]` = `<componentCamelCase>FieldConfig`
- `[componentName]` = the Title-Case label
- `[submitKeysToMap]` = `backendHandoff.submitKeysToMap` verbatim (inline snake_case array; empty array if none)
- `[webexKeysToMap]` = `backendHandoff.webexKeysToMap` verbatim (inline snake_case array; empty array if none)
- `[detailsColumnsToHide]` = `[]` by default

Example:

```html
@case ("app-test-tracker") {
<app-monitoring-dashboard
  [userContext]="userContextData"
  [urls]="testTrackerUrls"
  [keysToMap]="testTrackerKeysToMap"
  [componentName]="'Test-Tracker'"
  [columnsToFilter]="testTrackerFilters"
  [detailsColumnsToHide]="[]"
  [assignmentDialogFieldConfig]="testTrackerFieldConfig"
  [submitKeysToMap]="['ctm_folder', 'job_name']"
  [webexKeysToMap]="['ctm_folder', 'job_name']"
></app-monitoring-dashboard>
}
```

---
