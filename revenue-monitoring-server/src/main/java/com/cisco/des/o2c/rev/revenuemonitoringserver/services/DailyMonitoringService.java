package com.cisco.des.o2c.rev.revenuemonitoringserver.services;
import com.cisco.des.o2c.rev.revenuemonitoringserver.packages.ErrorSummaryModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
        System.out.println(stdArExcQuery);
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

    public List<Map<String, Object>> getOrderStatus() {
        List<Map<String, Object>> result = jdbcManager.queryForList(orderStatus);
        result.forEach(data -> {
            data.remove("AGING_BOOKING");
            data.remove("AGING_HOLD_RELEASE");
            data.remove("EXPECTED_BOOK_DATE");
            data.remove("HOLD_RELEASE_TARGET_DATE");
            data.remove("LINE_TYPE");
            data.remove("ORDER_TOTAL");
            data.remove("SFDC_STATUS");
            data.remove("TOTAL_CONTRACT_VALUE");
            if(data.get("STATUS_AS_OF_DATE") != null){
                String date = data.get("STATUS_AS_OF_DATE").toString();
                String[] dateArr = date.split(" ");
                data.put("STATUS_AS_OF_DATE", dateArr[0]);
            }
            if(data.get("ACTUAL_BOOK_DATE") != null){
                String date = data.get("ACTUAL_BOOK_DATE").toString();
                String[] dateArr = date.split(" ");
                data.put("ACTUAL_BOOK_DATE", dateArr[0]);
            }
            if(data.get("FUTURE_INVOICE_RELEASE_DATE") != null){
                String date = data.get("FUTURE_INVOICE_RELEASE_DATE").toString();
                String[] dateArr = date.split(" ");
                data.put("FUTURE_INVOICE_RELEASE_DATE", dateArr[0]);
            }

        });


        return result;
    }

    public List<Map<String, Object>> getOrderStatusSummary() {
        return jdbcManager.queryForList(orderStatusSummary);
    }

}
