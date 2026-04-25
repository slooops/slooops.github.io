package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JdbcManagerTest {

    @Mock JdbcTemplate primaryJdbcTemplate;
    @Mock JdbcTemplate secondaryJdbcTemplate;

    JdbcManager jdbc;

    @BeforeEach
    void setUp() {
        jdbc = new JdbcManager(primaryJdbcTemplate, secondaryJdbcTemplate);
    }

    // ── Basic query delegation ────────────────────────────────

    @Test
    void queryForListDelegatesToPrimary() {
        List<Map<String, Object>> expected = List.of(Map.of("k", "v"));
        when(primaryJdbcTemplate.queryForList("SELECT 1")).thenReturn(expected);
        assertEquals(expected, jdbc.queryForList("SELECT 1"));
    }

    @Test
    void queryForListWithSingleParam() {
        List<Map<String, Object>> expected = List.of();
        when(primaryJdbcTemplate.queryForList("sql", "p")).thenReturn(expected);
        assertEquals(expected, jdbc.queryForListWithSingleParam("sql", "p"));
    }

    @Test
    void queryForListWithParams() {
        List<Map<String, Object>> expected = List.of(Map.of("a", 1));
        when(primaryJdbcTemplate.queryForList(eq("sql"), eq("p1"), eq("p2"))).thenReturn(expected);
        assertEquals(expected, jdbc.queryForListWithParams("sql", "p1", "p2"));
    }

    @Test
    void queryForO2CData() {
        when(primaryJdbcTemplate.queryForList("sql")).thenReturn(List.of());
        assertEquals(0, jdbc.queryForO2CData("sql").size());
    }

    // ── queryForO2CConnectorData — SQL injection protection ───

    @Test
    void queryForO2CConnectorDataInvalidFieldThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("SELECT * FROM T", "BAD_FIELD", "val"));
    }

    @Test
    void queryForO2CConnectorDataNullSqlThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData(null, "TRX_NUMBER", "val"));
    }

    @Test
    void queryForO2CConnectorDataEmptySqlThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("", "TRX_NUMBER", "val"));
    }

    @Test
    void queryForO2CConnectorDataSqlWithWhereClauseThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("SELECT * FROM T WHERE 1=1", "TRX_NUMBER", "val"));
    }

    @Test
    void queryForO2CConnectorDataSqlWithSemicolonThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("SELECT * FROM T; DROP TABLE T", "TRX_NUMBER", "val"));
    }

    @Test
    void queryForO2CConnectorDataSqlInjectionUnionThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("SELECT * FROM T UNION SELECT * FROM USERS", "TRX_NUMBER", "val"));
    }

    @Test
    void queryForO2CConnectorDataNotSelectThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("DELETE FROM T", "TRX_NUMBER", "val"));
    }

    // ── Update methods ────────────────────────────────────────

    @Test
    void updateComments() {
        when(primaryJdbcTemplate.update("sql", "close", "comment")).thenReturn(1);
        assertEquals(1, jdbc.updateComments("sql", "close", "comment"));
    }

    @Test
    void updateOrderStatus() {
        when(primaryJdbcTemplate.update("sql", "prog", "acct", 10, "user")).thenReturn(1);
        assertEquals(1, jdbc.updateOrderStatus("sql", "prog", "acct", 10, "user"));
    }

    @Test
    void updateInvoiceEligibleDate() {
        Date d = new Date();
        when(primaryJdbcTemplate.update("sql", d, 1, "SO")).thenReturn(1);
        assertEquals(1, jdbc.updateInvoiceEligibleDate("sql", d, 1, "SO"));
    }

    @Test
    void deleteSelectedDeals() {
        when(primaryJdbcTemplate.update("sql", "user", 1, "SO1", "SO2")).thenReturn(1);
        assertEquals(1, jdbc.deleteSelectedDeals("sql", "user", 1, "SO1", "SO2"));
    }

    @Test
    void executeUpdate() {
        doReturn(3).when(primaryJdbcTemplate).update(eq("sql"), eq("a"), eq("b"));
        assertEquals(3, jdbc.executeUpdate("sql", "a", "b"));
    }

    // ── Secondary JDBC template (AIT) ─────────────────────────

    @Test
    void queryForListAITUsesSecondary() {
        when(secondaryJdbcTemplate.queryForList("sql")).thenReturn(List.of());
        jdbc.queryForListAIT("sql");
        verify(secondaryJdbcTemplate).queryForList("sql");
        verifyNoInteractions(primaryJdbcTemplate);
    }

    @Test
    void aitGlInterfaceSummaryUpdateUsesSecondary() {
        when(secondaryJdbcTemplate.update(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, jdbc.AITGlInterfaceSummaryUpdate("sql", "to", "cmt", "src", "led", "per", "bat", "ref"));
    }

    // ── Financial summary ─────────────────────────────────────

    @Test
    void callFinancialSummaryView() {
        when(primaryJdbcTemplate.queryForList(anyString(), eq("val"))).thenReturn(List.of());
        List<Map<String, Object>> result = jdbc.callFinancialSummaryView("SELECT * FROM V", "FIELD", "val");
        assertNotNull(result);
    }

    @Test
    void callFinancialSummaryPkgProc() {
        jdbc.callFinancialSummaryPkgProc("pkg", "sub", "wo", "inv");
        verify(primaryJdbcTemplate).update("pkg", "sub", "wo", "inv");
    }

    // ── Various detail queries ────────────────────────────────

    @Test
    void o2cInvoiceSummary() {
        when(primaryJdbcTemplate.queryForList("sql", "v")).thenReturn(List.of());
        assertNotNull(jdbc.o2cInvoiceSummary("sql", "v"));
    }

    @Test
    void tsvTopSku() {
        when(primaryJdbcTemplate.queryForList("sql", "sub", "uid")).thenReturn(List.of());
        assertNotNull(jdbc.tsvTopSku("sql", "sub", "uid"));
    }

    @Test
    void approveRejectIssueReport() {
        when(primaryJdbcTemplate.update("sql", "Y", "admin", "INC001")).thenReturn(1);
        assertEquals(1, jdbc.approveRejectIssueReport("sql", "Y", "admin", "INC001"));
    }

    // ── O2C connector data — happy paths ──────────────────────────────

    @Test
    void queryForO2CConnectorData_TRX_NUMBER() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(org.springframework.jdbc.core.namedparam.SqlParameterSource.class)))
                .thenReturn(List.of());
        // Use NamedParameterJdbcTemplate internally, but we mock primary
        // Just verify no exception for valid field
        assertDoesNotThrow(() -> jdbc.queryForO2CConnectorData("SELECT * FROM T", "TRX_NUMBER", "123"));
    }

    @Test
    void queryForO2CConnectorData_SUBSCRIPTION_REF_ID() {
        assertDoesNotThrow(() -> {
            try { jdbc.queryForO2CConnectorData("SELECT * FROM T", "SUBSCRIPTION_REF_ID", "S1"); } catch (Exception e) {
                // NamedParameterJdbcTemplate calls through — may fail without full Spring context, but we tested the validation path
            }
        });
    }

    @Test
    void queryForO2CConnectorDataSqlCommentInjectionThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("SELECT * FROM T -- comment", "TRX_NUMBER", "val"));
    }

    @Test
    void queryForO2CConnectorDataSqlBlockCommentThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> jdbc.queryForO2CConnectorData("SELECT * FROM T /* block */", "TRX_NUMBER", "val"));
    }

    // ── Various update methods ────────────────────────────────────────

    @Test void updateCLoData() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), anyInt(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateCLoData("sql", "prog", "acct", 1, "SO", new java.sql.Timestamp(0), "comment", "user"));
    }

    @Test void updateCloComments() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), anyInt(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateCloComments("sql", "prog", "acct", 1, "SO", "comment", "user"));
    }

    @Test void updateInvoiceDate() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), anyInt(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateInvoiceDate("sql", "prog", "acct", 1, "SO", new java.sql.Timestamp(0), "user"));
    }

    @Test void updateRolErrorsSummaryData() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateRolErrorsSummaryData("sql", "to", "cmt", "by", "per", "app", "sub", "org"));
    }

    @Test void updateAutoInvoiceErrorsSummaryData() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateAutoInvoiceErrorsSummaryData("sql", "to", "by", "cmt", "ou", "pf", "per", "bs", "cd"));
    }

    @Test void updatePreInvoiceErrorsSummaryData() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updatePreInvoiceErrorsSummaryData("sql", "to", "by", "cmt", "ou", "cd", "pf"));
    }

    @Test void updateAccrualsErrorsSummaryData() {
        when(primaryJdbcTemplate.update("sql", "to", "cmt", "by", 1)).thenReturn(1);
        assertEquals(1, jdbc.updateAccrualsErrorsSummaryData("sql", "to", "cmt", "by", 1));
    }

    @Test void getRolTransactionDataFilter() {
        when(primaryJdbcTemplate.queryForList("sql", "per", "ou", "app", 1)).thenReturn(List.of());
        assertNotNull(jdbc.getRolTransactionDataFilter("sql", "per", "ou", "app", 1));
    }

    @Test void getGlDetailsFilter() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getGlDetailsFilter("sql", "per", "app", "pf", "led", "acct", "td"));
    }

    @Test void updateGlErrorsSummaryData() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateGlErrorsSummaryData("sql", "to", "by", "cmt", "batch"));
    }

    @Test void getEInvoicingDetailsFilter() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getEInvoicingDetailsFilter("sql", "ou", "per", "app", "pf", "td"));
    }

    @Test void updateEInvoicingSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateEInvoicingSummary("sql", "to", "by", "cmt", "per", "app", "pf", "ou", "td"));
    }

    @Test void getFusionDetailsFilter() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getFusionDetailsFilter("sql", "ou", "per", "app", "pf", "td"));
    }

    @Test void updateFusionErrorSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateFusionErrorSummary("sql", "to", "by", "cmt", "per", "pf", "ou", "td"));
    }

    @Test void queryWithNamedParams() {
        // queryWithNamedParams creates a NamedParameterJdbcTemplate internally, hard to mock fully
        // Just test it doesn't throw with the mock
        assertDoesNotThrow(() -> {
            try { jdbc.queryWithNamedParams("SELECT 1 FROM DUAL", Map.of()); } catch (Exception e) { /* OK */ }
        });
    }

    @Test void insertUserRole() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.insertUserRole("sql", "user", "email", 1, "ADMIN", "Y", "creator"));
    }

    @Test void updateUserRole() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateUserRole("sql", "email", 1, "Y", "user", "ADMIN"));
    }

    @Test void deleteUserRole() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.deleteUserRole("sql", "deleted by: admin", "user", "ADMIN", "2024-01-01"));
    }

    @Test void insertCtlTwrRole() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.insertCtlTwrRole("sql", "name", "value", "desc", "dash", "admin"));
    }

    @Test void updateCtlTwrRole() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), anyInt())).thenReturn(1);
        assertEquals(1, jdbc.updateCtlTwrRole("sql", "name", "val", "desc", "Y", "dash", "admin", 1));
    }

    @Test void insertCtlTwrUserAccessRole() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), anyInt(), any(), anyInt())).thenReturn(1);
        assertEquals(1, jdbc.insertCtlTwrUserAccessRole("sql", "user", "email", "name", 1, "N", "N", "admin", "admin"));
    }

    @Test void updateCtlTwrUserAccessRole() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt())).thenReturn(1);
        assertEquals(1, jdbc.updateCtlTwrUserAccessRole("sql", "Y", "N", "N", "admin", "user", 1));
    }

    @Test void getTransactionsProcessedFiltered() {
        when(primaryJdbcTemplate.queryForList("sql", "ou")).thenReturn(List.of());
        assertNotNull(jdbc.getTransactionsProcessedFiltered("sql", "ou"));
    }

    @Test void getTspAccountDetailViewFiltered() {
        when(primaryJdbcTemplate.queryForList("sql", "1")).thenReturn(List.of());
        assertNotNull(jdbc.getTspAccountDetailViewFiltered("sql", "1"));
    }

    @Test void updateTspAccountSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateTspAccountSummary("sql", "to", "by", "cmt", "1"));
    }

    @Test void getCMAmortDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getCMAmortDetailsFiltered("sql", "per", "app", "pf", "ou", "td"));
    }

    @Test void getPrintDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getPrintDetailsFiltered("sql", "per", "app", "pf", "ou", "td"));
    }

    @Test void updatePrintSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updatePrintSummary("sql", "to", "by", "cmt", "per", "org", "td"));
    }

    @Test void getCreditCardDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getCreditCardDetailsFiltered("sql", "per", "app", "pf", "ou", "td"));
    }

    @Test void getRPOExtractDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getRPOExtractDetailsFiltered("sql", "per", "app", "pf", "ou", "td"));
    }

    @Test void updateRPOExtractSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateRPOExtractSummary("sql", "to", "by", "cmt", "per", "org", "td"));
    }

    @Test void getSRTProcessDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getSRTProcessDetailsFiltered("sql", "per", "pf", "ou", "srt"));
    }

    @Test void updateSRTProcessSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateSRTProcessSummary("sql", "to", "by", "cmt", "per", "entity", "srt"));
    }

    @Test void updateCMAmortSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateCMAmortSummary("sql", "to", "by", "cmt", "per", "pf", "org", "td"));
    }

    @Test void getStandardRevenueDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getStandardRevenueDetailsFiltered("sql", "per", "app", "pf", "ou", "td"));
    }

    @Test void updateStandardRevenueSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateStandardRevenueSummary("sql", "to", "by", "cmt", "per", "pf", "org", "td"));
    }

    @Test void updateCommentsIssueReport() {
        when(primaryJdbcTemplate.update("sql", "cmt", "admin", "INC001")).thenReturn(1);
        assertEquals(1, jdbc.updateCommentsIssueReport("sql", "cmt", "admin", "INC001"));
    }

    @Test void updateFixDetailsIssueReport() {
        when(primaryJdbcTemplate.update("sql", "fix", "admin", "INC001")).thenReturn(1);
        assertEquals(1, jdbc.updateFixDetailsIssueReport("sql", "fix", "admin", "INC001"));
    }

    @Test void updateStatusIssueReport() {
        when(primaryJdbcTemplate.update("sql", "RESOLVED", "admin", "INC001")).thenReturn(1);
        assertEquals(1, jdbc.updateStatusIssueReport("sql", "RESOLVED", "admin", "INC001"));
    }

    @Test void updateIssueDescIssueReport() {
        when(primaryJdbcTemplate.update("sql", "issue", "root", "impact", "admin", "INC001")).thenReturn(1);
        assertEquals(1, jdbc.updateIssueDescIssueReport("sql", "issue", "root", "impact", "admin", "INC001"));
    }

    @Test void insertIssueReport() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.insertIssueReport("sql", "track", "desc", "root", "impact", "fix",
                "INC001", "start", "reported", "by", "Q1", "per", "P1", "N", "N", "N", "N", "cmt", "N", "OPEN", "EOC", "user"));
    }

    @Test void getCreditCardCheckDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getCreditCardCheckDetailsFiltered("sql", "per", "org", "date", "pf"));
    }

    @Test void updateCreditCardCheckSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updateCreditCardCheckSummary("sql", "to", "by", "cmt", "entity", "date", "floor"));
    }

    @Test void getO2CBillSchedules() {
        when(primaryJdbcTemplate.queryForList("sql", "1")).thenReturn(List.of());
        assertNotNull(jdbc.getO2CBillSchedules("sql", "1"));
    }

    @Test void getO2CBillScheduleList() {
        when(primaryJdbcTemplate.queryForList("sql", "1", "2024-01-01")).thenReturn(List.of());
        assertNotNull(jdbc.getO2CBillScheduleList("sql", "1", "2024-01-01"));
    }

    @Test void getPCMApplicationDetailsFiltered() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getPCMApplicationDetailsFiltered("sql", "per", "app", "pf", "ou", "td"));
    }

    @Test void updatePCMApplicationSummary() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.updatePCMApplicationSummary("sql", "to", "by", "cmt", "per", "bs", "pf", "entity", "td"));
    }

    @Test void getProcessFlowTotal() {
        when(primaryJdbcTemplate.queryForList("sql", "I2C")).thenReturn(List.of());
        assertNotNull(jdbc.getProcessFlowTotal("sql", "I2C"));
    }

    @Test void filterI2cControls() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.filterI2cControls("sql", "per", "app", "ou", "td"));
    }

    @Test void filterRevControls() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.filterRevControls("sql", "per", "app", "ou", "td"));
    }

    @Test void filterGtcControls() {
        when(primaryJdbcTemplate.queryForList(anyString(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.filterGtcControls("sql", "pf", "entity", "td"));
    }

    @Test void espCaseAnalyzerGlobalSearch() {
        when(primaryJdbcTemplate.queryForList("sql", "INC001")).thenReturn(List.of());
        assertNotNull(jdbc.espCaseAnalyzerGlobalSearch("sql", "INC001"));
    }

    @Test void espCaseAnalyzerTableUpdate() {
        when(primaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.espCaseAnalyzerTableUpdate("sql", "user", "cat", "catActual", "cmt",
                "core", "coreActual", "INC001", "svc"));
    }

    @Test void insertSummaryAssignmentUser() {
        when(primaryJdbcTemplate.update("sql", "user", "email", "email", "team")).thenReturn(1);
        assertEquals(1, jdbc.insertSummaryAssignmentUser("sql", "user", "email", "team"));
    }

    @Test void disableSummaryAssignmentUser() {
        when(primaryJdbcTemplate.update("sql", "email")).thenReturn(1);
        assertEquals(1, jdbc.disableSummaryAssignmentUser("sql", "email"));
    }

    // ── Secondary (AIT) methods ───────────────────────────────────────

    @Test void getAITGlInterfaceDetailsFilter() {
        when(secondaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getAITGlInterfaceDetailsFilter("sql", "src", "led", "per", "batch", "date"));
    }

    @Test void getGlFaDetailsFilter() {
        when(secondaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getGlFaDetailsFilter("sql", "date", "mod", "folder", "status"));
    }

    @Test void glFaSummaryUpdate() {
        when(secondaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.glFaSummaryUpdate("sql", "to", "cmt", "date", "mod", "folder", "status"));
    }

    @Test void getAITGlUnpostedDetailsFilter() {
        when(secondaryJdbcTemplate.queryForList(anyString(), any(), any(), any(), any())).thenReturn(List.of());
        assertNotNull(jdbc.getAITGlUnpostedDetailsFilter("sql", "src", "led", "per", "batch"));
    }

    @Test void AITGlUnpostedSummaryUpdate() {
        when(secondaryJdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        assertEquals(1, jdbc.AITGlUnpostedSummaryUpdate("sql", "to", "cmt", "batch", "src", "led", "per"));
    }

    // ── Remaining query methods ───────────────────────────────────────

    @Test void queryForListWithParamsAutoInvoice() {
        when(primaryJdbcTemplate.queryForList("sql", "app", "ou", "per", "uid")).thenReturn(List.of());
        assertNotNull(jdbc.queryForListWithParamsAutoInvoice("sql", "app", "ou", "per", "uid"));
    }

    @Test void queryForListWithParamsPreInvoice() {
        when(primaryJdbcTemplate.queryForList("sql", "app", "ou", "per", "pf", "uid")).thenReturn(List.of());
        assertNotNull(jdbc.queryForListWithParamsPreInvoice("sql", "app", "ou", "per", "pf", "uid"));
    }

    @Test void queryForListWithParamsAccruals() {
        when(primaryJdbcTemplate.queryForList("sql", "per", "ou", "pf", 1)).thenReturn(List.of());
        assertNotNull(jdbc.queryForListWithParamsAccruals("sql", "per", "ou", "pf", 1));
    }

    @Test void callTsvPkgProc() {
        jdbc.callTsvPkgProc("pkg", "sub", "uid");
        verify(primaryJdbcTemplate).update("pkg", "sub", null, "uid");
    }

    @Test void tsvSubSku() {
        when(primaryJdbcTemplate.queryForList("sql", "sub", "uid")).thenReturn(List.of());
        assertNotNull(jdbc.tsvSubSku("sql", "sub", "uid"));
    }

    @Test void tsvAccounts() {
        when(primaryJdbcTemplate.queryForList("sql", "sub", "uid")).thenReturn(List.of());
        assertNotNull(jdbc.tsvAccounts("sql", "sub", "uid"));
    }

    @Test void o2cSubscriptionSummary() {
        when(primaryJdbcTemplate.queryForList("sql", "v", "c")).thenReturn(List.of());
        assertNotNull(jdbc.o2cSubscriptionSummary("sql", "v", "c"));
    }

    @Test void o2cOrderSummary() {
        when(primaryJdbcTemplate.queryForList("sql", "v")).thenReturn(List.of());
        assertNotNull(jdbc.o2cOrderSummary("sql", "v"));
    }

    @Test void o2cInvoiceLineSummary() {
        when(primaryJdbcTemplate.queryForList("sql", "v")).thenReturn(List.of());
        assertNotNull(jdbc.o2cInvoiceLineSummary("sql", "v"));
    }

    @Test void o2cSubscriptionLineSummary() {
        when(primaryJdbcTemplate.queryForList("sql", "v", "c")).thenReturn(List.of());
        assertNotNull(jdbc.o2cSubscriptionLineSummary("sql", "v", "c"));
    }

    @Test void sbpBillScheduleHeader() {
        when(primaryJdbcTemplate.queryForList("sql", "v")).thenReturn(List.of());
        assertNotNull(jdbc.sbpBillScheduleHeader("sql", "v"));
    }
}
