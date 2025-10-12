package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.OrderManagementMonitoringService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderManagementMonitoringController.class)
class OrderManagementMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean OrderManagementMonitoringService service;

    @Test
    void omImportSummary() throws Exception {
        when(service.getOMSummaryData("om_control_tower_import_summary_view")).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/om-import-summary"))
                .andExpect(status().isOk());
    }
}
