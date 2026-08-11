---
description: "Use when adding or editing SQL queries, service methods, or REST endpoints in the Spring Boot backend. Covers the inline-SQL service pattern, named bind parameters, and the controller wiring."
applyTo: "revenue-monitoring-server/**"
---

# Java Service Query Pattern

## Stack constraints

- Spring Boot 2.7.18, **Java 11** — no text blocks (`"""`), no `var` in fields, no records
- Oracle via `JdbcTemplate` (not JPA). Data access always goes through `JdbcManager`
- Results are returned as `List<Map<String, Object>>` — Oracle returns column keys **UPPERCASE**

## Where SQL lives

**Preferred: inline `private static final String` constants at the top of the service class.**

```java
private static final String GHOST_SUCCESS = "SELECT incident_number, team_name, category, " +
        "resolution_api_status, caseiq_run_date " +
        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
        "WHERE resolution_api_status = 'SUCCESS' " +
        "AND is_active = 'TRUE' " +
        "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
        "ORDER BY caseiq_run_date DESC";
```

**Avoid** adding new queries to `queries.properties` + `envfile.json`. That path requires a
matching deployment config change in every environment and is easy to miss. The older
services still use it; do not migrate them, but write new queries inline.

Reference implementation: `services/CaseIQMonitoringService.java`.

### Conventions for the constants

- Group them under a `// ─── SQL Query Constants ───` banner before any methods
- Fully qualify tables with the schema: `ARFINRO.TABLE_NAME`
- Keep a trailing space at the end of every concatenated line (`"... is_active = 'TRUE' " +`)
- Escape backslashes for Oracle `REGEXP_LIKE` — `"\\w+(Error|Exception)\\b"`
- Name the constant after the concept, not the endpoint (`TEAM_VOLUME_SUMMARY`, not `getTeamVolume`)

## Binding parameters

Always use Oracle **named** bind params (`:snake_case`) and `JdbcManager.queryWithNamedParams`:

```java
public List<Map<String, Object>> getGhostSuccess(int lookbackHours, String fiscQtr) {
    Map<String, Object> params = new HashMap<>();
    params.put("lookback_hours", lookbackHours);
    return runQuery(GHOST_SUCCESS, params, fiscQtr);
}
```

- **Never** string-concatenate a user-supplied value into SQL
- The only values that may be interpolated are literals the code itself controls
  — and they must never come from a request
- For a caller-supplied column/table/direction, use a whitelist `Map` and look the value up,
  as `JdbcManager.ALLOWED_FIELD_CLAUSES` does
- `queryWithNamedParams` takes an empty map (`Collections.emptyMap()`) when the SQL has no binds

## Optional / conditional SQL fragments

Two accepted techniques, both used in `CaseIQMonitoringService`:

1. **`{{PLACEHOLDER}}` token** replaced with a fixed fragment (never with user input):

   ```java
   sql = fiscQtr != null
       ? sql.replace("{{FISC_QTR_FILTER}}", "AND fisc_qtr = :fisc_qtr ")
       : sql.replace("{{FISC_QTR_FILTER}}", "");
   ```

2. **Base SQL + a fragment from a `static final Map`** (`ISSUE_CONDITIONS`), keyed by an enum-like
   string that is validated against the map before use.

## Fiscal-quarter aware queries

`runQuery(sql, params, fiscQtr)` is the shared entry point for the CaseIQ endpoints:

- Always binds `fisc_qtr` (null when unset) so staging subqueries referencing `:fisc_qtr` stay valid
- When a quarter **is** selected it strips the rolling-date predicate (`DATE_LOOKBACK_PATTERN`),
  injects `AND fisc_qtr = :fisc_qtr` before `GROUP BY` / `ORDER BY` / `FETCH`
  (`FISC_QTR_INJECT_PATTERN`), and drops `lookback_hours` / `lookback_days` from the params
- So a new quarter-aware query only needs a standard `SYSDATE - :lookback_hours/24` predicate;
  do not hand-roll the quarter branch

Never hardcode a quarter (`FISCAL_QTR = 'Q4FY26'`) in new SQL — several legacy Oracle views do,
which is why the backend reproduces their definitions against the base table instead.

## Controller wiring

```java
@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api/caseiq")
public class CaseIQMonitoringController {

    @Autowired
    private CaseIQMonitoringService service;

    @GetMapping("/anomalies/ghost-success")
    public ResponseEntity<List<Map<String, Object>>> ghostSuccess(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getGhostSuccess(lookbackHours, fiscQtr), HttpStatus.OK);
    }
}
```

- Controllers stay thin — no SQL, no business logic, just delegate and wrap in `ResponseEntity`
- Query params are `camelCase` (`lookbackHours`); bind params are `snake_case` (`:lookback_hours`)
- `lookbackHours` defaults to `24`; `fiscQtr` is `required = false`

## Checklist for a new query

- [ ] `private static final String` constant in the service, schema-qualified, named binds
- [ ] Service method builds a `Map<String, Object>` and calls `runQuery` / `queryWithNamedParams`
- [ ] No user input concatenated into SQL; any dynamic identifier comes from a whitelist
- [ ] `@GetMapping` added to the controller, delegating only
- [ ] Verified against Oracle first (SQLcl MCP) before wiring it up
- [ ] **Restart the Spring Boot server** — it does not hot-reload SQL, service, or controller changes
