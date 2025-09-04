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

    private Boolean useRedisPostInv = true;



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
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("CmAmortSummary", cmAmortSummary, useRedisPostInv);
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
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("CmAmortDetails", cmAmortDetails, useRedisPostInv);
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
        if(test == 1) {
            refreshPostInvoicingMonitoringCache();
        }
        return 1;
    }

    public List<Map<String, Object>> getPrintErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("PrintSummary", printSummary, useRedisPostInv);
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
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("PrintDetail", printDetail, useRedisPostInv);
//        result.forEach(data -> {
//            formatDateColumns(data, dateColumns);
//        });
        return result;
    }

    public List<Map<String, Object>> getCreditCardSummary() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("CreditCardSummary", creditCardSummary, useRedisPostInv);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getCreditCardDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("CreditCardDetails", creditCardDetails, useRedisPostInv);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
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
        if(test == 1) {
            refreshPostInvoicingMonitoringCache();
        }
        return 1;
    }

    public List<Map<String, Object>> getRpoExtractSummary() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("RpoExtractSummary", rpoExtractSummary, useRedisPostInv);
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
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("RpoExtractDetails", rpoExtractDetails, useRedisPostInv);
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
        if(test == 1) {
            refreshPostInvoicingMonitoringCache();
        }
        return 1;
    }

    public List<Map<String, Object>> getSrtProcessSummary() {
        String[] dateColumns = { "SRT_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("SrtProcessSummary", srtProcessSummary, useRedisPostInv);
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
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("SrtProcessDetails", srtProcessDetails, useRedisPostInv);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getSRTProcessDetailsFiltered(String periodName,
                                                                  String processFlow, String ouName, String srtDate) {
        String[] dateColumns = { "SRT_DATE" };
        List<Map<String, Object>> result = jdbcManager.getSRTProcessDetailsFiltered(
                srtProcessDetailsFilter, periodName, processFlow, ouName, srtDate);
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
        if(test == 1) {
            refreshPostInvoicingMonitoringCache();
        }
        return 1;
    }


    public List<Map<String, Object>> getPCMApplicationSummary() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("PcmApplicationSummary", pcmApplicationSummary, useRedisPostInv);
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
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("PcmApplicationDetails", pcmApplicationDetails, useRedisPostInv);
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
        if(test == 1) {
            refreshPostInvoicingMonitoringCache();
        }
        return 1;
    }

    public void refreshPostInvoicingMonitoringCache() {
        Map<String, String> cmAmortSummaryMap = Map.of("CmAmortSummary", cmAmortSummary);
        Map<String, String> cmAmortDetailsMap = Map.of("CmAmortDetails", cmAmortDetails);
        Map<String, String> printSummaryMap = Map.of("PrintSummary", printSummary);
        Map<String, String> printDetailMap = Map.of("PrintDetail", printDetail);
        Map<String, String> creditCardSummaryMap = Map.of("CreditCardSummary", creditCardSummary);
        Map<String, String> creditCardDetailsMap = Map.of("CreditCardDetails", creditCardDetails);
        Map<String, String> rpoExtractSummaryMap = Map.of("RpoExtractSummary", rpoExtractSummary);
        Map<String, String> rpoExtractDetailsMap = Map.of("RpoExtractDetails", rpoExtractDetails);
        Map<String, String> srtProcessSummaryMap = Map.of("SrtProcessSummary", srtProcessSummary);
        Map<String, String> srtProcessDetailsMap = Map.of("SrtProcessDetails", srtProcessDetails);
        Map<String, String> pcmApplicationSummaryMap = Map.of("PcmApplicationSummary", pcmApplicationSummary);
        Map<String, String> pcmApplicationDetailsMap = Map.of("PcmApplicationDetails", pcmApplicationDetails);

        System.out.println("refresh from post invoicing service");

        cacheCommon.refreshExceptionMonitoringCache(cmAmortSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(cmAmortDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(printSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(printDetailMap);
        cacheCommon.refreshExceptionMonitoringCache(creditCardSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(creditCardDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(rpoExtractSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(rpoExtractDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(srtProcessSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(srtProcessDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(pcmApplicationSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(pcmApplicationDetailsMap);
    }

}
