package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;

@Service
public class RevenueAccountingMonitoringService {
    private JdbcManager jdbcManager;
    private String rolTransactionData;
    private String rolErrorsSummary;
    private String rolErrorsSummaryUpdate;
    private String rolTransactionDataFilter;
    private String standardRevenueSummary;
    private String standardRevenueDetails;
    private String standardRevenueDetailsFiltered;
    private String standardRevenueSummaryUpdate;
    private String accrualsSummary;
    private String accrualsDetails;
    private String accrualsDetailsFiltered;
    private String accrualsSummaryUpdate;
    private String tspAccountSummaryView;
    private String tspAccountDetailView;
    private String tspAccountDetailViewFiltered;
    private String tspAccountSummaryUpdate;
    @Autowired
    private Common common;
    @Autowired
    private CacheCommon cacheCommon;

    private Boolean useRedisRevAccounting = true;

    @Autowired
    public RevenueAccountingMonitoringService(JdbcManager jdbcManager, String rolErrorsSummaryUpdate, String rolTransactionDataFilter,
                                              String rolTransactionData, String rolErrorsSummary,String standardRevenueSummaryUpdate,
                                              String standardRevenueDetailsFiltered, String standardRevenueSummary, String standardRevenueDetails,
                                              String accrualsSummary, String accrualsDetails, String accrualsDetailsFiltered, String accrualsSummaryUpdate,
                                              String tspAccountSummaryView, String tspAccountDetailView, String tspAccountDetailViewFiltered,
                                              String tspAccountSummaryUpdate) {
        this.jdbcManager = jdbcManager;
        this.rolTransactionData = rolTransactionData;
        this.rolErrorsSummary = rolErrorsSummary;
        this.rolErrorsSummaryUpdate = rolErrorsSummaryUpdate;
        this.rolTransactionDataFilter = rolTransactionDataFilter;
        this.standardRevenueSummary = standardRevenueSummary;
        this.standardRevenueDetails = standardRevenueDetails;
        this.standardRevenueDetailsFiltered = standardRevenueDetailsFiltered;
        this.standardRevenueSummaryUpdate = standardRevenueSummaryUpdate;
        this.accrualsSummary = accrualsSummary;
        this.accrualsDetails = accrualsDetails;
        this.accrualsDetailsFiltered = accrualsDetailsFiltered;
        this.accrualsSummaryUpdate = accrualsSummaryUpdate;
        this.tspAccountSummaryView = tspAccountSummaryView;
        this.tspAccountDetailView = tspAccountDetailView;
        this.tspAccountDetailViewFiltered = tspAccountDetailViewFiltered;
        this.tspAccountSummaryUpdate = tspAccountSummaryUpdate;
    }

    public List<Map<String, Object>> getRolErrorsSummary() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("RolErrorsSummary", rolErrorsSummary, useRedisRevAccounting);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            common.renameKey(data, "SUB_APPLICATION", "PROCESS_FLOW");
            common.renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("ASSIGNED_BY");
            data.remove("CURRENCY_CODE");
            data.remove("ERROR_APPLICATION");
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

    public List<Map<String, Object>> getRolErrorDetails() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("RolErrorsDetails", rolTransactionData, useRedisRevAccounting);
        result.forEach(data -> {
            common.renameKey(data, "OU_NAME", "ORG_NAME");
            common.renameKey(data, "SUB_APPLICATION", "PROCESS_FLOW");
            common.renameKey(data, "ORDERLINEID", "ORDER_LINE_ID");
            common.renameKey(data, "INTID_TRXNID_CUSTTRXLINE_GROUPID", "TRANSACTION_ID");
            data.remove("ERROR_APPLICATION");
            data.remove("SOURCE");
            data.remove("CURRENCY_CODE");
            data.remove("CUSTTRXLINEID");
            data.remove("ORDERNUMBER_CUSTTRXID");
        });
        return result;
    }

    public List<Map<String, Object>> getRolTransactionDetailsFilter(String periodName, String ouName,
                                                                    String applicationName, String uniqueId) {
        List<Map<String, Object>> result = jdbcManager.getRolTransactionDataFilter(rolTransactionDataFilter, periodName,
                ouName, applicationName, Integer.parseInt(uniqueId));
        result.forEach(data -> {
            common.renameKey(data, "OU_NAME", "ORG_NAME");
            common.renameKey(data, "SUB_APPLICATION", "PROCESS_FLOW");
            common.renameKey(data, "ORDERLINEID", "ORDER_LINE_ID");
            common.renameKey(data, "INTID_TRXNID_CUSTTRXLINE_GROUPID", "TRANSACTION_ID");
            data.remove("ERROR_APPLICATION");
            data.remove("SOURCE");
            data.remove("CURRENCY_CODE");
            data.remove("CUSTTRXLINEID");
            data.remove("ORDERNUMBER_CUSTTRXID");
        });
        return result;
    }

    public int updateRolErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String appName = updateData.get("applicationName");
        String subApp = updateData.get("processFlow");
        String orgName = updateData.get("orgName");
        String assignedBy = updateData.get("username");
        int test = jdbcManager.updateRolErrorsSummaryData(rolErrorsSummaryUpdate, assignedTo, comments, assignedBy,
                periodName, appName, subApp, orgName);
        if(test == 1) {
            refreshRevenueAccountingMonitoringCache();
        }
        return test;
    }

    public List<Map<String, Object>> getStandardRevenueSummary() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("StandardRevenueSummary", standardRevenueSummary, useRedisRevAccounting);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
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

    public List<Map<String, Object>> getStandardRevenueDetails() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("StandardRevenueDetails", standardRevenueDetails, useRedisRevAccounting);
        return result;
    }

    public List<Map<String, Object>> getStandardRevenueDetailsFiltered(String periodName,
                                                                       String appName, String processFlow, String ouName, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getStandardRevenueDetailsFiltered(standardRevenueDetailsFiltered, periodName, appName, processFlow, ouName, transactionDate);
        result.forEach(data -> {
        });
        return result;
    }

    public int updateStandardRevenueSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String processFlow = updateData.get("processFlow");
        String orgName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        String assignedBy = updateData.get("username");
        int test = jdbcManager.updateStandardRevenueSummary(standardRevenueSummaryUpdate, assignedTo, assignedBy, comments,
                periodName, processFlow, orgName, transactionDate);
        if(test == 1) {
            refreshRevenueAccountingMonitoringCache();
        }
        return test;
    }

    // Accruals
    public List<Map<String, Object>> getAccrualsSummary() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("AccrualsSummary", accrualsSummary, useRedisRevAccounting);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            common.renameKey(data, "SEQUENCE_NUMBER", "SEQUENCE_NUM");
            data.remove("ASSIGNED_BY");
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

    public List<Map<String, Object>> getAccrualsDetails() {
        String[] dateColumns = { "CREATION_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("AccrualsDetails", accrualsDetails, useRedisRevAccounting);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            common.renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public List<Map<String, Object>> getAccrualsDetailsFiltered(String periodName, String ouName, String processFlow,
                                                                String sequenceNum) {
        List<Map<String, Object>> result = jdbcManager.queryForListWithParamsAccruals(accrualsDetailsFiltered, periodName, ouName, processFlow,
                Integer.parseInt(sequenceNum));
        result.forEach(data -> {
            common.renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public int updateAccrualsErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        int sequenceNum = Integer.parseInt(updateData.get("sequenceNum"));
        int test = jdbcManager.updateAccrualsErrorsSummaryData(accrualsSummaryUpdate, assignedTo, comments, assignedBy,
                sequenceNum);
        if(test == 1) {
            refreshRevenueAccountingMonitoringCache();
        }
        return 1;
    }

    public List<Map<String, Object>> getTspAccountSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("TspAccountSummaryView", tspAccountSummaryView, useRedisRevAccounting);
        result.forEach(data -> {
            data.remove("ASSIGNED_BY");
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

    public List<Map<String, Object>> getTspAccountDetailView() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("TspAccountDetailView", tspAccountDetailView, useRedisRevAccounting);
        result.forEach(data -> {
            common.renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public List<Map<String, Object>> getTspAccountDetailViewFiltered(String sequenceNumber){
        List<Map<String, Object>> result = jdbcManager.getTspAccountDetailViewFiltered( tspAccountDetailViewFiltered, sequenceNumber);
        result.forEach(data -> {
            common.renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public int updateTspAccountSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String sequenceNumber = updateData.get("sequenceNumber");
        int test = jdbcManager.updateTspAccountSummary(tspAccountSummaryUpdate, assignedTo, assignedBy, comments, sequenceNumber);
        if(test == 1) {
            refreshRevenueAccountingMonitoringCache();
        }
        return 1;
    }

    public void refreshRevenueAccountingMonitoringCache() {
        Map<String, String> rolErrorsSummaryMap = Map.of("RolErrorsSummary", rolErrorsSummary);
        Map<String, String> rolErrorsDetailsMap = Map.of("RolErrorsDetails", rolTransactionData);
        Map<String, String> standardRevenueSummaryMap = Map.of("StandardRevenueSummary", standardRevenueSummary);
        Map<String, String> standardRevenueDetailsMap = Map.of("StandardRevenueDetails", standardRevenueDetails);
        Map<String, String> accrualsSummaryMap = Map.of("AccrualsSummary", accrualsSummary);
        Map<String, String> accrualsDetailsMap = Map.of("AccrualsDetails", accrualsDetails);
        Map<String, String> tspAccountSummaryViewMap = Map.of("TspAccountSummaryView", tspAccountSummaryView);
        Map<String, String> tspAccountDetailViewMap = Map.of("TspAccountDetailView", tspAccountDetailView);

        System.out.println("refresh from revenue accounting service");

        cacheCommon.refreshExceptionMonitoringCache(rolErrorsSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(rolErrorsDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(standardRevenueSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(standardRevenueDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(accrualsSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(accrualsDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(tspAccountSummaryViewMap);
        cacheCommon.refreshExceptionMonitoringCache(tspAccountDetailViewMap);
    }

}
