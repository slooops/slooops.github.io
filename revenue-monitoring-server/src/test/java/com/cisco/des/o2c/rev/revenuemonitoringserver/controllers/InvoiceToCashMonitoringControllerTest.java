package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.InvoiceToCashMonitoringService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InvoiceToCashMonitoringController.class)
class InvoiceToCashMonitoringControllerTest {
    @Autowired
    MockMvc mvc;
    @MockBean
    InvoiceToCashMonitoringService service;

    @Test
    @DisplayName("GET /api/credit-card-check-summary-view returns list")
    void creditCardCheckSummary() throws Exception {
        when(service.getCreditCardCheckSummaryView()).thenReturn(List.of(Map.of("x","y")));
        mvc.perform(get("/api/credit-card-check-summary-view"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].x").value("y"));
    }
}
