package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.RoleEntry;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UserRoleInfo;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CommonService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommonController.class)
class CommonControllerTest {
    @Autowired MockMvc mvc;
    @MockBean CommonService service;

    @Test void invoiceToCashSummary() throws Exception {
        when(service.getInvoiceToCashSummary()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/invoice-to-cash-summary")).andExpect(status().isOk());
    }

    @Test void summaryAssignmentUsers() throws Exception {
        when(service.getSummaryAssignmentUsers()).thenReturn(List.of(Map.of("user","alice")));
        mvc.perform(get("/api/summary-assignment-users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].user").value("alice"));
    }

    @Test void monitoringPeriodStatus() throws Exception {
        when(service.getMonitoringPeriodStatus()).thenReturn(List.of(Map.of("s","open")));
        mvc.perform(get("/api/monitoring-period-status")).andExpect(status().isOk());
    }

    @Test void allUserRoles() throws Exception {
        when(service.getAllUserRoles()).thenReturn(List.of(Map.of("role","ADMIN")));
        mvc.perform(get("/api/user-roles")).andExpect(status().isOk());
    }

    @Test void userRole() throws Exception {
        when(service.getUserRoles("bob")).thenReturn(new UserRoleInfo("bob","bob@example.com", List.of(new RoleEntry(1, "ADMIN"))));
        mvc.perform(get("/api/user-role").param("username","bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"));
    }

    @Test void processFlowTotal() throws Exception {
        when(service.getProcessFlowTotals("I2C")).thenReturn(List.of(Map.of("total","100")));
        mvc.perform(get("/api/process-flow-total").param("compName","I2C")).andExpect(status().isOk());
    }

    @Test void adminTable() throws Exception {
        when(service.getAdminTable()).thenReturn(List.of(Map.of("a","1")));
        mvc.perform(get("/api/admin-table")).andExpect(status().isOk());
    }

    @Test void dashboardMetrics() throws Exception {
        when(service.getDashboardMetrics()).thenReturn(List.of(Map.of("m","1")));
        mvc.perform(get("/api/dashboard-metrics")).andExpect(status().isOk());
    }

    @Test void insertSummaryAssignmentUser() throws Exception {
        when(service.insertSummaryAssignmentUser(anyMap())).thenReturn(1);
        mvc.perform(post("/api/insert-summary-assignment-user")
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"a@b.com\"}"))
                .andExpect(status().isOk());
    }

    @Test void disableSummaryAssignmentUser() throws Exception {
        when(service.disableSummaryAssignmentUser("a@b.com")).thenReturn(1);
        mvc.perform(get("/api/disable-summary-assignment-user").param("email","a@b.com"))
                .andExpect(status().isOk());
    }

    @Test void enableSummaryAssignmentUser() throws Exception {
        when(service.enableSummaryAssignmentUser("a@b.com")).thenReturn(1);
        mvc.perform(get("/api/enable-summary-assignment-user").param("email","a@b.com"))
                .andExpect(status().isOk());
    }

    @Test void allRoles() throws Exception {
        when(service.getAllRoles()).thenReturn(List.of(Map.of("r","ADMIN")));
        mvc.perform(get("/api/roles")).andExpect(status().isOk());
    }

    @Test void usersAccessList() throws Exception {
        when(service.getAllUsersAccessList()).thenReturn(List.of(Map.of("u","alice")));
        mvc.perform(get("/api/user-access-list")).andExpect(status().isOk());
    }

    @Test void usersAccessListByUser() throws Exception {
        when(service.getUsersAccessListByUser("bob")).thenReturn(new UserRoleInfo("bob","bob@b.com", List.of()));
        mvc.perform(get("/api/user-access-list-by-user").param("userName","bob")).andExpect(status().isOk());
    }

    @Test void logPageVisit() throws Exception {
        when(service.logPageVisit(anyString(),anyString())).thenReturn(1);
        mvc.perform(post("/api/log-page-visit")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"alice\",\"pageRoute\":\"/home\"}"))
                .andExpect(status().isOk());
    }

    @Test void pageVisitAnalytics() throws Exception {
        when(service.getPageVisitAnalytics(30)).thenReturn(List.of(Map.of("p","home")));
        mvc.perform(get("/api/page-visit-analytics")).andExpect(status().isOk());
    }

    @Test void pageVisitSummary() throws Exception {
        when(service.getPageVisitSummary(30)).thenReturn(List.of(Map.of("s","1")));
        mvc.perform(get("/api/page-visit-summary")).andExpect(status().isOk());
    }

    @Test void createUserAccessRole() throws Exception {
        when(service.createAccessRole(anyString(),anyString(),anyString(),anyInt(),anyString(),anyString(),anyString())).thenReturn(1);
        mvc.perform(post("/api/create-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\",\"roleId\":1,\"admin\":\"N\",\"readOnly\":\"N\",\"createdBy\":\"admin\"}"))
                .andExpect(status().isCreated());
    }

    @Test void deleteUserAccessRole() throws Exception {
        when(service.deleteAccessRole(anyString(),anyInt(),anyString())).thenReturn(1);
        mvc.perform(put("/api/delete-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"roleId\":1,\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isOk());
    }
}
