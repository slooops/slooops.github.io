package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
}
