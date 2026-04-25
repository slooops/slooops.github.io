package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.OperationsControlsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OperationsControlsController.class)
class OperationsControlsControllerTest {
    @Autowired MockMvc mvc;
    @MockBean OperationsControlsService service;

    @Test void revControlsErrorSummary() throws Exception {
        when(service.getRevControlsSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/rev-controls-errors-summary")).andExpect(status().isOk());
    }

    @Test void revControlsErrorDetails() throws Exception {
        when(service.getRevControlsDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/rev-controls-error-details")).andExpect(status().isOk());
    }

    @Test void i2cControlsErrorSummary() throws Exception {
        when(service.geti2cControlsSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/i2c-controls-errors-summary")).andExpect(status().isOk());
    }

    @Test void i2cControlsErrorDetails() throws Exception {
        when(service.getI2CControlsDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/i2c-controls-error-details")).andExpect(status().isOk());
    }

    @Test void i2cControlsErrorDetailsFiltered() throws Exception {
        when(service.getI2CControlsDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/i2c-controls-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("transactionDates","2024-01-01").param("ruleNames","R1"))
                .andExpect(status().isOk());
    }

    @Test void revControlsErrorDetailsFiltered() throws Exception {
        when(service.getRevControlsDetailsFiltered(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/rev-controls-error-details-filtered")
                .param("periodNames","P1").param("orgNames","O1").param("applicationNames","A1").param("transactionDates","2024-01-01").param("ruleNames","R1"))
                .andExpect(status().isOk());
    }

    @Test void gtcControlsErrorSummary() throws Exception {
        when(service.getGtcControlsSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/gtc-controls-errors-summary")).andExpect(status().isOk());
    }

    @Test void gtcControlsErrorDetails() throws Exception {
        when(service.getGtcControlsDetails()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/gtc-controls-error-details")).andExpect(status().isOk());
    }

    @Test void gtcControlsErrorDetailsFiltered() throws Exception {
        when(service.getGtcControlsDetailsFiltered(anyString(),anyString(),anyString())).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/gtc-controls-error-details-filtered")
                .param("processFlows","PF1").param("bookingEntitys","BE1").param("transactionDates","2024-01-01"))
                .andExpect(status().isOk());
    }
}
