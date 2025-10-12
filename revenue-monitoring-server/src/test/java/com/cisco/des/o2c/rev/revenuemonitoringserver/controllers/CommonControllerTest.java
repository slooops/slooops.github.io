package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UserRoleInfo;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CommonService;
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

@WebMvcTest(CommonController.class)
class CommonControllerTest {
    @Autowired
    MockMvc mvc;
    @MockBean
    CommonService service;

    @Test
    @DisplayName("GET /api/summary-assignment-users returns list")
    void summaryAssignmentUsers() throws Exception {
        when(service.getSummaryAssignmentUsers()).thenReturn(List.of(Map.of("user","alice")));
        mvc.perform(get("/api/summary-assignment-users"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].user").value("alice"));
    }

    @Test
    @DisplayName("GET /api/user-role returns role info")
    void userRole() throws Exception {
    when(service.getUserRoles("bob")).thenReturn(new UserRoleInfo("bob","bob@example.com", List.of("ADMIN","USER")));
    mvc.perform(get("/api/user-role").param("username","bob"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.username").value("bob"))
        .andExpect(jsonPath("$.userEmail").value("bob@example.com"))
        .andExpect(jsonPath("$.userRoles[0]").value("ADMIN"));
    }
}
