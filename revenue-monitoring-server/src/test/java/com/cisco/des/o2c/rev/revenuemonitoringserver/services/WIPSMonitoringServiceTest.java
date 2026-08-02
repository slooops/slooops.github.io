package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.MongoDBManager;
import org.junit.jupiter.api.BeforeEach;
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
class WIPSMonitoringServiceTest {

    @Mock private MongoDBManager mongoDBManager;
    @Mock private Common common;
    private WIPSMonitoringService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new WIPSMonitoringService(mongoDBManager);
        Field f = WIPSMonitoringService.class.getDeclaredField("common");
        f.setAccessible(true);
        f.set(service, common);
    }

    @Test
    void getWIPSDetailsData_formatsAndRemovesDate() {
        Map<String, Object> row = new HashMap<>();
        row.put("assigned_date", "2024-01-01");
        row.put("name", "test");
        when(mongoDBManager.getWIPSData("col")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getWIPSDetailsData("col");
        assertEquals(1, result.size());
        assertFalse(result.get(0).containsKey("assigned_date"));
    }

    @Test
    void getWIPSSummaryData_formatsAndRemoves() {
        Map<String, Object> row = new HashMap<>();
        row.put("assigned_date", "d1");
        row.put("closed_date", "d2");
        row.put("created_date", "d3");
        row.put("_id", "id1");
        when(mongoDBManager.getWIPSData("col")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getWIPSSummaryData("col");
        assertFalse(result.get(0).containsKey("_id"));
        assertFalse(result.get(0).containsKey("closed_date"));
    }

    @Test
    void updateWIPSSummary_returns1() {
        when(mongoDBManager.updateWipsSummaryData(anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1L);
        Map<String, String> data = Map.of("assignedTo", "u", "comments", "c", "timestamp", "ts", "scenario", "s", "status", "OPEN");
        assertEquals(1, service.updateWIPSSummary("col", data));
    }

    @Test
    void getWIPSDetailsDataFiltered_formatsAndRemoves() {
        Map<String, Object> row = new HashMap<>();
        row.put("assigned_date", "d1");
        row.put("assigned_data", "x");
        when(mongoDBManager.getWipsFilteredData("col", "ts", "sc")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getWIPSDetailsDataFiltered("col", "ts", "sc");
        assertEquals(1, result.size());
        verify(common).formatDateColumns(any(), any());
    }

    @Test
    void getWIPSDetailsData_emptyList() {
        when(mongoDBManager.getWIPSData("col")).thenReturn(List.of());
        assertTrue(service.getWIPSDetailsData("col").isEmpty());
    }
}
