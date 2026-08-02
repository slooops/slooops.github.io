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
class RevenueAccountingMonitoringServiceTest {

    @Mock private JdbcManager jdbcManager;
    @Mock private Common common;
    @Mock private CacheCommon cacheCommon;
    private RevenueAccountingMonitoringService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new RevenueAccountingMonitoringService(jdbcManager,
                "q1","q2","q3","q4","q5","q6","q7","q8",
                "q9","q10","q11","q12","q13","q14","q15","q16");
        setField("common", common);
        setField("cacheCommon", cacheCommon);
    }

    private void setField(String name, Object value) throws Exception {
        Field f = RevenueAccountingMonitoringService.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(service, value);
    }

    // ROL Errors
    @Test void getRolErrorsSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("SUB_APPLICATION", "sa"); row.put("CREATION_DATE", "d"); row.put("ASSIGNED_BY", "x");
        row.put("CURRENCY_CODE", "USD"); row.put("ERROR_APPLICATION", "ea"); row.put("TRANSACTION_DATE", "d");
        row.put("ASSIGNED_DATE", "d2");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("RolErrorsSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        List<Map<String, Object>> result = service.getRolErrorsSummary();
        assertEquals(1, result.size());
        verify(common).renameKey(any(), eq("SUB_APPLICATION"), eq("PROCESS_FLOW"));
        verify(common).renameKey(any(), eq("CREATION_DATE"), eq("TRANSACTION_DATE"));
    }

    @Test void getRolErrorDetails() {
        Map<String, Object> row = new HashMap<>();
        row.put("OU_NAME","o"); row.put("SUB_APPLICATION","s"); row.put("ORDERLINEID","ol");
        row.put("INTID_TRXNID_CUSTTRXLINE_GROUPID","id"); row.put("ERROR_APPLICATION","ea");
        row.put("SOURCE","src"); row.put("CURRENCY_CODE","USD"); row.put("CUSTTRXLINEID","ct"); row.put("ORDERNUMBER_CUSTTRXID","on");
        when(cacheCommon.checkRedisForCachedData(eq("RolErrorsDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        List<Map<String, Object>> result = service.getRolErrorDetails();
        assertEquals(1, result.size());
        assertFalse(result.get(0).containsKey("ERROR_APPLICATION"));
        assertFalse(result.get(0).containsKey("SOURCE"));
    }

    @Test void getRolTransactionDetailsFilter() {
        when(jdbcManager.getRolTransactionDataFilter(anyString(), anyString(), anyString(), anyString(), anyInt()))
                .thenReturn(List.of(new HashMap<>(Map.of("OU_NAME","o","SUB_APPLICATION","s","ORDERLINEID","ol","INTID_TRXNID_CUSTTRXLINE_GROUPID","id","ERROR_APPLICATION","ea","SOURCE","src","CURRENCY_CODE","USD","CUSTTRXLINEID","ct","ORDERNUMBER_CUSTTRXID","on"))));
        assertEquals(1, service.getRolTransactionDetailsFilter("p","o","a","1").size());
    }

    @Test void updateRolErrorSummary() {
        when(jdbcManager.updateRolErrorsSummaryData(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","comments","c","periodName","p","applicationName","a","processFlow","pf","orgName","o","username","u");
        assertEquals(1, service.updateRolErrorSummary(data));
    }

    // Standard Revenue
    @Test void getStandardRevenueSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE","d1"); row.put("ASSIGNED_DATE","d2"); row.put("AGING","old");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("StandardRevenueSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        assertEquals(1, service.getStandardRevenueSummary().size());
    }

    @Test void getStandardRevenueDetails() {
        when(cacheCommon.checkRedisForCachedData(eq("StandardRevenueDetails"), anyString(), anyBoolean())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getStandardRevenueDetails().size());
    }

    @Test void getStandardRevenueDetailsFiltered() {
        when(jdbcManager.getStandardRevenueDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getStandardRevenueDetailsFiltered("p","a","pf","o","d").size());
    }

    @Test void updateStandardRevenueSummary() {
        when(jdbcManager.updateStandardRevenueSummary(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","comments","c","periodName","p","processFlow","pf","orgName","o","transactionDate","d","username","u");
        assertEquals(1, service.updateStandardRevenueSummary(data));
    }

    // Accruals
    @Test void getAccrualsSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE","d1"); row.put("ASSIGNED_DATE","d2"); row.put("ASSIGNED_BY","x"); row.put("SEQUENCE_NUMBER","1");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("AccrualsSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("2 days");
        assertEquals(1, service.getAccrualsSummary().size());
    }

    @Test void getAccrualsDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("CREATION_DATE","d"); row.put("SEQUENCE_NUMBER","1");
        when(cacheCommon.checkRedisForCachedData(eq("AccrualsDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        List<Map<String, Object>> result = service.getAccrualsDetails();
        assertFalse(result.get(0).containsKey("SEQUENCE_NUMBER"));
    }

    @Test void getAccrualsDetailsFiltered() {
        Map<String, Object> row = new HashMap<>(); row.put("CREATION_DATE","d"); row.put("SEQUENCE_NUMBER","1");
        when(jdbcManager.queryForListWithParamsAccruals(anyString(), anyString(), anyString(), anyString(), anyInt()))
                .thenReturn(List.of(row));
        assertEquals(1, service.getAccrualsDetailsFiltered("p","o","pf","1").size());
    }

    @Test void updateAccrualsErrorSummary() {
        when(jdbcManager.updateAccrualsErrorsSummaryData(anyString(), anyString(), anyString(), anyString(), anyInt())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","sequenceNum","1");
        assertEquals(1, service.updateAccrualsErrorSummary(data));
    }

    // TSP Account
    @Test void getTspAccountSummaryView() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE","d1"); row.put("ASSIGNED_DATE","d2"); row.put("ASSIGNED_BY","x");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("TspAccountSummaryView"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("1 day");
        assertEquals(1, service.getTspAccountSummaryView().size());
    }

    @Test void getTspAccountDetailView() {
        Map<String, Object> row = new HashMap<>(); row.put("CREATION_DATE","d"); row.put("SEQUENCE_NUMBER","1");
        when(cacheCommon.checkRedisForCachedData(eq("TspAccountDetailView"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertFalse(service.getTspAccountDetailView().get(0).containsKey("SEQUENCE_NUMBER"));
    }

    @Test void getTspAccountDetailViewFiltered() {
        Map<String, Object> row = new HashMap<>(); row.put("CREATION_DATE","d"); row.put("SEQUENCE_NUMBER","1");
        when(jdbcManager.getTspAccountDetailViewFiltered(anyString(), anyString())).thenReturn(List.of(row));
        assertEquals(1, service.getTspAccountDetailViewFiltered("1").size());
    }

    @Test void updateTspAccountSummary() {
        when(jdbcManager.updateTspAccountSummary(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","sequenceNumber","1");
        assertEquals(1, service.updateTspAccountSummary(data));
    }

    @Test void refreshRevenueAccountingMonitoringCache_noRedis() {
        service.refreshRevenueAccountingMonitoringCache();
        verify(cacheCommon, never()).refreshExceptionMonitoringCache(anyMap());
    }
}
