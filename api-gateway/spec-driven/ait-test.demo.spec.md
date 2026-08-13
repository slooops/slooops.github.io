# Team Dashboard Onboarding Specification

## Identity and access

Create an exception-monitoring dashboard with the following identity and access settings:

{{ component: AIT TEST }}
{{ feature: ait-test }}
{{ role: AIT_TEST }}
{{ assignmentUsersKey: AIT_TEST }}

## SQL queries

### Summary query

Use this query to load the summary table:

{{ query: summary }}

```sql
SELECT * FROM finisro.xxcfi_ait_jobs_summary_v
```

### Details query

Use this query to load all detail records:

{{ query: details }}

```sql
SELECT * FROM finisro.xxcfi_ait_jobs_detail_v
```

### Filtered details query

Use this query to load detail records filtered by job date, module, Control-M folder, and Control-M status:

{{ query: detailsFiltered }}

```sql
SELECT * FROM finisro.xxcfi_ait_jobs_detail_v WHERE job_date=? AND module=? AND ctm_folder=? AND ctm_status=?
```

### Summary update query

Use this query to assign and comment on uncleared summary records:

{{ query: summaryUpdate }}

```sql
UPDATE finisro.xxcfi_ait_jobs_audit SET assigned_to=?, assigned_date=SYSDATE, comments=? WHERE cleared_flag='N' AND job_date=TRUNC(TO_DATE(?, 'MM/DD/YYYY')) AND module=? AND ctm_folder=? AND ctm_status=?
```

## Summary columns

Display these summary columns in this order:

{{ summaryColumn: PERIOD_NAME }}
{{ summaryColumn: CTM_FOLDER }}
{{ summaryColumn: JOB_NAME }}
{{ summaryColumn: JOB_STATUS }}
{{ summaryColumn: RUN_DATE }}

## Details-table filters

Provide a text filter for run date and a selection filter for the Control-M folder:

{{ filter: RUN_DATE | text }}
{{ filter: CTM_FOLDER | select }}
