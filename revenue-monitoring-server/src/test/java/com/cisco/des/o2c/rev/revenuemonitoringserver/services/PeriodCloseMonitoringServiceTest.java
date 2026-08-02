package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PeriodCloseMonitoringServiceTest {

    @Mock private JdbcManager jdbcManager;
    private PeriodCloseMonitoringService service;

    @BeforeEach
    void setUp() {
        service = new PeriodCloseMonitoringService(jdbcManager,
                "invStats", "intLoad", "startEnd", "volume", "meStatus",
                "qeCash", "dashComments", "updComments", "estComp", "periodName");
    }

    @Test void getCloseInvStats() {
        when(jdbcManager.queryForList("invStats")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getCloseInvStats().size());
    }

    @Test void getCloseStartEndTime() {
        when(jdbcManager.queryForList("startEnd")).thenReturn(List.of());
        assertTrue(service.getCloseStartEndTime().isEmpty());
    }

    @Test void getCloseVolume() {
        when(jdbcManager.queryForList("volume")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getCloseVolume().size());
    }

    @Test void getCloseMEStatus() {
        when(jdbcManager.queryForList("meStatus")).thenReturn(List.of());
        assertNotNull(service.getCloseMEStatus());
    }

    @Test void getCloseQECashCollected() {
        when(jdbcManager.queryForList("qeCash")).thenReturn(List.of());
        assertNotNull(service.getCloseQECashCollected());
    }

    @Test void getDashboardComments() {
        when(jdbcManager.queryForList("dashComments")).thenReturn(List.of(Map.of("comment", "hi")));
        assertEquals(1, service.getDashboardComments().size());
    }

    @Test void updateDashboardComments() {
        when(jdbcManager.updateComments("updComments", "PRECLOSE", "test comment")).thenReturn(1);
        assertEquals(1, service.updateDashboardComments("test comment", "PRECLOSE"));
    }

    @Test
    void getPeriodCloseInterfaceLoad_monthEnd() {
        // Period name returns a non-quarter month (e.g., FEB)
        when(jdbcManager.queryForList("periodName")).thenReturn(List.of(Map.of("PERIOD_NAME", "FEB-24")));

        Map<String, Object> row = new HashMap<>();
        row.put("LINE_TYPE", "Revenue");
        row.put("CLOSE_TYPE", "PRECLOSE");
        row.put("PERIOD_NAME", "FEB-24");
        row.put("QUARTER", "Q3FY24");
        row.put("LINE_COUNT", 100);
        row.put("MOM_PERCENTAGE", 5.0);
        row.put("PQM_PERCENTAGE", 3.0);
        row.put("QOQ_PERCENTAGE", null);
        row.put("YOY_PERCENTAGE", null);
        when(jdbcManager.queryForList("intLoad")).thenReturn(List.of(row));

        Map<String, List<Map<String, Object>>> result = service.getPeriodCloseInterfaceLoad();
        assertNotNull(result.get("PRECLOSE"));
        assertNotNull(result.get("MIDCLOSE"));
        assertFalse(result.get("PRECLOSE").isEmpty());
    }

    @Test
    void getPeriodCloseInterfaceLoad_quarterEnd() {
        when(jdbcManager.queryForList("periodName")).thenReturn(List.of(Map.of("PERIOD_NAME", "JAN-25")));

        Map<String, Object> row = new HashMap<>();
        row.put("LINE_TYPE", "Revenue");
        row.put("CLOSE_TYPE", "MIDCLOSE");
        row.put("PERIOD_NAME", "JAN-25");
        row.put("QUARTER", "Q3FY25");
        row.put("LINE_COUNT", 200);
        row.put("QOQ_PERCENTAGE", 10.0);
        row.put("YOY_PERCENTAGE", 8.0);
        row.put("MOM_PERCENTAGE", null);
        row.put("PQM_PERCENTAGE", null);
        when(jdbcManager.queryForList("intLoad")).thenReturn(List.of(row));

        Map<String, List<Map<String, Object>>> result = service.getPeriodCloseInterfaceLoad();
        assertFalse(result.get("MIDCLOSE").isEmpty());
    }

    @Test
    void getPeriodCloseInterfaceLoad_emptyData() {
        when(jdbcManager.queryForList("periodName")).thenReturn(List.of(Map.of("PERIOD_NAME", "MAR-25")));
        when(jdbcManager.queryForList("intLoad")).thenReturn(List.of());

        Map<String, List<Map<String, Object>>> result = service.getPeriodCloseInterfaceLoad();
        assertTrue(result.get("PRECLOSE").isEmpty());
        assertTrue(result.get("MIDCLOSE").isEmpty());
    }

    @Test
    void getEstimatedCompletionTime_stringDate() {
        Map<String, Object> row = new HashMap<>();
        row.put("ESTIMATED_COMPLETION_TIME", "2024-01-15T14:30:00+00:00");
        when(jdbcManager.queryForList("estComp")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getEstimatedCompletionTime();
        assertEquals("14:30:00", result.get(0).get("ESTIMATED_COMPLETION_TIME"));
    }

    @Test
    void getEstimatedCompletionTime_nonStringValue() {
        Map<String, Object> row = new HashMap<>();
        row.put("ESTIMATED_COMPLETION_TIME", 12345);
        when(jdbcManager.queryForList("estComp")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getEstimatedCompletionTime();
        assertEquals(12345, result.get(0).get("ESTIMATED_COMPLETION_TIME"));
    }
}
