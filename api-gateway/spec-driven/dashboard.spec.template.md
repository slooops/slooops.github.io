# Team Dashboard Onboarding Specification

Complete this file and upload it from the **Onboard Exception Monitoring**
screen. It contains the same information collected by the step-by-step form.

## How to complete this specification

1. Replace each sample value inside `{{ ... }}`.
2. Replace the sample SQL inside all four `sql` blocks.
3. Keep marker names such as `feature`, `component`, and `query` unchanged.
4. Add or remove repeated summary-column and filter markers as needed.
5. Do not include passwords, tokens, connection strings, or other secrets.

## 1. Identity and access

Provide the dashboard label, generated component name, access role, and the key
used to load assignable users.

{{ component: AIT Jobs }}
{{ feature: ait-monitoring }}
{{ role: AIT_JOBS }}
{{ assignmentUsersKey: AIT_USERS }}

Rules:

- `component` is the human-readable dashboard or tab name and may be up to 60 characters.
- `feature` must use lowercase kebab-case, such as `ait-monitoring`.
- `role` must use UPPER_SNAKE_CASE, such as `AIT_JOBS`.
- `assignmentUsersKey` is the existing lookup key for assignable users.

## 2. SQL queries

Provide all four SQL statements. Use `?` only for values that the generated
backend will bind as parameters.

### Summary query

Returns the top-level rows displayed in the summary table.

{{ query: summary }}

```sql
SELECT *
FROM ARFINRO.REPLACE_WITH_SUMMARY_SOURCE
```

### Details query

Returns the detail rows before filtering.

{{ query: details }}

```sql
SELECT *
FROM ARFINRO.REPLACE_WITH_DETAILS_SOURCE
```

### Filtered details query

Returns detail rows for the values represented by its `?` placeholders.

{{ query: detailsFiltered }}

```sql
SELECT *
FROM ARFINRO.REPLACE_WITH_DETAILS_SOURCE
WHERE REPLACE_WITH_KEY_COLUMN = ?
```

### Summary update query

Updates assignment or comment information from the summary table.

{{ query: summaryUpdate }}

```sql
UPDATE ARFINRO.REPLACE_WITH_SUMMARY_SOURCE
SET ASSIGNED_TO = ?, COMMENTS = ?
WHERE REPLACE_WITH_KEY_COLUMN = ?
```

## 3. Summary columns

List at least five columns to display in the summary table. Add more markers if
needed. Column names may use UPPER_SNAKE_CASE or lower_snake_case.

{{ summaryColumn: RUN_DATE }}
{{ summaryColumn: CTM_FOLDER }}
{{ summaryColumn: JOB_NAME }}
{{ summaryColumn: STATUS }}
{{ summaryColumn: OWNER }}

## 4. Details-table filters

Provide at least one UI filter. Each filter uses `COLUMN_NAME | type`, where
`type` is either `select` or `text`. These configure controls in the details
table and do not define the SQL parameters in the filtered-details query.

{{ filter: RUN_DATE | text }}
{{ filter: CTM_FOLDER | select }}

## 5. Team review

Before uploading this specification, confirm that:

- All sample identity values have been replaced.
- All four SQL blocks contain executable SQL for the intended environment.
- SQL uses bind placeholders instead of embedding user-provided values.
- At least five summary columns and one details-table filter are present.
- Every filter type is either `select` or `text`.
- No credentials or secrets are included.
