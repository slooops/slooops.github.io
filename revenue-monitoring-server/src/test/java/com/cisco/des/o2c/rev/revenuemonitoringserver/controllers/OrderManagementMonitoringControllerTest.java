package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.OrderManagementMonitoringService;
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

@WebMvcTest(OrderManagementMonitoringController.class)
class OrderManagementMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean OrderManagementMonitoringService service;

    // --- Import ---
    @Test void omImportSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_import_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-import-summary")).andExpect(status().isOk());
    }
    @Test void omImportDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_import_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-import-details")).andExpect(status().isOk());
    }
    @Test void omImportDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-import-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omImportSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-import-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Holds ---
    @Test void omHoldsSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_holds_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-holds-summary")).andExpect(status().isOk());
    }
    @Test void omHoldsDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_holds_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-holds-details")).andExpect(status().isOk());
    }
    @Test void omHoldsDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-holds-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omHoldsSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-holds-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Bookings ---
    @Test void omBookingsSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_bookings_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-bookings-summary")).andExpect(status().isOk());
    }
    @Test void omBookingsDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_bookings_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-bookings-details")).andExpect(status().isOk());
    }
    @Test void omBookingsDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-bookings-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omBookingsSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-bookings-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Workflow ---
    @Test void omWorkflowSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_workflow_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-workflow-summary")).andExpect(status().isOk());
    }
    @Test void omWorkflowDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_workflow_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-workflow-details")).andExpect(status().isOk());
    }
    @Test void omWorkflowDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-workflow-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omWorkflowSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-workflow-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Processing ---
    @Test void omProcessingSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_processing_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-processing-summary")).andExpect(status().isOk());
    }
    @Test void omProcessingDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_processing_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-processing-details")).andExpect(status().isOk());
    }
    @Test void omProcessingDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-processing-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omProcessingSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-processing-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Distribution ---
    @Test void omDistributionSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_distribution_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-distribution-summary")).andExpect(status().isOk());
    }
    @Test void omDistributionDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_distribution_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-distribution-details")).andExpect(status().isOk());
    }
    @Test void omDistributionDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-distribution-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omDistributionSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-distribution-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Attribution ---
    @Test void omAttributionSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_attribution_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-attribution-summary")).andExpect(status().isOk());
    }
    @Test void omAttributionDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_attribution_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-attribution-details")).andExpect(status().isOk());
    }
    @Test void omAttributionDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-attribution-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omAttributionSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-attribution-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }

    // --- Jobs ---
    @Test void omJobsSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_jobs_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-jobs-summary")).andExpect(status().isOk());
    }
    @Test void omJobsDetails() throws Exception {
        when(service.getOMDetailsData("om_control_tower_jobs_detail_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-jobs-details")).andExpect(status().isOk());
    }
    @Test void omJobsDetailsFiltered() throws Exception {
        when(service.getOMDetailsDataFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-jobs-details-filtered").param("timestamps","T1").param("scenarios","S1")).andExpect(status().isOk());
    }
    @Test void omJobsSummaryUpdate() throws Exception {
        when(service.updateOmSummary(anyString(),anyMap())).thenReturn(1L);
        mvc.perform(post("/api/om-jobs-summary-update").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\"}")).andExpect(status().isOk());
    }
}
