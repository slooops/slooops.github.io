package com.cisco.des.o2c.rev.revenuemonitoringserver.services;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.*;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class DailyMonitoringService {
    private JdbcManager jdbcManager;
    private String stdArExcQuery;
    private String tsvTopSkuExcQuery;
    private String tsvSubSkuExcQuery;
    private String revenueControlsQuery;
    private String closeInvStats;
    private String closeInterfaceLoad;
    private String closeStartEndTime;
    private String closeVolume;
    private String closeMEStatus;
    private String closeQECashCollected;
    private String dashboardComments;
    private String updateComments;
    private String errorSummary;
    private String allErrorDetails;
    private String errorDetails;
    private String orderStatus;
    private String orderStatusSummary;
    private String orderStatusDownload;
    private String updateOrderStatus;
    private String orderStatusRevSummary;
    private String updateInvoiceEligibleDate;

    private String invoiceTrackerHeader;

    private String invoiceTrackerLine;

    private String wd0ArMidCloseStatusQuery;

    private String wd0ArMidCloseHeaderDataQuery;

    private String wd0HistoricalDataQuery;

    private String kafkaError;
    private String kafkaInbound;
    private String arTrxnMissing;
    private String accrualsProcessingErrors;
    private String accrualsDistributionErrors;
    private String accrualsSummarizationErrors;
    private String kafkaPublishToDownstream;
    private String errorDistributionSummarization;
    private String personaAccessRoles;
    private String wd0Regression;
    private String wd0CurrentMonth;
    private String deleteSelectedDeals;
    private String cloBulkUpdate;
    private String invoiceEligibleUpdate;
    private String cloCommentUpdate;

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String stdArExcQuery, String tsvTopSkuExcQuery, 
                                 String tsvSubSkuExcQuery, String revenueControlsQuery, String closeInvStats, 
                                 String closeInterfaceLoad, String closeStartEndTime, String closeVolume,
                                 String closeMEStatus, String closeQECashCollected, String dashboardComments,
                                  String errorSummary, String allErrorDetails, String errorDetails, String updateComments,
                                 String invoiceTrackerHeader, String invoiceTrackerLine,
                                  String wd0ArMidCloseStatusQuery, String wd0ArMidCloseHeaderDataQuery,
                                  String wd0HistoricalDataQuery,
                                  String orderStatus, String orderStatusSummary, String orderStatusDownload,
                                  String updateOrderStatus, String kafkaError, String kafkaInbound,
                                  String arTrxnMissing, String accrualsProcessingErrors, String accrualsDistributionErrors,
                                  String accrualsSummarizationErrors, String kafkaPublishToDownstream, String errorDistributionSummarization,
                                  String orderStatusRevSummary, String personaAccessRoles,
                                  String wd0Regression, String wd0CurrentMonth, String deleteSelectedDeals, String cloBulkUpdate,
                                  String invoiceEligibleUpdate, String cloCommentUpdate
    ) {
        this.jdbcManager = jdbcManager;
        this.stdArExcQuery = stdArExcQuery;
        this.tsvTopSkuExcQuery = tsvTopSkuExcQuery;
        this.tsvSubSkuExcQuery = tsvSubSkuExcQuery;
        this.revenueControlsQuery = revenueControlsQuery;
        this.closeInvStats = closeInvStats;
        this.closeInterfaceLoad = closeInterfaceLoad;
        this.closeStartEndTime = closeStartEndTime;
        this.closeVolume = closeVolume;
        this.closeMEStatus = closeMEStatus;
        this.closeQECashCollected = closeQECashCollected;
        this.dashboardComments = dashboardComments;
        this.errorSummary = errorSummary;
        this.allErrorDetails = allErrorDetails;
        this.errorDetails = errorDetails;
        this.updateComments = updateComments;
        this.orderStatus = orderStatus;
        this.invoiceTrackerHeader = invoiceTrackerHeader;
        this.invoiceTrackerLine = invoiceTrackerLine;
        this.wd0ArMidCloseStatusQuery = wd0ArMidCloseStatusQuery;
        this.wd0ArMidCloseHeaderDataQuery = wd0ArMidCloseHeaderDataQuery;
        this.wd0HistoricalDataQuery = wd0HistoricalDataQuery;
        this.orderStatusSummary = orderStatusSummary;
        this.orderStatusDownload = orderStatusDownload;
        this.updateOrderStatus = updateOrderStatus;
        this.kafkaError = kafkaError;
        this.kafkaInbound = kafkaInbound;
        this.arTrxnMissing = arTrxnMissing;
        this.accrualsProcessingErrors = accrualsProcessingErrors;
        this.accrualsDistributionErrors = accrualsDistributionErrors;
        this.accrualsSummarizationErrors = accrualsSummarizationErrors;
        this.kafkaPublishToDownstream = kafkaPublishToDownstream;
        this.errorDistributionSummarization = errorDistributionSummarization;
        this.orderStatusRevSummary = orderStatusRevSummary;
        this.personaAccessRoles = personaAccessRoles;
        this.wd0Regression = wd0Regression;
        this.wd0CurrentMonth = wd0CurrentMonth;
        this.deleteSelectedDeals = deleteSelectedDeals;
        this.cloBulkUpdate = cloBulkUpdate;
        this.invoiceEligibleUpdate = invoiceEligibleUpdate;
        this.cloCommentUpdate = cloCommentUpdate;
    }

    public UserRoleInfo getUserRoles(String username) {
        List<Map<String, Object>> rolesList = jdbcManager.queryForList(personaAccessRoles);
        List<Map<String, Object>> filteredUsers = rolesList.stream()
                .filter(user -> user.get("USER_NAME").equals(username.toUpperCase()))
                .collect(Collectors.toList());

        List<String> roles = rolesList.stream()
                .filter(user -> user.get("USER_NAME").equals(username.toUpperCase()))
                .map(user -> (String) user.get("USER_ROLE"))
                .collect(Collectors.toList());

        if (!filteredUsers.isEmpty()) {
            Map<String, Object> user = filteredUsers.get(0);
            String userName = (String) user.get("USER_NAME");
            String userEmail = (String) user.get("USER_EMAIL");

            return new UserRoleInfo(userName, userEmail, roles);
        } else {
            return null;
        }
    }

    public List<Map<String, Object>> getStdArExceptions() {
        return jdbcManager.queryForList(stdArExcQuery);
    }

    public List<Map<String, Object>> getTsvTopSkuExceptions() {
        return jdbcManager.queryForList(tsvTopSkuExcQuery);
    }

    public List<Map<String, Object>> getTsvSubSkuExceptions() {
        return jdbcManager.queryForList(tsvSubSkuExcQuery);
    }

    public List<Map<String,Object>> getRevenueControls() { return jdbcManager.queryForList(revenueControlsQuery); }

    public List<Map<String,Object>> getCloseInvStats() { return jdbcManager.queryForList(closeInvStats); }

    public List<Map<String,Object>> getPeriodCloseInterfaceLoad() {
        List<Map<String,Object>> product = new ArrayList<>();
        List<Map<String,Object>> service = new ArrayList<>();
        for(Map<String,Object> row: jdbcManager.queryForList(closeInterfaceLoad)){
            if(row.get("LINE_TYPE").equals("PRODUCT")){
                product.add(row);
            } else {
                service.add(row);
            }
        }
        product = product.subList(product.size()-10,product.size());
        service = service.subList(service.size()-10,service.size());

        List<Map<String,Object>> interfaceLoad = new ArrayList<>();
        Stream.of(product, service).forEach(interfaceLoad::addAll);

        return interfaceLoad;
    }

    public List<Map<String,Object>> getCloseStartEndTime() { 
        return jdbcManager.queryForList(closeStartEndTime); 
    }

    public List<Map<String,Object>> getCloseVolume() { 
        return jdbcManager.queryForList(closeVolume); 
    }

    public List<Map<String,Object>> getCloseMEStatus() { 
        return jdbcManager.queryForList(closeMEStatus); 
    }

    public List<Map<String,Object>> getCloseQECashCollected() { return jdbcManager.queryForList(closeQECashCollected); }

    public List<Map<String,Object>> getDashboardComments() { return jdbcManager.queryForList(dashboardComments); }

    public int updateDashboardComments(String comments, String closeType) {
        return jdbcManager.updateComments(updateComments, closeType, comments);
    }

    public List<Map<String, Object>> getErrorSummary() {
        return jdbcManager.queryForList(errorSummary);
    }

    public List<Map<String, Object>> getAllErrorDetails() {
        return jdbcManager.queryForList(allErrorDetails);
    }

    public List<Map<String, Object>> getErrorDetails(String appName, String batchSource, String entity, String type) {
        List<Map<String, Object>> result = jdbcManager.queryForListWithParams(errorDetails, appName, batchSource, entity, type);
        return result;
    }

    public List<Map<String, Object>> getOrderStatusDownload() {
        return jdbcManager.queryForList(orderStatusDownload);
    }

    public List<Map<String, Object>> getInvoiceTrackerHeader() {
        return jdbcManager.queryForList(invoiceTrackerHeader);
    }

    public List<Map<String, Object>> getInvoiceTrackerLine() {
        return jdbcManager.queryForList(invoiceTrackerLine);
    }

    public List<Map<String, Object>> getWd0ArMidCloseStatus() {
        return jdbcManager.queryForList(wd0ArMidCloseStatusQuery);
    }

    public List<Map<String, Object>> getWd0ArMidCloseHeaderData(){
        return jdbcManager.queryForList(wd0ArMidCloseHeaderDataQuery);
    }

    public List<Map<String, Object>> getWd0HistoricalData(){
        return jdbcManager.queryForList(wd0HistoricalDataQuery);
    }


    public OrderLifecycleModel getOrderStatus() {
        OrderLifecycleModel orderLifecycleModel = new OrderLifecycleModel();
        List<Map<String, Object>> result = jdbcManager.queryForList(orderStatus);
        String[] columnsToRemove = {"AGING_BOOKING", "AGING_HOLD_RELEASE", "EXPECTED_BOOK_DATE", "HOLD_RELEASE_TARGET_DATE",
       "LINE_TYPE", "ORDER_TOTAL", "SFDC_STATUS", "TOTAL_CONTRACT_VALUE", "STATUS_AS_OF_DATE", "SUBSCRIPTION_ID" };
        String[] dateColumns = {"STATUS_AS_OF_DATE", "ACTUAL_BOOK_DATE", "FUTURE_INVOICE_RELEASE_DATE", "INVOICE_DATE", "DEAL_UPLOAD_DATE"};
        result.forEach(data -> {
            for(String str: columnsToRemove){
                data.remove(str);
            }
            for(String str: dateColumns){
                if(data.get(str) != null){
                    String date = data.get(str).toString();
                    String[] dateArr = date.split(" ");
                    data.put(str, dateArr[0]);
                } else {
                    if(!str.equals("DEAL_UPLOAD_DATE")){
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
        for(String key: keys){
            columns.add(key.replaceAll("_", " "));
        }
        orderLifecycleModel.setColumns(columns);

        return orderLifecycleModel;
    }

    public void setUpdateOrderStatusFromFile(MultipartFile file, String username) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isFirstLine = true;
            while ((line = reader.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }
                String[] parts = line.split(",");
                if (parts.length == 3) {
                    UpdateOrderModel orderModel = new UpdateOrderModel();
                    orderModel.setProgramName(parts[0]);
                    orderModel.setAccount(parts[1]);
                    orderModel.setDealIds(parts[2]);
                    saveToDatabase(orderModel, username);
                }
            }
        }
    }

    public void setUpdateOrderStatusFromData(UpdateOrderModel input){
        UpdateOrderModel orderModel = new UpdateOrderModel();
        orderModel.setProgramName(input.getProgramName());
        orderModel.setAccount(input.getAccount());
        String inputDealIds = input.getDealIds();
        String username = input.getUsername();
        if(inputDealIds.contains(",")){
            String[] updateDealIds = inputDealIds.replaceAll("\\s", "").split(",");
            for(String id: updateDealIds){
                orderModel.setDealIds(id);
                saveToDatabase(orderModel, username);
            }
        } else {
            orderModel.setDealIds(inputDealIds);
            saveToDatabase(orderModel, username);
        }
    }
    public List<Map<String, Object>> getKafkaError() { return jdbcManager.queryForList(kafkaError); }

    public List<Map<String, Object>> getKafkaInbound() { return jdbcManager.queryForList(kafkaInbound); }

    public List<Map<String, Object>> getArTrxnMissing() { return jdbcManager.queryForList(arTrxnMissing); }

    public List<Map<String, Object>> getAccrualsProcessingErrors() { return jdbcManager.queryForList(accrualsProcessingErrors); }

    public List<Map<String, Object>> getAccrualsDistributionErrors() { return jdbcManager.queryForList(accrualsDistributionErrors); }

    public List<Map<String, Object>> getAccrualsSummarizationErrors() { return jdbcManager.queryForList(accrualsSummarizationErrors); }

    public List<Map<String, Object>> getKafkaPublishToDownstream() { return jdbcManager.queryForList(kafkaPublishToDownstream); }

    public List<Map<String, Object>> getErrorDistributionSummarization() { return jdbcManager.queryForList(errorDistributionSummarization); }

    private void saveToDatabase(UpdateOrderModel csvData, String username) {
        jdbcManager.updateOrderStatus(this.updateOrderStatus, csvData.getProgramName(), csvData.getAccount(), Integer.parseInt(csvData.getDealIds()), username);
    }

    public List<OrderLifecycleSummaryModel> getOrderStatusSummary() {
        List<Map<String, Object>> res = jdbcManager.queryForList(orderStatusSummary);
        List<OrderLifecycleSummaryModel> resultList = mapToOrderLifecycleSummaryModelList(res);

        List<String> newList = resultList.stream().map(ele -> ele.PROGRAM_NAME).collect(Collectors.toList());
        List<String> programNames = new ArrayList<>(new HashSet<String>(newList));

        Map<String, Integer> lastIndex = new HashMap<>();
        for(String prog: programNames){
            lastIndex.put(prog, getLastIndexOfProperty(resultList, prog));
        }
        Map<String, Integer> lastIndexSorted = sortByValue(lastIndex);

        int index = 1;
        for(Map.Entry<String, Integer> ele: lastIndexSorted.entrySet()){
            resultList.add(ele.getValue()+index,orderLifecycleSummary(resultList, ele.getKey()) );
            index++;
        }

        int progNameLength = resultList.size();
        int totalCount =  0 ;

        for(String prog: programNames){
            totalCount += calculateOrderCountSumByProgramName(resultList, prog);
        }
        resultList.add(progNameLength, new OrderLifecycleSummaryModel("Total", totalCount, null, null));

        return resultList;
    }


    public List<Map<String, Object>> getOrderStatusRevSummary() {
        return jdbcManager.queryForList(orderStatusRevSummary);
    }
    public static OrderLifecycleSummaryModel orderLifecycleSummary(List<OrderLifecycleSummaryModel> resultList,String programName){
        OrderLifecycleSummaryModel obj = new OrderLifecycleSummaryModel("Sub Total ("+programName+")", calculateOrderCountSumByProgramName(resultList, programName), null, null);
        return obj;
    }
    public static List<OrderLifecycleSummaryModel> mapToOrderLifecycleSummaryModelList(List<Map<String, Object>> inputList) {
        List<OrderLifecycleSummaryModel> resultList = new ArrayList<>();
        for (Map<String, Object> map : inputList) {
            String programName = (String) map.get("PROGRAM_NAME");
            int orderCount = ((BigDecimal) map.get("ORDER_COUNT")).intValue();
            String status = (String) map.get("STATUS");
            Optional<Integer> completion = Optional.ofNullable(((BigDecimal) map.get("COMPLETION")).intValue());
            OrderLifecycleSummaryModel model = new OrderLifecycleSummaryModel(programName, orderCount, status, completion);
            resultList.add(model);
        }

        return resultList;
    }
    public static int calculateOrderCountSumByProgramName(List<OrderLifecycleSummaryModel> orderSummary, String programName) {
        int sum = 0;
        for (OrderLifecycleSummaryModel order : orderSummary) {
            if (order.PROGRAM_NAME.equals(programName)) {
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
    public static HashMap<String, Integer> sortByValue(Map<String, Integer> hm)
    {
        List<Map.Entry<String, Integer> > list =
                new LinkedList<Map.Entry<String, Integer> >(hm.entrySet());
        Collections.sort(list, new Comparator<Map.Entry<String, Integer> >() {
            public int compare(Map.Entry<String, Integer> o1,
                               Map.Entry<String, Integer> o2)
            {
                return (o1.getValue()).compareTo(o2.getValue());
            }
        });
        HashMap<String, Integer> temp = new LinkedHashMap<String, Integer>();
        for (Map.Entry<String, Integer> aa : list) {
            temp.put(aa.getKey(), aa.getValue());
        }
        return temp;
    }


    public List<Map<String, Object>> getWd0Regression() {
        return jdbcManager.queryForList(wd0Regression);
    }

    public List<Map<String, Object>> getWd0CurrentMonth() {
        return jdbcManager.queryForList(wd0CurrentMonth);
    }

    public void deleteSelectedDeals(List<Map<String,Object>> selectedDeals, String username){
        for(Map<String,Object> deal:selectedDeals){
            deleteDeals(username, (int)deal.get("DEAL_ID"), (String)deal.get("SALES_ORDER"));
        }
    }

    public void deleteDeals(String username, int dealId, String salesOrder){
        String so;
        if(salesOrder.equals("TBD")){
            so = "0";
        } else {
            so = salesOrder;
        }
        System.out.println(so);
        int test =  jdbcManager.deleteSelectedDeals(deleteSelectedDeals, username, dealId, so, so);
        System.out.println(test);
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

                if(parts.length == 6) {
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
        if(input.getOrderNum().equals("")){
            cloData.setOrderNum("0");
        } else {
            cloData.setOrderNum(input.getOrderNum());
        }
        cloData.setInvoiceDate(input.getInvoiceDate());
        cloData.setCloComments(input.getCloComments());
        saveToDatabaseCLOUpdate(cloData, username);
    }

    private void saveToDatabaseCLOUpdate(UpdateCLOData cloData, String username)  {
        Timestamp timestamp;
        if(cloData.getInvoiceDate().isEmpty()){
            timestamp = null;
        } else {
            java.util.Date date = timeStampGenerator(cloData.getInvoiceDate());
            timestamp = new Timestamp(date.getTime());
        }
//        int test = jdbcManager.updateCLoData(cloBulkUpdate, cloData.getProgramName(), cloData.getAccount(), Integer.parseInt(cloData.getDealIds()), cloData.getOrderNum(), timestamp, cloData.getCloComments(), username);
//        System.out.println(test);
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

    private static Date timeStampGenerator(String invoiceDate){

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
        if(updatedModel.get("orderID").equals("TBD")){
            so = "0";
        } else {
            so = updatedModel.get("orderID");
        }
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        java.util.Date date = dateFormat.parse(updatedModel.get("invoiceEligibleDate"));

        Timestamp timestamp = new Timestamp(date.getTime());

        int test = jdbcManager.updateInvoiceDate(invoiceEligibleUpdate, updatedModel.get("programName"), updatedModel.get("account"), Integer.parseInt(updatedModel.get("dealId")), so, timestamp, username);
    }

    public void setCloCommentUpdate(Map<String, String> updatedModel, String username){
        String so;
        System.out.println(updatedModel.get("orderID"));
        if(updatedModel.get("orderID").equals("TBD")){
            so = "0";
        } else {
            so = updatedModel.get("orderID");
        }
        int test = jdbcManager.updateCloComments(cloCommentUpdate, updatedModel.get("programName"), updatedModel.get("account"), Integer.parseInt(updatedModel.get("dealId")), so, updatedModel.get("cloComments"), username);
    }
}
