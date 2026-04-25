package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Clob;
import java.sql.SQLException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CtmAiAlertsServiceTest {

    @Mock private JdbcManager jdbcManager;
    private CtmAiAlertsService service;

    @BeforeEach
    void setUp() {
        service = new CtmAiAlertsService(jdbcManager);
    }

    @Test
    void getAllAlerts_returnsList() {
        Map<String, Object> row = new HashMap<>();
        row.put("ID", 1);
        row.put("JOB_NAME", "job1");
        row.put("JOB_COMMAND", "cmd");
        row.put("JOB_LOG", null);
        row.put("JOB_OUTPUT", null);
        row.put("DOWNSTREAM_BLOCKED_JOBS", null);
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getAllAlerts();
        assertEquals(1, result.size());
        assertEquals("job1", result.get(0).get("JOB_NAME"));
    }

    @Test
    void getAllAlerts_convertsClobToString() throws SQLException {
        Clob clob = mock(Clob.class);
        when(clob.length()).thenReturn(5L);
        when(clob.getSubString(1, 5)).thenReturn("hello");

        Map<String, Object> row = new HashMap<>();
        row.put("JOB_COMMAND", clob);
        row.put("JOB_LOG", null);
        row.put("JOB_OUTPUT", null);
        row.put("DOWNSTREAM_BLOCKED_JOBS", null);
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getAllAlerts();
        assertEquals("hello", result.get(0).get("JOB_COMMAND"));
    }

    @Test
    void getAllAlerts_clobSqlException_setsNull() throws SQLException {
        Clob clob = mock(Clob.class);
        when(clob.length()).thenThrow(new SQLException("fail"));

        Map<String, Object> row = new HashMap<>();
        row.put("JOB_COMMAND", clob);
        row.put("JOB_LOG", null);
        row.put("JOB_OUTPUT", null);
        row.put("DOWNSTREAM_BLOCKED_JOBS", null);
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getAllAlerts();
        assertNull(result.get(0).get("JOB_COMMAND"));
    }

    @Test
    void getSummary_delegatesToJdbc() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(Map.of("total", 10)));
        List<Map<String, Object>> result = service.getSummary();
        assertEquals(1, result.size());
    }

    @Test
    void getAlertTypeDistribution_delegatesToJdbc() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertTrue(service.getAlertTypeDistribution().isEmpty());
    }

    @Test
    void getPriorityDistribution_delegatesToJdbc() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(Map.of("priority", "P1")));
        assertEquals(1, service.getPriorityDistribution().size());
    }

    @Test
    void getTopDownstreamBlocked_delegatesToJdbc() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getTopDownstreamBlocked());
    }

    @Test
    void getApplicationBreakdown_delegatesToJdbc() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(Map.of("APP", "X")));
        assertEquals(1, service.getApplicationBreakdown().size());
    }

    @Test
    void getHourlyTrend_delegatesToJdbc() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getHourlyTrend());
    }
}
