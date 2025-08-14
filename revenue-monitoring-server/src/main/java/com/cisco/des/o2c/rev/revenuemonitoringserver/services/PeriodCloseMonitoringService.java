package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.*;
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
    private String deleteSelectedDeals;
    private String cloBulkUpdate;
    private String invoiceEligibleUpdate;
    private String cloCommentUpdate;
    private String estimatedCompletionTime;
    private String largeDealSummaryByAccount;
    private String cloSampleDownloadData;
    private Boolean isQuarterEnd;
    private String periodName;


    @Autowired
    public PeriodCloseMonitoringService(JdbcManager jdbcManager, String closeInvStats,
            String closeInterfaceLoad, String closeStartEndTime, String closeVolume,
            String closeMEStatus, String closeQECashCollected, String dashboardComments,
            String updateComments,  String orderStatus,
            String orderStatusSummary, String orderStatusDownload, String updateOrderStatus,
            String orderStatusRevSummary, String deleteSelectedDeals, String cloBulkUpdate, String invoiceEligibleUpdate, String cloCommentUpdate,
            String estimatedCompletionTime, String largeDealSummaryByAccount, String cloSampleDownloadData,
                                          String periodName
                                        ) {
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
        this.orderStatusSummary = orderStatusSummary;
        this.orderStatusDownload = orderStatusDownload;
        this.updateOrderStatus = updateOrderStatus;
        this.orderStatusRevSummary = orderStatusRevSummary;
        this.deleteSelectedDeals = deleteSelectedDeals;
        this.cloBulkUpdate = cloBulkUpdate;
        this.invoiceEligibleUpdate = invoiceEligibleUpdate;
        this.cloCommentUpdate = cloCommentUpdate;
        this.estimatedCompletionTime = estimatedCompletionTime;
        this.largeDealSummaryByAccount = largeDealSummaryByAccount;
        this.cloSampleDownloadData = cloSampleDownloadData;
        this.periodName = periodName;
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


}
