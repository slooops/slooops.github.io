package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
public class JdbcManager {

    private JdbcTemplate jdbcTemplate;

    @Autowired
    public JdbcManager(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> queryForList(String sql) {
            return jdbcTemplate.queryForList(sql);
    }

    public int updateComments(String sql, String closeType, String comments) {
        return jdbcTemplate.update(sql, closeType, comments);
    }

    public int updateOrderStatus(String sql, String progName, String account, int dealId, String username){
        return jdbcTemplate.update(sql, progName, account, dealId, username);
    }

    public int updateInvoiceEligibleDate(String sql, Date invoiceElgibileDate, int dealId, String salesOrder){
        return jdbcTemplate.update(sql, invoiceElgibileDate, dealId, salesOrder);
    }

    public List<Map<String, Object>> queryForListWithParamsAutoInvoice(String sql, String appName, String operatingUnit, String periodName, String uniqueId){
        return jdbcTemplate.queryForList(sql, appName, operatingUnit, periodName, uniqueId);
    }

    public List<Map<String, Object>> queryForListWithParamsAccruals(String sql, String periodName, String ouName, String processFlow, int sequenceNum){
        return jdbcTemplate.queryForList(sql, periodName, ouName, processFlow, sequenceNum);
    }

    public int deleteSelectedDeals(String sql, String username, int dealId, String salesOrder, String salesOrder2){
        return jdbcTemplate.update(sql, username, dealId, salesOrder, salesOrder2);
    }

    public int updateCLoData(String sql, String progName, String account, int dealId, String salesOrder, Timestamp invoiceDate, String cloComments, String updatedBy){
        return jdbcTemplate.update(sql, cloComments, updatedBy, invoiceDate, dealId, salesOrder, salesOrder, progName, account);
    }

    public int updateCloComments(String sql, String progName, String account, int dealId, String salesOrder, String cloComments, String updatedBy){
        return jdbcTemplate.update(sql, cloComments, updatedBy, dealId, salesOrder, salesOrder, progName, account);
    }

    public int updateInvoiceDate(String sql, String progName, String account, int dealId, String salesOrder, Timestamp invoiceDate, String updatedBy){
        return jdbcTemplate.update(sql, invoiceDate, updatedBy, dealId, salesOrder, salesOrder, progName, account);
    }

    public int updateRolErrorsSummaryData(String sql, String assignedTo, String comments, String assignedBy, String periodName, String appName, String subApp, String orgName){
        return jdbcTemplate.update(sql, assignedTo, comments, assignedBy, periodName, appName, subApp, orgName);
    }

    public int updateAutoInvoiceErrorsSummaryData(String sql, String assignedTo, String assignedBy, String comments, String ouName, String processFlow, String periodName, String batchSourceName, String creationDate){
        return jdbcTemplate.update(sql, assignedTo, assignedBy, comments, ouName, processFlow, periodName, batchSourceName, creationDate);
    }

    public int updatePreInvoiceErrorsSummaryData(String sql, String assignedTo, String assignedBy, String comments, String ouName, String creationDate, String processFlow){
        return jdbcTemplate.update(sql, assignedTo, assignedBy, comments, ouName, creationDate, processFlow);
    }

    public int updateAccrualsErrorsSummaryData(String sql, String assignedTo, String comments, String assignedBy, int sequenceNum){
        return jdbcTemplate.update(sql, assignedTo, comments, assignedBy, sequenceNum);
    }

    public List<Map<String, Object>> getRolTransactionDataFilter(String sql, String periodName, String ouName, String applicationName, int uniqueId) {
        return jdbcTemplate.queryForList(sql, periodName, ouName, applicationName, uniqueId);
    }

    public List<Map<String, Object>> getGlDetailsFilter(String sql, String processFlow, String ledgerName, String applicationName, String journalSource, String accountSeg, String transactionDate) {
        return jdbcTemplate.queryForList(sql, processFlow, ledgerName, applicationName, journalSource, accountSeg, transactionDate);
    }

    public int updateGlErrorsSummaryData(String sql, String assignedTo, String assignedBy,String comments, String processFlow, String ledgerName, String applicationName, String journalSource, String accountSeg, String transactionDate){
        return jdbcTemplate.update(sql, assignedTo, assignedBy, comments , processFlow, ledgerName, applicationName, journalSource, accountSeg, transactionDate );
    }

    public List<Map<String, Object>> getEInvoicingDetailsFilter(String sql, String ouName, String periodName, String appName, String processFlow, String transactionDate) { 
        return jdbcTemplate.queryForList(sql, ouName, periodName, appName, processFlow, transactionDate);
    }

    public int updateEInvoicingSummary(String sql, String assignedTo, String assignedBy, String comments, String periodName, String appName, String processFlow, String ouName, String transactionDate) {
        return jdbcTemplate.update(sql, assignedTo, assignedBy, comments, periodName, appName, processFlow, ouName, transactionDate );
    }

}
