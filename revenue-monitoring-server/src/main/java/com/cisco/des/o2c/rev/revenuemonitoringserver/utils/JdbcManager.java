package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
public class JdbcManager {

    private final JdbcTemplate primaryJdbcTemplate;

    @Autowired
    public JdbcManager(@Qualifier("primaryJdbcTemplate") JdbcTemplate primaryJdbcTemplate) {
        this.primaryJdbcTemplate = primaryJdbcTemplate;
    }

    // unknown function
    public List<Map<String, Object>> queryForListStageWithParams(String sql, String periodName, String appName,
            String operatingUnit, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, operatingUnit, transactionDate);
    }

    public List<Map<String, Object>> queryForList(String sql) {
        return primaryJdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> queryForO2CData(String sql) {
        return primaryJdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> queryForO2CConnectorData(String sql, String field, String value) {
        // Only allow specific, known-safe fields
        List<String> allowedFields = Arrays.asList("SUBSCRIPTION_REF_ID", "TRX_NUMBER", "WEBORDER_ID");
        if (!allowedFields.contains(field)) {
            throw new IllegalArgumentException("Invalid field name");
        }
        String query = sql + "WHERE " + field + " = ?";
        System.out.println(query);
        return primaryJdbcTemplate.queryForList(query, value);
    }

    public List<Map<String, Object>> o2cInvoiceSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public List<Map<String, Object>> o2cSubscriptionSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public List<Map<String, Object>> o2cOrderSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public List<Map<String, Object>> o2cInvoiceLineSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public List<Map<String, Object>> o2cSubscriptionLineSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public int updateComments(String sql, String closeType, String comments) {
        return primaryJdbcTemplate.update(sql, closeType, comments);
    }

    public int updateOrderStatus(String sql, String progName, String account, int dealId, String username) {
        return primaryJdbcTemplate.update(sql, progName, account, dealId, username);
    }

    public int updateInvoiceEligibleDate(String sql, Date invoiceElgibileDate, int dealId, String salesOrder) {
        return primaryJdbcTemplate.update(sql, invoiceElgibileDate, dealId, salesOrder);
    }

    public List<Map<String, Object>> queryForListWithParamsAutoInvoice(String sql, String appName, String operatingUnit,
            String periodName, String uniqueId) {
        return primaryJdbcTemplate.queryForList(sql, appName, operatingUnit, periodName, uniqueId);
    }

    public List<Map<String, Object>> queryForListWithParamsPreInvoice(String sql, String appName, String operatingUnit,
            String periodName, String processFlow, String uniqueId) {
        return primaryJdbcTemplate.queryForList(sql, appName, operatingUnit, periodName, processFlow, uniqueId);
    }

    public List<Map<String, Object>> queryForListWithParamsAccruals(String sql, String periodName, String ouName,
            String processFlow, int sequenceNum) {
        return primaryJdbcTemplate.queryForList(sql, periodName, ouName, processFlow, sequenceNum);
    }

    public int deleteSelectedDeals(String sql, String username, int dealId, String salesOrder, String salesOrder2) {
        return primaryJdbcTemplate.update(sql, username, dealId, salesOrder, salesOrder2);
    }

    public int updateCLoData(String sql, String progName, String account, int dealId, String salesOrder,
            Timestamp invoiceDate, String cloComments, String updatedBy) {
        return primaryJdbcTemplate.update(sql, cloComments, updatedBy, invoiceDate, dealId, salesOrder, salesOrder,
                progName,
                account);
    }

    public int updateCloComments(String sql, String progName, String account, int dealId, String salesOrder,
            String cloComments, String updatedBy) {
        return primaryJdbcTemplate.update(sql, cloComments, updatedBy, dealId, salesOrder, salesOrder, progName,
                account);
    }

    public int updateInvoiceDate(String sql, String progName, String account, int dealId, String salesOrder,
            Timestamp invoiceDate, String updatedBy) {
        return primaryJdbcTemplate.update(sql, invoiceDate, updatedBy, dealId, salesOrder, salesOrder, progName,
                account);
    }

    public int updateRolErrorsSummaryData(String sql, String assignedTo, String comments, String assignedBy,
            String periodName, String appName, String subApp, String orgName) {
        return primaryJdbcTemplate.update(sql, assignedTo, comments, assignedBy, periodName, appName, subApp, orgName);
    }

    public int updateAutoInvoiceErrorsSummaryData(String sql, String assignedTo, String assignedBy, String comments,
            String ouName, String processFlow, String periodName, String batchSourceName, String creationDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, ouName, processFlow, periodName,
                batchSourceName, creationDate);
    }

    public int updatePreInvoiceErrorsSummaryData(String sql, String assignedTo, String assignedBy, String comments,
            String ouName, String creationDate, String processFlow) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, ouName, creationDate, processFlow);
    }

    public int updateAccrualsErrorsSummaryData(String sql, String assignedTo, String comments, String assignedBy,
            int sequenceNum) {
        return primaryJdbcTemplate.update(sql, assignedTo, comments, assignedBy, sequenceNum);
    }

    public List<Map<String, Object>> getRolTransactionDataFilter(String sql, String periodName, String ouName,
            String applicationName, int uniqueId) {
        return primaryJdbcTemplate.queryForList(sql, periodName, ouName, applicationName, uniqueId);
    }

    public List<Map<String, Object>> getGlDetailsFilter(String sql, String periodName, String applicationName,
            String processFlow, String ledgerName,
            String accountSeg, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, applicationName, processFlow, ledgerName, accountSeg,
                transactionDate);
    }

    public int updateGlErrorsSummaryData(String sql, String assignedTo, String assignedBy, String comments,
            String processFlow, String ledgerName, String applicationName, String journalSource, String glbatch,
            String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, processFlow, ledgerName,
                applicationName,
                journalSource, glbatch, transactionDate);
    }

    public List<Map<String, Object>> getEInvoicingDetailsFilter(String sql, String ouName, String periodName,
            String appName, String processFlow, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, ouName, periodName, appName, processFlow, transactionDate);
    }

    public int updateEInvoicingSummary(String sql, String assignedTo, String assignedBy, String comments,
            String periodName, String appName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, appName, processFlow,
                ouName,
                transactionDate);
    }

    public List<Map<String, Object>> getFusionDetailsFilter(String sql, String ouName, String periodName,
            String appName, String processFlow, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, processFlow, ouName, transactionDate);
    }

    public int updateFusionErrorSummary(String sql, String assignedTo, String assignedBy, String comments,
            String periodName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, processFlow, ouName,
                transactionDate);
    }

    public List<Map<String, Object>> getTransactionsProcessedFiltered(String sql, String ouName) {
        return primaryJdbcTemplate.queryForList(sql, ouName);
    }

    public List<Map<String, Object>> getTspAccountDetailViewFiltered(String sql, String sequenceNumber) {
        return primaryJdbcTemplate.queryForList(sql, sequenceNumber);
    }

    public int updateTspAccountSummary(String sql, String assignedTo, String assignedBy, String comments,
            String sequenceNumber) {
        return primaryJdbcTemplate.update(sql, assignedTo, comments, assignedBy, sequenceNumber);
    }

    public List<Map<String, Object>> getCMAmortDetailsFiltered(String sql, String periodName,
            String appName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, processFlow, ouName, transactionDate);
    }

    public List<Map<String, Object>> getPrintDetailsFiltered(String sql, String periodName,
            String appName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, processFlow, ouName, transactionDate);
    }

    public List<Map<String, Object>> getCreditCardDetailsFiltered(String sql, String periodName,
                                                             String appName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, processFlow, ouName, transactionDate);
    }

    public List<Map<String, Object>> getRPOExtractDetailsFiltered(String sql, String periodName,
            String appName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, processFlow, ouName, transactionDate);
    }

    public int updateRPOExtractSummary(String sql, String assignedTo, String assignedBy, String comments,
            String periodName,
            String orgName, String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, orgName, transactionDate);
    }

    public List<Map<String, Object>> getSRTProcessDetailsFiltered(String sql, String periodName,
            String processFlow, String ouName, String srtDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, processFlow, ouName, srtDate);
    }

    public int updateSRTProcessSummary(String sql, String assignedTo, String assignedBy, String comments,
            String periodName,
            String entityName, String srtDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, entityName, srtDate);
    }

    public int updateCMAmortSummary(String sql, String assignedTo, String assignedBy, String comments,
            String periodName,
            String processFlow, String orgName, String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, processFlow, orgName,
                transactionDate);
    }

    public int updatePrintSummary(String sql, String assignedTo, String assignedBy, String comments, String periodName,
            String orgName, String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, orgName, transactionDate);
    }

    public List<Map<String, Object>> getStandardRevenueDetailsFiltered(String sql, String periodName,
            String appName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, processFlow, ouName, transactionDate);
    }

    public int updateStandardRevenueSummary(String sql, String assignedTo, String assignedBy, String comments,
            String periodName,
            String processFlow, String orgName, String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, processFlow, orgName,
                transactionDate);
    }

    public int approveRejectIssueReport(String sql, String approval, String approvedBy, String incidentNum) {
        return primaryJdbcTemplate.update(sql, approval, approvedBy, incidentNum);
    }

    public int updateCommentsIssueReport(String sql, String comments, String approvedBy, String incidentNum) {
        return primaryJdbcTemplate.update(sql, comments, approvedBy, incidentNum);
    }

    public int updateFixDetailsIssueReport(String sql, String fixDetails, String approvedBy, String incidentNum) {
        return primaryJdbcTemplate.update(sql, fixDetails, approvedBy, incidentNum);
    }

    public int updateStatusIssueReport(String sql, String status, String approvedBy, String incidentNum) {
        return primaryJdbcTemplate.update(sql, status, approvedBy, incidentNum);
    }

    public int updateIssueDescIssueReport(String sql, String issue, String rootCause, String businessImpact,
            String approvedBy, String incidentNum) {
        return primaryJdbcTemplate.update(sql, issue, rootCause, businessImpact, approvedBy, incidentNum);
    }

    public int insertIssueReport(String sql, String track,
            String issueDescription,
            String rootCause,
            String businessImpact,
            String fixDetails,
            String incidentNumber,
            String issueStarted,
            String issueReportedOn,
            String issueReportedBy,
            String quarter,
            String periodName,
            String priority,
            String codeFix,
            String pdfRequired,
            String businessApproval,
            String itApproval,
            String approvalComments,
            String periodCloseImpacting,
            String issueStatus,
            String eocIncident,
            String username) {
        return primaryJdbcTemplate.update(sql, track, issueDescription, rootCause, businessImpact, fixDetails,
                incidentNumber, issueStarted, issueReportedOn, issueReportedBy,
                quarter, periodName, priority, codeFix, pdfRequired,
                businessApproval, itApproval, approvalComments,
                periodCloseImpacting, issueStatus, eocIncident, username);

    }

    public List<Map<String, Object>> getCreditCardCheckDetailsFiltered(String sql, String periodName,
            String orgName, String holdApplyDate, String processFlow) {
        return primaryJdbcTemplate.queryForList(sql, periodName, orgName, holdApplyDate, processFlow);
    }

    public int updateCreditCardCheckSummary(String sql, String assignedTo, String assignedBy, String comments,
            String entityName, String holdApplyDate, String flooringBid) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, entityName, holdApplyDate,
                flooringBid);
    }

    public List<Map<String, Object>> getPCMApplicationDetailsFiltered(String sql, String periodName,
                                                                       String appName, String processFlow, String ouName, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, appName, ouName, periodName, processFlow, transactionDate);
    }

    public int updatePCMApplicationSummary(String sql, String assignedTo, String assignedBy, String comments,
                                            String periodName, String batchSource, String processFlow, String entityName, String transactionDate) {
        return primaryJdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, batchSource,
                processFlow, entityName, transactionDate);
    }
}
