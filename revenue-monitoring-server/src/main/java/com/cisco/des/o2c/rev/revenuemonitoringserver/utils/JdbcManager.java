package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class JdbcManager {

    private final JdbcTemplate primaryJdbcTemplate;

    @Autowired
    public JdbcManager(@Qualifier("primaryJdbcTemplate") JdbcTemplate primaryJdbcTemplate) {
        this.primaryJdbcTemplate = primaryJdbcTemplate;
    }

    public List<Map<String, Object>> queryForList(String sql) {
        return primaryJdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> queryForO2CData(String sql) {
        return primaryJdbcTemplate.queryForList(sql);
    }

    // public List<Map<String, Object>> queryForO2CConnectorData(String sql, String
    // field, String value) {
    // Map<String, String> allowedFields = Map.of(
    // "SUBSCRIPTION_REF_ID", "SUBSCRIPTION_REF_ID",
    // "TRX_NUMBER", "TRX_NUMBER",
    // "WEBORDER_ID", "WEBORDER_ID");
    // if (field == null || !allowedFields.containsKey(field.toUpperCase())) {
    // throw new IllegalArgumentException("Invalid field name: " + field);
    // }
    // String validatedField = allowedFields.get(field.toUpperCase());

    // String query = sql + " WHERE " + validatedField + " = ?";
    // return primaryJdbcTemplate.queryForList(query, value);
    // }

    private static final Map<String, String> ALLOWED_FIELD_CLAUSES = Map.of(
            "SUBSCRIPTION_REF_ID", "SUBSCRIPTION_REF_ID = :value",
            "TRX_NUMBER", "TRX_NUMBER = :value",
            "WEBORDER_ID", "WEBORDER_ID = :value");

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(?i)(.*\\b(union|select|from|where|insert|delete|update|drop|execute|exec|alter|truncate|declare|create)\\b.*)");

    public List<Map<String, Object>> queryForO2CConnectorData(String sql, String field, String value) {
        if (!ALLOWED_FIELD_CLAUSES.containsKey(field)) {
            throw new IllegalArgumentException("Invalid field name");
        }

        // Validate base SQL for security
        validateBaseSql(sql);

        // Use validated field clause with named parameter
        String whereClause = ALLOWED_FIELD_CLAUSES.get(field);
        String additionalCondition = "";

        // Add latest_flag condition for SUBSCRIPTION_REF_ID
        if (field.equals("SUBSCRIPTION_REF_ID")) {
            additionalCondition = " AND latest_flag='Y'";
        }

        String query = sql + " WHERE " + whereClause + additionalCondition;
        System.out.println("Executing query with parameters: " + query);
        MapSqlParameterSource params = new MapSqlParameterSource("value", value);
        NamedParameterJdbcTemplate namedTemplate = new NamedParameterJdbcTemplate(primaryJdbcTemplate);
        namedTemplate.getJdbcTemplate().setQueryTimeout(30);
        return namedTemplate.queryForList(query, params);
    }

    private void validateBaseSql(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            throw new IllegalArgumentException("SQL statement cannot be empty");
        }

        String normalizedSql = sql.trim().toUpperCase();
        if (!normalizedSql.startsWith("SELECT ") ||
                normalizedSql.contains(" WHERE ") ||
                normalizedSql.contains(";") ||
                containsSqlInjectionPatterns(normalizedSql)) {
            throw new IllegalArgumentException("Invalid SQL statement");
        }
    }

    private boolean containsSqlInjectionPatterns(String sql) {
        return sql.contains(";") ||
                sql.contains("--") ||
                sql.contains("/*") ||
                SQL_INJECTION_PATTERN.matcher(sql).matches();
    }

    public List<Map<String, Object>> callFinancialSummaryView(String sql, String field, String value) {
        String condition = " WHERE 1=1 and ";
        String query = sql + condition + field + "=?";
        return primaryJdbcTemplate.queryForList(query, value);
    }

    public void callFinancialSummaryPkgProc(String pkgProc, String subscription, String webOrderId, String invoiceId) {
        primaryJdbcTemplate.update(pkgProc, subscription, webOrderId, invoiceId);
    }

    public void callTsvPkgProc(String pkgProc, String subscription, String uniqueId) {
        primaryJdbcTemplate.update(pkgProc, subscription, null, uniqueId);
    }

    public List<Map<String, Object>> tsvTopSku(String sql, String subscription, String uniqueId) {
        return primaryJdbcTemplate.queryForList(sql, subscription, uniqueId);
    }

    public List<Map<String, Object>> tsvSubSku(String sql, String subscription, String uniqueId) {
        return primaryJdbcTemplate.queryForList(sql, subscription, uniqueId);
    }

    public List<Map<String, Object>> tsvAccounts(String sql, String subscription, String uniqueId) {
        return primaryJdbcTemplate.queryForList(sql, subscription, uniqueId);
    }

    public List<Map<String, Object>> o2cInvoiceSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public List<Map<String, Object>> o2cSubscriptionSummary(String sql, String value, String code) {
        return primaryJdbcTemplate.queryForList(sql, value, code);
    }

    public List<Map<String, Object>> o2cOrderSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public List<Map<String, Object>> o2cInvoiceLineSummary(String sql, String value) {
        return primaryJdbcTemplate.queryForList(sql, value);
    }

    public List<Map<String, Object>> o2cSubscriptionLineSummary(String sql, String value, String code) {
        return primaryJdbcTemplate.queryForList(sql, value, code);
    }

    public List<Map<String, Object>> sbpBillScheduleHeader(String sql, String value) {
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
        System.out.println(sql);
        System.out.println(periodName);
        System.out.println(processFlow);
        System.out.println(ouName);
        System.out.println(srtDate);
        System.out.println(primaryJdbcTemplate.queryForList(sql, periodName, processFlow, ouName, srtDate));
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

    public List<Map<String, Object>> getO2CBillSchedules(String sql, String offsetId) {
        return primaryJdbcTemplate.queryForList(sql, offsetId);
    }

    public List<Map<String, Object>> getO2CBillScheduleList(String sql, String offsetId, String billDate) {
        return primaryJdbcTemplate.queryForList(sql, offsetId, billDate);
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

    public List<Map<String, Object>> getProcessFlowTotal(String sql, String compName) {
        return primaryJdbcTemplate.queryForList(sql, compName);
    }

    public List<Map<String, Object>> filterI2cControls(String sql, String periodName, String appName,
            String operatingUnit, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, operatingUnit, transactionDate);
    }

    public List<Map<String, Object>> filterRevControls(String sql, String periodName, String appName,
            String operatingUnit, String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, periodName, appName, operatingUnit, transactionDate);
    }

    public List<Map<String, Object>> filterGtcControls(String sql, String processFlow, String entityName,
            String transactionDate) {
        return primaryJdbcTemplate.queryForList(sql, processFlow, entityName, transactionDate);
    }

    public int espCaseAnalyzerTableUpdate(String sql, String username, String category, String categoryActual,
            String comments, String coreIssue, String coreIssueActual, String incidentNumber,
            String impactedServiceOffering) {
        return primaryJdbcTemplate.update(sql, username, categoryActual, coreIssueActual, comments, category,
                categoryActual, coreIssue, coreIssueActual, category, categoryActual, categoryActual, coreIssue,
                coreIssueActual, coreIssueActual, incidentNumber, impactedServiceOffering);
    }

    /**
     * Inserts a new user role into the database.
     * 
     * @param sql         The INSERT SQL statement with placeholders (?)
     * @param userName    The user's username (e.g., "JSMITH")
     * @param userEmail   The user's email address
     * @param roleId      The role ID from the roles table
     * @param userRole    The role name (e.g., "Admin", "Viewer")
     * @param enabledFlag 'Y' for enabled, 'N' for disabled
     * @return Number of rows inserted (should be 1 on success)
     */
    public int insertUserRole(String sql, String userName, String userEmail,
            Integer roleId, String userRole, String enabledFlag) {
        return primaryJdbcTemplate.update(sql, userName, userEmail, roleId, userRole, enabledFlag);
    }

    /**
     * Updates an existing user role in the database using composite key.
     * 
     * IMPORTANT: This updates based on USER_NAME + USER_ROLE composite key.
     * This ensures only the specific role for a specific user is updated,
     * not all roles for that user.
     * 
     * Query: UPDATE ... SET USER_EMAIL=?, ROLE_ID=?, ENABLED_FLAG=? WHERE
     * USER_NAME=? AND USER_ROLE=?
     * 
     * @param sql         The UPDATE SQL statement with placeholders (?)
     * @param userEmail   The user's email address
     * @param roleId      The role ID
     * @param enabledFlag 'Y' for enabled, 'N' for disabled
     * @param userName    The user's username (WHERE clause)
     * @param userRole    The role name (WHERE clause)
     * @return Number of rows updated (should be 1 on success, 0 if not found)
     */
    public int updateUserRole(String sql, String userEmail, Integer roleId,
            String enabledFlag, String userName, String userRole) {
        return primaryJdbcTemplate.update(sql, userEmail, roleId, enabledFlag, userName, userRole);
    }

    /**
     * Soft deletes a user role with forensic tracking.
     * 
     * SOFT DELETE: Does NOT remove the row from database.
     * Instead, it:
     * 1. Sets USER_EMAIL to "deleted by: {deleterUsername}"
     * 2. Sets ENABLED_FLAG to NULL
     * 
     * This maintains forensic record while hiding the row from normal queries.
     * GET queries filter WHERE ENABLED_FLAG IS NOT NULL to exclude deleted rows.
     * 
     * Query: UPDATE ... SET USER_EMAIL=?, ENABLED_FLAG=NULL WHERE USER_NAME=? AND
     * USER_ROLE=? AND CREATION_DATE=?
     * Uses userName + userRole + creationDate for precise row targeting to prevent
     * accidental deletions.
     * 
     * IMPORTANT: creationDate is passed as raw string from database to ensure exact
     * match.
     * Database has inconsistent formats: "2024-02-23" vs "2024-03-21 09:11:15"
     * JDBC PreparedStatement will handle the string-to-date conversion
     * automatically.
     * 
     * @param sql           The soft delete SQL statement
     * @param forensicEmail Forensic string "deleted by: username"
     * @param userName      The user's username (WHERE clause)
     * @param userRole      The role name (WHERE clause)
     * @param creationDate  Raw creation date string from database (exact format
     *                      match)
     * @return Number of rows soft-deleted (1 = success, 0 = not found)
     */
    public int deleteUserRole(String sql, String forensicEmail, String userName, String userRole,
            String creationDate) {
        return primaryJdbcTemplate.update(sql, forensicEmail, userName, userRole, creationDate);
    }
}
