package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.EspCaseManagerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EspCaseManagerController.class)
class EspCaseManagerControllerTest {
    @Autowired MockMvc mvc;
    @MockBean EspCaseManagerService service;

    @Test void espAgingCaseSummary() throws Exception {
        when(service.getEspAgingCaseSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/esp-aging-case-summary")).andExpect(status().isOk());
    }

    @Test void espCaseServiceMetricSummary() throws Exception {
        when(service.getEspCaseServiceMetricSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/esp-case-service-metric-summary")).andExpect(status().isOk());
    }

    @Test void espWeeklyComparisonSummary() throws Exception {
        when(service.getEspWeeklyComparisonSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/esp-weekly-comparison-summary")).andExpect(status().isOk());
    }

    @Test void sbpEspAgingCaseSummary() throws Exception {
        when(service.getSbpEspAgingCaseSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/sbp-esp-aging-case-summary")).andExpect(status().isOk());
    }

    @Test void sbpEspCaseServiceMetricSummary() throws Exception {
        when(service.getSbpEspCaseServiceMetricSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/sbp-esp-case-service-metric-summary")).andExpect(status().isOk());
    }

    @Test void sbpEspWeeklyComparisonSummary() throws Exception {
        when(service.getSbpEspWeeklyComparisonSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/sbp-esp-weekly-comparison-summary")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCategoryGraphVAit() throws Exception {
        when(service.getXxcaseiqCategoryGraphVAit()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-category-graph-v-ait")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCategoryGraphVCapital() throws Exception {
        when(service.getXxcaseiqCategoryGraphVCapital()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-category-graph-v-capital")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCategoryGraphVFpp() throws Exception {
        when(service.getXxcaseiqCategoryGraphVFpp()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-category-graph-v-fpp")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCategoryGraphVI2c() throws Exception {
        when(service.getXxcaseiqCategoryGraphVI2c()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-category-graph-v-i2c")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCategoryGraphVOm() throws Exception {
        when(service.getXxcaseiqCategoryGraphVOm()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-category-graph-v-om")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCategoryGraphVP2p() throws Exception {
        when(service.getXxcaseiqCategoryGraphVP2p()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-category-graph-v-p2p")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCategoryGraphVSm() throws Exception {
        when(service.getXxcaseiqCategoryGraphVSm()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-category-graph-v-sm")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCoreIssueGraphVAit() throws Exception {
        when(service.getXxcaseiqCoreIssueGraphVAit()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-core-issue-graph-v-ait")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCoreIssueGraphVCapital() throws Exception {
        when(service.getXxcaseiqCoreIssueGraphVCapital()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-core-issue-graph-v-capital")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCoreIssueGraphVFpp() throws Exception {
        when(service.getXxcaseiqCoreIssueGraphVFpp()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-core-issue-graph-v-fpp")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCoreIssueGraphVI2c() throws Exception {
        when(service.getXxcaseiqCoreIssueGraphVI2c()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-core-issue-graph-v-i2c")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCoreIssueGraphVOm() throws Exception {
        when(service.getXxcaseiqCoreIssueGraphVOm()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-core-issue-graph-v-om")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCoreIssueGraphVP2p() throws Exception {
        when(service.getXxcaseiqCoreIssueGraphVP2p()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-core-issue-graph-v-p2p")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCoreIssueGraphVSm() throws Exception {
        when(service.getXxcaseiqCoreIssueGraphVSm()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-core-issue-graph-v-sm")).andExpect(status().isOk());
    }

    @Test void xxcaseiqI2cCaseDetailsV() throws Exception {
        when(service.getXxcaseiqI2cCaseDetailsV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-i2c-case-details-v")).andExpect(status().isOk());
    }

    @Test void xxcaseiqI2cCaseDetailsMatchY() throws Exception {
        when(service.getXxcaseiqI2cCaseDetailsMatchY()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-i2c-case-details-match-y")).andExpect(status().isOk());
    }

    @Test void xxcaseiqAitCaseDetailsV() throws Exception {
        when(service.getXxcaseiqAitCaseDetailsV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-ait-case-details-v")).andExpect(status().isOk());
    }

    @Test void xxcaseiqFppCaseDetailsV() throws Exception {
        when(service.getXxcaseiqFppCaseDetailsV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-fpp-case-details-v")).andExpect(status().isOk());
    }

    @Test void xxcaseiqOmCaseDetailsV() throws Exception {
        when(service.getXxcaseiqOmCaseDetailsV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-om-case-details-v")).andExpect(status().isOk());
    }

    @Test void xxcaseiqSmCaseDetailsV() throws Exception {
        when(service.getXxcaseiqSmCaseDetailsV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-sm-case-details-v")).andExpect(status().isOk());
    }

    @Test void xxcaseiqP2pCaseDetailsV() throws Exception {
        when(service.getXxcaseiqP2pCaseDetailsV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-p2p-case-details-v")).andExpect(status().isOk());
    }

    @Test void xxcaseiqCapitalCaseDetailsV() throws Exception {
        when(service.getXxcaseiqCapitalCaseDetailsV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-capital-case-details-v")).andExpect(status().isOk());
    }

    @Test void espCaseAnalyzerTableUpdate() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file","cases.csv","text/csv","data".getBytes());
        mvc.perform(multipart("/api/xxcaseiq-esp-case-analyzer-table-update").file(file).param("username","alice"))
                .andExpect(status().isOk());
        verify(service).updateEspCaseAnalyzerTable(any(), eq("alice"));
    }

    @Test void espCaseManagerGlobalSearch() throws Exception {
        when(service.espCaseAnalyzerGlobalSearch("INC001")).thenReturn(List.of(Map.of("id","INC001")));
        mvc.perform(post("/api/xxcaseiq-global-search").param("incidentNumber","INC001"))
                .andExpect(status().isOk());
    }

    @Test void espCaseAnalyzerMetrics() throws Exception {
        when(service.getEspCaseAnalyzerMetrics()).thenReturn(List.of(Map.of("m","1")));
        mvc.perform(get("/api/xxcaseiq-metrics")).andExpect(status().isOk());
    }
}
