package com.cisco.des.o2c.rev.revenuemonitoringserver.services;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class InvoiceToCashMonitoringService{
    private JdbcManager jdbcManager;

    private String autoInvoiceErrorSummaryView;
    private String autoInvoiceErrorDetails;
    private String preInvoiceErrorSummaryView;
    private String preInvoiceErrorDetails;
    private String autoInvoiceErrorDetailsFiltered;
    private String preInvoiceErrorDetailsFiltered;
    private String autoInvoiceErrorsSummaryUpdate;
    private String preInvoiceErrorsSummaryUpdate;
    private String einvoicingSummary;
    private String einvoicingDetails;
    private String einvoicingDetailsFiltered;
    private String eInvoicingSummaryUpdate;
    private String fusionErrorSummary;
    private String fusionErrorDetails;
    private String fusionErrorDetailsFiltered;
    private String fusionErrorSummaryUpdate;
    private String creditCardCheckSummaryView;
    private String creditCardCheckDetailView;
    private String creditCardCheckDetailFilteredView;
    private String updateCreditCardCheckSummary;

    @Autowired
    private Common common;
    @Autowired
    private CacheCommon cacheCommon;

    private Boolean useRedisInv = true;


    @Autowired
    public InvoiceToCashMonitoringService(JdbcManager jdbcManager, String autoInvoiceErrorSummaryView,
                                          String autoInvoiceErrorDetails, String preInvoiceErrorSummaryView, String preInvoiceErrorDetails,
                                          String autoInvoiceErrorDetailsFiltered, String preInvoiceErrorDetailsFiltered, String autoInvoiceErrorsSummaryUpdate,
                                           String preInvoiceErrorsSummaryUpdate, String einvoicingSummary, String einvoicingDetails,
                                          String einvoicingDetailsFiltered, String eInvoicingSummaryUpdate, String fusionErrorSummary, String fusionErrorDetails,
                                          String fusionErrorDetailsFiltered, String fusionErrorSummaryUpdate, String creditCardCheckSummaryView, String creditCardCheckDetailView,
                                          String creditCardCheckDetailFilteredView, String updateCreditCardCheckSummary){
        this.jdbcManager = jdbcManager;
        this.autoInvoiceErrorSummaryView = autoInvoiceErrorSummaryView;
        this.autoInvoiceErrorDetails = autoInvoiceErrorDetails;
        this.preInvoiceErrorSummaryView = preInvoiceErrorSummaryView;
        this.preInvoiceErrorDetails = preInvoiceErrorDetails;
        this.autoInvoiceErrorDetailsFiltered = autoInvoiceErrorDetailsFiltered;
        this.preInvoiceErrorDetailsFiltered = preInvoiceErrorDetailsFiltered;
        this.autoInvoiceErrorsSummaryUpdate = autoInvoiceErrorsSummaryUpdate;
        this.preInvoiceErrorsSummaryUpdate = preInvoiceErrorsSummaryUpdate;
        this.einvoicingSummary = einvoicingSummary;
        this.einvoicingDetails = einvoicingDetails;
        this.einvoicingDetailsFiltered = einvoicingDetailsFiltered;
        this.eInvoicingSummaryUpdate = eInvoicingSummaryUpdate;
        this.fusionErrorSummary = fusionErrorSummary;
        this.fusionErrorDetails = fusionErrorDetails;
        this.fusionErrorDetailsFiltered = fusionErrorDetailsFiltered;
        this.fusionErrorSummaryUpdate = fusionErrorSummaryUpdate;
        this.creditCardCheckDetailView = creditCardCheckDetailView;
        this.creditCardCheckSummaryView = creditCardCheckSummaryView;
        this.creditCardCheckDetailFilteredView = creditCardCheckDetailFilteredView;
        this.updateCreditCardCheckSummary = updateCreditCardCheckSummary;
    }

    // Pre-Invoice
    public List<Map<String, Object>> getPreInvoiceErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("PreInvoiceErrorSummaryView", preInvoiceErrorSummaryView, useRedisInv);
        result.forEach(data -> {
            data.remove("AGING");
            common.renameKey(data, "ERROR_AMOUNT", "AMOUNT");
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

    public List<Map<String, Object>> getPreInvoiceErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        String[] emptyAmountColumns = { "IOL_HOLD",
                "IOL_PENDING",
                "IOL_ERROR",
                "AR_INTERFACE",
                "AR_INTERFACE_ERROR",
                "INVOICED" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("PreInvoiceErrorDetails", preInvoiceErrorDetails, useRedisInv);
        result.forEach(data -> {
            common.renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            common.renameKey(data, "SUBSCRIPTION_ID", "TRANSACTION_ID");
            common.formatDateColumns(data, dateColumns);
            common.formatEmptyAmounts(data, emptyAmountColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getPreInvoiceErrorDetailsFiltered(String appName, String operatingUnit,
                                                                       String periodName, String processFlow, String uniqueId) {
        String[] dateColumns = { "TRANSACTION_DATE" };
        String[] emptyAmountColumns = { "IOL_HOLD",
                "IOL_PENDING",
                "IOL_ERROR",
                "AR_INTERFACE",
                "AR_INTERFACE_ERROR",
                "INVOICED" };
        List<Map<String, Object>> result = jdbcManager.queryForListWithParamsPreInvoice(preInvoiceErrorDetailsFiltered,
                appName, operatingUnit, periodName, processFlow, uniqueId);
        result.forEach(data -> {
            common.renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            common.renameKey(data, "SUBSCRIPTION_ID", "TRANSACTION_ID");
            common.formatDateColumns(data, dateColumns);
            common.formatEmptyAmounts(data, emptyAmountColumns);
        });
        return result;
    }

    public int updatePreInvoiceErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String processFlow = updateData.get("processFlow");
        String ouName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updatePreInvoiceErrorsSummaryData(preInvoiceErrorsSummaryUpdate, assignedTo, assignedBy,
                comments, ouName, transactionDate, processFlow);
        if(test == 1) {
            refreshInvoiceToCashMonitoringCache();
        }
            return 1;
    }

    // Auto-Invoice
    public List<Map<String, Object>> getAutoInvoiceErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("AutoInvoiceErrorSummaryView", autoInvoiceErrorSummaryView, useRedisInv);
        result.forEach(data -> {
            data.remove("AGING");
            common.renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            common.renameKey(data, "AMOUNT_USD", "AMOUNT");
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

    public List<Map<String, Object>> getAutoInvoiceErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("AutoInvoiceErrorDetails", autoInvoiceErrorDetails, useRedisInv);
        result.forEach(data -> {
            common.renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getAutoInvoiceErrorDetailsFiltered(String appName, String operatingUnit,
                                                                        String periodName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForListWithParamsAutoInvoice(
                autoInvoiceErrorDetailsFiltered, appName, operatingUnit, periodName, transactionDate);
        result.forEach(data -> {
            common.renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updateAutoInvoiceErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String processFlow = updateData.get("processFlow");
        String batchSourceName = updateData.get("applicationName");
        String ouName = updateData.get("orgName");
        String creationDate = updateData.get("transactionDate");
        int test = jdbcManager.updateAutoInvoiceErrorsSummaryData(autoInvoiceErrorsSummaryUpdate, assignedTo,
                assignedBy, comments, ouName, processFlow, periodName, batchSourceName, creationDate);
        if(test == 1) {
            refreshInvoiceToCashMonitoringCache();
        }
        return 1;
    }

    // eInvoicing
    public List<Map<String, Object>> getEInvoicingSummary() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("EinvoicingSummary", einvoicingSummary, useRedisInv);
        String[] dateColumns = { "ASSIGNED_DATE", "TRANSACTION_DATE" };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            data.remove("ASSIGNED_BY");
            data.remove("AGING");
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

    public List<Map<String, Object>> getEInvoicingDetails() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("EinvoicingDetails", einvoicingDetails, useRedisInv);
        result.forEach(data -> {
            common.renameKey(data,"TRX_NUMBER", "TRANSACTION_ID");
        });
        return result;
    }

    public List<Map<String, Object>> getEInvoicingDetailsFiltered(String ouName, String periodName, String appName, String processFlow, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getEInvoicingDetailsFilter(einvoicingDetailsFiltered, ouName, periodName, appName, processFlow, transactionDate);
        result.forEach(data -> {
            common.renameKey(data,"TRX_NUMBER", "TRANSACTION_ID");
        });
        return result;
    }


    public int updateEInvoicingErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String processFlow = updateData.get("processFlow");
        String appName = updateData.get("applicationName");
        String ouName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updateEInvoicingSummary(eInvoicingSummaryUpdate, assignedTo, assignedBy, comments, periodName, appName,
                processFlow, ouName, transactionDate);
        if(test == 1) {
            refreshInvoiceToCashMonitoringCache();
        }
        return 1;
    }

    public List<Map<String, Object>> getFusionErrorSummary() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("FusionErrorSummary", fusionErrorSummary, useRedisInv);
        result.forEach(data -> {
            data.remove("AGING");
            common.renameKey(data,"ENTITY_NAME", "ORG_NAME");
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

    public List<Map<String, Object>> getFusionDetails() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("FusionErrorDetails", fusionErrorDetails, useRedisInv);
        result.forEach(data -> {
            common.renameKey(data,"ENTITY_NAME", "ORG_NAME");
        });
        return result;
    }

    public List<Map<String, Object>> getFusionDetailsFiltered(String ouName, String periodName, String appName, String processFlow, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getFusionDetailsFilter(fusionErrorDetailsFiltered, ouName, periodName, appName, processFlow,  transactionDate );
        result.forEach(data -> {
            common.renameKey(data,"ENTITY_NAME", "ORG_NAME");
        });
        return result;
    }

    public int updateFusionErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String periodName = updateData.get("periodName");
        String processFlow = updateData.get("processFlow");
        String ouName = updateData.get("orgName");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updateFusionErrorSummary(fusionErrorSummaryUpdate, assignedTo, assignedBy, comments, periodName,
                processFlow, ouName, transactionDate);
        if(test == 1) {
            refreshInvoiceToCashMonitoringCache();
        }
        return 1;
    }

    public List<Map<String, Object>> getCreditCardCheckSummaryView() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("CreditCardCheckSummaryView", creditCardCheckSummaryView, useRedisInv);
        String[] dateColumns = { "HOLD_APPLY_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            data.remove("AGING");
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 5) {
                    reorderedData.put("AGING", common.calculateAging(data.get("HOLD_APPLY_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", common.calculateAging(data.get("HOLD_APPLY_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getCreditCardCheckDetailView() {
        String[] dateColumns = { "HOLD_APPLY_DATE" };
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("CreditCardCheckDetailView", creditCardCheckDetailView, useRedisInv);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getCreditCardCheckDetailFilteredView(String periodName,
                                                                          String orgName, String holdApplyDate, String processFlow) {
        String[] dateColumns = { "HOLD_APPLY_DATE" };
        List<Map<String, Object>> result = jdbcManager.getCreditCardCheckDetailsFiltered(creditCardCheckDetailFilteredView, periodName, orgName, holdApplyDate, processFlow);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updateCreditCardCheckSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String comments = updateData.get("comments");
        String flooringBid = updateData.get("processFlow").toUpperCase();
        String entityName = updateData.get("orgName");
        String holdApplyDate = updateData.get("holdApplyDate");
        String assignedBy = updateData.get("username");
        int test = jdbcManager.updateCreditCardCheckSummary(updateCreditCardCheckSummary, assignedTo, assignedBy, comments,
                entityName, holdApplyDate, flooringBid);
        if(test == 1) {
            refreshInvoiceToCashMonitoringCache();
        }
        return test;
    }

    public void refreshInvoiceToCashMonitoringCache() {
        Map<String, String> preInvoiceErrorSummaryViewMap   = Map.of("PreInvoiceErrorSummaryView", preInvoiceErrorSummaryView);
        Map<String, String> preInvoiceErrorDetailsViewMap   = Map.of("PreInvoiceErrorDetails", preInvoiceErrorDetails);
        Map<String, String> autoInvoiceErrorSummaryViewMap  = Map.of("AutoInvoiceErrorSummaryView", autoInvoiceErrorSummaryView);
        Map<String, String> autoInvoiceErrorDetailsMap      = Map.of("AutoInvoiceErrorDetails", autoInvoiceErrorDetails);
        Map<String, String> einvoicingSummaryMap            = Map.of("EinvoicingSummary", einvoicingSummary);
        Map<String, String> einvoicingDetailsMap            = Map.of("EinvoicingDetails", einvoicingDetails);
        Map<String, String> fusionErrorSummaryMap           = Map.of("FusionErrorSummary", fusionErrorSummary);
        Map<String, String> fusionErrorDetailsMap           = Map.of("FusionErrorDetails", fusionErrorDetails);
        Map<String, String> creditCardCheckSummaryViewMap   = Map.of("CreditCardCheckSummaryView", creditCardCheckSummaryView);
        Map<String, String> creditCardCheckDetailViewMap    = Map.of("CreditCardCheckDetailView", creditCardCheckDetailView);
        System.out.println("refresh from invoice to cash service");

        cacheCommon.refreshExceptionMonitoringCache(preInvoiceErrorSummaryViewMap);
        cacheCommon.refreshExceptionMonitoringCache(preInvoiceErrorDetailsViewMap);
        cacheCommon.refreshExceptionMonitoringCache(autoInvoiceErrorSummaryViewMap);
        cacheCommon.refreshExceptionMonitoringCache(autoInvoiceErrorDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(einvoicingSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(einvoicingDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(fusionErrorSummaryMap);
        cacheCommon.refreshExceptionMonitoringCache(fusionErrorDetailsMap);
        cacheCommon.refreshExceptionMonitoringCache(creditCardCheckSummaryViewMap);
        cacheCommon.refreshExceptionMonitoringCache(creditCardCheckDetailViewMap);
    }

}
