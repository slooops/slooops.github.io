package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.RevenueAccountingMonitoringService;
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

@WebMvcTest(RevenueAccountingMonitoringController.class)
class RevenueAccountingMonitoringControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean RevenueAccountingMonitoringService service;

    // Standard Revenue
    @Test void getStandardRevenueErrorSummary() throws Exception {
        when(service.getStandardRevenueSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/standard-revenue-errors-summary")).andExpect(status().isOk());
    }

    @Test void getStandardRevenueErrorDetails() throws Exception {
        when(service.getStandardRevenueDetails()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/standard-revenue-error-details")).andExpect(status().isOk());
    }

    @Test void getStandardRevenueDetailsFiltered() throws Exception {
        when(service.getStandardRevenueDetailsFiltered(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/standard-revenue-error-details-filtered")
                .param("periodNames", "P1").param("orgNames", "O1")
                .param("applicationNames", "A1").param("processFlows", "PF1")
                .param("transactionDates", "D1"))
                .andExpect(status().isOk());
    }

    @Test void updateStandardRevenueSummary() throws Exception {
        when(service.updateStandardRevenueSummary(any())).thenReturn(1);
        mvc.perform(post("/api/standard-revenue-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }

    // ROL Errors
    @Test void getRolErrorsSummary() throws Exception {
        when(service.getRolErrorsSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/rol-errors-summary")).andExpect(status().isOk());
    }

    @Test void getRolTransactionDetails() throws Exception {
        when(service.getRolErrorDetails()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/rol-transaction-data")).andExpect(status().isOk());
    }

    @Test void getRolTransactionDataFilter() throws Exception {
        when(service.getRolTransactionDetailsFilter(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/rol-transaction-data-filter")
                .param("periodNames", "P1").param("orgNames", "O1")
                .param("applicationNames", "A1").param("processFlows", "PF1")
                .param("sequenceNums", "1"))
                .andExpect(status().isOk());
    }

    @Test void updateRolErrorsSummary() throws Exception {
        when(service.updateRolErrorSummary(any())).thenReturn(1);
        mvc.perform(post("/api/rol-errors-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }

    // Accruals
    @Test void getAccrualsSummary() throws Exception {
        when(service.getAccrualsSummary()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/accruals-summary")).andExpect(status().isOk());
    }

    @Test void getAccrualsDetails() throws Exception {
        when(service.getAccrualsDetails()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/accruals-details")).andExpect(status().isOk());
    }

    @Test void getAccrualsDetailsFiltered() throws Exception {
        when(service.getAccrualsDetailsFiltered(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/accruals-details-filtered")
                .param("periodNames", "P1").param("orgNames", "O1")
                .param("applicationNames", "A1").param("processFlows", "PF1")
                .param("sequenceNums", "1"))
                .andExpect(status().isOk());
    }

    @Test void updateAccrualsErrorsSummary() throws Exception {
        when(service.updateAccrualsErrorSummary(any())).thenReturn(1);
        mvc.perform(post("/api/accruals-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }

    // TSP Account
    @Test void getTspAccountSummaryView() throws Exception {
        when(service.getTspAccountSummaryView()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/tsp-account-summary-view")).andExpect(status().isOk());
    }

    @Test void getTspAccountDetailView() throws Exception {
        when(service.getTspAccountDetailView()).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/tsp-account-detail-view")).andExpect(status().isOk());
    }

    @Test void getTspAccountDetailViewFiltered() throws Exception {
        when(service.getTspAccountDetailViewFiltered(anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/accounts-details-filtered")
                .param("sequenceNumbers", "1"))
                .andExpect(status().isOk());
    }

    @Test void updateTspAccountSummary() throws Exception {
        when(service.updateTspAccountSummary(any())).thenReturn(1);
        mvc.perform(post("/api/tsp-account-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }
}
