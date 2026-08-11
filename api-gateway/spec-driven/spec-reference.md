# Dashboard Spec — Reference Manual

> 📖 **This is the detailed reference.** If you just want to create a dashboard, start
> with **`dashboard.spec.example.md`** (a fully filled-in example you can copy and edit)
> or the lean **`dashboard.spec.template.md`** skeleton. Come here only when you need to
> understand a specific rule.

> ✏️ **You may rewrite any plain English in this document however you like** — the sentences are just there to make it readable.
>
> ❌ **Do NOT change the marker names inside `{{ }}`, the `{{query: ...}}` label lines, or the ` ```sql ` code fences.** Replace **only** the sample values inside them.
>
> A marker looks like this: `{{ role: AIT_TEST }}` — the word before the colon (`role`) is the fixed marker name, and the text after the colon (`AIT_TEST`) is the value **you** fill in.

---

## 1. Identity

I want to create a dashboard called {{ feature: ait-test }} that belongs to the
component {{ component: AIT Jobs }}, protected by the role {{ role: AIT_TEST }},
and using the assignment users key {{ assignmentUsersKey: AIT_TEST }}.

This dashboard reads its data from a {{ dataStore: sql }} data source.

> **Value rules for this section**
>
> - `feature` — lowercase kebab-case (letters, numbers, dashes), e.g. `ait-test`, `revenue-recon`.
> - `component` — the human-friendly display name, any spacing/casing, e.g. `AIT Jobs`.
> - `role` — UPPER_SNAKE_CASE, e.g. `AIT_TEST`.
> - `assignmentUsersKey` — the key the UI uses to load the assignment-user list, e.g. `AIT_TEST`.
> - `dataStore` — either `sql` or `mongo`. Leave as `sql` unless told otherwise.

---

## 2. Summary Columns (exactly five)

The summary table shows these five columns, in this order:

{{ summaryColumn: RUN_DATE }}
{{ summaryColumn: CTM_FOLDER }}
{{ summaryColumn: JOB_NAME }}
{{ summaryColumn: STATUS }}
{{ summaryColumn: OWNER }}

> **Value rules**
>
> - Provide **exactly five** `summaryColumn` markers.
> - Each value is UPPER_SNAKE_CASE, matching the column name as it appears in your summary query.

---

## 3. Filters

Users can filter the details table by the following columns. Each filter names a
column and how it should appear — `select` for a dropdown, `text` for a free-text box:

{{ filter: RUN_DATE | text }}
{{ filter: CTM_FOLDER | select }}

> **Value rules**
>
> - One `filter` marker per filter column. Provide at least one.
> - Format is `COLUMN_NAME | type`, separated by a single pipe (`|`).
> - `COLUMN_NAME` is UPPER_SNAKE_CASE; `type` is either `select` or `text`.
> - The filter columns must line up, in order, with the `?` placeholders in your
>   **filtered-details** query below.

---

## 4. Column Aliases (optional)

Only fill this in if a column has a **different name in the update query** than it
has in the summary table. If not, leave this section empty (delete the sample line).

{{ alias: entity_name = org_name }}

> **Value rules**
>
> - Format is `updateColumn = summaryColumn`.
> - Optional — most dashboards need none. Delete the sample marker if unused.

---

## 5. Queries

Paste each raw SQL query into its code block, exactly as it should run. The small
`{{query: ...}}` line directly **above** each block tells us which query it is —
do not remove or rename it. The four query labels below are all **required**.

The summary query:

{{ query: summary }}

```sql
SELECT * FROM ARFINRO.XXCFI_SUMMARY_V
```

The details query:

{{ query: details }}

```sql
SELECT * FROM ARFINRO.XXCFI_DETAILS_V
```

The filtered-details query (its `?` placeholders must match the filters in Section 3, in order):

{{ query: detailsFiltered }}

```sql
SELECT * FROM ARFINRO.XXCFI_DETAILS_V
WHERE run_date = ? AND ctm_folder = ?
```

The summary-update query:

{{ query: summaryUpdate }}

```sql
UPDATE ARFINRO.XXCFI_SUMMARY_V
SET assigned_to = ?, comments = ?
WHERE run_date = ? AND ctm_folder = ?
```

> **Value rules**
>
> - All four query labels (`summary`, `details`, `detailsFiltered`, `summaryUpdate`)
>   are required, each with its own ` ```sql ` code block.
> - The SQL is copied **verbatim** — whatever you paste is exactly what runs. Do not
>   escape quotes or newlines; just paste the real query.

---

## What happens after you submit this spec

1. We read only the marked values (inside `{{ }}` and the ` ```sql ` blocks) — your
   surrounding sentences are ignored.
2. We show you a short plain-English summary of what we understood (component name,
   feature name, number of columns, number of filters, the four queries) and ask you
   to **confirm**.
3. After you confirm, we hand this off to the existing dashboard code generator —
   nothing about the generator changes; your spec simply becomes its input.
