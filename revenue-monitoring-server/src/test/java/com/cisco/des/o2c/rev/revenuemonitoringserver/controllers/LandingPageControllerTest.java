package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.LandingPageService;
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

@WebMvcTest(LandingPageController.class)
class LandingPageControllerTest {

    @Autowired MockMvc mvc;
    @MockBean LandingPageService service;

    @Test void getLandingPagePeriodData() throws Exception {
        when(service.getLandingPagePeriodData()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/landing-page-period-data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].k").value("v"));
    }

    @Test void getLandingPageIssues() throws Exception {
        when(service.getLandingPageIssues()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/landing-page-issues")).andExpect(status().isOk());
    }

    @Test void getLandingPageHighPriorityIssues() throws Exception {
        when(service.getLandingPageHighPriorityIssues()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/landing-page-high-priority-issues")).andExpect(status().isOk());
    }

    @Test void getLandingPageIssuesList() throws Exception {
        when(service.getLandingPageIssuesList()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/landing-page-issues-list")).andExpect(status().isOk());
    }

    @Test void getLandingPageIssuesDistribution() throws Exception {
        when(service.getLandingPageIssuesDistribution()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/landing-page-issues-distribution")).andExpect(status().isOk());
    }

    @Test void getLandingPageTransactionFailures() throws Exception {
        when(service.getLandingPageTransactionFailures()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/landing-page-transaction-failures")).andExpect(status().isOk());
    }

    @Test void getLandingPageEspCases() throws Exception {
        when(service.getLandingPageEspCases()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/landing-page-esp-cases")).andExpect(status().isOk());
    }
}
