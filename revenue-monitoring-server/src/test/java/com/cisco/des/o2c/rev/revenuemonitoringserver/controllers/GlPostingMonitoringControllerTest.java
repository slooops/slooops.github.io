package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.GLPostingMonitoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GlPostingMonitoringController.class)
class GlPostingMonitoringControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean GLPostingMonitoringService service;

    // GL Error
    @Test void getGlErrorSummary() throws Exception {
        when(service.getGlErrorSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-error-summary")).andExpect(status().isOk());
    }

    @Test void getGlErrorDetails() throws Exception {
        when(service.getGlErrorDetails()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-error-details")).andExpect(status().isOk());
    }

    @Test void getGlDetailsFiltered() throws Exception {
        when(service.getGlDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-details-filtered")
                .param("periodNames", "P1").param("applicationNames", "A1")
                .param("processFlows", "PF1").param("ledgerNames", "L1")
                .param("glBatchNames", "B1").param("transactionDates", "D1"))
                .andExpect(status().isOk());
    }

    @Test void updateGlErrorsSummary() throws Exception {
        when(service.updateGlErrorSummary(any())).thenReturn(1);
        mvc.perform(post("/api/gl-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u", "comments", "c"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }

    // AIT
    @Test void getGlInterfaceErrorSummary() throws Exception {
        when(service.getGlInterfaceErrorSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ait-error-summary")).andExpect(status().isOk());
    }

    @Test void getGlInterfaceErrorDetails() throws Exception {
        when(service.getGlInterfaceErrorDetails()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ait-error-details")).andExpect(status().isOk());
    }

    @Test void getAITGlInterfaceDetailsFilter() throws Exception {
        when(service.getAITGlInterfaceDetailsFilter(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ait-details-filtered")
                .param("userJeSourceNames", "S1").param("ledgerNames", "L1")
                .param("periodNames", "P1").param("batchNames", "B1")
                .param("dateCreateds", "D1"))
                .andExpect(status().isOk());
    }

    @Test void updateAITGlErrorSummary() throws Exception {
        when(service.updateAITGlErrorSummary(any())).thenReturn(1);
        mvc.perform(post("/api/ait-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }

    // FA Jobs
    @Test void getGlFaJobsSummary() throws Exception {
        when(service.getGlFaJobsSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-fa-jobs-summary")).andExpect(status().isOk());
    }

    @Test void getGlFaDetails() throws Exception {
        when(service.getGlFaDetails()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-fa-jobs-details")).andExpect(status().isOk());
    }

    @Test void getGlFaDetailsFilter() throws Exception {
        when(service.getGlFaDetailsFilter(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-fa-details-filtered")
                .param("jobDates", "D1").param("modules", "M1")
                .param("ctmFolders", "F1").param("ctmStatuss", "S1"))
                .andExpect(status().isOk());
    }

    @Test void updateGlFaErrorSummary() throws Exception {
        when(service.updateGlFaErrorSummary(any())).thenReturn(1);
        mvc.perform(post("/api/gl-fa-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }

    // Unposted
    @Test void getGlUnpostedErrorSummary() throws Exception {
        when(service.getGlUnpostedSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-unposted-error-summary")).andExpect(status().isOk());
    }

    @Test void getGlUnpostedErrorDetails() throws Exception {
        when(service.getGlUnpostedDetails()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-unposted-error-details")).andExpect(status().isOk());
    }

    @Test void getGlUnpostedDetailsFilter() throws Exception {
        when(service.getGlUnpostedDetailsFilter(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/gl-unposted-details-filtered")
                .param("userJeSourceNames", "S1").param("ledgerNames", "L1")
                .param("periodNames", "P1").param("batchNames", "B1"))
                .andExpect(status().isOk());
    }

    @Test void updateAITGlUnpostedErrorSummary() throws Exception {
        when(service.updateGlUnpostedErrorSummary(any())).thenReturn(1);
        mvc.perform(post("/api/gl-unposted-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }
}
