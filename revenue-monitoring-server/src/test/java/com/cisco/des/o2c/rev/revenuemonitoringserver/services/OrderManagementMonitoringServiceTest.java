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
class OrderManagementMonitoringServiceTest {

    @Mock private MongoDBManager mongoDBManager;
    @Mock private Common common;
    private OrderManagementMonitoringService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new OrderManagementMonitoringService(mongoDBManager);
        Field f = OrderManagementMonitoringService.class.getDeclaredField("common");
        f.setAccessible(true);
        f.set(service, common);
    }

    @Test
    void updateOmSummary_returns1() {
        when(mongoDBManager.updateSummaryData(anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1L);
        Map<String, String> data = Map.of("assignedTo", "user", "comments", "c", "timestamp", "ts", "scenario", "s", "status", "OPEN");
        assertEquals(1, service.updateOmSummary("col", data));
    }

    @Test
    void getOMDetailsDataFiltered_formatsAndRemoves() {
        Map<String, Object> row = new HashMap<>();
        row.put("assigned_date", "2024-01-01");
        row.put("assigned_data", "x");
        row.put("name", "test");
        when(mongoDBManager.getFilteredData("col", "ts", "sc")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getOMDetailsDataFiltered("col", "ts", "sc");
        assertEquals(1, result.size());
        verify(common).formatDateColumns(any(), any());
    }

    @Test
    void getOMDetailsData_formatsAndRemovesDate() {
        Map<String, Object> row = new HashMap<>();
        row.put("assigned_date", "2024-01-01");
        row.put("name", "test");
        when(mongoDBManager.getAllData("col")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getOMDetailsData("col");
        assertEquals(1, result.size());
        assertFalse(result.get(0).containsKey("assigned_date"));
    }

    @Test
    void getOMSummaryData_formatsAndRemovesClosedDate() {
        Map<String, Object> row = new HashMap<>();
        row.put("assigned_date", "2024-01-01");
        row.put("closed_date", "2024-02-01");
        row.put("created_date", "2024-01-01");
        when(mongoDBManager.getAllData("col")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getOMSummaryData("col");
        assertEquals(1, result.size());
        assertFalse(result.get(0).containsKey("closed_date"));
    }

    @Test
    void getOMDetailsData_emptyList() {
        when(mongoDBManager.getAllData("col")).thenReturn(List.of());
        assertTrue(service.getOMDetailsData("col").isEmpty());
    }
}
