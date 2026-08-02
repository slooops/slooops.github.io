package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.LargeDealSummaryByAccountModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.OrderLifecycleModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.OrderLifecycleSummaryModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UpdateCLOData;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UpdateOrderModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.text.ParseException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessInsightsMonitoringServiceTest {

    @Mock
    private JdbcManager jdbcManager;
    @Mock
    private Common common;
    private BusinessInsightsMonitoringService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new BusinessInsightsMonitoringService(jdbcManager,
                "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
                "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19",
                "q20", "q21", "q22", "q23", "q24", "q25", "q26", "q27");
        Field f = BusinessInsightsMonitoringService.class.getDeclaredField("common");
        f.setAccessible(true);
        f.set(service, common);
    }

    // Issue Reporting
    @Test
    void getIssueReportingData() {
        Map<String, Object> row = new HashMap<>();
        row.put("START_DATE", "d");
        row.put("REPORTED_DATE", "d");
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(row));
        assertEquals(1, service.getIssueReportingData().size());
        verify(common).formatDateColumns(any(), any());
    }

    @Test
    void getIssueReportingDataSummary() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        when(common.transformForActiveIncidentsSummary(any())).thenReturn(List.of(Map.of("r", "v")));
        assertEquals(1, service.getIssueReportingDataSummary().size());
    }

    @Test
    void approveRejectIssueReporting() {
        when(jdbcManager.approveRejectIssueReport(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.approveRejectIssueReporting("APPROVED", "user1", "INC001"));
    }

    @Test
    void updateCommentsIssueReporting() {
        when(jdbcManager.updateCommentsIssueReport(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.updateCommentsIssueReporting("comment", "user1", "INC001"));
    }

    @Test
    void updateFixDetailsIssueReporting() {
        when(jdbcManager.updateFixDetailsIssueReport(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.updateFixDetailsIssueReporting("fix", "user1", "INC001"));
    }

    @Test
    void updateStatusIssueReporting() {
        when(jdbcManager.updateStatusIssueReport(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.updateStatusIssueReporting("CLOSED", "user1", "INC001"));
    }

    @Test
    void updateIssueDescIssueReporting() {
        when(jdbcManager.updateIssueDescIssueReport(anyString(), anyString(), anyString(), anyString(), anyString(),
                anyString())).thenReturn(1);
        assertEquals(1, service.updateIssueDescIssueReporting("issue", "root", "impact", "user1", "INC001"));
    }

    @Test
    void bulkApproveRejectIssueReporting() {
        when(jdbcManager.approveRejectIssueReport(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        List<Map<String, Object>> data = List.of(
                Map.of("status", "APPROVED", "approvedBy", "u1", "incidentNumber", "INC001"),
                Map.of("status", "REJECTED", "approvedBy", "u2", "incidentNumber", "INC002"));
        service.bulkApproveRejectIssueReporting(data);
        verify(jdbcManager, times(2)).approveRejectIssueReport(anyString(), anyString(), anyString(), anyString());
    }

    // WD0 methods
    @Test
    void getWd0ArMidCloseStatus() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0ArMidCloseStatus().size());
    }

    @Test
    void getWd0ArMidCloseHeaderData() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0ArMidCloseHeaderData().size());
    }

    @Test
    void getWd0HistoricalData() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0HistoricalData().size());
    }

    @Test
    void getWd0Regression() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0Regression().size());
    }

    @Test
    void getWd0CurrentMonth() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0CurrentMonth().size());
    }

    @Test
    void getWd0Volumes() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0Volumes().size());
    }

    @Test
    void getWd0MidcloseActualsProduct() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0MidcloseActualsProduct().size());
    }

    @Test
    void getWd0MidcloseActualsService() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getWd0MidcloseActualsService().size());
    }

    // Large Deal Summary
    @Test
    void getLargeDealSummaryByAccount_grouping() {
        List<Map<String, Object>> rows = List.of(
                Map.of("ACCOUNT", "Acme", "ORDER_COUNT", new BigDecimal(5), "STATUS", "Open", "COMPLETION",
                        new BigDecimal(50)),
                Map.of("ACCOUNT", "Acme", "ORDER_COUNT", new BigDecimal(3), "STATUS", "Closed", "COMPLETION",
                        new BigDecimal(100)),
                Map.of("ACCOUNT", "Beta", "ORDER_COUNT", new BigDecimal(2), "STATUS", "Open", "COMPLETION",
                        new BigDecimal(25)));
        when(jdbcManager.queryForList(anyString())).thenReturn(rows);
        List<LargeDealSummaryByAccountModel> result = service.getLargeDealSummaryByAccount();
        // Should have subtotals per account + grand total
        assertTrue(result.stream().anyMatch(m -> m.ACCOUNT != null && m.ACCOUNT.startsWith("Sub Total")));
        assertTrue(result.stream().anyMatch(m -> m.ACCOUNT != null && m.ACCOUNT.equals("Total")));
    }

    @Test
    void mapToLargeDealSummaryByAccountModelList() {
        List<Map<String, Object>> rows = List.of(
                Map.of("ACCOUNT", "X", "ORDER_COUNT", new BigDecimal(10), "STATUS", "Open", "COMPLETION",
                        new BigDecimal(75)));
        List<LargeDealSummaryByAccountModel> result = BusinessInsightsMonitoringService
                .mapToLargeDealSummaryByAccountModelList(rows);
        assertEquals(1, result.size());
        assertEquals("X", result.get(0).ACCOUNT);
        assertEquals(10, result.get(0).ORDER_COUNT);
    }

    // CLO
    @Test
    void getCloSampleDownloadData() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getCloSampleDownloadData().size());
    }

    // Order Status Summary
    @Test
    void getOrderStatusSummary_grouping() {
        List<Map<String, Object>> rows = List.of(
                Map.of("PROGRAM_NAME", "P1", "ORDER_COUNT", new BigDecimal(4), "STATUS", "Active", "COMPLETION",
                        new BigDecimal(80)),
                Map.of("PROGRAM_NAME", "P1", "ORDER_COUNT", new BigDecimal(6), "STATUS", "Done", "COMPLETION",
                        new BigDecimal(100)));
        when(jdbcManager.queryForList(anyString())).thenReturn(rows);
        List<OrderLifecycleSummaryModel> result = service.getOrderStatusSummary();
        assertTrue(result.stream().anyMatch(m -> m.PROGRAM_NAME != null && m.PROGRAM_NAME.startsWith("Sub Total")));
        assertTrue(result.stream().anyMatch(m -> m.PROGRAM_NAME != null && m.PROGRAM_NAME.equals("Total")));
    }

    @Test
    void getOrderStatusRevSummary() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getOrderStatusRevSummary().size());
    }

    // setUpdateOrderStatusFromData
    @Test
    void setUpdateOrderStatusFromData_singleDeal() {
        UpdateOrderModel input = new UpdateOrderModel();
        input.setProgramName("P1");
        input.setAccount("A1");
        input.setDealIds("123");
        input.setUsername("user1");
        service.setUpdateOrderStatusFromData(input);
        verify(jdbcManager).updateOrderStatus(anyString(), eq("P1"), eq("A1"), eq(123), eq("user1"));
    }

    @Test
    void setUpdateOrderStatusFromData_commaSeparatedDeals() {
        UpdateOrderModel input = new UpdateOrderModel();
        input.setProgramName("P1");
        input.setAccount("A1");
        input.setDealIds("123,456");
        input.setUsername("user1");
        service.setUpdateOrderStatusFromData(input);
        verify(jdbcManager, times(2)).updateOrderStatus(anyString(), anyString(), anyString(), anyInt(), anyString());
    }

    // setUpdateOrderStatusFromFile
    @Test
    void setUpdateOrderStatusFromFile() throws IOException {
        String csv = "header\nP1,A1,123\nP2,A2,456\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csv.getBytes());
        service.setUpdateOrderStatusFromFile(file, "user1");
        verify(jdbcManager, times(2)).updateOrderStatus(anyString(), anyString(), anyString(), anyInt(), anyString());
    }

    // getOrderStatus
    @Test
    void getOrderStatus_removesColumnsAndFormatsDates() {
        Map<String, Object> row = new HashMap<>();
        row.put("DEAL_ID", 1);
        row.put("AGING_BOOKING", "x");
        row.put("AGING_HOLD_RELEASE", "x");
        row.put("EXPECTED_BOOK_DATE", "x");
        row.put("HOLD_RELEASE_TARGET_DATE", "x");
        row.put("LINE_TYPE", "x");
        row.put("ORDER_TOTAL", "x");
        row.put("SFDC_STATUS", "x");
        row.put("TOTAL_CONTRACT_VALUE", "x");
        row.put("STATUS_AS_OF_DATE", "2024-01-15 10:00");
        row.put("SUBSCRIPTION_ID", "x");
        row.put("ACTUAL_BOOK_DATE", "2024-02-01 10:00");
        row.put("FUTURE_INVOICE_RELEASE_DATE", "2024-03-01 10:00");
        row.put("INVOICE_DATE", "2024-04-01 10:00");
        row.put("DEAL_UPLOAD_DATE", null);
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(row));
        OrderLifecycleModel result = service.getOrderStatus();
        assertNotNull(result.getOrderLifecycleResult());
        assertNotNull(result.getColumns());
        // removed columns should not be present
        assertFalse(result.getOrderLifecycleResult().get(0).containsKey("AGING_BOOKING"));
        // ACTUAL_BOOK_DATE renamed to BOOK_DATE
        assertTrue(result.getOrderLifecycleResult().get(0).containsKey("BOOK_DATE"));
    }

    // deleteSelectedDeals
    @Test
    void deleteSelectedDeals() {
        List<Map<String, Object>> deals = List.of(Map.of("DEAL_ID", 1, "SALES_ORDER", "SO1"));
        service.deleteSelectedDeals(deals, "user1");
        verify(jdbcManager).deleteSelectedDeals(anyString(), eq("user1"), eq(1), eq("SO1"), eq("SO1"));
    }

    @Test
    void deleteDeals_tbd() {
        service.deleteDeals("user1", 1, "TBD");
        verify(jdbcManager).deleteSelectedDeals(anyString(), eq("user1"), eq(1), eq("0"), eq("0"));
    }

    // getOrderStatusDownload
    @Test
    void getOrderStatusDownload() {
        when(jdbcManager.queryForList(anyString())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getOrderStatusDownload().size());
    }

    // setUpdateInvoiceEligibleDate
    @Test
    void setUpdateInvoiceEligibleDate() throws ParseException {
        when(jdbcManager.updateInvoiceDate(anyString(), anyString(), anyString(), anyInt(), anyString(), any(),
                anyString())).thenReturn(1);
        Map<String, String> model = new HashMap<>();
        model.put("programName", "P1");
        model.put("account", "A1");
        model.put("dealId", "123");
        model.put("orderID", "SO1");
        model.put("invoiceEligibleDate", "2024-01-15T10:00:00.000Z");
        service.setUpdateInvoiceEligibleDate(model, "user1");
        verify(jdbcManager).updateInvoiceDate(anyString(), eq("P1"), eq("A1"), eq(123), eq("SO1"), any(), eq("user1"));
    }

    @Test
    void setUpdateInvoiceEligibleDate_tbd() throws ParseException {
        when(jdbcManager.updateInvoiceDate(anyString(), anyString(), anyString(), anyInt(), anyString(), any(),
                anyString())).thenReturn(1);
        Map<String, String> model = new HashMap<>();
        model.put("programName", "P1");
        model.put("account", "A1");
        model.put("dealId", "123");
        model.put("orderID", "TBD");
        model.put("invoiceEligibleDate", "2024-01-15T10:00:00.000Z");
        service.setUpdateInvoiceEligibleDate(model, "user1");
        verify(jdbcManager).updateInvoiceDate(anyString(), eq("P1"), eq("A1"), eq(123), eq("0"), any(), eq("user1"));
    }

    // setCloCommentUpdate
    @Test
    void setCloCommentUpdate() {
        when(jdbcManager.updateCloComments(anyString(), anyString(), anyString(), anyInt(), anyString(), anyString(),
                anyString())).thenReturn(1);
        Map<String, String> model = new HashMap<>();
        model.put("programName", "P1");
        model.put("account", "A1");
        model.put("dealId", "123");
        model.put("orderID", "SO1");
        model.put("cloComments", "comment");
        service.setCloCommentUpdate(model, "user1");
        verify(jdbcManager).updateCloComments(anyString(), eq("P1"), eq("A1"), eq(123), eq("SO1"), eq("comment"),
                eq("user1"));
    }

    @Test
    void setCloCommentUpdate_tbd() {
        when(jdbcManager.updateCloComments(anyString(), anyString(), anyString(), anyInt(), anyString(), anyString(),
                anyString())).thenReturn(1);
        Map<String, String> model = new HashMap<>();
        model.put("programName", "P1");
        model.put("account", "A1");
        model.put("dealId", "123");
        model.put("orderID", "TBD");
        model.put("cloComments", "comment");
        service.setCloCommentUpdate(model, "user1");
        verify(jdbcManager).updateCloComments(anyString(), eq("P1"), eq("A1"), eq(123), eq("0"), eq("comment"),
                eq("user1"));
    }

    // setCloBulkUpdate
    @Test
    void setCloBulkUpdate_emptyOrderNum() throws ParseException {
        UpdateCLOData input = new UpdateCLOData();
        input.setProgramName("P1");
        input.setAccount("A1");
        input.setDealIds("123");
        input.setOrderNum("");
        input.setInvoiceDate("");
        input.setCloComments("c");
        assertDoesNotThrow(() -> service.setCloBulkUpdate(input, "user1"));
    }
}
