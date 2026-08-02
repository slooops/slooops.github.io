package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.WIPSMonitoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WIPSController.class)
class WIPSControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean WIPSMonitoringService service;

    @Test void getWIPSSummary() throws Exception {
        when(service.getWIPSSummaryData(anyString())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/wips-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].k").value("v"));
    }

    @Test void getWIPSDetails() throws Exception {
        when(service.getWIPSDetailsData(anyString())).thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/wips-details")).andExpect(status().isOk());
    }

    @Test void getOMJobsDetailsFiltered() throws Exception {
        when(service.getWIPSDetailsDataFiltered(anyString(), anyString(), anyString()))
                .thenReturn(List.of(Map.of("k", "v")));
        mvc.perform(get("/api/wips-jobs-details-filtered")
                .param("timestamps", "T1").param("scenarios", "S1"))
                .andExpect(status().isOk());
    }

    @Test void updateWIPSSummary() throws Exception {
        when(service.updateWIPSSummary(anyString(), any())).thenReturn(1L);
        mvc.perform(post("/api/wips-summary-update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("assignedTo", "u"))))
                .andExpect(status().isOk())
                .andExpect(content().string("User assignment successful."));
    }
}
