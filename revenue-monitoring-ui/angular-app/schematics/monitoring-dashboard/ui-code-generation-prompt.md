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

> **Orchestration:** This is the **second** of a two-prompt sequence, run automatically right after the backend prompt in the same agent run. The `backendHandoff` object is supplied **silently by the agent** from the backend step — it is never shown to the user and never appears in the backend output document.

---

## Input Object

You will receive the original form-data input **plus** the backend handoff
metadata produced by the backend prompt:

```json
{
  "componentName": "<Component Name>",
  "roleName": "<ROLE_NAME>",
  "assignmentUsersKey": "<ASSIGNMENT_USERS_KEY>",
  "summaryColumns": ["<COLUMN_1>", "<COLUMN_2>", "<COLUMN_3>", "<COLUMN_4>", "<COLUMN_5>"],
  "detailsTableFilters": [{ "columnName": "<COLUMN_NAME>", "type": "select|text" }],
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

From `featureName`, derive **only** the schematic-generation command argument shown in Step 1 (the `ng generate` command below). `featureName` is supplied by the user in the input object already in **kebab-case** (e.g. `ait-monitoring`) and is used **verbatim** as the schematic `name` argument — do not transform it. It is not used anywhere else in the UI config.

> **featureName validation (UI form concern):** the input form / request layer validates `featureName` against `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` and rejects non-kebab-case values with an error before this prompt runs, so you may assume `featureName` is already valid kebab-case here.

> **Target component file (important):** the schematic in Step 1 scaffolds the component from `featureName`, producing `<featureName>.component.ts` and `<featureName>.component.html` (e.g. `ait-monitoring.component.ts`). **All generated `.ts` config blocks (VISIBLE_TABS, FIELD_CONFIG, FILTER_CONFIGS, KEYS_TO_MAP, URL_MAPS) and the `.html` `@case` block are copied into that same `<featureName>` component file** — never into a `componentName`-named file. The `componentName`-derived names (selector `app-<component-kebab-case>`, label, and the `<componentCamelCase>*` array/object names) are used only as the identifiers **inside** that feature component. This lets multiple dashboard tabs live in one feature component: adding a new tab means appending another set of `<componentCamelCase>*` blocks (and another `@case`) to the same `<featureName>.component.*` files.

---

## Required Output

Generate one UI implementation document. Begin the document with **Step 1**, the
schematic-generation command (using `featureName`), then the **six** clearly-labelled
code blocks, each mapped to a marker in the scaffolded component.

**Step 1 — Generate the component scaffold** (always the first instruction in the output document):

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard <featureName>
```

Use the `featureName` value **verbatim** as the schematic argument (it is already kebab-case, e.g. `ait-monitoring`). Do not add quotes or transform it.

Then emit the six code blocks:

| #   | Marker            | File    | Block name                              |
| --- | ----------------- | ------- | --------------------------------------- |
| 1   | `VISIBLE_TABS`    | `.ts`   | visibleTabs array                       |
| 2   | `FIELD_CONFIG`    | `.ts`   | `<componentCamelCase>FieldConfig` array |
| 3   | `FILTER_CONFIGS`  | `.ts`   | `<componentCamelCase>Filters` array     |
| 4   | `KEYS_TO_MAP`     | `.ts`   | `<componentCamelCase>KeysToMap` array   |
| 5   | `URL_MAPS`        | `.ts`   | `<componentCamelCase>Urls` object       |
| 6   | `DASHBOARD_CASES` | `.html` | `@case` block                           |

Then include an app-team checklist.

**Before every code block in the generated document, add a single one-line note (prefixed with `Copy to:`) telling the app team exactly which file and marker the block goes into. The target file is always the `featureName`-scaffolded component** — e.g. `Copy to: <featureName>.component.ts (replace the empty array under the // ─── VISIBLE_TABS marker)` for `.ts` blocks and `Copy to: <featureName>.component.html (add inside the @switch under the DASHBOARD_CASES marker)` for the `@case` block. For `ait-monitoring`, that means `ait-monitoring.component.ts` / `ait-monitoring.component.html`.

---

## 1) VISIBLE_TABS (from componentName + roleName)

Build a single-tab array. Derive from `componentName` and `roleName`:

- `label` = Title-Case form of `componentName`
- `component` = `app-<component-kebab-case>`
- `role` = `['ADMIN', '<ROLE_NAME>', '<ROLE_NAME>_ADMIN']`

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
    role: ['ADMIN', 'TEST_TRACKER', 'TEST_TRACKER_ADMIN'],
  },
];
```

> **Adding a tab to an existing feature component:** if the `<featureName>.component.ts` already declares a `visibleTabs` array (from a previously generated tab), **do not** re-declare it. Instead, **add a new object** to the existing array. Only emit the full `visibleTabs: {...}[] = [ ... ];` declaration for the **first** tab in a fresh component. In the generated document, note this explicitly next to the block (e.g. `If visibleTabs already exists in this component, append just this object instead of the whole declaration:`) and show the single object on its own:
>
> ```typescript
> {
>   label: 'AIT-Jobs',
>   component: 'app-ait-jobs',
>   role: ['ADMIN', 'AIT_JOBS', 'AIT_JOBS_ADMIN'],
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
  { controlName: "column1", label: "Column 1", sourceKey: "COLUMN_1", disabled: true },
  { controlName: "column2", label: "Column 2", sourceKey: "COLUMN_2", disabled: true },
  { controlName: "column3", label: "Column 3", sourceKey: "COLUMN_3", disabled: true },
  { controlName: "column4", label: "Column 4", sourceKey: "COLUMN_4", disabled: true },
  { controlName: "column5", label: "Column 5", sourceKey: "COLUMN_5", disabled: true },
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
  { columnName: "PROCESS_FLOW", formControlName: "processFlow", type: "select", subAppMapping: false },
  { columnName: "ORG_NAME", formControlName: "orgName", type: "select", subAppMapping: false },
  { columnName: "TRANSACTION_ID", formControlName: "transactionId", type: "text", subAppMapping: false },
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
<app-monitoring-dashboard [userContext]="userContextData" [urls]="testTrackerUrls" [keysToMap]="testTrackerKeysToMap" [componentName]="'Test-Tracker'" [columnsToFilter]="testTrackerFilters" [detailsColumnsToHide]="[]" [assignmentDialogFieldConfig]="testTrackerFieldConfig" [submitKeysToMap]="['ctm_folder', 'job_name']" [webexKeysToMap]="['ctm_folder', 'job_name']"></app-monitoring-dashboard>
}
```

---

## Mapping Summary (quick reference)

| UI block                            | Source                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `visibleTabs`                       | `componentName` + `roleName`                                                       |
| `<name>FieldConfig`                 | first 5 of `summaryColumns` + fixed `assignedTo`/`comments`                        |
| `<name>Filters` (`columnsToFilter`) | `detailsTableFilters` (columnName + type)                                          |
| `<name>KeysToMap`                   | `backendHandoff.keysToMap` (snake_case, from `detailsFiltered` WHERE)              |
| `<name>Urls`                        | `backendHandoff.uiEndpointMap`                                                     |
| `submitKeysToMap`                   | `backendHandoff.submitKeysToMap` (snake_case update WHERE cols via `paramAliases`) |
| `webexKeysToMap`                    | identical to `submitKeysToMap`                                                     |
| `detailsColumnsToHide`              | empty array by default                                                             |

---

## App-Team Checklist (required section)

Include a final checklist confirming the app team has:

- run the `ng generate` command (Step 1) with the `featureName` argument to scaffold the `<featureName>` component
- pasted every `.ts` block below into the **same** `<featureName>.component.ts` (all markers live in that one feature component)
- pasted `visibleTabs` into the `VISIBLE_TABS` marker
- pasted `<name>FieldConfig` into the `FIELD_CONFIG` marker
- pasted `<name>Filters` into the `FILTER_CONFIGS` marker
- pasted `<name>KeysToMap` into the `KEYS_TO_MAP` marker
- pasted `<name>Urls` into the `URL_MAPS` marker
- pasted the `@case` block into the `DASHBOARD_CASES` marker in the `<featureName>.component.html`
- verified the tab role matches the roles configured in routing/nav
- left `detailsColumnsToHide` empty unless a column must be hidden
- (adding another tab later) appended a new `<componentCamelCase>*` set + `@case` to the same `<featureName>.component.*` files instead of scaffolding a new component
- (adding another tab later) added a new **object** to the existing `visibleTabs` array rather than re-declaring `visibleTabs` (a second declaration is a duplicate-member compile error)
