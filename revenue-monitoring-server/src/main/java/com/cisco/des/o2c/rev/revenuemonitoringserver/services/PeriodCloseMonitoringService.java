package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.*;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.ExcelReader;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PeriodCloseMonitoringService {
    private JdbcManager jdbcManager;
    private String closeInvStats;
    private String closeInterfaceLoad;
    private String closeStartEndTime;
    private String closeVolume;
    private String closeMEStatus;
    private String closeQECashCollected;
    private String dashboardComments;
    private String updateComments;
    private String orderStatus;
    private String orderStatusSummary;
    private String orderStatusDownload;
    private String updateOrderStatus;
    private String orderStatusRevSummary;
    private String updateInvoiceEligibleDate;
    private String wd0ArMidCloseStatusQuery;
    private String wd0ArMidCloseHeaderDataQuery;
    private String wd0HistoricalDataQuery;
    private String personaAccessRoles;
    private String wd0Regression;
    private String wd0CurrentMonth;
    private String deleteSelectedDeals;
    private String cloBulkUpdate;
    private String invoiceEligibleUpdate;
    private String cloCommentUpdate;
    private String estimatedCompletionTime;
    private String largeDealSummaryByAccount;
    private String cloSampleDownloadData;
    private String wd0Volumes;
    private String espAgingCaseSummary;
    private String espCaseServiceMetricSummary;
    private String espWeeklyComparisonSummary;
    private Boolean isQuarterEnd;
    private String periodName;
    private String issueReportingDash;
    private String issueReportingDashInsert;
    private String issueReportingDashApprove;
    private String issueReportingDashCommentsUpdate;
    private String issueReportingDashFixDetailsUpdate;
    private String issueReportingDashStatusUpdate;
    private String issueReportingDashIssueDescUpdate;
    private String wd0MidcloseActualsProduct;
    private String wd0MidcloseActualsService;
    private String issueReportingDashSummary;
    private String sbpEspAgingCaseSummary;
    private String sbpEspCaseServiceMetricSummary;
    private String sbpEspWeeklyComparisonSummary;

    @Autowired
    public PeriodCloseMonitoringService(JdbcManager jdbcManager, String closeInvStats,
            String closeInterfaceLoad, String closeStartEndTime, String closeVolume,
            String closeMEStatus, String closeQECashCollected, String dashboardComments,
            String updateComments, String wd0ArMidCloseStatusQuery,
            String wd0ArMidCloseHeaderDataQuery, String wd0HistoricalDataQuery, String orderStatus,
            String orderStatusSummary, String orderStatusDownload, String updateOrderStatus,
            String orderStatusRevSummary, String personaAccessRoles, String wd0Regression, String wd0CurrentMonth,
            String deleteSelectedDeals, String cloBulkUpdate, String invoiceEligibleUpdate, String cloCommentUpdate,
            String estimatedCompletionTime, String largeDealSummaryByAccount, String cloSampleDownloadData,
                                        String wd0Volumes,  String espAgingCaseSummary, String espCaseServiceMetricSummary,
                                        String espWeeklyComparisonSummary, String periodName, String issueReportingDash,
                                        String issueReportingDashInsert, String issueReportingDashApprove,
                                        String issueReportingDashCommentsUpdate, String issueReportingDashFixDetailsUpdate,
                                        String wd0MidcloseActualsProduct, String wd0MidcloseActualsService,
                                        String issueReportingDashStatusUpdate, String issueReportingDashIssueDescUpdate,
                                        String issueReportingDashSummary, String sbpEspAgingCaseSummary,
                                        String sbpEspCaseServiceMetricSummary, String sbpEspWeeklyComparisonSummary) {
        this.jdbcManager = jdbcManager;
        this.closeInvStats = closeInvStats;
        this.closeInterfaceLoad = closeInterfaceLoad;
        this.closeStartEndTime = closeStartEndTime;
        this.closeVolume = closeVolume;
        this.closeMEStatus = closeMEStatus;
        this.closeQECashCollected = closeQECashCollected;
        this.dashboardComments = dashboardComments;
        this.updateComments = updateComments;
        this.orderStatus = orderStatus;
        this.wd0ArMidCloseStatusQuery = wd0ArMidCloseStatusQuery;
        this.wd0ArMidCloseHeaderDataQuery = wd0ArMidCloseHeaderDataQuery;
        this.wd0HistoricalDataQuery = wd0HistoricalDataQuery;
        this.orderStatusSummary = orderStatusSummary;
        this.orderStatusDownload = orderStatusDownload;
        this.updateOrderStatus = updateOrderStatus;
        this.orderStatusRevSummary = orderStatusRevSummary;
        this.personaAccessRoles = personaAccessRoles;
        this.wd0Regression = wd0Regression;
        this.wd0CurrentMonth = wd0CurrentMonth;
        this.deleteSelectedDeals = deleteSelectedDeals;
        this.cloBulkUpdate = cloBulkUpdate;
        this.invoiceEligibleUpdate = invoiceEligibleUpdate;
        this.cloCommentUpdate = cloCommentUpdate;
        this.estimatedCompletionTime = estimatedCompletionTime;
        this.largeDealSummaryByAccount = largeDealSummaryByAccount;
        this.cloSampleDownloadData = cloSampleDownloadData;
        this.wd0Volumes = wd0Volumes;
        this.espAgingCaseSummary = espAgingCaseSummary;
        this.espCaseServiceMetricSummary = espCaseServiceMetricSummary;
        this.espWeeklyComparisonSummary = espWeeklyComparisonSummary;
        this.periodName = periodName;
        this.issueReportingDash = issueReportingDash;
        this.issueReportingDashInsert = issueReportingDashInsert;
        this.issueReportingDashApprove = issueReportingDashApprove;
        this.issueReportingDashCommentsUpdate = issueReportingDashCommentsUpdate;
        this.issueReportingDashFixDetailsUpdate = issueReportingDashFixDetailsUpdate;
        this.issueReportingDashStatusUpdate = issueReportingDashStatusUpdate;
        this.issueReportingDashIssueDescUpdate = issueReportingDashIssueDescUpdate;
        this.wd0MidcloseActualsProduct = wd0MidcloseActualsProduct;
        this.wd0MidcloseActualsService = wd0MidcloseActualsService;
        this.issueReportingDashSummary = issueReportingDashSummary;
        this.sbpEspAgingCaseSummary = sbpEspAgingCaseSummary;
        this.sbpEspCaseServiceMetricSummary = sbpEspCaseServiceMetricSummary;
        this.sbpEspWeeklyComparisonSummary = sbpEspWeeklyComparisonSummary;
    }

    public List<Map<String, Object>> getIssueReportingData() {
        String[] dateColumns = { "START_DATE", "REPORTED_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(issueReportingDash);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getIssueReportingDataSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(issueReportingDashSummary);
        List<Map<String, Object>> finalRes = transform(result);
        return finalRes;
    }

    public void insertIssueReportingData(MultipartFile file, String username) throws IOException {
        try {
            List<Map<String, String>> data = ExcelReader.readExcel(file.getInputStream());

            for (Map<String, String> row : data) {
                jdbcManager.insertIssueReport(issueReportingDashInsert, row.get("TRACK"), row.get("ISSUE_DESCRIPTION"), row.get("ROOT_CAUSE"), row.get("BUSINESS_IMPACT"),
                        row.get("FIX_DETAILS"), row.get("INCIDENT_NUMBER"), row.get("ISSUE_STARTED"), row.get("ISSUE_REPORTED_ON"), row.get("ISSUE_REPORTED_BY"),
                        row.get("QUARTER"), row.get("PERIOD_NAME"), row.get("PRIORITY"), row.get("CODE_FIX"), row.get("PDF_REQUIRED"), row.get("BUSINESS_APROVAL"),
                        row.get("IT_APPROVAL"), row.get("APPROVAL_COMMENTS"), row.get("PERIOD_CLOSE_IMPACTING"), row.get("ISSUE_STATUS"), row.get("EOC_INCIDENT"), username);
            }
        } catch (Exception e) {
            System.out.println(e);
            e.printStackTrace();
        }
    }

    public int approveRejectIssueReporting(String approval, String approvedBy, String incidentNum) {
        int test = jdbcManager.approveRejectIssueReport(issueReportingDashApprove, approval, approvedBy, incidentNum);
        return test;
    }

    public int updateCommentsIssueReporting(String comments, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateCommentsIssueReport(issueReportingDashCommentsUpdate, comments, approvedBy, incidentNum);
        return test;
    }

    public int updateFixDetailsIssueReporting(String fixDetails, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateFixDetailsIssueReport(issueReportingDashFixDetailsUpdate, fixDetails, approvedBy, incidentNum);
        return test;
    }

    public int updateStatusIssueReporting(String status, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateStatusIssueReport(issueReportingDashStatusUpdate, status, approvedBy, incidentNum);
        return test;
    }

    public int updateIssueDescIssueReporting(String issue, String rootCause, String businessImpact, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateIssueDescIssueReport(issueReportingDashIssueDescUpdate, issue, rootCause, businessImpact, approvedBy, incidentNum);
        return test;
    }

    public void bulkApproveRejectIssueReporting(List<Map<String, Object>> approveData){
        for(Map<String, Object> data: approveData) {
            approveRejectIssueReporting((String)data.get("status"), (String)data.get("approvedBy"), (String)data.get("incidentNumber"));
        }
    }

    public static List<Map<String, Object>> transform(List<Map<String, Object>> data) {
        List<Map<String, Object>> result = new ArrayList<>();
        int grandTotal = 0;

        Map<String, List<Map<String, Object>>> grouped = data.stream()
                .collect(Collectors.groupingBy(row -> String.valueOf(row.get("TRACK"))));

        for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
            String track = entry.getKey();
            List<Map<String, Object>> rows = entry.getValue();

            // Add subtotal before the rows
            Map<String, Object> subtotalRow = new LinkedHashMap<>();
            subtotalRow.put("Track", "Sub Total (" + track + ")");
            subtotalRow.put("Count", rows.size());
            result.add(subtotalRow);

            // Add the detailed rows
            for (Map<String, Object> row : rows) {
                Map<String, Object> newRow = new LinkedHashMap<>();
                newRow.put("Track", track);
                newRow.put("Count", 1);
                newRow.put("Issue Status", row.get("ISSUE_STATUS"));
                newRow.put("IT Approval", row.get("IT_APPROVAL"));
                newRow.put("Approved On", formatDate(String.valueOf(row.get("APPROVED_ON"))));
                newRow.put("Issue Description", row.get("ISSUE_DESCRIPTION"));
                result.add(newRow);
            }

            grandTotal += rows.size();
        }

        // Add grand total at the top
        Map<String, Object> totalRow = new LinkedHashMap<>();
        totalRow.put("Track", "Total");
        totalRow.put("Count", grandTotal);
        result.add(totalRow); // insert at the beginning

        return result;
    }

    private static String formatDate(String isoDate) {
        return LocalDate.parse(isoDate.substring(0, 10))
                .format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
    }

    public UserRoleInfo getUserRoles(String username) {
        String upperUsername = username.toUpperCase();
        List<Map<String, Object>> rolesList = jdbcManager.queryForList(personaAccessRoles);
        Optional<Map<String, Object>> userOptional = rolesList.stream()
                .filter(user -> upperUsername.equals(user.get("USER_NAME")))
                .findFirst();

        if (userOptional.isPresent()) {
            Map<String, Object> user = userOptional.get();
            String userName = (String) user.get("USER_NAME");
            String userEmail = (String) user.get("USER_EMAIL");

            List<String> roles = rolesList.stream()
                    .filter(u -> upperUsername.equals(u.get("USER_NAME")))
                    .map(u -> (String) u.get("USER_ROLE"))
                    .collect(Collectors.toList());

            return new UserRoleInfo(userName, userEmail, roles);
        }
        return null;
    }

    public List<Map<String, Object>> getCloseInvStats() {
        return jdbcManager.queryForList(closeInvStats);
    }

    public Map<String, List<Map<String, Object>>> getPeriodCloseInterfaceLoad() {
        List<Map<String, Object>> pName = jdbcManager.queryForList(periodName);
        String[] period = pName.get(0).get("PERIOD_NAME").toString().split("-");
        boolean isQuarterEnd = period[0].equals("JAN") || period[0].equals("APR") || period[0].equals("JUL") || period[0].equals("OCT");

        List<Map<String, Object>> data = jdbcManager.queryForList(closeInterfaceLoad);

        Map<String, List<Map<String, Object>>> finalResult = new HashMap<>();
        finalResult.put("PRECLOSE", new ArrayList<>());
        finalResult.put("MIDCLOSE", new ArrayList<>());

        Map<String, Map<String, Object>> preCloseResults = new LinkedHashMap<>();
        Map<String, Map<String, Object>> midCloseResults = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> percentageBuffer = new HashMap<>();

        for (Map<String, Object> row : data) {
            String lineType = row.get("LINE_TYPE").toString();
            String closeType = row.get("CLOSE_TYPE").toString(); // "PRECLOSE" or "MIDCLOSE"
            String uniqueKey = lineType + "-" + closeType;

            Map<String, Object> resultMap = closeType.equals("PRECLOSE")
                    ? preCloseResults.computeIfAbsent(uniqueKey, k -> new LinkedHashMap<>())
                    : midCloseResults.computeIfAbsent(uniqueKey, k -> new LinkedHashMap<>());

            resultMap.put("LINE_TYPE", lineType);

            String periodKey = isQuarterEnd ? row.get("QUARTER").toString() : row.get("PERIOD_NAME").toString();
            resultMap.put(periodKey, row.get("LINE_COUNT"));

            Map<String, Object> temp = new LinkedHashMap<>();
            if (isQuarterEnd) {
                if (row.get("QOQ_PERCENTAGE") != null) temp.put("QUARTER OVER QUARTER", row.get("QOQ_PERCENTAGE"));
                if (row.get("YOY_PERCENTAGE") != null) temp.put("YEAR OVER YEAR", row.get("YOY_PERCENTAGE"));
            } else {
                if (row.get("MOM_PERCENTAGE") != null) temp.put("MONTH OVER MONTH", row.get("MOM_PERCENTAGE"));
                if (row.get("PQM_PERCENTAGE") != null) temp.put("PRIOR QUARTER MONTH", row.get("PQM_PERCENTAGE"));
            }

            if (!temp.isEmpty()) {
                String percentKey = lineType + "-" + closeType;
                percentageBuffer.computeIfAbsent(percentKey, k -> new ArrayList<>()).add(temp);
            }
        }

        for (Map.Entry<String, Map<String, Object>> entry : preCloseResults.entrySet()) {
            String key = entry.getKey();
            List<Map<String, Object>> percentList = percentageBuffer.getOrDefault(key, Collections.emptyList());
            for (Map<String, Object> percentMap : percentList) {
                for (Map.Entry<String, Object> p : percentMap.entrySet()) {
                    entry.getValue().put(p.getKey(), p.getValue());
                }
            }
        }

        for (Map.Entry<String, Map<String, Object>> entry : midCloseResults.entrySet()) {
            String key = entry.getKey();
            List<Map<String, Object>> percentList = percentageBuffer.getOrDefault(key, Collections.emptyList());
            for (Map<String, Object> percentMap : percentList) {
                for (Map.Entry<String, Object> p : percentMap.entrySet()) {
                    entry.getValue().put(p.getKey(), p.getValue());
                }
            }
        }

        finalResult.get("PRECLOSE").addAll(preCloseResults.values());
        finalResult.get("MIDCLOSE").addAll(midCloseResults.values());

        return finalResult;
    }


    public List<Map<String, Object>> getCloseStartEndTime() {
        return jdbcManager.queryForList(closeStartEndTime);
    }

    public List<Map<String, Object>> getCloseVolume() {
        return jdbcManager.queryForList(closeVolume);
    }

    public List<Map<String, Object>> getCloseMEStatus() {
        return jdbcManager.queryForList(closeMEStatus);
    }

    public List<Map<String, Object>> getCloseQECashCollected() {
        return jdbcManager.queryForList(closeQECashCollected);
    }

    public List<Map<String, Object>> getDashboardComments() {
        return jdbcManager.queryForList(dashboardComments);
    }

    public int updateDashboardComments(String comments, String closeType) {
        return jdbcManager.updateComments(updateComments, closeType, comments);
    }

    public List<Map<String, Object>> getWd0ArMidCloseStatus() {
        return jdbcManager.queryForList(wd0ArMidCloseStatusQuery);
    }

    public List<Map<String, Object>> getWd0ArMidCloseHeaderData() {
        return jdbcManager.queryForList(wd0ArMidCloseHeaderDataQuery);
    }

    public List<Map<String, Object>> getWd0HistoricalData() {
        return jdbcManager.queryForList(wd0HistoricalDataQuery);
    }

    public OrderLifecycleModel getOrderStatus() {
        OrderLifecycleModel orderLifecycleModel = new OrderLifecycleModel();
        List<Map<String, Object>> result = jdbcManager.queryForList(orderStatus);
        String[] columnsToRemove = { "AGING_BOOKING", "AGING_HOLD_RELEASE", "EXPECTED_BOOK_DATE",
                "HOLD_RELEASE_TARGET_DATE",
                "LINE_TYPE", "ORDER_TOTAL", "SFDC_STATUS", "TOTAL_CONTRACT_VALUE", "STATUS_AS_OF_DATE",
                "SUBSCRIPTION_ID" };
        String[] dateColumns = { "STATUS_AS_OF_DATE", "ACTUAL_BOOK_DATE", "FUTURE_INVOICE_RELEASE_DATE", "INVOICE_DATE",
                "DEAL_UPLOAD_DATE" };
        result.forEach(data -> {
            for (String str : columnsToRemove) {
                data.remove(str);
            }
            for (String str : dateColumns) {
                if (data.get(str) != null) {
                    String date = data.get(str).toString();
                    String[] dateArr = date.split(" ");
                    data.put(str, dateArr[0]);
                } else {
                    if (!str.equals("DEAL_UPLOAD_DATE")) {
                        data.put(str, "TBD");
                    }
                }
            }

            Object obj = data.remove("ACTUAL_BOOK_DATE");
            data.put("BOOK_DATE", obj);
        });

        orderLifecycleModel.setOrderLifecycleResult(result);

        List<String> keys = result.stream().map(Map::keySet).flatMap(Set::stream).collect(Collectors.toList());
        keys = new ArrayList<>(new HashSet<String>(keys));
        List<String> columns = new ArrayList<>();
        for (String key : keys) {
            columns.add(key.replaceAll("_", " "));
        }
        orderLifecycleModel.setColumns(columns);

        return orderLifecycleModel;
    }

    public void setUpdateOrderStatusFromFile(MultipartFile file, String username) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            reader.lines()
                    .skip(1) // Skip the first line
                    .map(line -> line.split(","))
                    .filter(parts -> parts.length == 3)
                    .map(parts -> {
                        UpdateOrderModel orderModel = new UpdateOrderModel();
                        orderModel.setProgramName(parts[0]);
                        orderModel.setAccount(parts[1]);
                        orderModel.setDealIds(parts[2]);
                        return orderModel;
                    })
                    .forEach(orderModel -> saveToDatabase(orderModel, username));
        }
    }

    public void setUpdateOrderStatusFromData(UpdateOrderModel input) {
        UpdateOrderModel orderModel = new UpdateOrderModel();
        orderModel.setProgramName(input.getProgramName());
        orderModel.setAccount(input.getAccount());
        String inputDealIds = input.getDealIds();
        String username = input.getUsername();
        if (inputDealIds.contains(",")) {
            String[] updateDealIds = inputDealIds.replaceAll("\\s", "").split(",");
            for (String id : updateDealIds) {
                orderModel.setDealIds(id);
                saveToDatabase(orderModel, username);
            }
        } else {
            orderModel.setDealIds(inputDealIds);
            saveToDatabase(orderModel, username);
        }
    }

    private void saveToDatabase(UpdateOrderModel csvData, String username) {
        jdbcManager.updateOrderStatus(this.updateOrderStatus, csvData.getProgramName(), csvData.getAccount(),
                Integer.parseInt(csvData.getDealIds()), username);
    }

    public List<OrderLifecycleSummaryModel> getOrderStatusSummary() {
        // Step 1: Fetch and map data
        List<Map<String, Object>> res = jdbcManager.queryForList(orderStatusSummary);
        List<OrderLifecycleSummaryModel> rawList = mapToOrderLifecycleSummaryModelList(res);

        // Step 2: Group by PROGRAM_NAME
        Map<String, List<OrderLifecycleSummaryModel>> groupedByProgram = rawList.stream()
                .collect(Collectors.groupingBy(model -> model.PROGRAM_NAME, LinkedHashMap::new, Collectors.toList()));

        List<OrderLifecycleSummaryModel> finalList = new ArrayList<>();

        // Step 3: Build the result list with subtotals inserted immediately after each group
        for (Map.Entry<String, List<OrderLifecycleSummaryModel>> entry : groupedByProgram.entrySet()) {
            String programName = entry.getKey();
            List<OrderLifecycleSummaryModel> group = entry.getValue();


            int subtotal = group.stream().mapToInt(m -> m.ORDER_COUNT).sum();
            finalList.add(new OrderLifecycleSummaryModel("Sub Total (" + programName + ")", subtotal, null, null));
            finalList.addAll(group); // add all rows for that program

        }

        // Step 4: Add grand total at the top
        int totalCount = finalList.stream()
                .filter(m -> m.PROGRAM_NAME != null && !m.PROGRAM_NAME.startsWith("Sub Total"))
                .mapToInt(m -> m.ORDER_COUNT)
                .sum();

        finalList.add( new OrderLifecycleSummaryModel("Total", totalCount, null, null));

        return finalList;
    }

    public List<LargeDealSummaryByAccountModel> getLargeDealSummaryByAccount() {
        // Fetch and map the results to the model list
        List<Map<String, Object>> res = jdbcManager.queryForList(largeDealSummaryByAccount);
        List<LargeDealSummaryByAccountModel> rawList = mapToLargeDealSummaryByAccountModelList(res);

        // Group the raw data by ACCOUNT
        Map<String, List<LargeDealSummaryByAccountModel>> groupedByAccount = rawList.stream()
                .collect(Collectors.groupingBy(model -> model.ACCOUNT, LinkedHashMap::new, Collectors.toList()));

        List<LargeDealSummaryByAccountModel> resultList = new ArrayList<>();

        // Build the result list by account group
        for (Map.Entry<String, List<LargeDealSummaryByAccountModel>> entry : groupedByAccount.entrySet()) {
            String account = entry.getKey();
            List<LargeDealSummaryByAccountModel> accountModels = entry.getValue();

             // add all rows for the account

            // add subtotal after the rows
            int subtotal = accountModels.stream().mapToInt(m -> m.ORDER_COUNT).sum();
            resultList.add(new LargeDealSummaryByAccountModel("Sub Total (" + account + ")", subtotal, null, null));
            resultList.addAll(accountModels);
        }

        // Add the grand total row at the top
        int totalCount = resultList.stream()
                .filter(m -> m.ACCOUNT != null && !m.ACCOUNT.startsWith("Sub Total"))
                .mapToInt(m -> m.ORDER_COUNT)
                .sum();

        resultList.add( new LargeDealSummaryByAccountModel("Total", totalCount, null, null));

        return resultList;
    }

    public static OrderLifecycleSummaryModel orderLifecycleSummary(List<OrderLifecycleSummaryModel> resultList,
            String programName) {
        OrderLifecycleSummaryModel obj = new OrderLifecycleSummaryModel("Sub Total (" + programName + ")",
                calculateOrderCountSumByProgramName(resultList, programName), null, null);
        return obj;
    }

    public List<Map<String, Object>> getOrderStatusDownload() {
        return jdbcManager.queryForList(orderStatusDownload);
    }

    public static LargeDealSummaryByAccountModel largeDealSummaryByAccount(
            List<LargeDealSummaryByAccountModel> resultList, String account) {
        LargeDealSummaryByAccountModel obj = new LargeDealSummaryByAccountModel("Sub Total (" + account + ")",
                calculateOrderCountSumByAccount(resultList, account), null, null);
        return obj;
    }

    public static List<OrderLifecycleSummaryModel> mapToOrderLifecycleSummaryModelList(
            List<Map<String, Object>> inputList) {
        List<OrderLifecycleSummaryModel> resultList = new ArrayList<>();
        for (Map<String, Object> map : inputList) {
            String programName = (String) map.get("PROGRAM_NAME");
            int orderCount = ((BigDecimal) map.get("ORDER_COUNT")).intValue();
            String status = (String) map.get("STATUS");
            Optional<Integer> completion = Optional.ofNullable(((BigDecimal) map.get("COMPLETION")).intValue());
            OrderLifecycleSummaryModel model = new OrderLifecycleSummaryModel(programName, orderCount, status,
                    completion);
            resultList.add(model);
        }
        return resultList;
    }

    public static List<LargeDealSummaryByAccountModel> mapToLargeDealSummaryByAccountModelList(
            List<Map<String, Object>> inputList) {
        List<LargeDealSummaryByAccountModel> resultList = new ArrayList<>();
        for (Map<String, Object> map : inputList) {
            String account = (String) map.get("ACCOUNT");
            int orderCount = ((BigDecimal) map.get("ORDER_COUNT")).intValue();
            String status = (String) map.get("STATUS");
            Optional<Integer> completion = Optional.ofNullable(((BigDecimal) map.get("COMPLETION")).intValue());
            LargeDealSummaryByAccountModel model = new LargeDealSummaryByAccountModel(account, orderCount, status,
                    completion);
            resultList.add(model);
        }

        return resultList;
    }

    public static int calculateOrderCountSumByProgramName(List<OrderLifecycleSummaryModel> orderSummary,
            String programName) {
        int sum = 0;
        for (OrderLifecycleSummaryModel order : orderSummary) {
            if (order.PROGRAM_NAME.equals(programName)) {
                sum += order.ORDER_COUNT;
            }
        }
        return sum;
    }

    public static int calculateOrderCountSumByAccount(List<LargeDealSummaryByAccountModel> orderSummary,
            String account) {
        int sum = 0;
        for (LargeDealSummaryByAccountModel order : orderSummary) {
            if (order.ACCOUNT.equals(account)) {
                sum += order.ORDER_COUNT;
            }
        }
        return sum;
    }

    public List<Map<String, Object>> getOrderStatusRevSummary() {
        return jdbcManager.queryForList(orderStatusRevSummary);
    }

    public List<Map<String, Object>> getWd0Regression() {
        return jdbcManager.queryForList(wd0Regression);
    }

    public List<Map<String, Object>> getWd0CurrentMonth() {
        return jdbcManager.queryForList(wd0CurrentMonth);
    }

    public void deleteSelectedDeals(List<Map<String, Object>> selectedDeals, String username) {
        for (Map<String, Object> deal : selectedDeals) {
            deleteDeals(username, (int) deal.get("DEAL_ID"), (String) deal.get("SALES_ORDER"));
        }
    }

    public void deleteDeals(String username, int dealId, String salesOrder) {
        String so;
        if (salesOrder.equals("TBD")) {
            so = "0";
        } else {
            so = salesOrder;
        }
        int test = jdbcManager.deleteSelectedDeals(deleteSelectedDeals, username, dealId, so, so);
    }

    public void setCloBulkUpdateFromFile(MultipartFile file, String username) throws IOException, ParseException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isFirstLine = true;
            while ((line = reader.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }
                String[] parts = line.split(",", -1);

                if (parts.length == 6) {
                    UpdateCLOData cloData = new UpdateCLOData();
                    cloData.setProgramName(parts[0]);
                    cloData.setAccount(parts[1]);
                    cloData.setDealIds(parts[2]);
                    if (parts[3].equals("")) {
                        cloData.setOrderNum("0");
                    } else {
                        cloData.setOrderNum(parts[3]);
                    }
                    cloData.setInvoiceDate(parts[4]);
                    cloData.setCloComments(parts[5]);
                    saveToDatabaseCLOUpdate(cloData, username);
                }
            }
        }
    }

    public void setCloBulkUpdate(UpdateCLOData input, String username) throws ParseException {
        UpdateCLOData cloData = new UpdateCLOData();
        cloData.setProgramName(input.getProgramName());
        cloData.setAccount(input.getAccount());
        cloData.setDealIds(input.getDealIds());
        if (input.getOrderNum().equals("")) {
            cloData.setOrderNum("0");
        } else {
            cloData.setOrderNum(input.getOrderNum());
        }
        cloData.setInvoiceDate(input.getInvoiceDate());
        cloData.setCloComments(input.getCloComments());
        saveToDatabaseCLOUpdate(cloData, username);
    }

    private void saveToDatabaseCLOUpdate(UpdateCLOData cloData, String username) {
        Timestamp timestamp;
        if (cloData.getInvoiceDate().isEmpty()) {
            timestamp = null;
        } else {
            java.util.Date date = timeStampGenerator(cloData.getInvoiceDate());
            timestamp = new Timestamp(date.getTime());
        }
        // int test = jdbcManager.updateCLoData(cloBulkUpdate, cloData.getProgramName(),
        // cloData.getAccount(), Integer.parseInt(cloData.getDealIds()),
        // cloData.getOrderNum(), timestamp, cloData.getCloComments(), username);
    }

    private static final List<SimpleDateFormat> dateFormats = new ArrayList<>();

    static {
        dateFormats.add(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
        dateFormats.add(new SimpleDateFormat("yyyy-MM-dd"));
        dateFormats.add(new SimpleDateFormat("yyyy-dd-MM"));
        dateFormats.add(new SimpleDateFormat("mm/dd/yy"));
        dateFormats.add(new SimpleDateFormat("mm/dd/yyyy"));
        dateFormats.add(new SimpleDateFormat("m/dd/yy"));
        dateFormats.add(new SimpleDateFormat("mm-dd-yy"));
        dateFormats.add(new SimpleDateFormat("mm-dd-yyyy"));
        dateFormats.add(new SimpleDateFormat("dd/mm/yy"));
        dateFormats.add(new SimpleDateFormat("dd/mm/yyyy"));
        dateFormats.add(new SimpleDateFormat("dd-mm-yy"));
        dateFormats.add(new SimpleDateFormat("dd-mm-yyyy"));
    }

    private static Date timeStampGenerator(String invoiceDate) {

        for (SimpleDateFormat dateFormat : dateFormats) {
            try {
                return dateFormat.parse(invoiceDate);
            } catch (ParseException e) {
            }
        }
        throw new IllegalArgumentException("No valid date format found for: " + invoiceDate);
    }

    public void setUpdateInvoiceEligibleDate(Map<String, String> updatedModel, String username) throws ParseException {
        String so;
        if (updatedModel.get("orderID").equals("TBD")) {
            so = "0";
        } else {
            so = updatedModel.get("orderID");
        }
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        java.util.Date date = dateFormat.parse(updatedModel.get("invoiceEligibleDate"));

        Timestamp timestamp = new Timestamp(date.getTime());

        int test = jdbcManager.updateInvoiceDate(invoiceEligibleUpdate, updatedModel.get("programName"),
                updatedModel.get("account"), Integer.parseInt(updatedModel.get("dealId")), so, timestamp, username);
    }

    public void setCloCommentUpdate(Map<String, String> updatedModel, String username) {
        String so;
        if (updatedModel.get("orderID").equals("TBD")) {
            so = "0";
        } else {
            so = updatedModel.get("orderID");
        }
        int test = jdbcManager.updateCloComments(cloCommentUpdate, updatedModel.get("programName"),
                updatedModel.get("account"), Integer.parseInt(updatedModel.get("dealId")), so,
                updatedModel.get("cloComments"), username);
    }

    public List<Map<String, Object>> getEstimatedCompletionTime() {
        return jdbcManager.queryForList(estimatedCompletionTime);
    }

    public List<Map<String, Object>> getCloSampleDownloadData() {
        return jdbcManager.queryForList(cloSampleDownloadData);
    }

    public List<Map<String, Object>> getWd0Volumes() {
        return jdbcManager.queryForList(wd0Volumes);
    }

    public List<Map<String, Object>> getEspCaseServiceMetricSummary() {
        return jdbcManager.queryForList(espCaseServiceMetricSummary);
    }

    public List<Map<String, Object>> getEspWeeklyComparisonSummary() {
        return jdbcManager.queryForList(espWeeklyComparisonSummary);
    }

    public List<Map<String, Object>> getEspAgingCaseSummary() {
        return jdbcManager.queryForList(espAgingCaseSummary);
    }

    public List<Map<String, Object>> getSbpEspCaseServiceMetricSummary() {
        return jdbcManager.queryForList(sbpEspCaseServiceMetricSummary);
    }

    public List<Map<String, Object>> getSbpEspWeeklyComparisonSummary() {
        return jdbcManager.queryForList(sbpEspWeeklyComparisonSummary);
    }

    public List<Map<String, Object>> getSbpEspAgingCaseSummary() {
        return jdbcManager.queryForList(sbpEspAgingCaseSummary);
    }

    private void formatDateColumns(Map<String, Object> data, String[] dateColumns) {
        for (String column : dateColumns) {
            Object value = data.get(column);
            if (value != null) {
                String date = value.toString().split(" ")[0];
                data.put(column, date);
            } else {
                data.put(column, "");
            }
        }
    }

    public List<Map<String, Object>> getWd0MidcloseActualsProduct() {
        return jdbcManager.queryForList(wd0MidcloseActualsProduct);
    }

    public List<Map<String, Object>> getWd0MidcloseActualsService() {
        return jdbcManager.queryForList(wd0MidcloseActualsService);
    }

}
