### Guide for Implementing Update and Filter Queries

This guide provides a step-by-step process for implementing update and filter queries in the backend JDBC server and the Angular frontend.

### Notes

- This guide assumes the user has already completed the steps for implementing summary and detail queries. If this has not yet been completed, please refer to the jdbc generator.py.

---

#### Step 1: Define Queries in the Environment File

Add the necessary queries to the environment configuration file. Ensure the column names align with the database schema, though minor variations may occur. For example:

```json
{
  "TSP_ACCOUNT_DETAIL_FILTERED_VIEW": "SELECT * FROM table_name WHERE 1=1 AND SEQUENCE_NUMBER=?",
  "TSP_ACCOUNT_SUMMARY_UPDATE_QUERY": "UPDATE table_name\nSET ASSIGNED_TO=?,\nASSIGNED_DATE=SYSDATE,\nCOMMENTS=?,\nASSIGNED_BY=?\nWHERE 1=1\nAND SEQUENCE_NUM=?"
}
```

---

#### Step 2: Map Queries in the Properties File

Add the queries to the `queries.properties` file for mapping:

```properties
tsp.account.detail.view.filtered.q = ${TSP_ACCOUNT_DETAIL_FILTERED_VIEW}
tsp.account.summary.update.q = ${TSP_ACCOUNT_SUMMARY_UPDATE_QUERY}
```

---

#### Step 3: Add Query Values and Beans in Java Configuration

Update the `QueryConfigs.java` file with the following:

```java
@Value("${tsp.account.detail.view.filtered.q}")
public String tspAccountDetailViewFiltered;

@Value("${tsp.account.summary.update.q}")
public String tspAccountSummaryUpdate;

@Bean(name = "tspAccountDetailViewFiltered")
public String getTspAccountDetailViewFiltered() {
    return this.tspAccountDetailViewFiltered;
}

@Bean(name = "tspAccountSummaryUpdate")
public String getTspAccountSummaryUpdate() {
    return this.tspAccountSummaryUpdate;
}
```

---

#### Step 4: Integrate Queries in the Monitoring Service

1. Declare the queries in the service class:

```java
private String tspAccountDetailViewFiltered;
private String tspAccountSummaryUpdate;
```

2. Inject the queries using `@Autowired`:

```java
@Autowired
public ExceptionMonitoringService(
    String tspAccountDetailViewFiltered,
    String tspAccountSummaryUpdate
) {
    this.tspAccountDetailViewFiltered = tspAccountDetailViewFiltered;
    this.tspAccountSummaryUpdate = tspAccountSummaryUpdate;
}
```

3. Add the filtered view method:

```java
public List<Map<String, Object>> getTspAccountDetailViewFiltered(String sequenceNumber) {
    List<Map<String, Object>> result = jdbcManager.getTspAccountDetailViewFiltered(tspAccountDetailViewFiltered, sequenceNumber);
    result.forEach(data -> {
        data.remove("CREATION_DATE");
        data.remove("SEQUENCE_NUMBER");
    });
    return result;
}
```

4. Add the update summary method:

```java
public int updateTspAccountSummary(Map<String, String> updateData) {
    String assignedTo = updateData.get("assignedTo");
    String assignedBy = updateData.get("username");
    String comments = updateData.get("comments");
    String sequenceNumber = updateData.get("sequenceNumber");

    return jdbcManager.updateTspAccountSummary(
        tspAccountSummaryUpdate, assignedTo, comments, assignedBy, sequenceNumber
    );
}
```

---

#### Step 5: Update the Monitoring Controller

1. Add the filtered view endpoint:

```java
@GetMapping("/accounts-details-filtered")
public ResponseEntity<Map<String, Object>> getTspAccountDetailViewFiltered(@RequestParam List<String> sequenceNumbers) {
    try {
        List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();

        for (String sequenceNumber : sequenceNumbers) {
            List<Map<String, Object>> result = service.getTspAccountDetailViewFiltered(sequenceNumber);
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

2. Add the update summary endpoint:

```java
@PostMapping("/tsp-account-summary-update")
public ResponseEntity<String> updateTspAccountSummary(@RequestBody Map<String, String> updateData) {
    service.updateTspAccountSummary(updateData);
    return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
}
```

---

#### Step 6: Implement the JDBC Manager Methods

Ensure the JDBC manager has the following methods:

```java
public List<Map<String, Object>> getTspAccountDetailViewFiltered(String sql, String sequenceNumber) {
    return jdbcTemplate.queryForList(sql, sequenceNumber);
}

public int updateTspAccountSummary(String sql, String assignedTo, String comments, String assignedBy, String sequenceNumber) {
    return jdbcTemplate.update(sql, assignedTo, comments, assignedBy, sequenceNumber);
}
```

---

#### Step 7: Add Attributes in the Angular Component

1. Define the process flow:

```typescript
accountsTotals: { [key: string]: number } = {
  '27041': 0,
  'Different_process_flow_name': 0,
};
```

2. Define the filters for the detail view:

```typescript
accountsFilters: {
  formControlName: string;
  columnName: string;
}
[] = [
  { formControlName: "subref/orderNum", columnName: "SUBREF/ORDER NUMBER" },
  { formControlName: "transactionId", columnName: "TRANSACTION_ID" },
];
```

3. Define the URLs:

```typescript
accountsUrls: { [key: string]: string } = {
  summaryUrl: 'tsp-account-summary-view',
  detailsUrl: 'tsp-account-detail-view',
  filteredDetailsUrl: 'accounts-details-filtered',
  summaryUpdateUrl: 'tsp-account-summary-update',
  webexMessageUrl: 'send-message-rol',
  chartTotalsUrl: '',
  chartDetailsUrl: '',
};
```

4. Add the tab to `visibleTabs`:

```typescript
visibleTabs: { label: string; component: string; role: string[]; disabled?: boolean }[] = [
  {
    label: 'Account Recon',
    component: 'app-accounts',
    role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
  },
];
```

---

#### Step 8: Update the HTML

Add the new tab and pass the requisite bindings:

```html
<ng-container *ngSwitchCase="'app-accounts'">
  <app-monitoring-dashboard
    [urls]="accountsUrls"
    [keysToMap]="['SEQUENCE_NUMBER']"
    [processFlowKeys]="accountsTotals"
    [periodStatus]="periodStatus"
    [componentName]="'Accounts'"
    [processFlowTabsToDisplay]="['Accounts']"
    [specialWords]="specialWords"
    [skippedWords]="skippedWords"
    [dynamicTemplate]="''"
    [dynamicCss]="''"
    [isSubAppMapping]="false"
    [warningMessage]="'Displays message with impacted accounting information'"
    [columnsToFilter]="accountsFilters"
    [summaryColumnsToHide]="['SEQUENCE_NUMBER']"
    [detailsColumnsToHide]="[]"
    [submitKeysToMap]="['SEQUENCE_NUMBER']"
    [webexKeysToMap]="[
      'PERIOD_NAME',
      'APPLICATION_NAME',
      'PROCESS_FLOW',
      'ORG_NAME',
      'TRANSACTION_DATE',
      'AMOUNT'
    ]"
    *ngIf="selectedIndex === i"
  ></app-monitoring-dashboard>
</ng-container>
```

---

### Notes

- This guide assumes the user has already completed the steps for implementing summary and detail queries.
