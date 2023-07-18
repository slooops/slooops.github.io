package com.cisco.des.o2c.rev.revenuemonitoringserver.services;
import com.cisco.des.o2c.rev.revenuemonitoringserver.packages.OrderLifecycleModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.packages.OrderLifecycleSummaryModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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


//    Connection conn;

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String stdArExcQuery, String tsvTopSkuExcQuery, 
                                 String tsvSubSkuExcQuery, String revenueControlsQuery, String closeInvStats, 
                                 String closeInterfaceLoad, String closeStartEndTime, String closeVolume,
                                 String closeMEStatus, String closeQECashCollected, String dashboardComments,
                                  String errorSummary, String allErrorDetails, String errorDetails,
                                  String updateComments, String orderStatus, String orderStatusSummary) {
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
        this.orderStatusSummary = orderStatusSummary;
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
        return jdbcManager.update(updateComments, closeType, comments);
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

    public OrderLifecycleModel getOrderStatus() {
        OrderLifecycleModel orderLifecycleModel = new OrderLifecycleModel();
        List<Map<String, Object>> result = jdbcManager.queryForList(orderStatus);
        String[] columnsToRemove = {"AGING_BOOKING", "AGING_HOLD_RELEASE", "EXPECTED_BOOK_DATE", "HOLD_RELEASE_TARGET_DATE",
       "LINE_TYPE", "ORDER_TOTAL", "SFDC_STATUS", "TOTAL_CONTRACT_VALUE" };
        String[] dateColumns = {"STATUS_AS_OF_DATE", "ACTUAL_BOOK_DATE", "FUTURE_INVOICE_RELEASE_DATE", "INVOICE_DATE"};
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
                    data.put(str, "TBD");
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
    public List<OrderLifecycleSummaryModel> getOrderStatusSummary() {
        List<Map<String, Object>> res = jdbcManager.queryForList(orderStatusSummary);
        List<OrderLifecycleSummaryModel> resultList = mapToOrderLifecycleSummaryModelList(res);

        resultList.add(6, orderLifecycleSummary(resultList, "WPA"));
        resultList.add(2, orderLifecycleSummary(resultList, "CX EA TF"));
        resultList.add(4,orderLifecycleSummary(resultList, "EA"));
        int totalCount = calculateOrderCountSumByProgramName(resultList, "WPA") + calculateOrderCountSumByProgramName(resultList, "CX EA TF") + calculateOrderCountSumByProgramName(resultList,"EA" );
        resultList.add(9, new OrderLifecycleSummaryModel("Total", totalCount, null, null));
        return resultList;
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
            String completion = (String) map.get("COMPLETION");

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
}
