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
import java.util.stream.Stream;

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
             String wd0Volumes,  String espAgingCaseSummary, String espCaseServiceMetricSummary, String espWeeklyComparisonSummary) {
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

    public List<Map<String, Object>> getPeriodCloseInterfaceLoad() {
        return jdbcManager.queryForList(closeInterfaceLoad);
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
        // Fetch data from the database and map it to the model list
        List<Map<String, Object>> res = jdbcManager.queryForList(orderStatusSummary);
        List<OrderLifecycleSummaryModel> resultList = mapToOrderLifecycleSummaryModelList(res);

        // Extract unique program names
        List<String> programNames = resultList.stream()
                .map(model -> model.PROGRAM_NAME) // Assuming PROGRAM_NAME is a public field
                .distinct()
                .collect(Collectors.toList());

        // Calculate the last index for each program and sort by the index
        Map<String, Integer> lastIndexSorted = programNames.stream()
                .collect(Collectors.toMap(
                        prog -> prog,
                        prog -> getLastIndexOfProperty(resultList, prog)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (oldValue, newValue) -> oldValue,
                        LinkedHashMap::new
                ));

        // Insert summary models at the correct positions
        int indexOffset = 0;
        for (Map.Entry<String, Integer> entry : lastIndexSorted.entrySet()) {
            int position = entry.getValue() + indexOffset;
            resultList.add(position, orderLifecycleSummary(resultList, entry.getKey()));
            indexOffset++;
        }

        // Calculate the total count across all programs
        int totalCount = programNames.stream()
                .mapToInt(prog -> calculateOrderCountSumByProgramName(resultList, prog))
                .sum();

        // Add the total count as a summary row
        resultList.add(new OrderLifecycleSummaryModel("Total", totalCount, null, null));

        return resultList;
    }

    public List<LargeDealSummaryByAccountModel> getLargeDealSummaryByAccount() {
        // Fetch and map the results to the model list
        List<Map<String, Object>> res = jdbcManager.queryForList(largeDealSummaryByAccount);
        List<LargeDealSummaryByAccountModel> resultList = mapToLargeDealSummaryByAccountModelList(res);

        // Extract unique accounts directly using a stream
        List<String> accounts = resultList.stream()
                .map(model -> model.ACCOUNT) // Assuming ACCOUNT is a public field
                .distinct()
                .collect(Collectors.toList());

        // Calculate the last index for each account and sort by value
        Map<String, Integer> lastIndexSorted = accounts.stream()
                .collect(Collectors.toMap(
                        acc -> acc,
                        acc -> getLastIndexOfPropertyforAccount(resultList, acc)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (oldValue, newValue) -> oldValue,
                        LinkedHashMap::new
                ));

        // Insert summary models at the correct positions
        int indexOffset = 0;
        for (Map.Entry<String, Integer> entry : lastIndexSorted.entrySet()) {
            int position = entry.getValue() + indexOffset;
            resultList.add(position, largeDealSummaryByAccount(resultList, entry.getKey()));
            indexOffset++;
        }

        // Calculate the total count across all accounts
        int totalCount = accounts.stream()
                .mapToInt(acc -> calculateOrderCountSumByAccount(resultList, acc))
                .sum();

        // Add the total row
        resultList.add(new LargeDealSummaryByAccountModel("Total", totalCount, null, null));

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

    public static int getLastIndexOfProperty(List<OrderLifecycleSummaryModel> objects, String targetProperty) {
        for (int i = objects.size() - 1; i >= 0; i--) {
            OrderLifecycleSummaryModel obj = objects.get(i);
            if (obj.PROGRAM_NAME.equals(targetProperty)) {
                return i;
            }
        }
        return -1; // Property not found
    }

    public static int getLastIndexOfPropertyforAccount(List<LargeDealSummaryByAccountModel> objects,
            String targetProperty) {
        for (int i = objects.size() - 1; i >= 0; i--) {
            LargeDealSummaryByAccountModel obj = objects.get(i);
            if (obj.ACCOUNT.equals(targetProperty)) {
                return i;
            }
        }
        return -1; // Property not found
    }

    public static HashMap<String, Integer> sortByValue(Map<String, Integer> hm) {
        List<Map.Entry<String, Integer>> list = new LinkedList<Map.Entry<String, Integer>>(hm.entrySet());
        Collections.sort(list, new Comparator<Map.Entry<String, Integer>>() {
            public int compare(Map.Entry<String, Integer> o1,
                    Map.Entry<String, Integer> o2) {
                return (o1.getValue()).compareTo(o2.getValue());
            }
        });
        HashMap<String, Integer> temp = new LinkedHashMap<String, Integer>();
        for (Map.Entry<String, Integer> aa : list) {
            temp.put(aa.getKey(), aa.getValue());
        }
        return temp;
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

}
