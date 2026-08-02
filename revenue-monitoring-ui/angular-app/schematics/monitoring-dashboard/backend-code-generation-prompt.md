# Spring Boot Backend Code Generation Prompt

You are generating a backend implementation document for the app team.

The app team will:

1. add generated code into the codebase,
2. commit changes,
3. create a PR to main.

Do not include any instructions about post-PR build operations.

> **Orchestration:** This is the **first** of a two-prompt sequence. After producing the backend document, the agent computes the handoff metadata internally and **automatically continues to the UI prompt in the same run** (no separate trigger). The two generated documents (backend + UI) are the final deliverables.

---

## Input Object

You will receive this input (delivered from the Python service as form-data):

```json
{
  "componentName": "<Component Name>",
  "featureName": "<feature-name-kebab-case>",
  "queries": {
    "summary": "<SQL_SUMMARY>",
    "details": "<SQL_DETAILS>",
    "detailsFiltered": "<SQL_DETAILS_FILTERED>",
    "summaryUpdate": "<SQL_SUMMARY_UPDATE>"
  },
  "paramAliases": {},
  "assignmentUsersKey": "<ASSIGNMENT_USERS_KEY>",
  "summaryColumns": ["<COLUMN_1>", "<COLUMN_2>", "<COLUMN_3>", "<COLUMN_4>", "<COLUMN_5>"],
  "detailsTableFilters": [{ "columnName": "<COLUMN_NAME>", "type": "select|text" }],
  "roleName": "<ROLE_NAME>"
}
```

### Field meanings

- `componentName` — human display name for the dashboard (e.g. `AIT Jobs`). Drives all query/field/method/endpoint naming.
- `featureName` — kebab-case name of the feature/module (e.g. `ait-monitoring`), supplied by the user in the input object already in kebab-case. **Used ONLY to name the generated service and controller classes** (`<FeaturePascalCase>Service` / `<FeaturePascalCase>Controller`) and, downstream, as the Angular schematic `ng generate` argument (verbatim). It does not affect any other generated code. Kebab-case validation is enforced by the UI input form, so you may assume it is already valid here.
- `queries` — the four raw SQL statements this dashboard runs.
- `paramAliases` — an **optional, user-supplied** map that resolves **column-name differences between the summary table and the update table**. Shape: `{ "<updateTableColumn>": "<summaryTableColumn>" }`. Example: `{ "entity_name": "org_name" }` means the column is called `entity_name` in the update query but `org_name` in the summary table / UI form data. **Never auto-populate this map** — it is empty (`{}`) unless the user explicitly provides entries in the form input. Do not infer aliases from SET columns or anywhere else. Used **only** in the service update-map lookup and in the `submitKeysToMap`/`webexKeysToMap` derivation.
- `assignmentUsersKey` — the key used by the UI to load the correct assignment-user list (UI concern; echo it into the handoff metadata only).
- `summaryColumns` — the first five summary-table columns. **Backend does not use these**; pass them straight through into the handoff metadata for the UI prompt.
- `detailsTableFilters` — the filter columns for the details grid, each with a `columnName` and a `type`. **Backend does not use these**; pass them straight through into the handoff metadata for the UI prompt.
- `roleName` — the base role name (e.g. `AIT_JOBS`). Backend does not use it directly; pass it through to the handoff metadata for the UI prompt.

---

## Required Output

Generate **one** backend implementation document in simple, sentence-based format.
It must include:

1. Input summary (echo values clearly)
2. Derived naming forms from `componentName`
3. Step-by-step code insertions in this order:
   - envfile entries
   - queries.properties entries
   - QueryConfigs entries
   - service-layer additions
   - controller-layer additions
4. dateColumns inference + verification notes
5. paramAliases mapping behavior
6. app-team implementation checklist
7. UI handoff metadata extracted from backend output (see the dedicated section)

Use plain language. Keep it easy for minimally technical users.

**Before every code block in the generated document, add a single one-line note (prefixed with `Copy to:`) telling the app team exactly which file and location the block goes into** — e.g. `Copy to: envfile.json (add near the other *_Q entries)`.

---

## Naming Derivation Rules (from componentName)

From `componentName`, derive:

- `COMPONENT_SNAKE` (UPPER_SNAKE_CASE)
- `component.dot.case`
- `componentCamelCase`
- `ComponentPascalCase`
- `component-kebab-case`

Example for `AIT Jobs`:

- `AIT_JOBS`
- `ait.jobs`
- `aitJobs`
- `AitJobs`
- `ait-jobs`

These derived forms must be used consistently in every layer.

Separately, from `featureName` derive **only**:

- `FeaturePascalCase` — PascalCase of `featureName` (split on `-`, capitalize each segment, join), used solely for the service/controller class names.

Example for `featureName = "ait-monitoring"` → `AitMonitoring` → classes `AitMonitoringService` and `AitMonitoringController`.

---

## SQL-to-Parameter Rules (strict)

1. Read placeholder order exactly as `?` appears in the SQL.
2. For `detailsFiltered`, extract params from WHERE-clause placeholders in exact order.
3. For `summaryUpdate`, extract params from:
   - SET placeholders first,
   - then WHERE placeholders,
   - in exact appearance order.
4. Ignore non-placeholder values (`SYSDATE`, constants, literals).
5. Strip wrappers for naming (e.g. `TRUNC(TO_DATE(job_date...))` → `jobDate`).
6. Convert SQL-style names to camelCase for Java variables.
7. Use `paramAliases` **only** in the service update-map lookup and the handoff `submitKeysToMap`/`webexKeysToMap` derivation (not in the controller, not in QueryConfigs). An alias maps an **update-table column name** to its **summary-table column name**.

---

## Envfile Entries (mandatory)

For each of the four queries, add a JSON entry to `envfile.json` using `UPPER_SNAKE_CASE` keys with a `_Q` suffix:

- `<COMPONENT_SNAKE>_SUMMARY_Q`
- `<COMPONENT_SNAKE>_DETAILS_Q`
- `<COMPONENT_SNAKE>_DETAILS_FILTERED_Q`
- `<COMPONENT_SNAKE>_SUMMARY_UPDATE_Q`

The value of each is the raw SQL string from the input (as a single-line JSON string).

---

## queries.properties Entries (mandatory)

Add one property line per query using `dot.case` keys with a `.q` suffix, referencing the env var:

- `<component.dot.case>.summary.q=${<COMPONENT_SNAKE>_SUMMARY_Q}`
- `<component.dot.case>.details.q=${<COMPONENT_SNAKE>_DETAILS_Q}`
- `<component.dot.case>.details.filtered.q=${<COMPONENT_SNAKE>_DETAILS_FILTERED_Q}`
- `<component.dot.case>.summary.update.q=${<COMPONENT_SNAKE>_SUMMARY_UPDATE_Q}`

---

## QueryConfigs Entries (mandatory)

In `QueryConfigs.java`, each query needs **two** things: a `@Value`-annotated public String field **and** a `@Bean`-annotated getter that returns that field (this codebase wires queries as named beans that the service constructor consumes by parameter name).

### a) `@Value` fields

```java
@Value("${<component.dot.case>.summary.q}")
public String <componentCamelCase>Summary;

@Value("${<component.dot.case>.details.q}")
public String <componentCamelCase>Details;

@Value("${<component.dot.case>.details.filtered.q}")
public String <componentCamelCase>DetailsFiltered;

@Value("${<component.dot.case>.summary.update.q}")
public String <componentCamelCase>SummaryUpdate;
```

### b) `@Bean` getters (one per field — REQUIRED)

The bean `name` must exactly match the field / service-constructor parameter name.

```java
@Bean(name = "<componentCamelCase>Summary")
public String get<ComponentPascalCase>Summary() {
    return this.<componentCamelCase>Summary;
}

@Bean(name = "<componentCamelCase>Details")
public String get<ComponentPascalCase>Details() {
    return this.<componentCamelCase>Details;
}

@Bean(name = "<componentCamelCase>DetailsFiltered")
public String get<ComponentPascalCase>DetailsFiltered() {
    return this.<componentCamelCase>DetailsFiltered;
}

@Bean(name = "<componentCamelCase>SummaryUpdate")
public String get<ComponentPascalCase>SummaryUpdate() {
    return this.<componentCamelCase>SummaryUpdate;
}
```

---

## Precise Service-Layer Instruction Block (mandatory)

Generate a **complete service class** named `<FeaturePascalCase>Service` (from `featureName`). Emit the whole file, ready to drop in. All member naming inside (fields, methods, params) is driven by `componentName`, not `featureName`.

`Copy to: src/main/java/.../services/<FeaturePascalCase>Service.java (new file)`

### A) Class shell, fields, dependencies, constructor

- `@Service` class named `<FeaturePascalCase>Service`.
- 4 private String query fields (`<componentCamelCase>Summary/Details/DetailsFiltered/SummaryUpdate`).
- Shared deps: `private JdbcManager jdbcManager;` and `@Autowired private Common common;`.
- An `@Autowired` constructor taking `JdbcManager` + the 4 query beans (parameter names match the bean names) and assigning every field.

```java
@Service
public class <FeaturePascalCase>Service {
    private JdbcManager jdbcManager;

    private String <componentCamelCase>Summary;
    private String <componentCamelCase>Details;
    private String <componentCamelCase>DetailsFiltered;
    private String <componentCamelCase>SummaryUpdate;

    @Autowired
    private Common common;

    @Autowired
    public <FeaturePascalCase>Service(JdbcManager jdbcManager,
                                      String <componentCamelCase>Summary,
                                      String <componentCamelCase>Details,
                                      String <componentCamelCase>DetailsFiltered,
                                      String <componentCamelCase>SummaryUpdate) {
        this.jdbcManager = jdbcManager;
        this.<componentCamelCase>Summary = <componentCamelCase>Summary;
        this.<componentCamelCase>Details = <componentCamelCase>Details;
        this.<componentCamelCase>DetailsFiltered = <componentCamelCase>DetailsFiltered;
        this.<componentCamelCase>SummaryUpdate = <componentCamelCase>SummaryUpdate;
    }

    // ... read + update methods (below) go inside this class
}
```

Include the required imports at the top of the file: `org.springframework.beans.factory.annotation.Autowired`, `org.springframework.stereotype.Service`, the project's `JdbcManager` and `Common` utils, `java.util.List`, `java.util.Map` (and `java.util.HashMap` if used).

### B) Read methods

Generate 3 read methods:

- `get<ComponentPascalCase>Summary()`
- `get<ComponentPascalCase>Details()`
- `get<ComponentPascalCase>DetailsFiltered(...)`

Each read method must:

1. call the generic `JdbcManager` methods:
   - `jdbcManager.queryForList(query)` for summary/details,
   - `jdbcManager.queryForListWithParams(query, params...)` for filtered.
2. define `String[] dateColumns = {...}` inside the method,
3. call `common.formatDateColumns(data, dateColumns)` for each row,
4. return `result`.

### C) Update method

Generate:

- `update<ComponentPascalCase>Summary(Map<String, String> updateData)`

Rules:

1. Bind values to the update query's `?` placeholders in exact SQL placeholder order (SET placeholders first, then WHERE placeholders). Ignore `SYSDATE`/literal columns such as `assigned_date` — they have no `?`.
2. For each placeholder column `x`, resolve the value key as follows:
   - if `paramAliases` has an entry `{ "x": "y" }` (i.e. update-table column `x` maps to summary-table column `y`), use `updateData.get(camelCase(y))`;
   - else use `updateData.get(camelCase(x))` — the update-table column name as-is.
   - Example: update column `entity_name` with alias `{ "entity_name": "org_name" }` → `updateData.get("orgName")`. Update column `assigned_to` with no alias → `updateData.get("assignedTo")`.
3. Special case (always): if the placeholder column is `assigned_by`, use `updateData.get("username")` regardless of aliases.
4. Execute:
   - `jdbcManager.executeUpdate(<componentCamelCase>SummaryUpdate, new Object[]{...})` with the resolved values in placeholder order.
5. Return the **actual update count** from `executeUpdate` (never hardcode `1`).

### D) dateColumns verification note (must be explicit)

In the output document, explicitly state:

- dateColumns must be added/verified in:
  - `get<ComponentPascalCase>Summary`
  - `get<ComponentPascalCase>Details`
  - `get<ComponentPascalCase>DetailsFiltered`
- If uncertain, keep `dateColumns` empty and mark it as "app team must fill before PR".

---

## Controller Rules (mandatory)

Generate a **complete controller class** named `<FeaturePascalCase>Controller` (from `featureName`). Emit the whole file, ready to drop in. Endpoint paths and method names are driven by `componentName`, not `featureName`.

`Copy to: src/main/java/.../controllers/<FeaturePascalCase>Controller.java (new file)`

Class shell:

```java
@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class <FeaturePascalCase>Controller {

    @Autowired
    <FeaturePascalCase>Service service;

    // ... the 4 endpoint methods (below) go inside this class
}
```

Include the required imports at the top of the file: `org.springframework.beans.factory.annotation.Autowired`, `org.springframework.http.HttpStatus`, `org.springframework.http.ResponseEntity`, `org.springframework.web.bind.annotation.*`, `java.util.ArrayList`, `java.util.HashMap`, `java.util.List`, `java.util.Map`, and the `<FeaturePascalCase>Service` import.

Generate all four endpoint methods (full method bodies), all using kebab-case paths.

### 1) Summary (GET)

```java
@GetMapping("/<component-kebab-case>-summary")
public ResponseEntity<List<Map<String, Object>>> get<ComponentPascalCase>Summary() {
    return new ResponseEntity<>(service.get<ComponentPascalCase>Summary(), HttpStatus.OK);
}
```

### 2) Details (GET)

```java
@GetMapping("/<component-kebab-case>-details")
public ResponseEntity<List<Map<String, Object>>> get<ComponentPascalCase>Details() {
    return new ResponseEntity<>(service.get<ComponentPascalCase>Details(), HttpStatus.OK);
}
```

### 3) Details Filtered (GET)

The params are the `detailsFiltered` WHERE columns, in placeholder order, **pluralized** as `List<String>`. The loop calls the service with the singular values in the same order.

```java
@GetMapping("/<component-kebab-case>-details-filtered")
public ResponseEntity<Map<String, Object>> get<ComponentPascalCase>DetailsFiltered(
        @RequestParam List<String> <param1Plural>,
        @RequestParam List<String> <param2Plural>) {
    try {
        List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
        int minLength = Math.min(<param1Plural>.size(), <param2Plural>.size());
        for (int i = 0; i < minLength; i++) {
            String <param1> = <param1Plural>.get(i);
            String <param2> = <param2Plural>.get(i);
            List<Map<String, Object>> result =
                service.get<ComponentPascalCase>DetailsFiltered(<param1>, <param2>);
            errorDetailsFiltered.addAll(result);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("errorDetailsFiltered", errorDetailsFiltered);
        return new ResponseEntity<>(response, HttpStatus.OK);
    } catch (Exception e) {
        return null;
    }
}
```

> For more than two params, extend the nested `Math.min(...)` accordingly and add one `String <param> = <paramPlural>.get(i);` line per param, in placeholder order.

### 4) Summary Update (POST)

```java
@PostMapping("/<component-kebab-case>-summary-update")
public ResponseEntity<String> update<ComponentPascalCase>Summary(@RequestBody Map<String, String> updateData) {
    int updated = service.update<ComponentPascalCase>Summary(updateData);
    return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
}
```

---

## Backend-to-UI Handoff Metadata (agent-internal — DO NOT print in the output document)

The agent computes the following handoff object and passes it **directly and silently** into the UI prompt as its `backendHandoff` input. **Never render this block in the generated backend `.md` document** — it is internal plumbing between the two prompts, not app-team-facing content.

### 1) `uiEndpointMap`

Object with URLs derived from the controller endpoints:

```json
{
  "summaryUrl": "<component-kebab-case>-summary",
  "detailsUrl": "<component-kebab-case>-details",
  "filteredDetailsUrl": "<component-kebab-case>-details-filtered",
  "summaryUpdateUrl": "<component-kebab-case>-summary-update"
}
```

### 2) `keysToMap`

Derive from the columns surfaced by the `detailsFiltered` query WHERE `?` placeholders.

- Keep each column **as-is in snake_case** (do NOT convert to camelCase).
- Preserve SQL placeholder order.
- Strip wrappers when reading the column name (e.g. `TRUNC(run_date)` → `run_date`).

Example:
`WHERE TRUNC(run_date)=? AND ctm_folder=?`
→ `["run_date", "ctm_folder"]`

### 3) `submitKeysToMap` and `webexKeysToMap`

Derive from the **WHERE-clause `?` columns of the `summaryUpdate` query only** (ignore the SET columns — those are supplied at runtime — and ignore `SYSDATE`/literal columns).

- Take the WHERE `?` columns in placeholder order.
- Transform each column through `paramAliases`: if an alias `{ "<updateColumn>": "<summaryColumn>" }` exists, replace `<updateColumn>` with `<summaryColumn>`; otherwise keep the update column as-is.
- Keep every column **as-is in snake_case** (do NOT convert to camelCase).
- `submitKeysToMap` and `webexKeysToMap` are **always identical**.

Example:
`... SET assigned_to=?, comments=?, assigned_by=?, assigned_date=SYSDATE WHERE period_name=? AND entity_name=? AND transaction_date=?`
with `paramAliases = { "entity_name": "org_name" }`
→ `["period_name", "org_name", "transaction_date"]` (for both arrays)

### 4) Pass-through fields (echo unchanged for the UI prompt)

- `componentName`
- `featureName`
- `roleName`
- `assignmentUsersKey`
- `summaryColumns`
- `detailsTableFilters`

---

## Step Order for Generated Document (must follow)

1. Input provided
2. Derived names
3. Env entries
4. Properties entries
5. Query config entries (`@Value` fields + `@Bean` getters)
6. Service insertions — full `<FeaturePascalCase>Service` class (with precise mapping rules)
7. Controller insertions — full `<FeaturePascalCase>Controller` class (all 4 endpoints)
8. dateColumns verification section
9. App-team checklist

> The Backend-to-UI handoff metadata (`uiEndpointMap`, `keysToMap`, `submitKeysToMap`, `webexKeysToMap`, pass-through fields) is computed by the agent **internally** and is **not** part of the generated document.

---

## App-Team Checklist (required section)

Include a final checklist confirming:

- env entries added
- properties entries added
- query config `@Value` fields **and** matching `@Bean` getters added
- service: full `<FeaturePascalCase>Service` class added (fields, constructor, 3 read methods, 1 update method)
- controller: full `<FeaturePascalCase>Controller` class added (autowired service + all 4 endpoints: summary, details, details-filtered, summary-update)
- paramAliases applied in service update method
- update method returns actual update count
- dateColumns verified in all 3 read methods
