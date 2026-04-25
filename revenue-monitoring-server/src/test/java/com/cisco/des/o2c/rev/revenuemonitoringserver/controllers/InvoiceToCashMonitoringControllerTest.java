package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.InvoiceToCashMonitoringService;
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

@WebMvcTest(InvoiceToCashMonitoringController.class)
class InvoiceToCashMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean InvoiceToCashMonitoringService service;

    // --- Credit Card Check (4 params) ---
    @Test void creditCardCheckSummary() throws Exception {
        when(service.getCreditCardCheckSummaryView()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/credit-card-check-summary-view")).andExpect(status().isOk());
    }
    @Test void creditCardCheckDetail() throws Exception {
        when(service.getCreditCardCheckDetailView()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/credit-card-check-detail-view")).andExpect(status().isOk());
    }
    @Test void creditCardCheckDetailFiltered() throws Exception {
        when(service.getCreditCardCheckDetailFilteredView(anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/credit-card-check-detail-view-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("holdApplyDates","2024-01-01").param("processFlows","PF1"))
                .andExpect(status().isOk());
    }
    @Test void creditCardCheckSummaryUpdate() throws Exception {
        when(service.updateCreditCardCheckSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/credit-card-check-summary-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}"))
                .andExpect(status().isOk());
    }

    // --- Pre-Invoice Error (5 params) ---
    @Test void preInvoiceErrorSummary() throws Exception {
        when(service.getPreInvoiceErrorSummaryView()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pre-invoice-error-summary")).andExpect(status().isOk());
    }
    @Test void preInvoiceErrorDetails() throws Exception {
        when(service.getPreInvoiceErrorDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pre-invoice-error-details")).andExpect(status().isOk());
    }
    @Test void preInvoiceErrorDetailsFiltered() throws Exception {
        when(service.getPreInvoiceErrorDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/pre-invoice-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void preInvoiceErrorSummaryUpdate() throws Exception {
        when(service.updatePreInvoiceErrorSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/pre-invoice-error-summary-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}"))
                .andExpect(status().isOk());
    }

    // --- Auto Invoice Error (4 params) ---
    @Test void autoInvoiceErrorSummary() throws Exception {
        when(service.getAutoInvoiceErrorSummaryView()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/auto-invoice-error-summary")).andExpect(status().isOk());
    }
    @Test void autoInvoiceErrorDetails() throws Exception {
        when(service.getAutoInvoiceErrorDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/auto-invoice-error-details")).andExpect(status().isOk());
    }
    @Test void autoInvoiceErrorDetailsFiltered() throws Exception {
        when(service.getAutoInvoiceErrorDetailsFiltered(anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/auto-invoice-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void autoInvoiceErrorSummaryUpdate() throws Exception {
        when(service.updateAutoInvoiceErrorSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/auto-invoice-error-summary-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}"))
                .andExpect(status().isOk());
    }

    // --- eInvoicing Error (5 params) ---
    @Test void einvoicingErrorSummary() throws Exception {
        when(service.getEInvoicingSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/einvoicing-error-summary")).andExpect(status().isOk());
    }
    @Test void einvoicingErrorDetails() throws Exception {
        when(service.getEInvoicingDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/einvoicing-error-details")).andExpect(status().isOk());
    }
    @Test void einvoicingErrorDetailsFiltered() throws Exception {
        when(service.getEInvoicingDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/einvoicing-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void einvoicingErrorSummaryUpdate() throws Exception {
        when(service.updateEInvoicingErrorSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/einvoicing-error-summary-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}"))
                .andExpect(status().isOk());
    }

    // --- Fusion Error (5 params) ---
    @Test void fusionErrorSummary() throws Exception {
        when(service.getFusionErrorSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/fusion-error-summary")).andExpect(status().isOk());
    }
    @Test void fusionErrorDetails() throws Exception {
        when(service.getFusionDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/fusion-error-details")).andExpect(status().isOk());
    }
    @Test void fusionErrorDetailsFiltered() throws Exception {
        when(service.getFusionDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/fusion-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("processFlows","PF1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
    @Test void fusionErrorSummaryUpdate() throws Exception {
        when(service.updateFusionErrorSummary(anyMap())).thenReturn(1);
        mvc.perform(post("/api/fusion-error-summary-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}"))
                .andExpect(status().isOk());
    }
}
