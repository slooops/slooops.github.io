package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.O2CMonitoringService;
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

@WebMvcTest(O2CMonitoringController.class)
class O2CMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean O2CMonitoringService service;

    @Test
    void orderSummary() throws Exception {
        when(service.getOrderSummary("1")).thenReturn(List.of(Map.of("id",1)));
        mvc.perform(get("/api/order-summary").param("orderIds","1"))
                .andExpect(status().isOk());
    }
}
