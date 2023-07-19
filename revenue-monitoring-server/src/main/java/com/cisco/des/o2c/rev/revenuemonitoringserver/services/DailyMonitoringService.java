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
        String[] dateColumns = {"BOOK_DATE", "FUTURE_INVOICE_RELEASE_DATE", "INVOICE_DATE"};
        result.forEach(data -> {
            for(String str: dateColumns){
                if(data.get(str) != null){
                    String date = data.get(str).toString();
                    String[] dateArr = date.split(" ");
                    data.put(str, dateArr[0]);
                } else {
                    data.put(str, "TBD");
                }
            }
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
            Optional<Integer> completion = Optional.ofNullable(((BigDecimal) map.get("COMPLETION")).intValue())  ;
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
}
