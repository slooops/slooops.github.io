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
class PostInvoicingMonitoringServiceTest {

    @Mock private JdbcManager jdbcManager;
    @Mock private Common common;
    @Mock private CacheCommon cacheCommon;
    private PostInvoicingMonitoringService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new PostInvoicingMonitoringService(jdbcManager,
                "q1","q2","q3","q4","q5","q6","q7","q8","q9","q10",
                "q11","q12","q13","q14","q15","q16","q17","q18","q19","q20",
                "q21","q22","q23","q24");
        setField("common", common);
        setField("cacheCommon", cacheCommon);
    }

    private void setField(String name, Object value) throws Exception {
        Field f = PostInvoicingMonitoringService.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(service, value);
    }

    // CM Amort
    @Test void getCMAmortErrorSummaryView() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE", "d1"); row.put("ASSIGNED_DATE", "d2"); row.put("AGING", "old");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("CmAmortSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        assertEquals(1, service.getCMAmortErrorSummaryView().size());
    }

    @Test void getCMAmortErrorDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("TRANSACTION_DATE", "d");
        when(cacheCommon.checkRedisForCachedData(eq("CmAmortDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getCMAmortErrorDetails().size());
        verify(common).formatDateColumns(any(), any());
    }

    @Test void getCMAmortErrorDetailsFiltered() {
        when(jdbcManager.getCMAmortDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(new HashMap<>(Map.of("TRANSACTION_DATE", "d"))));
        assertEquals(1, service.getCMAmortErrorDetailsFiltered("p","a","pf","o","d").size());
    }

    @Test void updateCMAmortErrorSummary() {
        when(jdbcManager.updateCMAmortSummary(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","periodName","p","processFlow","pf","orgName","o","transactionDate","d");
        assertEquals(1, service.updateCMAmortErrorSummary(data));
    }

    // Print
    @Test void getPrintErrorSummaryView() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE", "d1"); row.put("ASSIGNED_DATE", "d2");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("PrintSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        assertEquals(1, service.getPrintErrorSummaryView().size());
    }

    @Test void getPrintErrorDetails() {
        when(cacheCommon.checkRedisForCachedData(eq("PrintDetail"), anyString(), anyBoolean())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getPrintErrorDetails().size());
    }

    @Test void getPrintErrorDetailsFiltered() {
        when(jdbcManager.getPrintDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getPrintErrorDetailsFiltered("p","a","pf","o","d").size());
    }

    @Test void updatePrintErrorSummary() {
        when(jdbcManager.updatePrintSummary(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","periodName","p","orgName","o","transactionDate","d");
        assertEquals(1, service.updatePrintErrorSummary(data));
    }

    // Credit Card (post-invoicing)
    @Test void getCreditCardSummary() {
        Map<String, Object> row = new HashMap<>(); row.put("TRANSACTION_DATE","d");
        when(cacheCommon.checkRedisForCachedData(eq("CreditCardSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getCreditCardSummary().size());
    }

    @Test void getCreditCardDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("TRANSACTION_DATE","d");
        when(cacheCommon.checkRedisForCachedData(eq("CreditCardDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getCreditCardDetails().size());
    }

    @Test void getCreditCardDetailsFiltered() {
        when(jdbcManager.getCreditCardDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(new HashMap<>(Map.of("TRANSACTION_DATE","d"))));
        assertEquals(1, service.getCreditCardDetailsFiltered("p","a","pf","o","d").size());
    }

    // RPO Extract
    @Test void getRpoExtractSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE","d1"); row.put("ASSIGNED_DATE","d2");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("RpoExtractSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("3 days");
        assertEquals(1, service.getRpoExtractSummary().size());
    }

    @Test void getRpoExtractDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("TRANSACTION_DATE","d");
        when(cacheCommon.checkRedisForCachedData(eq("RpoExtractDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getRpoExtractDetails().size());
    }

    @Test void getRpoExtractDetailsFiltered() {
        when(jdbcManager.getRPOExtractDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(new HashMap<>(Map.of("TRANSACTION_DATE","d"))));
        assertEquals(1, service.getRpoExtractDetailsFiltered("p","a","pf","o","d").size());
    }

    @Test void updateRPOExtractSummary() {
        when(jdbcManager.updateRPOExtractSummary(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","periodName","p","orgName","o","transactionDate","d");
        assertEquals(1, service.updateRPOExtractSummary(data));
    }

    // SRT Process
    @Test void getSrtProcessSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("SRT_DATE","d1"); row.put("ASSIGNED_DATE","d2");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5);
        when(cacheCommon.checkRedisForCachedData(eq("SrtProcessSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("2 days");
        assertEquals(1, service.getSrtProcessSummary().size());
    }

    @Test void getSrtProcessDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("SRT_DATE","d");
        when(cacheCommon.checkRedisForCachedData(eq("SrtProcessDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getSrtProcessDetails().size());
    }

    @Test void getSRTProcessDetailsFiltered() {
        when(jdbcManager.getSRTProcessDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(new HashMap<>(Map.of("SRT_DATE","d"))));
        assertEquals(1, service.getSRTProcessDetailsFiltered("p","pf","o","d").size());
    }

    @Test void updateSRTProcessSummary() {
        when(jdbcManager.updateSRTProcessSummary(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","periodName","p","orgName","o","srtDate","d");
        assertEquals(1, service.updateSRTProcessSummary(data));
    }

    // PCM Application
    @Test void getPCMApplicationSummary() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE","d1"); row.put("ASSIGNED_DATE","d2");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(cacheCommon.checkRedisForCachedData(eq("PcmApplicationSummary"), anyString(), anyBoolean())).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("1 day");
        assertEquals(1, service.getPCMApplicationSummary().size());
    }

    @Test void getPCMApplicationDetails() {
        Map<String, Object> row = new HashMap<>(); row.put("TRANSACTION_DATE","d");
        when(cacheCommon.checkRedisForCachedData(eq("PcmApplicationDetails"), anyString(), anyBoolean())).thenReturn(List.of(row));
        assertEquals(1, service.getPCMApplicationDetails().size());
    }

    @Test void getPCMApplicationDetailsFiltered() {
        when(jdbcManager.getPCMApplicationDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(new HashMap<>(Map.of("TRANSACTION_DATE","d"))));
        assertEquals(1, service.getPCMApplicationDetailsFiltered("p","a","pf","o","d").size());
    }

    @Test void updatePCMApplicationSummary() {
        when(jdbcManager.updatePCMApplicationSummary(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","username","u","comments","c","periodName","p","orgName","o","transactionDate","d","applicationName","a","processFlow","pf");
        assertEquals(1, service.updatePCMApplicationSummary(data));
    }

    @Test void refreshPostInvoicingMonitoringCache_noRedis() {
        service.refreshPostInvoicingMonitoringCache();
        verify(cacheCommon, never()).refreshExceptionMonitoringCache(anyMap());
    }
}
