package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GLPostingMonitoringServiceTest {

    @Mock
    JdbcManager jdbcManager;
    @Mock
    Common common;
    @Mock
    CacheCommon cacheCommon;

    @InjectMocks
    GLPostingMonitoringService service = new GLPostingMonitoringService(null,
            "sum","det","filter","update",
            "intSum","intDet","intFilter","intUpdate",
            "faSum","faDet","faFilter","faUpdate",
            "unpostSum","unpostDet","unpostFilter","unpostUpdate");

    @BeforeEach
    void setup(){
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("getGlErrorSummary reorders and injects AGING")
    void glErrorSummary() {
        List<Map<String,Object>> rows = new ArrayList<>();
        Map<String,Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE", new Date());
        row.put("ASSIGNED_DATE", new Date());
        row.put("OTHER", 1);
        rows.add(row);
        when(cacheCommon.checkRedisForCachedData(eq("GlErrorSummary"), anyString(), anyBoolean())).thenReturn(rows);
    // calculateAging returns a String, so stub with a String value not an int
    when(common.calculateAging(any())).thenReturn("5 days");

        var result = service.getGlErrorSummary();
        assertEquals(1, result.size());
        assertTrue(result.get(0).containsKey("AGING"));
    }

    @Test void getGlErrorDetails() {
        when(cacheCommon.checkRedisForCachedData(eq("GlErrorDetails"), anyString(), anyBoolean())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlErrorDetails().size());
    }

    @Test void getGlDetailsFilter() {
        when(jdbcManager.getGlDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlDetailsFilter("p","a","pf","l","b","d").size());
    }

    @Test void updateGlErrorSummary() {
        when(jdbcManager.updateGlErrorsSummaryData(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = Map.of("assignedTo","u","comments","c","glBatchName","b","username","u");
        assertEquals(1, service.updateGlErrorSummary(data));
    }

    @Test void refreshGlPostingMonitoringCache_noRedis() {
        service.refreshGlPostingMonitoringCache();
        verify(cacheCommon, never()).refreshExceptionMonitoringCache(anyMap());
    }

    @Test void getGlInterfaceErrorSummary() {
        Map<String, Object> row = new HashMap<>();
        row.put("DATE_CREATED","2024-01-01"); row.put("OTHER", 1);
        when(jdbcManager.queryForListAIT(anyString())).thenReturn(List.of(row));
        assertEquals(1, service.getGlInterfaceErrorSummary().size());
        verify(common).formatDateColumns(any(), any());
    }

    @Test void getGlInterfaceErrorDetails() {
        Map<String, Object> row = new HashMap<>();
        row.put("DATE_CREATED","d"); row.put("ACCOUNTING_DATE","d");
        when(jdbcManager.queryForListAIT(anyString())).thenReturn(List.of(row));
        assertEquals(1, service.getGlInterfaceErrorDetails().size());
    }

    @Test void getAITGlInterfaceDetailsFilter() {
        when(jdbcManager.getAITGlInterfaceDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getAITGlInterfaceDetailsFilter("s","l","p","b","d").size());
    }

    @Test void updateAITGlErrorSummary() {
        when(jdbcManager.AITGlInterfaceSummaryUpdate(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = new HashMap<>(Map.of("assignedTo","u","comments","c","userJeSourceName","s","ledgerName","l","periodName","p","batchName","b","reference4","r"));
        assertEquals(1, service.updateAITGlErrorSummary(data));
    }

    @Test void getGlFaJobsSummary() {
        when(jdbcManager.queryForListAIT(anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlFaJobsSummary().size());
    }

    @Test void getGlFaDetails() {
        when(jdbcManager.queryForListAIT(anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlFaDetails().size());
    }

    @Test void getGlFaDetailsFilter() {
        when(jdbcManager.getGlFaDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlFaDetailsFilter("d","m","f","s").size());
    }

    @Test void updateGlFaErrorSummary() {
        when(jdbcManager.glFaSummaryUpdate(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = new HashMap<>(Map.of("assignedTo","u","comments","c","jobDate","d","module","m","ctmFolder","f","ctmStatus","s"));
        assertEquals(1, service.updateGlFaErrorSummary(data));
    }

    @Test void getGlUnpostedSummary() {
        when(jdbcManager.queryForListAIT(anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlUnpostedSummary().size());
    }

    @Test void getGlUnpostedDetails() {
        when(jdbcManager.queryForListAIT(anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlUnpostedDetails().size());
    }

    @Test void getGlUnpostedDetailsFilter() {
        when(jdbcManager.getAITGlUnpostedDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(Map.of("k","v")));
        assertEquals(1, service.getGlUnpostedDetailsFilter("s","l","p","b").size());
    }

    @Test void updateGlUnpostedErrorSummary() {
        when(jdbcManager.AITGlUnpostedSummaryUpdate(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        Map<String, String> data = new HashMap<>(Map.of("assignedTo","u","comments","c","userJeSourceName","s","ledgerName","l","periodName","p","batchName","b"));
        assertEquals(1, service.updateGlUnpostedErrorSummary(data));
    }
}
