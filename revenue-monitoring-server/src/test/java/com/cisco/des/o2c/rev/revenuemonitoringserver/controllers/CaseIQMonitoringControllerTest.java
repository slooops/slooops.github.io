package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CaseIQMonitoringService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CaseIQMonitoringController.class)
class CaseIQMonitoringControllerTest {

    @Autowired MockMvc mvc;
    @MockBean CaseIQMonitoringService service;

    @Test void healthOverview() throws Exception {
        when(service.getHealthOverview(anyInt(), any())).thenReturn(Map.of("score", 95));
        mvc.perform(get("/api/caseiq/health").param("lookbackHours", "24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(95));
    }

    @Test void ghostSuccess() throws Exception {
        when(service.getGhostSuccess(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/ghost-success"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].k").value("v"));
    }

    @Test void nullStatus() throws Exception {
        when(service.getNullStatus(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/null-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].k").value("v"));
    }

    @Test void notDefined() throws Exception {
        when(service.getNotDefined(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/not-defined"))
                .andExpect(status().isOk());
    }

    @Test void errorNoReason() throws Exception {
        when(service.getErrorNoReason(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/error-no-reason"))
                .andExpect(status().isOk());
    }

    @Test void errorBreakdown() throws Exception {
        when(service.getErrorBreakdown(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/error-breakdown"))
                .andExpect(status().isOk());
    }

    @Test void unknownStatus() throws Exception {
        when(service.getUnknownStatus(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/unknown-status"))
                .andExpect(status().isOk());
    }

    @Test void failure() throws Exception {
        when(service.getFailureStatus(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/failure"))
                .andExpect(status().isOk());
    }

    @Test void exceptions() throws Exception {
        when(service.getExceptions(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/exceptions"))
                .andExpect(status().isOk());
    }

    @Test void staleness() throws Exception {
        when(service.getStaleness()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/staleness"))
                .andExpect(status().isOk());
    }

    @Test void nullClassification() throws Exception {
        when(service.getNullClassification(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/null-classification"))
                .andExpect(status().isOk());
    }

    @Test void unknownTeam() throws Exception {
        when(service.getUnknownTeam(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/unknown-team"))
                .andExpect(status().isOk());
    }

    @Test void resolutionErrors() throws Exception {
        when(service.getApiResolutionErrors(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/resolution-errors"))
                .andExpect(status().isOk());
    }

    @Test void resolutionDistribution() throws Exception {
        when(service.getResolutionDistribution(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/status/resolution"))
                .andExpect(status().isOk());
    }

    @Test void p90ProcessingTime() throws Exception {
        when(service.getP90ProcessingTime(anyInt(), any())).thenReturn(Map.of("p90", 120));
        mvc.perform(get("/api/caseiq/performance/p90-time"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.p90").value(120));
    }

    @Test void analyzerDistribution() throws Exception {
        when(service.getAnalyzerDistribution(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/status/analyzer"))
                .andExpect(status().isOk());
    }

    @Test void processingTime() throws Exception {
        when(service.getProcessingTime(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/performance/processing-time"))
                .andExpect(status().isOk());
    }

    @Test void throughput() throws Exception {
        when(service.getThroughput(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/performance/throughput"))
                .andExpect(status().isOk());
    }

    @Test void timeByStatus() throws Exception {
        when(service.getTimeByStatus(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/performance/time-by-status"))
                .andExpect(status().isOk());
    }

    @Test void teamSummary() throws Exception {
        when(service.getTeamSummary(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/volume/team-summary"))
                .andExpect(status().isOk());
    }

    @Test void dailyTrend() throws Exception {
        when(service.getDailyTrend(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/volume/daily-trend"))
                .andExpect(status().isOk());
    }

    @Test void topErrors() throws Exception {
        when(service.getTopErrors(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/volume/top-errors"))
                .andExpect(status().isOk());
    }

    @Test void teamIssueMatrix() throws Exception {
        when(service.getTeamIssueMatrix(anyInt(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/team-issue-matrix"))
                .andExpect(status().isOk());
    }

    @Test void issueTrend() throws Exception {
        when(service.getIssueTrend(anyString(), anyString(), any())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/caseiq/anomalies/issue-trend")
                .param("team", "T1").param("issueType", "ghost"))
                .andExpect(status().isOk());
    }

    @Test void availableQuarters() throws Exception {
        when(service.getDistinctQuarters()).thenReturn(List.of("FY25Q1", "FY25Q2"));
        mvc.perform(get("/api/caseiq/quarters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("FY25Q1"));
    }
}
