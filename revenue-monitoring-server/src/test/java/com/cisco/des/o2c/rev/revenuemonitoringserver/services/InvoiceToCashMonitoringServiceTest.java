package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceToCashMonitoringServiceTest {

    @Mock private JdbcManager jdbcManager;
    @Mock private Common common;
    @Mock private CacheCommon cacheCommon;
    private InvoiceToCashMonitoringService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new InvoiceToCashMonitoringService(jdbcManager,
                "q1","q2","q3","q4","q5","q6","q7","q8","q9","q10",
                "q11","q12","q13","q14","q15","q16","q17","q18","q19","q20");
        setField("common", common);
        setField("cacheCommon", cacheCommon);
    }

    private void setField(String name, Object value) throws Exception {
        Field f = InvoiceToCashMonitoringService.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(service, value);
    }

    // Pre-Invoice
    @Test void getPreInvoiceErrorSummaryView() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE", "2024-01-01"); row.put("ASSIGNED_DATE", "2024-01-02");
        row.put("ERROR_AMOUNT", 100); row.put("AGING", "old");
        row.put("A", 1); row.put("B", 2); row.put("C", 3); row.put("D", 4); row.put("E", 5); row.put("F", 6);
        when(cacheCommon.checkRedisForCachedData(eq("PreInvoiceErrorSummaryView"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        List<Map<String, Object>> result = service.getPreInvoiceErrorSummaryView();
        assertEquals(1, result.size());
        verify(common).renameKey(any(), eq("ERROR_AMOUNT"), eq("AMOUNT"));
    }

    @Test void getPreInvoiceErrorDetails() {
        Map<String, Object> row = new HashMap<>();
        row.put("TRANSACTION_DATE", "2024-01-01"); row.put("CREATION_DATE", "2024-01-01"); row.put("SUBSCRIPTION_ID", "SUB1");
        when(cacheCommon.checkRedisForCachedData(eq("PreInvoiceErrorDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        List<Map<String, Object>> result = service.getPreInvoiceErrorDetails();
        assertEquals(1, result.size());
        verify(common).renameKey(any(), eq("CREATION_DATE"), eq("TRANSACTION_DATE"));
        verify(common).renameKey(any(), eq("SUBSCRIPTION_ID"), eq("TRANSACTION_ID"));
    }

    @Test void getPreInvoiceErrorDetailsFiltered() {
        Map<String, Object> row = new HashMap<>();
        row.put("CREATION_DATE", "d"); row.put("SUBSCRIPTION_ID", "s");
        when(jdbcManager.queryForListWithParamsPreInvoice(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(row));
        List<Map<String, Object>> result = service.getPreInvoiceErrorDetailsFiltered("a","b","c","d","e");
        assertEquals(1, result.size());
    }

    @Test void updatePreInvoiceErrorSummary() {
        when(jdbcManager.updatePreInvoiceErrorsSummaryData(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","processFlow","p","orgName","o","transactionDate","d");
        assertEquals(1, service.updatePreInvoiceErrorSummary(data));
    }

    // Auto-Invoice
    @Test void getAutoInvoiceErrorSummaryView() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE", "2024-01-01"); row.put("ASSIGNED_DATE", "2024-01-02");
        row.put("OPERATING_UNIT", "OU"); row.put("AMOUNT_USD", 100); row.put("AGING", "old");
        row.put("A", 1); row.put("B", 2); row.put("C", 3); row.put("D", 4); row.put("E", 5); row.put("F", 6);
        when(cacheCommon.checkRedisForCachedData(eq("AutoInvoiceErrorSummaryView"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        List<Map<String, Object>> result = service.getAutoInvoiceErrorSummaryView();
        assertEquals(1, result.size());
    }

    @Test void getAutoInvoiceErrorDetails() {
        Map<String, Object> row = new HashMap<>();
        row.put("OPERATING_UNIT", "OU"); row.put("TRANSACTION_DATE", "d");
        when(cacheCommon.checkRedisForCachedData(eq("AutoInvoiceErrorDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getAutoInvoiceErrorDetails().size());
    }

    @Test void getAutoInvoiceErrorDetailsFiltered() {
        when(jdbcManager.queryForListWithParamsAutoInvoice(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(new HashMap<>(Map.of("OPERATING_UNIT", "OU"))));
        assertEquals(1, service.getAutoInvoiceErrorDetailsFiltered("a","b","c","d").size());
    }

    @Test void updateAutoInvoiceErrorSummary() {
        when(jdbcManager.updateAutoInvoiceErrorsSummaryData(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","periodName","p","processFlow","pf","applicationName","a","orgName","o","transactionDate","d");
        assertEquals(1, service.updateAutoInvoiceErrorSummary(data));
    }

    // eInvoicing
    @Test void getEInvoicingSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("ASSIGNED_DATE", "d1"); row.put("TRANSACTION_DATE", "d2"); row.put("ASSIGNED_BY", "x"); row.put("AGING", "old");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("EinvoicingSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        assertEquals(1, service.getEInvoicingSummary().size());
    }

    @Test void getEInvoicingDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("TRX_NUMBER", "T1");
        when(cacheCommon.checkRedisForCachedData(eq("EinvoicingDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        service.getEInvoicingDetails();
        verify(common).renameKey(any(), eq("TRX_NUMBER"), eq("TRANSACTION_ID"));
    }

    @Test void getEInvoicingDetailsFiltered() {
        Map<String, Object> row = new HashMap<>(); row.put("TRX_NUMBER", "T1");
        when(jdbcManager.getEInvoicingDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(row));
        assertEquals(1, service.getEInvoicingDetailsFiltered("a","b","c","d","e").size());
    }

    // Fusion
    @Test void getFusionErrorSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE", "d"); row.put("ASSIGNED_DATE", "d2"); row.put("ENTITY_NAME", "e"); row.put("AGING", "old");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("FusionErrorSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        assertEquals(1, service.getFusionErrorSummary().size());
    }

    @Test void getFusionDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("ENTITY_NAME", "e");
        when(cacheCommon.checkRedisForCachedData(eq("FusionErrorDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        service.getFusionDetails();
        verify(common).renameKey(any(), eq("ENTITY_NAME"), eq("ORG_NAME"));
    }

    @Test void getFusionDetailsFiltered() {
        Map<String, Object> row = new HashMap<>(); row.put("ENTITY_NAME", "e");
        when(jdbcManager.getFusionDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(row));
        assertEquals(1, service.getFusionDetailsFiltered("a","b","c","d","e").size());
    }

    // Credit Card Check
    @Test void getCreditCardCheckSummaryView() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("HOLD_APPLY_DATE", "d"); row.put("ASSIGNED_DATE", "d2"); row.put("AGING", "old");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5);
        when(cacheCommon.checkRedisForCachedData(eq("CreditCardCheckSummaryView"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("3 days");
        assertEquals(1, service.getCreditCardCheckSummaryView().size());
    }

    @Test void getCreditCardCheckDetailView() {
        Map<String, Object> row = new HashMap<>(); row.put("HOLD_APPLY_DATE", "d");
        when(cacheCommon.checkRedisForCachedData(eq("CreditCardCheckDetailView"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getCreditCardCheckDetailView().size());
    }

    @Test void getCreditCardCheckDetailFilteredView() {
        when(jdbcManager.getCreditCardCheckDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(new HashMap<>(Map.of("HOLD_APPLY_DATE", "d"))));
        assertEquals(1, service.getCreditCardCheckDetailFilteredView("p","o","h","pf").size());
    }

    @Test void updateCreditCardCheckSummary() {
        when(jdbcManager.updateCreditCardCheckSummary(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","comments","c","processFlow","pf","orgName","o","holdApplyDate","h","username","u");
        assertEquals(1, service.updateCreditCardCheckSummary(data));
    }

    @Test void refreshInvoiceToCashMonitoringCache_noRedis() {
        // useRedisInv is false by default, so nothing should be called on cacheCommon
        service.refreshInvoiceToCashMonitoringCache();
        verify(cacheCommon, never()).refreshExceptionMonitoringCache(anyMap());
    }
}
