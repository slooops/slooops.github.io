package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.OperationsControlsService;
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

@WebMvcTest(OperationsControlsController.class)
class OperationsControlsControllerTest {
    @Autowired
    MockMvc mvc;

    @MockBean
    OperationsControlsService service;

    @Test
    @DisplayName("GET /api/rev-controls-errors-summary returns list")
    void getRevControlsErrorSummary() throws Exception {
        when(service.getRevControlsSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/rev-controls-errors-summary"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].k").value("v"));
    }
}
