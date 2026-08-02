package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EspCaseManagerServiceTest {

    @Mock private JdbcManager jdbcManager;
    @Mock private Common common;
    private EspCaseManagerService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new EspCaseManagerService(jdbcManager,
                "q1", "q2", "q3", "q4", "q5", "q6",
                "q7", "q8", "q9", "q10",
                "q11", "q12", "q13", "q14", "q15", "q16", "q17",
                "q18", "q19", "q20", "q21", "q22", "q23", "q24",
                "q25", "q26", "q27", "q28", "q29", "q30", "q31",
                "q32", "q33", "q34", "q35","q36", "q37");
        Field f = EspCaseManagerService.class.getDeclaredField("common");
        f.setAccessible(true);
        f.set(service, common);
    }

    @Test void getEspCaseServiceMetricSummary() {
        when(jdbcManager.queryForList("q2")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getEspCaseServiceMetricSummary().size());
    }

    @Test void getEspWeeklyComparisonSummary() {
        when(jdbcManager.queryForList("q3")).thenReturn(List.of());
        assertTrue(service.getEspWeeklyComparisonSummary().isEmpty());
    }

    @Test void getEspAgingCaseSummary() {
        when(jdbcManager.queryForList("q1")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getEspAgingCaseSummary().size());
    }

    @Test void getSbpEspCaseServiceMetricSummary() {
        when(jdbcManager.queryForList("q5")).thenReturn(List.of());
        assertNotNull(service.getSbpEspCaseServiceMetricSummary());
    }

    @Test void getSbpEspWeeklyComparisonSummary() {
        when(jdbcManager.queryForList("q6")).thenReturn(List.of());
        assertNotNull(service.getSbpEspWeeklyComparisonSummary());
    }

    @Test void getSbpEspAgingCaseSummary() {
        when(jdbcManager.queryForList("q4")).thenReturn(List.of());
        assertNotNull(service.getSbpEspAgingCaseSummary());
    }

    @Test void getVwI2cCategoryMatchStatus() {
        when(jdbcManager.queryForList("q7")).thenReturn(List.of());
        assertNotNull(service.getVwI2cCategoryMatchStatus());
    }

    @Test void getVwI2cCoreIssueMatchStatus() {
        when(jdbcManager.queryForList("q8")).thenReturn(List.of());
        assertNotNull(service.getVwI2cCoreIssueMatchStatus());
    }

    @Test void getXxcaseiqValidatedCasesAccuracyV() {
        when(jdbcManager.queryForList("q9")).thenReturn(List.of());
        assertNotNull(service.getXxcaseiqValidatedCasesAccuracyV());
    }

    @Test void getVwI2cCaseDetails() {
        when(jdbcManager.queryForList("q10")).thenReturn(List.of());
        assertNotNull(service.getVwI2cCaseDetails());
    }

    @Test void getXxcaseiqI2cCaseDetailsV_renamesKeys() {
        Map<String, Object> row = new HashMap<>();
        row.put("Cancel prediction", "yes");
        row.put("LLM Summary", "summary");
        when(jdbcManager.queryForList("q25")).thenReturn(List.of(row));

        service.getXxcaseiqI2cCaseDetailsV();
        verify(common).renameKey(any(), eq("Cancel prediction"), eq("CANCEL_PREDICTION"));
        verify(common).renameKey(any(), eq("LLM Summary"), eq("LLM_SUMMARY"));
    }

    @Test void getXxcaseiqI2cCaseDetailsMatchY() {
        when(jdbcManager.queryForList("q33")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getXxcaseiqI2cCaseDetailsMatchY().size());
    }

    @Test
    void espCaseAnalyzerGlobalSearch_null_returnsEmpty() throws IOException {
        assertTrue(service.espCaseAnalyzerGlobalSearch(null).isEmpty());
    }

    @Test
    void espCaseAnalyzerGlobalSearch_blank_returnsEmpty() throws IOException {
        assertTrue(service.espCaseAnalyzerGlobalSearch("  ").isEmpty());
    }

    @Test
    void espCaseAnalyzerGlobalSearch_multipleIncidents() throws IOException {
        when(jdbcManager.espCaseAnalyzerGlobalSearch("q34", "INC001")).thenReturn(List.of(Map.of("id", 1)));
        when(jdbcManager.espCaseAnalyzerGlobalSearch("q34", "INC002")).thenReturn(List.of(Map.of("id", 2)));

        List<Map<String, Object>> result = service.espCaseAnalyzerGlobalSearch("INC001,INC002");
        assertEquals(2, result.size());
    }

    @Test
    void espCaseAnalyzerGlobalSearch_emptyTokenSkipped() throws IOException {
        when(jdbcManager.espCaseAnalyzerGlobalSearch("q34", "INC001")).thenReturn(List.of(Map.of("id", 1)));
        List<Map<String, Object>> result = service.espCaseAnalyzerGlobalSearch("INC001,,");
        assertEquals(1, result.size());
    }

    @Test
    void getEspCaseAnalyzerMetrics_convertsFiscalQtr() {
        Map<String, Object> row = new HashMap<>();
        row.put("FISCAL_QTR", "Q2FY2026");
        when(jdbcManager.queryForList("q35")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getEspCaseAnalyzerMetrics();
        assertEquals("Q2FY26", result.get(0).get("FISCAL_QTR"));
    }

    @Test
    void getEspCaseAnalyzerMetrics_noConversionNeeded() {
        Map<String, Object> row = new HashMap<>();
        row.put("FISCAL_QTR", "Q2FY26");
        when(jdbcManager.queryForList("q35")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getEspCaseAnalyzerMetrics();
        assertEquals("Q2FY26", result.get(0).get("FISCAL_QTR"));
    }

    @Test
    void getEspCaseAnalyzerMetrics_nullFiscalQtr() {
        Map<String, Object> row = new HashMap<>();
        row.put("FISCAL_QTR", null);
        when(jdbcManager.queryForList("q35")).thenReturn(List.of(row));

        List<Map<String, Object>> result = service.getEspCaseAnalyzerMetrics();
        assertNull(result.get(0).get("FISCAL_QTR"));
    }
}
