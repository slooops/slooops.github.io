package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.PostInvoicingMonitoringService;
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

@WebMvcTest(PostInvoicingMonitoringController.class)
class PostInvoicingMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean PostInvoicingMonitoringService service;

    // --- CM/Amort (Post Invoice) ---
    @Test void postInvoiceSummary() throws Exception {
        when(service.getCMAmortErrorSummaryView()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/post-invoice-error-summary")).andExpect(status().isOk());
    }
    @Test void postInvoiceDetails() throws Exception {
        when(service.getCMAmortErrorDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/post-invoice-error-details")).andExpect(status().isOk());
    }
    @Test void postInvoiceDetailsFiltered() throws Exception {
        when(service.getCMAmortErrorDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/post-invoice-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void postInvoiceSummaryUpdate() throws Exception {
        when(service.updateCMAmortErrorSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/post-invoice-error-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Print Error ---
    @Test void printErrorSummary() throws Exception {
        when(service.getPrintErrorSummaryView()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/print-error-summary")).andExpect(status().isOk());
    }
    @Test void printErrorDetails() throws Exception {
        when(service.getPrintErrorDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/print-error-details")).andExpect(status().isOk());
    }
    @Test void printErrorDetailsFiltered() throws Exception {
        when(service.getPrintErrorDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/print-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void printErrorSummaryUpdate() throws Exception {
        when(service.updatePrintErrorSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/print-error-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Credit Card Error ---
    @Test void creditCardErrorSummary() throws Exception {
        when(service.getCreditCardSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/credit-card-error-summary")).andExpect(status().isOk());
    }
    @Test void creditCardErrorDetails() throws Exception {
        when(service.getCreditCardDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/credit-card-error-details")).andExpect(status().isOk());
    }
    @Test void creditCardErrorDetailsFiltered() throws Exception {
        when(service.getCreditCardDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/credit-card-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }

    // --- RPO Extract ---
    @Test void rpoExtractSummary() throws Exception {
        when(service.getRpoExtractSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/rpo-extract-error-summary")).andExpect(status().isOk());
    }
    @Test void rpoExtractDetails() throws Exception {
        when(service.getRpoExtractDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/rpo-extract-error-details")).andExpect(status().isOk());
    }
    @Test void rpoExtractDetailsFiltered() throws Exception {
        when(service.getRpoExtractDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/rpo-extract-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void rpoExtractSummaryUpdate() throws Exception {
        when(service.updateRPOExtractSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/rpo-extract-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- SRT Process ---
    @Test void srtProcessSummary() throws Exception {
        when(service.getSrtProcessSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/srt-process-error-summary")).andExpect(status().isOk());
    }
    @Test void srtProcessDetails() throws Exception {
        when(service.getSrtProcessDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/srt-process-error-details")).andExpect(status().isOk());
    }
    @Test void srtProcessDetailsFiltered() throws Exception {
        when(service.getSRTProcessDetailsFiltered(anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/srt-process-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("processFlows","PF1").param("srtDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void srtProcessSummaryUpdate() throws Exception {
        when(service.updateSRTProcessSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/srt-process-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- PCM Application ---
    @Test void pcmApplicationSummary() throws Exception {
        when(service.getPCMApplicationSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pcm-application-summary")).andExpect(status().isOk());
    }
    @Test void pcmApplicationDetails() throws Exception {
        when(service.getPCMApplicationDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pcm-application-details")).andExpect(status().isOk());
    }
    @Test void pcmApplicationDetailsFiltered() throws Exception {
        when(service.getPCMApplicationDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pcm-application-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void pcmApplicationSummaryUpdate() throws Exception {
        when(service.updatePCMApplicationSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/pcm-application-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }
}
