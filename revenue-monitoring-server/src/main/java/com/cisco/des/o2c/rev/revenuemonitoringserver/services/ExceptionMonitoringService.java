package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ExceptionMonitoringService {

    private JdbcManager jdbcManager;
    private String rolTransactionData;
    private String rolErrorsSummary;
    private String sbpSummary;
    private String sbpDetails;
    private String rolErrorsSummaryUpdate;
    private String rolErrorsSummaryPeriodStatus;
    private String rolChartTotals;
    private String rolChartDetails;
    private String rolTransactionDataFilter;
    private String autoInvoiceErrorSummaryView;
    private String autoInvoiceErrorDetails;
    private String preInvoiceErrorSummaryView;
    private String preInvoiceErrorDetails;
    private String autoInvoiceErrorDetailsFiltered;
    private String preInvoiceErrorDetailsFiltered;
    private String autoInvoiceErrorsSummaryUpdate;
    private String summaryAssignmentUsers;
    private String preInvoiceErrorsSummaryUpdate;
    private String accrualsSummary;
    private String accrualsDetails;
    private String accrualsDetailsFiltered;
    private String invoiceToCashSummary;
    private String accrualsSummaryUpdate;
    private String glErrorSummary;
    private String glErrorDetails;
    private String glPostingDetailsFiltered;
    private String glPostingSummaryUpdate;
    private String einvoicingSummary;
    private String einvoicingDetails;
    private String einvoicingDetailsFiltered;
    private String eInvoicingSummaryUpdate;
    private String tspAccountSummaryView;
    private String tspAccountDetailView;
    private String tspAccountDetailViewFiltered;
    private String tspAccountSummaryUpdate;
    private String fusionErrorSummary;
    private String fusionErrorDetails;
    private String transactionsProcessedSummary;
    private String transactionsProcessedDetails;
    private String transactionsProcessedDetailsFiltered;
    private String fusionErrorDetailsFiltered;
    private String fusionErrorSummaryUpdate;
    private String standardRevenueSummary;
    private String standardRevenueDetails;
    private String cmAmortSummary;
    private String cmAmortDetails;
    private String cmAmortDetailsFiltered;
    private String cmAmortSummaryUpdate;
    private String standardRevenueDetailsFiltered;
    private String standardRevenueSummaryUpdate;
    private String printSummary;
    private String printDetail;
    @Autowired
    public ExceptionMonitoringService(JdbcManager jdbcManager, String accrualsDetailsFiltered, String accrualsSummaryUpdate, String glErrorSummary,
                                      String glErrorDetails, String glPostingDetailsFiltered, String glPostingSummaryUpdate,
                                      String einvoicingSummary, String einvoicingDetails, String autoInvoiceErrorSummaryView,
                                      String autoInvoiceErrorDetails, String preInvoiceErrorSummaryView, String preInvoiceErrorDetails,
                                      String autoInvoiceErrorDetailsFiltered, String preInvoiceErrorDetailsFiltered, String autoInvoiceErrorsSummaryUpdate,
                                      String summaryAssignmentUsers, String preInvoiceErrorsSummaryUpdate, String accrualsSummary, String accrualsDetails,
                                      String invoiceToCashSummary,  String rolErrorsSummaryUpdate, String rolErrorsSummaryPeriodStatus, String rolChartTotals,
                                      String rolChartDetails, String rolTransactionDataFilter, String rolTransactionData, String rolErrorsSummary, String sbpSummary,
                                      String sbpDetails, String einvoicingDetailsFiltered, String eInvoicingSummaryUpdate, String tspAccountSummaryView, String tspAccountDetailView,
                                      String tspAccountDetailViewFiltered, String tspAccountSummaryUpdate, String fusionErrorSummary, String fusionErrorDetails,
                                      String transactionsProcessedSummary, String transactionsProcessedDetails, String transactionsProcessedDetailsFiltered,
                                      String fusionErrorDetailsFiltered, String fusionErrorSummaryUpdate, String standardRevenueSummary, String standardRevenueDetails,
                                      String cmAmortSummary, String cmAmortDetails, String cmAmortSummaryUpdate, String cmAmortDetailsFiltered,
                                      String standardRevenueSummaryUpdate, String standardRevenueDetailsFiltered, String printSummary, String printDetail
    ) {
        this.jdbcManager = jdbcManager;
        this.rolTransactionData = rolTransactionData;
        this.rolErrorsSummary = rolErrorsSummary;
        this.sbpSummary = sbpSummary;
        this.sbpDetails = sbpDetails;
        this.rolErrorsSummaryUpdate = rolErrorsSummaryUpdate;
        this.rolErrorsSummaryPeriodStatus = rolErrorsSummaryPeriodStatus;
        this.rolChartTotals = rolChartTotals;
        this.rolChartDetails = rolChartDetails;
        this.rolTransactionDataFilter = rolTransactionDataFilter;
        this.autoInvoiceErrorSummaryView = autoInvoiceErrorSummaryView;
        this.autoInvoiceErrorDetails = autoInvoiceErrorDetails;
        this.preInvoiceErrorSummaryView = preInvoiceErrorSummaryView;
        this.preInvoiceErrorDetails = preInvoiceErrorDetails;
        this.autoInvoiceErrorDetailsFiltered = autoInvoiceErrorDetailsFiltered;
        this.preInvoiceErrorDetailsFiltered = preInvoiceErrorDetailsFiltered;
        this.autoInvoiceErrorsSummaryUpdate = autoInvoiceErrorsSummaryUpdate;
        this.summaryAssignmentUsers = summaryAssignmentUsers;
        this.preInvoiceErrorsSummaryUpdate = preInvoiceErrorsSummaryUpdate;
        this.accrualsSummary = accrualsSummary;
        this.accrualsDetails = accrualsDetails;
        this.invoiceToCashSummary = invoiceToCashSummary;
        this.accrualsDetailsFiltered = accrualsDetailsFiltered;
        this.accrualsSummaryUpdate = accrualsSummaryUpdate;
        this.glErrorSummary = glErrorSummary;
        this.glErrorDetails = glErrorDetails;
        this.glPostingDetailsFiltered = glPostingDetailsFiltered;
        this.glPostingSummaryUpdate = glPostingSummaryUpdate;
        this.einvoicingSummary = einvoicingSummary;
        this.einvoicingDetails = einvoicingDetails;
        this.einvoicingDetailsFiltered = einvoicingDetailsFiltered;
        this.eInvoicingSummaryUpdate = eInvoicingSummaryUpdate;
        this.tspAccountSummaryView = tspAccountSummaryView;
        this.tspAccountDetailView = tspAccountDetailView;
        this.tspAccountDetailViewFiltered = tspAccountDetailViewFiltered;
        this.tspAccountSummaryUpdate = tspAccountSummaryUpdate;
        this.fusionErrorSummary = fusionErrorSummary;
        this.fusionErrorDetails = fusionErrorDetails;
        this.transactionsProcessedSummary = transactionsProcessedSummary;
        this.transactionsProcessedDetails = transactionsProcessedDetails;
        this.transactionsProcessedDetailsFiltered = transactionsProcessedDetailsFiltered;
        this.fusionErrorDetailsFiltered = fusionErrorDetailsFiltered;
        this.fusionErrorSummaryUpdate = fusionErrorSummaryUpdate;
        this.standardRevenueSummary = standardRevenueSummary;
        this.standardRevenueDetails = standardRevenueDetails;
        this.cmAmortSummary = cmAmortSummary;
        this.cmAmortDetails = cmAmortDetails;
        this.cmAmortDetailsFiltered = cmAmortDetailsFiltered;
        this.cmAmortSummaryUpdate = cmAmortSummaryUpdate;
        this.standardRevenueDetailsFiltered = standardRevenueDetailsFiltered;
        this.standardRevenueSummaryUpdate = standardRevenueSummaryUpdate;
        this.printSummary = printSummary;
        this.printDetail = printDetail;
    }

    // Standard Revenue
    public List<Map<String, Object>> getStandardRevenueSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(standardRevenueSummary);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            data.remove("AGING");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getStandardRevenueDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(standardRevenueDetails);
        result.forEach(data -> {

        });
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
        return test;
    }

    // ROL
    public List<Map<String, Object>> getRolErrorsSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(rolErrorsSummary);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            renameKey(data, "SUB_APPLICATION", "PROCESS_FLOW");
            renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("ASSIGNED_BY");
            data.remove("CURRENCY_CODE");
            data.remove("ERROR_APPLICATION");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getRolErrorDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(rolTransactionData);
        result.forEach(data -> {
            renameKey(data, "OU_NAME", "ORG_NAME");
            renameKey(data, "SUB_APPLICATION", "PROCESS_FLOW");
            renameKey(data, "ORDERLINEID", "ORDER_LINE_ID");
            renameKey(data, "INTID_TRXNID_CUSTTRXLINE_GROUPID", "TRANSACTION_ID");
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
            renameKey(data, "OU_NAME", "ORG_NAME");
            renameKey(data, "SUB_APPLICATION", "PROCESS_FLOW");
            renameKey(data, "ORDERLINEID", "ORDER_LINE_ID");
            renameKey(data, "INTID_TRXNID_CUSTTRXLINE_GROUPID", "TRANSACTION_ID");
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
        return test;
    }

    public List<Map<String, Object>> getRolChartTotals() {
        return jdbcManager.queryForList(rolChartTotals);
    }

    public List<Map<String, Object>> getRolChartDetails() {
        return jdbcManager.queryForList(rolChartDetails);
    }

    // Accruals
    public List<Map<String, Object>> getAccrualsSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(accrualsSummary);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
            renameKey(data, "SEQUENCE_NUMBER", "SEQUENCE_NUM");
            data.remove("ASSIGNED_BY");
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getAccrualsDetails() {
        String[] dateColumns = { "CREATION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(accrualsDetails);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
            renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public List<Map<String, Object>> getAccrualsDetailsFiltered(String periodName, String ouName, String processFlow,
                                                                String sequenceNum) {
        List<Map<String, Object>> result = jdbcManager.queryForListWithParamsAccruals(accrualsDetailsFiltered, periodName, ouName, processFlow,
                Integer.parseInt(sequenceNum));
        result.forEach(data -> {
            renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public int updateAccrualsErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        int sequenceNum = Integer.parseInt(updateData.get("sequenceNum"));
        System.out.println(updateData);
        int test = jdbcManager.updateAccrualsErrorsSummaryData(accrualsSummaryUpdate, assignedTo, comments, assignedBy,
                sequenceNum);
        return 1;
    }

    // Accounts
    public List<Map<String, Object>> getTspAccountSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(tspAccountSummaryView);
        result.forEach(data -> {
            data.remove("ASSIGNED_BY");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getTspAccountDetailView() {
        List<Map<String, Object>> result = jdbcManager.queryForList(tspAccountDetailView);;
        result.forEach(data -> {
            renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public List<Map<String, Object>> getTspAccountDetailViewFiltered(String sequenceNumber){
        List<Map<String, Object>> result = jdbcManager.getTspAccountDetailViewFiltered( tspAccountDetailViewFiltered, sequenceNumber);
        result.forEach(data -> {
            renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
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
        return 1;
    }

    // Pre-Invoice
    public List<Map<String, Object>> getPreInvoiceErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(preInvoiceErrorSummaryView);
        result.forEach(data -> {
            data.remove("AGING");
            renameKey(data, "ERROR_AMOUNT", "AMOUNT");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
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
        List<Map<String, Object>> result = jdbcManager.queryForList(preInvoiceErrorDetails);
        result.forEach(data -> {
            renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            renameKey(data, "SUBSCRIPTION_ID", "TRANSACTION_ID");
            formatDateColumns(data, dateColumns);
            formatEmptyAmounts(data, emptyAmountColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getPreInvoiceErrorDetailsFiltered(String appName, String operatingUnit,
                                                                       String periodName, String uniqueId) {
        String[] dateColumns = { "TRANSACTION_DATE" };
        String[] emptyAmountColumns = { "IOL_HOLD",
                "IOL_PENDING",
                "IOL_ERROR",
                "AR_INTERFACE",
                "AR_INTERFACE_ERROR",
                "INVOICED" };
        List<Map<String, Object>> result = jdbcManager.queryForListWithParamsAutoInvoice(preInvoiceErrorDetailsFiltered,
                appName, operatingUnit, periodName, uniqueId);
        result.forEach(data -> {
            renameKey(data, "CREATION_DATE", "TRANSACTION_DATE");
            renameKey(data, "SUBSCRIPTION_ID", "TRANSACTION_ID");
            formatDateColumns(data, dateColumns);
            formatEmptyAmounts(data, emptyAmountColumns);
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
        return 1;
    }

    // Auto-Invoice
    public List<Map<String, Object>> getAutoInvoiceErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(autoInvoiceErrorSummaryView);
        result.forEach(data -> {
            data.remove("AGING");
            renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            renameKey(data, "AMOUNT_USD", "AMOUNT");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getAutoInvoiceErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(autoInvoiceErrorDetails);
        result.forEach(data -> {
            renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getAutoInvoiceErrorDetailsFiltered(String appName, String operatingUnit,
                                                                        String periodName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForListWithParamsAutoInvoice(
                autoInvoiceErrorDetailsFiltered, appName, operatingUnit, periodName, transactionDate);
        result.forEach(data -> {
            renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            formatDateColumns(data, dateColumns);
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
        return 1;
    }

    //Post-Invoice
    public List<Map<String, Object>> getCMAmortErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(cmAmortSummary);
        result.forEach(data -> {
            data.remove("AGING");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getCMAmortErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE", "RULE_START_DATE", "RULE_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(cmAmortDetails);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getCMAmortErrorDetailsFiltered(String periodName,
                                                                        String appName, String processFlow, String ouName, String transactionDate) {
        String[] dateColumns = { "TRANSACTION_DATE", "RULE_START_DATE", "RULE_END_DATE"  };
        List<Map<String, Object>> result = jdbcManager.getCMAmortDetailsFiltered(
                cmAmortDetailsFiltered, periodName, appName, processFlow, ouName, transactionDate);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
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
        List<Map<String, Object>> result = jdbcManager.queryForList(printSummary);
//        result.forEach(data -> {
//            data.remove("AGING");
//            formatDateColumns(data, dateColumns);
//            Map<String, Object> reorderedData = new LinkedHashMap<>();
//            int index = 0;
//            for (Map.Entry<String, Object> entry : data.entrySet()) {
//                if (index == 6) {
//                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
//                }
//                reorderedData.put(entry.getKey(), entry.getValue());
//                index++;
//            }
//            if (!reorderedData.containsKey("AGING")) {
//                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
//            }
//            data.clear();
//            data.putAll(reorderedData);
//        });
        return result;
    }

    public List<Map<String, Object>> getPrintErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE", "RULE_START_DATE", "RULE_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(printDetail);
//        result.forEach(data -> {
//            formatDateColumns(data, dateColumns);
//        });
        return result;
    }

    // eInvoicing
    public List<Map<String, Object>> getEInvoicingSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(einvoicingSummary);
        String[] dateColumns = { "ASSIGNED_DATE", "TRANSACTION_DATE" };
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
            data.remove("ASSIGNED_BY");
            data.remove("AGING");
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getEInvoicingDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(einvoicingDetails);
        result.forEach(data -> {
            renameKey(data,"TRX_NUMBER", "TRANSACTION_ID");
        });
        return result;
    }

    public List<Map<String, Object>> getEInvoicingDetailsFiltered(String ouName, String periodName, String appName, String processFlow, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getEInvoicingDetailsFilter(einvoicingDetailsFiltered, ouName, periodName, appName, processFlow, transactionDate);
        result.forEach(data -> {
            renameKey(data,"TRX_NUMBER", "TRANSACTION_ID");
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
        return 1;
    }

    public List<Map<String, Object>> getFusionErrorSummary() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(fusionErrorSummary);
        result.forEach(data -> {
            data.remove("AGING");
            renameKey(data,"ENTITY_NAME", "ORG_NAME");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getFusionDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(fusionErrorDetails);
        result.forEach(data -> {
            renameKey(data,"ENTITY_NAME", "ORG_NAME");
        });
        return result;
    }

    public List<Map<String, Object>> getFusionDetailsFiltered(String ouName, String periodName, String appName, String processFlow, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getFusionDetailsFilter(fusionErrorDetailsFiltered, ouName, periodName, appName, processFlow,  transactionDate );
        result.forEach(data -> {
            renameKey(data,"ENTITY_NAME", "ORG_NAME");
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
        return 1;
    }

    public List<Map<String, Object>> getTransactionsProcessedSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(transactionsProcessedSummary);
        result.forEach(data -> {
            renameKey(data,"OPERATING_UNIT", "ORG_NAME");
        });
        return result;
    }

    public List<Map<String, Object>> getTransactionsProcessedDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(transactionsProcessedDetails);
        result.forEach(data -> {
            renameKey(data,"OPERATING_UNIT", "ORG_NAME");
        });
        return result;
    }

    public List<Map<String, Object>> getTransactionsProcessedDetailsFiltered(String ouName) {
        List<Map<String, Object>> result = jdbcManager.getTransactionsProcessedFiltered(transactionsProcessedDetailsFiltered, ouName);
        result.forEach(data -> {
            renameKey(data,"OPERATING_UNIT", "ORG_NAME");
        });
        return result;
    }

    // General Ledger
    public List<Map<String, Object>> getGlErrorSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(glErrorSummary);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            data.remove("AGING");
            formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getGlErrorDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(glErrorDetails);
        return result;
    }

    public List<Map<String, Object>> getGlDetailsFilter(String processFlow, String ledgerName, String applicationName,
                                                        String journalSource, String accountSeg, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getGlDetailsFilter(glPostingDetailsFiltered, processFlow, ledgerName, applicationName,
                journalSource, accountSeg, transactionDate);
        return result;
    }

    public int updateGlErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String ledgerName = updateData.get("ledgerName");
        String processFlow = updateData.get("processFlow");
        String applicationName = updateData.get("applicationName");
        String journalSource = updateData.get("journalSource");
        String accountSeg = updateData.get("accountSeg");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updateGlErrorsSummaryData(glPostingSummaryUpdate, assignedTo, assignedBy, comments,
                processFlow, ledgerName, applicationName, journalSource, accountSeg, transactionDate);
        return 1;
    }


    //SBP
    public List<Map<String, Object>> getSbpSummary() {
        return jdbcManager.queryForList(sbpSummary);
    }

    public List<Map<String, Object>> getSbpDetails() {
        return jdbcManager.queryForList(sbpDetails);
    }

    //Summaries
    public List<Map<String, Object>> getInvoiceToCashSummary() {
        return jdbcManager.queryForList(invoiceToCashSummary);
    }

    // Common methods
    public List<Map<String, Object>> getMonitoringPeriodStatus() {
        String[] dateColumns = { "END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(rolErrorsSummaryPeriodStatus);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getSummaryAssignmentUsers() {
        return jdbcManager.queryForList(summaryAssignmentUsers);
    }

    // Utility methods
    private void renameKey(Map<String, Object> data, String oldKey, String newKey) {
        List<Map.Entry<String, Object>> entries = new ArrayList<>(data.entrySet());
        data.clear();
        for (Map.Entry<String, Object> entry : entries) {
            if (entry.getKey().equals(oldKey)) {
                data.put(newKey, entry.getValue() != null ? entry.getValue().toString() : "");
            } else {
                data.put(entry.getKey(), entry.getValue());
            }
        }
    }

    private void formatDateColumns(Map<String, Object> data, String[] dateColumns) {
        for (String column : dateColumns) {
            Object value = data.get(column);
            if (value != null) {
                String date = value.toString().split(" ")[0];
                data.put(column, date);
            } else {
                data.put(column, "");
            }
        }
    }

    private void formatEmptyAmounts(Map<String, Object> data, String[] emptyAmountColumns) {
        for (String column : emptyAmountColumns) {
            Object value = data.get(column);
            if (value == null) {
                data.put(column, "-");
            }
        }
    }

    private String calculateAging(Object transactionDate) {
        if (transactionDate == null || !(transactionDate instanceof String)) {
            return "0";
        }
        try {
            String dateString = (String) transactionDate;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate creationDate = LocalDate.parse(dateString, formatter);
            ZonedDateTime today = ZonedDateTime.now(ZoneId.of("America/Los_Angeles"));
            long agingInDays = ChronoUnit.DAYS.between(creationDate, today.toLocalDate());
            return Long.toString(agingInDays);
        } catch (Exception e) {
            return "0";
        }
    }

}
