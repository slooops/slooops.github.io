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
class CaseIQMonitoringServiceTest {

    @Mock private JdbcManager jdbcManager;
    private CaseIQMonitoringService service;

    @BeforeEach
    void setUp() {
        service = new CaseIQMonitoringService(jdbcManager);
    }

    // ─── computeHealthScore ─────────────────────────────────────────────────────

    @Test
    void computeHealthScore_noData() {
        Map<String, Object> data = new HashMap<>();
        data.put("TOTAL_PROCESSED", 0);
        Map<String, Object> result = service.computeHealthScore(data, true);
        assertEquals(0.0, result.get("health_score"));
        assertEquals("NO_DATA", result.get("health_status"));
    }

    @Test
    void computeHealthScore_healthy() {
        Map<String, Object> data = new HashMap<>();
        data.put("TOTAL_PROCESSED", 100);
        data.put("NOT_SUPPORTED_CNT", 0);
        data.put("SUCCESS_CNT", 95);
        data.put("PARTIAL_CNT", 3);
        data.put("ERROR_CNT", 1);
        data.put("UNKNOWN_CNT", 1);
        data.put("NULL_STATUS_CNT", 0);
        data.put("NOT_DEFINED_CNT", 0);
        data.put("NULL_CATEGORY_CNT", 0);
        data.put("UNKNOWN_TEAM_CNT", 0);
        data.put("GHOST_SUCCESS_CNT", 0);
        data.put("EXCEPTION_CNT", 0);
        data.put("MINUTES_SINCE_LAST_RUN", 5.0);
        data.put("AVG_PROCESSING_MINUTES", 1.0);
        Map<String, Object> result = service.computeHealthScore(data, true);
        double score = (Double) result.get("health_score");
        assertTrue(score >= 90);
        assertEquals("HEALTHY", result.get("health_status"));
    }

    @Test
    void computeHealthScore_critical() {
        Map<String, Object> data = new HashMap<>();
        data.put("TOTAL_PROCESSED", 100);
        data.put("NOT_SUPPORTED_CNT", 0);
        data.put("SUCCESS_CNT", 10);
        data.put("PARTIAL_CNT", 0);
        data.put("ERROR_CNT", 40);
        data.put("UNKNOWN_CNT", 10);
        data.put("NULL_STATUS_CNT", 20);
        data.put("NOT_DEFINED_CNT", 10);
        data.put("NULL_CATEGORY_CNT", 5);
        data.put("UNKNOWN_TEAM_CNT", 5);
        data.put("GHOST_SUCCESS_CNT", 5);
        data.put("EXCEPTION_CNT", 5);
        data.put("MINUTES_SINCE_LAST_RUN", 120.0);
        data.put("AVG_PROCESSING_MINUTES", 10.0);
        Map<String, Object> result = service.computeHealthScore(data, true);
        assertEquals("CRITICAL", result.get("health_status"));
    }

    @Test
    void computeHealthScore_warning() {
        Map<String, Object> data = new HashMap<>();
        data.put("TOTAL_PROCESSED", 100);
        data.put("NOT_SUPPORTED_CNT", 0);
        data.put("SUCCESS_CNT", 70);
        data.put("PARTIAL_CNT", 5);
        data.put("ERROR_CNT", 10);
        data.put("UNKNOWN_CNT", 5);
        data.put("NULL_STATUS_CNT", 3);
        data.put("NOT_DEFINED_CNT", 2);
        data.put("NULL_CATEGORY_CNT", 2);
        data.put("UNKNOWN_TEAM_CNT", 1);
        data.put("GHOST_SUCCESS_CNT", 1);
        data.put("EXCEPTION_CNT", 1);
        data.put("MINUTES_SINCE_LAST_RUN", 30.0);
        data.put("AVG_PROCESSING_MINUTES", 5.0);
        Map<String, Object> result = service.computeHealthScore(data, true);
        double score = (Double) result.get("health_score");
        assertTrue(score >= 70 && score < 90, "Expected WARNING range, got " + score);
        assertEquals("WARNING", result.get("health_status"));
    }

    @Test
    void computeHealthScore_nullValues() {
        Map<String, Object> data = new HashMap<>();
        data.put("TOTAL_PROCESSED", 50);
        // all other counts null
        Map<String, Object> result = service.computeHealthScore(data, true);
        assertNotNull(result.get("health_score"));
    }

    // ─── getHealthOverview ──────────────────────────────────────────────────────

    @Test
    void getHealthOverview_emptyRows_returnsNoData() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        Map<String, Object> result = service.getHealthOverview(24, null);
        assertEquals("NO_DATA", result.get("health_status"));
    }

    @Test
    void getHealthOverview_withData() {
        Map<String, Object> row = new HashMap<>();
        row.put("TOTAL_PROCESSED", 10);
        row.put("SUCCESS_CNT", 10);
        row.put("NOT_SUPPORTED_CNT", 0);
        row.put("PARTIAL_CNT", 0);
        row.put("ERROR_CNT", 0);
        row.put("UNKNOWN_CNT", 0);
        row.put("NULL_STATUS_CNT", 0);
        row.put("NOT_DEFINED_CNT", 0);
        row.put("NULL_CATEGORY_CNT", 0);
        row.put("UNKNOWN_TEAM_CNT", 0);
        row.put("GHOST_SUCCESS_CNT", 0);
        row.put("EXCEPTION_CNT", 0);
        row.put("MINUTES_SINCE_LAST_RUN", 1.0);
        row.put("AVG_PROCESSING_MINUTES", 1.0);
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(row));

        Map<String, Object> result = service.getHealthOverview(24, null);
        assertNotNull(result.get("health_score"));
    }

    // ─── Query delegation methods ───────────────────────────────────────────────

    @Test void getGhostSuccess() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertTrue(service.getGhostSuccess(24, null).isEmpty());
    }

    @Test void getNullStatus() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getNullStatus(24, null).size());
    }

    @Test void getNotDefined() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getNotDefined(24, null));
    }

    @Test void getErrorNoReason() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getErrorNoReason(24, null));
    }

    @Test void getErrorBreakdown() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getErrorBreakdown(24, null));
    }

    @Test void getUnknownStatus() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getUnknownStatus(24, null));
    }

    @Test void getFailureStatus() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getFailureStatus(24, null));
    }

    @Test void getExceptions() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getExceptions(24, null));
    }

    @Test void getStaleness() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getStaleness());
    }

    @Test void getNullClassification() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getNullClassification(24, null));
    }

    @Test void getUnknownTeam() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getUnknownTeam(24, null));
    }

    @Test void getApiResolutionErrors() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getApiResolutionErrors(24, null));
    }

    @Test void getP90ProcessingTime_emptyRows() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        Map<String, Object> result = service.getP90ProcessingTime(24, null);
        assertEquals(0, result.get("TOTAL_RECORDS"));
    }

    @Test void getP90ProcessingTime_withData() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap()))
                .thenReturn(List.of(Map.of("TOTAL_RECORDS", 5, "P90_PROCESSING_SECS", 2.5)));
        Map<String, Object> result = service.getP90ProcessingTime(24, null);
        assertEquals(5, result.get("TOTAL_RECORDS"));
    }

    @Test void getResolutionDistribution() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getResolutionDistribution(24, null));
    }

    @Test void getAnalyzerDistribution() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getAnalyzerDistribution(24, null));
    }

    @Test void getProcessingTime() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getProcessingTime(24, null));
    }

    @Test void getThroughput() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getThroughput(24, null));
    }

    @Test void getTimeByStatus() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getTimeByStatus(24, null));
    }

    @Test void getTeamSummary() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getTeamSummary(24, null));
    }

    @Test void getDailyTrend() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getDailyTrend(7, null));
    }

    @Test void getTopErrors() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getTopErrors(24, null));
    }

    @Test void getTeamIssueMatrix() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getTeamIssueMatrix(24, null));
    }

    @Test void getIssueTrend_validType() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getIssueTrend("I2C", "GHOST_SUCCESS", null));
    }

    @Test void getIssueTrend_invalidType_returnsEmpty() {
        List<Map<String, Object>> result = service.getIssueTrend("I2C", "INVALID", null);
        assertTrue(result.isEmpty());
    }

    @Test void getIssueTrend_withFiscQtr() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getIssueTrend("I2C", "NOT_DEFINED", "Q1FY26"));
    }

    @Test void getDistinctQuarters() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap()))
                .thenReturn(List.of(Map.of("FISC_QTR", "Q1FY26"), Map.of("FISC_QTR", "Q2FY26")));
        List<String> quarters = service.getDistinctQuarters();
        assertEquals(2, quarters.size());
        assertEquals("Q1FY26", quarters.get(0));
    }

    @Test void getDistinctQuarters_nullValue() {
        Map<String, Object> row = new HashMap<>();
        row.put("FISC_QTR", null);
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of(row));
        assertTrue(service.getDistinctQuarters().isEmpty());
    }

    // ─── Fiscal quarter filtering ───────────────────────────────────────────────

    @Test void getGhostSuccess_withFiscQtr() {
        when(jdbcManager.queryWithNamedParams(anyString(), anyMap())).thenReturn(List.of());
        assertNotNull(service.getGhostSuccess(24, "Q1FY26"));
    }
}
