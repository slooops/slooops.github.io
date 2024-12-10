package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    @Autowired
    public ExceptionMonitoringService(JdbcManager jdbcManager, String accrualsDetailsFiltered, String accrualsSummaryUpdate, String glErrorSummary,
                                      String glErrorDetails, String glPostingDetailsFiltered, String glPostingSummaryUpdate,
                                      String einvoicingSummary, String einvoicingDetails, String autoInvoiceErrorSummaryView,
                                      String autoInvoiceErrorDetails, String preInvoiceErrorSummaryView, String preInvoiceErrorDetails,
                                      String autoInvoiceErrorDetailsFiltered, String preInvoiceErrorDetailsFiltered, String autoInvoiceErrorsSummaryUpdate,
                                      String summaryAssignmentUsers, String preInvoiceErrorsSummaryUpdate, String accrualsSummary, String accrualsDetails,
                                      String invoiceToCashSummary,  String rolErrorsSummaryUpdate, String rolErrorsSummaryPeriodStatus, String rolChartTotals,
                                      String rolChartDetails, String rolTransactionDataFilter, String rolTransactionData, String rolErrorsSummary, String sbpSummary,
                                      String sbpDetails, String einvoicingDetailsFiltered, String eInvoicingSummaryUpdate, String tspAccountSummaryView, String tspAccountDetailView
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

    public List<Map<String, Object>> getSummaryAssignmentUsers() {
        return jdbcManager.queryForList(summaryAssignmentUsers);
    }

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

    public List<Map<String, Object>> getMonitoringPeriodStatus() {
        String[] dateColumns = { "END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(rolErrorsSummaryPeriodStatus);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getAutoInvoiceErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(autoInvoiceErrorSummaryView);
        result.forEach(data -> {
            renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            renameKey(data, "AMOUNT_USD", "AMOUNT");
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getPreInvoiceErrorSummaryView() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(preInvoiceErrorSummaryView);
        result.forEach(data -> {
            renameKey(data, "ERROR_AMOUNT", "AMOUNT");
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

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

    public List<Map<String, Object>> getAutoInvoiceErrorDetails() {
        String[] dateColumns = { "TRANSACTION_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(autoInvoiceErrorDetails);
        result.forEach(data -> {
            renameKey(data, "OPERATING_UNIT", "ORG_NAME");
            formatDateColumns(data, dateColumns);
            data.remove("TRANSACTION_DATE");
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
            data.remove("TRANSACTION_DATE");
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
            renameKey(data, "ORDERNUMBER_CUSTTRXID", "TRANSACTION_ID");
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

    public List<Map<String, Object>> getSbpSummary() {
        return jdbcManager.queryForList(sbpSummary);
    }

    public List<Map<String, Object>> getSbpDetails() {
        return jdbcManager.queryForList(sbpDetails);
    }

    public List<Map<String, Object>> getRolChartTotals() {
        return jdbcManager.queryForList(rolChartTotals);
    }

    public List<Map<String, Object>> getRolChartDetails() {
        return jdbcManager.queryForList(rolChartDetails);
    }


    public List<Map<String, Object>> getAccrualsSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(accrualsSummary);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
            renameKey(data, "SEQUENCE_NUMBER", "SEQUENCE_NUM");
            data.remove("ASSIGNED_BY");
        });
        return result;
    }

    public List<Map<String, Object>> getAccrualsDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(accrualsDetails);
        result.forEach(data -> {
            data.remove("CREATION_DATE");
            data.remove("SEQUENCE_NUMBER");
        });
        return result;
    }

    public List<Map<String, Object>> getAccrualsDetailsFiltered(String periodName, String ouName, String processFlow,
                                                                String sequenceNum) {
        return jdbcManager.queryForListWithParamsAccruals(accrualsDetailsFiltered, periodName, ouName, processFlow,
                Integer.parseInt(sequenceNum));
    }

    public List<Map<String, Object>> getInvoiceToCashSummary() {
        return jdbcManager.queryForList(invoiceToCashSummary);
    }

    public List<Map<String, Object>> getGlErrorSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(glErrorSummary);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGlErrorDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(glErrorDetails);
        result.forEach(data -> {
            data.remove("TRANSACTION_DATE");
        });
        return result;
    }

    public List<Map<String, Object>> getGlDetailsFilter(String processFlow, String ledgerName, String applicationName,
                                                        String journalSource, String accountSeg, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getGlDetailsFilter(glPostingDetailsFiltered, processFlow, ledgerName, applicationName,
                journalSource, accountSeg, transactionDate);
        result.forEach(data -> {
            data.remove("TRANSACTION_DATE");
            data.remove("ACCOUNT");
        });
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

    public List<Map<String, Object>> getEInvoicingSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(einvoicingSummary);
        String[] dateColumns = { "ASSIGNED_DATE", "TRANSACTION_DATE" };
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
            data.remove("ASSIGNED_BY");
        });
        return result;
    }

    public List<Map<String, Object>> getEInvoicingDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(einvoicingDetails);
        result.forEach(data -> {
            renameKey(data,"TRX_NUMBER", "TRANSACTION_ID");
            data.remove("TRANSACTION_DATE");
        });
        return result;
    }

    public List<Map<String, Object>> getEInvoicingDetailsFiltered(String ouName, String periodName, String appName, String processFlow, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getEInvoicingDetailsFilter(einvoicingDetailsFiltered, ouName, periodName, appName, processFlow, transactionDate);
        result.forEach(data -> {
            renameKey(data,"TRX_NUMBER", "TRANSACTION_ID");
            data.remove("TRANSACTION_DATE");
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

    public List<Map<String, Object>> getTspAccountSummaryView() {
        return jdbcManager.queryForList(tspAccountSummaryView);
    }

    public List<Map<String, Object>> getTspAccountDetailView() {
        return jdbcManager.queryForList(tspAccountDetailView);
    }
}
