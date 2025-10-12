package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.PostInvoicingMonitoringService;
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

@WebMvcTest(PostInvoicingMonitoringController.class)
class PostInvoicingMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean PostInvoicingMonitoringService service;

    @Test
    void postInvoiceSummary() throws Exception {
        when(service.getCMAmortErrorSummaryView()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/post-invoice-error-summary"))
                .andExpect(status().isOk());
    }
}
