package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CtmAiAlertsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CtmAiAlertsController.class)
class CtmAiAlertsControllerTest {

    @Autowired MockMvc mvc;
    @MockBean CtmAiAlertsService service;

    @Test void allAlerts() throws Exception {
        when(service.getAllAlerts()).thenReturn(List.of(Map.of("id", 1)));
        mvc.perform(get("/api/ctm-alerts/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test void summary() throws Exception {
        when(service.getSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ctm-alerts/summary"))
                .andExpect(status().isOk());
    }

    @Test void alertTypeDistribution() throws Exception {
        when(service.getAlertTypeDistribution()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ctm-alerts/by-type"))
                .andExpect(status().isOk());
    }

    @Test void priorityDistribution() throws Exception {
        when(service.getPriorityDistribution()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ctm-alerts/by-priority"))
                .andExpect(status().isOk());
    }

    @Test void topDownstream() throws Exception {
        when(service.getTopDownstreamBlocked()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ctm-alerts/top-downstream"))
                .andExpect(status().isOk());
    }

    @Test void applicationBreakdown() throws Exception {
        when(service.getApplicationBreakdown()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ctm-alerts/by-application"))
                .andExpect(status().isOk());
    }

    @Test void hourlyTrend() throws Exception {
        when(service.getHourlyTrend()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/ctm-alerts/hourly-trend"))
                .andExpect(status().isOk());
    }
}
