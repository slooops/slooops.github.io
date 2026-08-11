# Dashboard Spec

<!--
  HOW TO USE
  • Change only the value after each colon inside {{ }}, and the SQL inside ```sql blocks.
  • Everything else can stay exactly as-is.
  • New here? Copy dashboard.spec.example.md instead — it's fully filled in.
  • Need the rules for a field? See spec-reference.md.
-->

## Identity

{{ feature: my-feature }} <!-- kebab-case, e.g. ait-test -->
{{ component: My Component }} <!-- display name, e.g. AIT Jobs -->
{{ role: MY_ROLE }} <!-- UPPER_SNAKE, e.g. AIT_TEST -->
{{ assignmentUsersKey: MY_KEY }} <!-- assignment-users key -->
{{ dataStore: sql }} <!-- sql or mongo -->

## Summary columns (exactly 5)

{{ summaryColumn: COLUMN_1 }}
{{ summaryColumn: COLUMN_2 }}
{{ summaryColumn: COLUMN_3 }}
{{ summaryColumn: COLUMN_4 }}
{{ summaryColumn: COLUMN_5 }}

## Filters (1 or more) format: COLUMN | select (or) text

{{ filter: COLUMN_1 | text }}
{{ filter: COLUMN_2 | select }}

## Aliases (optional) format: updateColumn = summaryColumn

<!-- delete the next line if you have none -->

{{ alias: update_col = summary_col }}

## Queries (paste real SQL, verbatim)

{{ query: summary }}

```sql
-- summary SQL here
```

{{ query: details }}

```sql
-- details SQL here
```

{{ query: detailsFiltered }}

```sql
-- filtered SQL here; the ? placeholders match the filters above, in order
```

{{ query: summaryUpdate }}

```sql
-- update SQL here
```
