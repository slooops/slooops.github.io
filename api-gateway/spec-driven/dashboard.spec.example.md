# Dashboard Spec — AIT Jobs (example)

<!--
  This is a REAL, fully filled-in spec. To make your own dashboard:
  1. Copy this file.
  2. Change the values inside {{ }} and the SQL inside the ```sql blocks.
  3. Leave everything else alone.
  The plain English sentences are optional — reword or delete them freely.
-->

## Identity

This spec creates a dashboard called {{ feature: ait-jobs }} under the component
{{ component: AIT Jobs }}, guarded by role {{ role: AIT_JOBS }}, using the
assignment users key {{ assignmentUsersKey: AIT }}.

## Summary columns (at least 5)

{{ summaryColumn: RUN_DATE }}
{{ summaryColumn: CTM_FOLDER }}
{{ summaryColumn: JOB_NAME }}
{{ summaryColumn: STATUS }}
{{ summaryColumn: OWNER }}

## Details-table filters (1 or more) format: COLUMN | select (or) text

{{ filter: RUN_DATE | text }}
{{ filter: CTM_FOLDER | select }}

## Queries (paste real SQL, verbatim)

{{ query: summary }}

```sql
SELECT run_date, ctm_folder, job_name, status, owner
FROM ARFINRO.XXCFI_AIT_JOBS_SUMMARY_V
```

{{ query: details }}

```sql
SELECT *
FROM ARFINRO.XXCFI_AIT_JOBS_DETAILS_V
```

{{ query: detailsFiltered }}

```sql
SELECT *
FROM ARFINRO.XXCFI_AIT_JOBS_DETAILS_V
WHERE run_date = ? AND ctm_folder = ?
```

{{ query: summaryUpdate }}

```sql
UPDATE ARFINRO.XXCFI_AIT_JOBS_SUMMARY_V
SET assigned_to = ?, comments = ?
WHERE run_date = ? AND ctm_folder = ?
```
