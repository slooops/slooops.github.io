package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.BusinessInsightsMonitoringService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BusinessInsightsMonitoringController.class)
class BusinessInsightsMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean BusinessInsightsMonitoringService service;

    @Test
    void issueReporting() throws Exception {
        when(service.getIssueReportingData()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/issue-reporting"))
                .andExpect(status().isOk());
    }

    @Test
    void uploadIssueReport() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file","test.csv","text/csv","a,b".getBytes());
        mvc.perform(multipart("/api/issue-reporting-upload").file(file).param("username","bob"))
                .andExpect(status().isOk());
        verify(service).insertIssueReportingData(any(), eq("bob"));
    }
}
