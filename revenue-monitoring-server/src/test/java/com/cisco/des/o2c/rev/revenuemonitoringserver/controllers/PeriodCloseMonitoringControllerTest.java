package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.EspCaseManagerService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.PeriodCloseMonitoringService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PeriodCloseMonitoringController.class)
class PeriodCloseMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean PeriodCloseMonitoringService service;
    @MockBean EspCaseManagerService espCaseManagerService;

    @Test void periodCloseInvoiceStats() throws Exception {
        when(service.getCloseInvStats()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/period-close-invoice-stats")).andExpect(status().isOk());
    }

    @Test void periodCloseInterfaceLoad() throws Exception {
        when(service.getPeriodCloseInterfaceLoad()).thenReturn(Map.of("data", List.of(Map.of("k","v"))));
        mvc.perform(get("/api/period-close-interface-load")).andExpect(status().isOk());
    }

    @Test void precloseStartEndTime() throws Exception {
        when(service.getCloseStartEndTime()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/preclose-start-end-time")).andExpect(status().isOk());
    }

    @Test void precloseVolume() throws Exception {
        when(service.getCloseVolume()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/preclose-volume")).andExpect(status().isOk());
    }

    @Test void precloseMeStatus() throws Exception {
        when(service.getCloseMEStatus()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/preclose-me-status")).andExpect(status().isOk());
    }

    @Test void pcloseQeCashCollected() throws Exception {
        when(service.getCloseQECashCollected()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pclose-qe-cash-collected")).andExpect(status().isOk());
    }

    @Test void pcloseDashboardComments() throws Exception {
        when(service.getDashboardComments()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pclose-dashboard-comments")).andExpect(status().isOk());
    }

    @Test void updateDashboardComments() throws Exception {
        mvc.perform(post("/api/pclose-update-dashboard-comments")
                .contentType(MediaType.APPLICATION_JSON).content("\"comment,preclose\""))
                .andExpect(status().isOk());
        verify(service).updateDashboardComments(anyString(), anyString());
    }

    @Test void dashboardTimestamp() throws Exception {
        mvc.perform(get("/api/dashboard-timestamp")).andExpect(status().isOk());
    }

    @Test void dashboardCurrentTimestamp() throws Exception {
        mvc.perform(get("/api/dashboard-current-timestamp")).andExpect(status().isOk());
    }

    @Test void estimatedCompletionTime() throws Exception {
        when(service.getEstimatedCompletionTime()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/estimated-completion-time")).andExpect(status().isOk());
    }

    @Test void vwI2cCategoryMatchStatus() throws Exception {
        when(espCaseManagerService.getVwI2cCategoryMatchStatus()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/vw-i2c-category-match-status")).andExpect(status().isOk());
    }

    @Test void vwI2cCoreIssueMatchStatus() throws Exception {
        when(espCaseManagerService.getVwI2cCoreIssueMatchStatus()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/vw-i2c-core-issue-match-status")).andExpect(status().isOk());
    }

    @Test void xxcaseiqValidatedCasesAccuracyV() throws Exception {
        when(espCaseManagerService.getXxcaseiqValidatedCasesAccuracyV()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/xxcaseiq-validated-cases-accuracy-v")).andExpect(status().isOk());
    }

    @Test void vwI2cCaseDetails() throws Exception {
        when(espCaseManagerService.getVwI2cCaseDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/vw-i2c-case-details")).andExpect(status().isOk());
    }
}
