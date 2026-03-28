package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.EspCaseManagerService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.PeriodCloseMonitoringService;
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

@WebMvcTest(PeriodCloseMonitoringController.class)
class PeriodCloseMonitoringControllerTest {
    @Autowired
    MockMvc mvc;
    @MockBean
    PeriodCloseMonitoringService service;
    @MockBean
    EspCaseManagerService espCaseManagerService;

    @Test
    @DisplayName("GET /api/period-close-invoice-stats returns list")
    void periodCloseInvoiceStats() throws Exception {
        when(service.getCloseInvStats()).thenReturn(List.of(Map.of("a", 1)));
        mvc.perform(get("/api/period-close-invoice-stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].a").value(1));
    }
}
