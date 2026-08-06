# Spring Boot Backend Code Generation Prompt

You are generating a backend implementation document for the app team.

The app team will:

1. add generated code into the codebase,
2. commit changes,
3. create a PR to main.

Do not include any instructions about post-PR build operations.

> **Orchestration:** This is the **first** step of a three-prompt sequence. After producing the backend document, the agent computes the handoff metadata internally, automatically continues to the UI prompt in the same run, and then runs a third machine-oriented prompt that converts both documents into a structured apply manifest (`fileOperations`) for automated GitHub application.

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

Generate **one** backend implementation document that any developer (including someone doing this for the first time) can follow without any prior context. The document must be broken into clearly-labelled **phases**, each introduced with a short plain-English explanation of _what_ you are doing and _why_, before showing the code block.

**Strict output contract (mandatory):**

- Output only these sections, in this exact order: `Overview`, `Step 1`, `Step 2`, `Step 3a`, `Step 3b`, `Step 4`, `Step 5`.
- Do **not** add any extra top-level or mid-level sections.
- Specifically, do **not** emit sections such as: `Files touched/created`, `Layers`, `Naming derivations used`, `End result names`, `Notes`, `Summary`, or `Conclusion`.
- Do **not** print a standalone naming-derivation dump (for example: `FeaturePascalCase: ...`, `componentCamelCase: ...`, etc.). Use derived names directly inside the required code blocks and labels only.

### Document structure (follow exactly in order)

---

### Overview

Open with a brief (3–5 sentence) plain-English paragraph summarising what this implementation adds:

- what component is being added,
- what capability is being implemented,
- how the generated backend pieces work together at a high level.

This gives a first-time reader a mental map before they see any code.

> **CRITICAL — file naming rule:** In Steps 4 and 5 the service and controller file names are formed by appending `Service.java` / `Controller.java` to the **Feature PascalCase** derived from `featureName` (see Naming Derivation Rules below). You **must** write the actual derived name in every `Copy to:` label and inside the class declaration. **Never write angle-bracket placeholders literally in your output.**

---

### Step 1 — Environment Variables

Start with a short explanation: _"Environment variables store the raw SQL strings outside the codebase so queries can be changed per-environment without a code change."_

Then show ONE block labelled:

> `Copy to: envfile.json — add these four entries near the other *_Q entries`

Use a `json` code fence. Show only the four new key/value pairs (not the whole file).

---

### Step 2 — Query Properties

Short explanation: _"queries.properties maps a friendly property key to each env var so Spring can inject them with `@Value`."_

> `Copy to: src/main/resources/queries.properties — add these four lines at the end`

Use a plain code fence (no language tag). Show exactly four lines.

---

### Step 3 — QueryConfigs.java (two sub-steps)

Short explanation: _"QueryConfigs.java reads each property into a public field and exposes it as a named Spring bean so the service constructor can receive it by name."_

Then **two clearly labelled sub-steps**:

#### Step 3a — @Value field declarations

> `Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/configs/QueryConfigs.java — add these four @Value fields alongside the existing ones`

`java` code fence with the four `@Value` + `public String` declarations.

#### Step 3b — @Bean getter methods

> `Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/configs/QueryConfigs.java — add these four @Bean methods alongside the existing getters`

`java` code fence with the four `@Bean`-annotated getter methods.

> 💡 Each bean `name` must exactly match the field name — this is how Spring finds it when wiring the service constructor.

---

### Step 4 — Service Class (new file)

Short explanation: _"The service class owns the business logic: it runs the queries, formats date columns, and handles the assignment update. It is wired together entirely through Spring constructor injection — you do not call `new` anywhere."_

> `Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/`**[derive: `PascalCase(featureName)` + `Service.java`]** `— create this file`
>
> ⚠️ **You MUST emit the actual file name in the Copy-to label above** — not the template. Derive it now: convert `featureName` to PascalCase and append `Service.java`. Example: `featureName = "ait-monitoring"` → label reads `Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/AitMonitoringService.java`. Never write `<FeaturePascalCase>` literally in your output.

Emit the **complete, ready-to-paste service file** in a single `java` code fence. Do NOT split it into sub-blocks — one contiguous file.

Directly after the code block, add a plain-English **"What each method does"** mini-table:

| Method                                           | Purpose                                                         |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `get<ComponentPascalCase>Summary()`              | Fetches all summary rows; formats date columns                  |
| `get<ComponentPascalCase>Details()`              | Fetches all detail rows; formats date columns                   |
| `get<ComponentPascalCase>DetailsFiltered(...)`   | Fetches details matching the WHERE params; formats date columns |
| `update<ComponentPascalCase>Summary(updateData)` | Runs the UPDATE query with values from the request body         |

Then add a **⚠️ Date columns verification box**:

> ⚠️ **Before raising the PR**, confirm `dateColumns` is correct for each read method.
> The generated code uses `{"runDate"}` (or whichever date fields were detected). If the formatter helper in your project expects a different key format, adjust these arrays before committing.

Then add a **🗺️ Update-method mapping box** (visible even when `paramAliases` is empty):

> 🗺️ **How the update method maps `updateData` keys to SQL placeholders:**
> For each `?` in the UPDATE statement (in order), the method resolves the key to read from `updateData` using the following rules:
>
> 1. If `paramAliases` contains an entry `{ "updateCol": "summaryCol" }`, use `camelCase(summaryCol)` as the key.
> 2. Otherwise, use `camelCase(updateCol)` as the key.
> 3. **Special rule**: if the column is `assigned_by`, always use the key `"username"` regardless of aliases.
>    For this run, `paramAliases` is `{}` so no alias remapping applies. The resolved keys in placeholder order are listed in the comments inside the method.

---

### Step 5 — Controller Class (new file)

Short explanation: _"The controller exposes the four HTTP endpoints the Angular frontend calls. It delegates all work to the service — it contains no business logic."_

> `Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/controllers/`**[derive: `PascalCase(featureName)` + `Controller.java`]** `— create this file`
>
> ⚠️ **You MUST emit the actual file name in the Copy-to label above** — not the template. Derive it now: convert `featureName` to PascalCase and append `Controller.java`. Example: `featureName = "ait-monitoring"` → label reads `Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/controllers/AitMonitoringController.java`. Never write `<FeaturePascalCase>` literally in your output.

Emit the **complete, ready-to-paste controller file** in a single `java` code fence.

Directly after the code block, add an **Endpoint summary table**:

| Method | Path                                       | Description                                              |
| ------ | ------------------------------------------ | -------------------------------------------------------- |
| GET    | `/<component-kebab-case>-summary`          | Returns all summary rows                                 |
| GET    | `/<component-kebab-case>-details`          | Returns all detail rows                                  |
| GET    | `/<component-kebab-case>-details-filtered` | Returns filtered details (query params per WHERE column) |
| POST   | `/<component-kebab-case>-summary-update`   | Updates assignment fields for matching rows              |

Use plain language throughout. Avoid jargon unless the term is first explained in the Overview or in a callout box. Keep every explanation to 1–3 sentences — enough context to act, not a tutorial.

---

## Naming Derivation Rules (from componentName)

This section is **instructional only** for generation logic. Do **not** render this section (or a computed-derivations summary) in the final backend output document.

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

`Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/`**[derive and emit: `PascalCase(featureName)` + `Service.java`]**` (new file)` — **you MUST write the actual derived name here, not the template** (e.g. `AitMonitoringService.java` for `featureName = "ait-monitoring"`)

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

The file must start with the package declaration: `package com.cisco.des.o2c.rev.revenuemonitoringserver.services;`

Include the required imports at the top of the file: `org.springframework.beans.factory.annotation.Autowired`, `org.springframework.stereotype.Service`, `java.util.List`, `java.util.Map` (and `java.util.HashMap` if used), and the two project utility classes with their **exact** fully-qualified package paths:

```java
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
```

> ⚠️ **Import path is fixed — do not invent packages.** Both `JdbcManager` and `Common` live in `com.cisco.des.o2c.rev.revenuemonitoringserver.utils` (note: `utils`, plural). Never emit `...revenuemonitoringserver.db.JdbcManager` or `...revenuemonitoringserver.util.Common` — those packages do not exist and will not compile.

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
3. **iterate the result list and format each row individually** — `common.formatDateColumns` takes a single `Map<String, Object>` row, **never** the whole `List`. You MUST use the per-row `forEach` form:
   ```java
   result.forEach(data -> {
       common.formatDateColumns(data, dateColumns);
   });
   ```
   > ⚠️ **Do NOT write `common.formatDateColumns(result, dateColumns);`** — `result` is a `List<Map<String, Object>>` and the method signature is `formatDateColumns(Map<String, Object> data, String[] dateColumns)`. Passing the `List` is a compile error (incompatible types).
4. return `result`.

Canonical read-method shape:

```java
public List<Map<String, Object>> get<ComponentPascalCase>Summary() {
    List<Map<String, Object>> result = jdbcManager.queryForList(<componentCamelCase>Summary);
    String[] dateColumns = { /* date columns, verify before PR */ };
    result.forEach(data -> {
        common.formatDateColumns(data, dateColumns);
    });
    return result;
}
```

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

`Copy to: src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/controllers/`**[derive and emit: `PascalCase(featureName)` + `Controller.java`]**` (new file)` — **you MUST write the actual derived name here, not the template** (e.g. `AitMonitoringController.java` for `featureName = "ait-monitoring"`)

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

The file must start with the package declaration: `package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;`

Include the required imports at the top of the file: `org.springframework.beans.factory.annotation.Autowired`, `org.springframework.http.HttpStatus`, `org.springframework.http.ResponseEntity`, `org.springframework.web.bind.annotation.*`, `java.util.ArrayList`, `java.util.HashMap`, `java.util.List`, `java.util.Map`, and the service import: `com.cisco.des.o2c.rev.revenuemonitoringserver.services.<FeaturePascalCase>Service` (derive the actual class name from `featureName`).

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

The params are the `detailsFiltered` WHERE columns, in placeholder order, exposed as `List<String>`. **Each `@RequestParam` name MUST be `camelCase(column) + "s"`** — the frontend builds these query-param names by camelCasing the `keysToMap` value and appending a single `s` (see `camelCase()` in `data-formatting.service.ts`). For example `run_date` → `runDates`, `ctm_folder` → `ctmFolders`.

> ⚠️ **Do NOT append `List` to the param name** (e.g. `runDateList` is WRONG). The name is the camelCased column with a trailing `s` (`runDates`). A mismatched `@RequestParam` name breaks Spring binding and the filter endpoint fails. The loop-local singular variable (`runDate`) can be any name — only the `@RequestParam` name is contract-bound.

The loop calls the service with the singular values in the same order.

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

## ⚠️ INTERNAL ONLY — Document Order Reference (do NOT render in output)

**You MUST follow this exact phase order when generating the backend document.** Use this as your checklist — do not include this section in the generated output.

1. Overview
2. Step 1 — Environment Variables
3. Step 2 — Query Properties
4. Step 3a — QueryConfigs `@Value` fields
5. Step 3b — QueryConfigs `@Bean` getters
6. Step 4 — Service Class (complete file + method table + date columns box + update mapping box)
7. Step 5 — Controller Class (complete file + endpoint table)

> **This checklist and all sections marked "⚠️ INTERNAL ONLY" are for your reference only.** Do not render them in the generated markdown document sent to the app team. The only content that should appear in the generated output is the seven sections listed above (Overview through Step 5).

---
