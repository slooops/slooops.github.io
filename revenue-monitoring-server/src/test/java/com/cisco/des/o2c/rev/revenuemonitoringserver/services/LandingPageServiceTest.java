package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

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
class LandingPageServiceTest {

    @Mock private JdbcManager jdbcManager;
    @Mock private Common common;
    private LandingPageService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new LandingPageService(jdbcManager, "q1", "q2", "q3", "q4", "q5", "q6", "q7");
        // Inject @Autowired common
        Field f = LandingPageService.class.getDeclaredField("common");
        f.setAccessible(true);
        f.set(service, common);
    }

    @Test
    void getLandingPagePeriodData_formatsDate() {
        Map<String, Object> row = new HashMap<>();
        row.put("PERIOD_END_DATE", "2024-01-01");
        when(jdbcManager.queryForList("q1")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getLandingPagePeriodData();
        assertEquals(1, result.size());
        verify(common).formatDateColumns(any(), any());
    }

    @Test
    void getLandingPageIssues_returnsList() {
        when(jdbcManager.queryForList("q2")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getLandingPageIssues().size());
    }

    @Test
    void getLandingPageHighPriorityIssues_returnsList() {
        when(jdbcManager.queryForList("q3")).thenReturn(List.of());
        assertTrue(service.getLandingPageHighPriorityIssues().isEmpty());
    }

    @Test
    void getLandingPageIssuesList_formatsAndRenames() {
        Map<String, Object> row = new HashMap<>();
        row.put("LAST_UPDATED_DATE", "2024-01-01");
        row.put("FUNCTIONAL)AREA", "test");
        when(jdbcManager.queryForList("q4")).thenReturn(List.of(row));

        service.getLandingPageIssuesList();
        verify(common).formatDateColumns(any(), any());
        verify(common).renameKey(any(), eq("FUNCTIONAL)AREA"), eq("FUNCTIONAL_AREA"));
    }

    @Test
    void getLandingPageIssuesDistribution_returnsList() {
        when(jdbcManager.queryForList("q5")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getLandingPageIssuesDistribution().size());
    }

    @Test
    void getLandingPageTransactionFailures_returnsList() {
        when(jdbcManager.queryForList("q6")).thenReturn(List.of());
        assertNotNull(service.getLandingPageTransactionFailures());
    }

    @Test
    void getLandingPageEspCases_returnsList() {
        when(jdbcManager.queryForList("q7")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getLandingPageEspCases().size());
    }
}
