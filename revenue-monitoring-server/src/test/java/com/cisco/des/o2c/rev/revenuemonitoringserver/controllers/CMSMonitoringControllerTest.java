package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CMSMonitoringService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CMSMonitoringController.class)
@TestPropertySource(properties = "CORS_URL=http://localhost")
class CMSMonitoringControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CMSMonitoringService cmsMonitoringService;

    @Test
    @DisplayName("GET /api/cms/getdata?query=unpostedSummary returns data from service")
    void getData_unpostedSummary_ok() throws Exception {
        List<Map<String, Object>> sample = List.of(Map.of("k", "v"));
        when(cmsMonitoringService.getUnpostedSummaryData()).thenReturn(sample);

        mockMvc.perform(get("/api/cms/getdata").param("query", "unpostedSummary"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].k").value("v"));

        verify(cmsMonitoringService).getUnpostedSummaryData();
    }
}
