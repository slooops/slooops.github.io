package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class PostInvoicingMonitoringService {

    private JdbcManager jdbcManager;
    private String cmAmortSummary;
    private String cmAmortDetails;
    private String cmAmortDetailsFiltered;
    private String cmAmortSummaryUpdate;
    private String printSummary;
    private String printDetail;
    private String printDetailFiltered;
    private String printSummaryUpdate;
    private String creditCardSummary;
    private String creditCardDetails;
    private String creditCardDetailsFiltered;
    private String creditCardSummaryUpdate;
    private String rpoExtractSummary;
    private String rpoExtractDetails;
    private String rpoExtractDetailsFilter;
    private String rpoExtractSummaryUpdate;
    private String srtProcessSummary;
    private String srtProcessDetails;
    private String srtProcessDetailsFilter;
    private String srtProcessSummaryUpdate;
    private String pcmApplicationSummary;
    private String pcmApplicationDetails;
    private String pcmApplicationDetailsFiltered;
    private String pcmApplicationSummaryUpdate;
    @Autowired
    private Common common;
    @Autowired
    private CacheCommon cacheCommon;
    private Logger logger = LoggerFactory.getLogger(PostInvoicingMonitoringService.class);


    @Autowired
    public PostInvoicingMonitoringService(JdbcManager jdbcManager,
                                      String cmAmortSummary, String cmAmortDetails, String cmAmortSummaryUpdate, String cmAmortDetailsFiltered,
                                      String printSummary, String printDetail, String printDetailFiltered, String printSummaryUpdate,
                                      String creditCardSummary, String creditCardDetails, String creditCardDetailsFiltered, String creditCardSummaryUpdate,
                                      String rpoExtractSummary, String rpoExtractDetails,
                                      String rpoExtractDetailsFilter, String rpoExtractSummaryUpdate, String srtProcessSummary, String srtProcessDetails,
                                      String srtProcessDetailsFilter, String srtProcessSummaryUpdate, String pcmApplicationSummary, String pcmApplicationDetails,
                                          String pcmApplicationDetailsFiltered, String pcmApplicationSummaryUpdate
    ) {
        this.jdbcManager = jdbcManager;
        this.cmAmortSummary = cmAmortSummary;
        this.cmAmortDetails = cmAmortDetails;
        this.cmAmortDetailsFiltered = cmAmortDetailsFiltered;
        this.cmAmortSummaryUpdate = cmAmortSummaryUpdate;
        this.printSummary = printSummary;
        this.printDetail = printDetail;
        this.printDetailFiltered = printDetailFiltered;
        this.printSummaryUpdate = printSummaryUpdate;
        this.creditCardSummary = creditCardSummary;
        this.creditCardDetails = creditCardDetails;
        this.rpoExtractSummary = rpoExtractSummary;
        this.rpoExtractDetails = rpoExtractDetails;
        this.rpoExtractDetailsFilter = rpoExtractDetailsFilter;
        this.rpoExtractSummaryUpdate = rpoExtractSummaryUpdate;
        this.srtProcessSummary = srtProcessSummary;
        this.srtProcessDetails = srtProcessDetails;
        this.srtProcessDetailsFilter = srtProcessDetailsFilter;
        this.srtProcessSummaryUpdate = srtProcessSummaryUpdate;
        this.creditCardDetailsFiltered = creditCardDetailsFiltered;
        this.creditCardSummaryUpdate = creditCardSummaryUpdate;
        this.pcmApplicationSummary = pcmApplicationSummary;
        this.pcmApplicationDetails = pcmApplicationDetails;
        this.pcmApplicationDetailsFiltered = pcmApplicationDetailsFiltered;
        this.pcmApplicationSummaryUpdate = pcmApplicationSummaryUpdate;

    }

    //Post-Invoice
    public List<Map<String, Object>> getCMAmortErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("CmAmortSummary", cmAmortSummary);
        result.forEach(data -> {
            data.remove("AGING");
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getCMAmortErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE", "RULE_START_DATE", "RULE_END_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("CmAmortDetails", cmAmortDetails);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getCMAmortErrorDetailsFiltered(String periodName,
                                                                        String appName, String processFlow, String ouName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE", "RULE_START_DATE", "RULE_END_DATE"  };
        List<Map<String, Object>> result = jdbcManager.getCMAmortDetailsFiltered(
                cmAmortDetailsFiltered, periodName, appName, processFlow, ouName, transactionDate);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updateCMAmortErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String processFlow = updateData.get("processFlow");
        String orgName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updateCMAmortSummary(cmAmortSummaryUpdate, assignedTo, assignedBy, comments,  periodName, processFlow, orgName, transactionDate);
        return 1;
    }

    public List<Map<String, Object>> getPrintErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("PrintSummary", printSummary);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getPrintErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE", "RULE_START_DATE", "RULE_END_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("PrintDetail", printDetail);
//        result.forEach(data -> {
//            formatDateColumns(data, dateColumns);
//        });
        return result;
    }

    public List<Map<String, Object>> getCreditCardSummary() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("CreditCardSummary", creditCardSummary);
        return result;
    }

    public List<Map<String, Object>> getCreditCardDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("CreditCardDetails", creditCardDetails);
        return result;
    }

    public List<Map<String, Object>> getCreditCardDetailsFiltered(String periodName,
                                                                  String appName, String processFlow, String ouName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.getCreditCardDetailsFiltered(creditCardDetailsFiltered, periodName, appName, processFlow, ouName, transactionDate);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getPrintErrorDetailsFiltered(String periodName,
                                                                    String appName, String processFlow, String ouName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE", "RULE_START_DATE", "RULE_END_DATE"  };
        List<Map<String, Object>> result = jdbcManager.getPrintDetailsFiltered(
                printDetailFiltered, periodName, appName, processFlow, ouName, transactionDate);
        return result;
    }

    public int updatePrintErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String orgName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updatePrintSummary(printSummaryUpdate, assignedTo, assignedBy, comments,  periodName,  orgName, transactionDate);
        return 1;
    }

    public List<Map<String, Object>> getRpoExtractSummary() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("RpoExtractSummary", rpoExtractSummary);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getRpoExtractDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("RpoExtractDetails", rpoExtractDetails);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getRpoExtractDetailsFiltered(String periodName,
                                                                  String appName, String processFlow, String ouName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.getRPOExtractDetailsFiltered(
                rpoExtractDetailsFilter, periodName, appName, processFlow, ouName, transactionDate);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updateRPOExtractSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String orgName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updateRPOExtractSummary(rpoExtractSummaryUpdate, assignedTo, assignedBy, comments,  periodName,  orgName, transactionDate);
        return 1;
    }

    public List<Map<String, Object>> getSrtProcessSummary() {
        String[] dateColumns = { "SRT_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("SrtProcessSummary", srtProcessSummary);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 5) {
                    reorderedData.put("AGING", common.calculateAging(data.get("SRT_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", common.calculateAging(data.get("SRT_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getSrtProcessDetails() {
        String[] dateColumns = { "SRT_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("SrtProcessDetails", srtProcessDetails);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getSRTProcessDetailsFiltered(String periodName,
                                                                  String processFlow, String eventType, String ouName, String srtDate) {
        String[] dateColumns = { "SRT_DATE" };
        List<Map<String, Object>> result = jdbcManager.getSRTProcessDetailsFiltered(
                srtProcessDetailsFilter, periodName, processFlow, eventType, ouName, srtDate);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updateSRTProcessSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String entityName = updateData.get("orgName");
        String srtDate = updateData.get("srtDate");
        int test = jdbcManager.updateSRTProcessSummary(srtProcessSummaryUpdate, assignedTo, assignedBy, comments,  periodName,  entityName, srtDate);
        return 1;
    }


    public List<Map<String, Object>> getPCMApplicationSummary() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("PcmApplicationSummary", pcmApplicationSummary);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getPCMApplicationDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = common.checkRedisForCachedData("PcmApplicationDetails", pcmApplicationDetails);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getPCMApplicationDetailsFiltered(String periodName,
                                                                      String appName, String processFlow, String ouName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.getPCMApplicationDetailsFiltered(
                pcmApplicationDetailsFiltered, periodName, appName, processFlow, ouName, transactionDate);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updatePCMApplicationSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String entityName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        String batchSource = updateData.get("applicationName");
        String processFlow = updateData.get("processFlow");
        System.out.println(assignedTo + assignedBy + comments + periodName + entityName + transactionDate + batchSource + processFlow);
        int test = jdbcManager.updatePCMApplicationSummary(pcmApplicationSummaryUpdate, assignedTo, assignedBy, comments,  periodName,  batchSource, processFlow, entityName, transactionDate);
        return 1;
    }

    public void refreshPostInvoicingMonitoringCache() {
        Map<String, String> cacheKeyToQueryMap = new HashMap<>();
        cacheKeyToQueryMap.put("CmAmortSummary", cmAmortSummary);
        cacheKeyToQueryMap.put("CmAmortDetails", cmAmortDetails);
        cacheKeyToQueryMap.put("PrintSummary", printSummary);
        cacheKeyToQueryMap.put("PrintDetail", printDetail);
        cacheKeyToQueryMap.put("CreditCardSummary", creditCardSummary);
        cacheKeyToQueryMap.put("CreditCardDetails", creditCardDetails);
        cacheKeyToQueryMap.put("RpoExtractSummary", rpoExtractSummary);
        cacheKeyToQueryMap.put("RpoExtractDetails", rpoExtractDetails);
        cacheKeyToQueryMap.put("SrtProcessSummary", srtProcessSummary);
        cacheKeyToQueryMap.put("SrtProcessDetails", srtProcessDetails);
        cacheKeyToQueryMap.put("PcmApplicationSummary",pcmApplicationSummary);
        cacheKeyToQueryMap.put("PcmApplicationDetails", pcmApplicationDetails);

        System.out.println("refresh from post invoicing service");

        cacheCommon.refreshExceptionMonitoringCache(cacheKeyToQueryMap);
    }

}
