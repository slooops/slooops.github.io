package com.cisco.des.o2c.rev.revenuemonitoringserver.services;
import com.cisco.des.o2c.rev.revenuemonitoringserver.packages.ErrorSummaryModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
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

    private String invoiceTrackerHeader;

    private String invoiceTrackerLine;

    private String wd0ArMidCloseStatusQuery;

    private String wd0ArMidCloseHeaderDataQuery;


//    Connection conn;

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String stdArExcQuery, String tsvTopSkuExcQuery, 
                                 String tsvSubSkuExcQuery, String revenueControlsQuery, String closeInvStats, 
                                 String closeInterfaceLoad, String closeStartEndTime, String closeVolume,
                                 String closeMEStatus, String closeQECashCollected, String dashboardComments,
                                  String errorSummary, String allErrorDetails, String errorDetails, String updateComments,
                                  String orderStatus, String invoiceTrackerHeader, String invoiceTrackerLine,
                                  String wd0ArMidCloseStatusQuery, String wd0ArMidCloseHeaderDataQuery) {
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
        return jdbcManager.queryForList(orderStatus);
    }

    public List<Map<String, Object>> getInvoiceTrackerHeader() {
        return jdbcManager.queryForList(invoiceTrackerHeader);
    }

    public List<Map<String, Object>> getInvoiceTrackerLine() {
        return jdbcManager.queryForList(invoiceTrackerLine);
    }

    public List<Map<String, Object>> getWd0ArMidCloseStatus() {

        //return jdbcManager.queryForList(wd0ArMidCloseStatusQuery);
        List<Map<String, Object>> returnList = new ArrayList<>();
        Map<String, Object>  mapObject1 = new HashMap<>();

        mapObject1.put("ENTITY", "India");
        mapObject1.put("INVOICING_STATUS", "1:09");
        mapObject1.put("STANDARD_AR_POSTING", "1:42");
        mapObject1.put("CUSTOM_REVENUE_POSTING", "1:50");
        mapObject1.put("DEFERRALS_POSTING", "1:52");
        mapObject1.put("INTERCOMPANY_POSTING", "1:55");
        mapObject1.put("EXECUTION_STATUS", "Completed");
        mapObject1.put("FCC_LOAD_STATUS", "Yes");
        returnList.add(mapObject1);

        Map<String, Object>  mapObject2 = new HashMap<>();

        mapObject2.put("ENTITY", "Brazil");
        mapObject2.put("INVOICING_STATUS", "0:55");
        mapObject2.put("STANDARD_AR_POSTING", "1:56");
        mapObject2.put("CUSTOM_REVENUE_POSTING", "1:57");
        mapObject2.put("DEFERRALS_POSTING", "1:58");
        mapObject2.put("INTERCOMPANY_POSTING", "2:03");
        mapObject2.put("EXECUTION_STATUS", "Completed");
        mapObject2.put("FCC_LOAD_STATUS", "Yes");
        returnList.add(mapObject2);

        return returnList;

    }

    public List<Map<String, Object>> getWd0ArMidCloseHeaderData(){

        //return jdbcManager.queryForList(wd0ArMidCloseHeaderDataQuery);

        List<Map<String, Object>> returnList = new ArrayList<>();
        Map<String, Object>  mapObject = new HashMap<>();

        mapObject.put("CLOSE_TYPE", "MIDCLOSE");
        mapObject.put("EXPECTED_START_TIME", "2023-09-24T12:20:00.000+00:00");
        mapObject.put("EXPECTED_END_TIME", "2023-09-24T09:25:00.000+00:00");
        mapObject.put("ACTUAL_START_TIME", "2023-09-24T12:20:00.000+00:00");
        mapObject.put("ACTUAL_END_TIME", "2023-09-24T09:28:00.000+00:00");
        mapObject.put("QUARTER", "Q1FY24");
        mapObject.put("PERIOD_NAME", "OCT-23");
        mapObject.put("PERIOD_YEAR", "2023");
        returnList.add(mapObject);

        return returnList;
    }


}
