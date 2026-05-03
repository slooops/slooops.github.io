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

    // ── GET endpoints ───────────────────────────────────────────────────────────

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
        when(service.getUserRoles("bob")).thenReturn(new UserRoleInfo("bob","bob@example.com", List.of(new RoleEntry(1, "ADMIN", "N"))));
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

    @Test void adminTableFiltered() throws Exception {
        when(service.getAdminTableFiltered(anyList())).thenReturn(List.of(Map.of("a","1")));
        mvc.perform(get("/api/admin-table").param("managedRoles","ADMIN,VIEWER"))
                .andExpect(status().isOk());
        verify(service).getAdminTableFiltered(anyList());
    }

    @Test void adminTableFilteredEmptyRoles() throws Exception {
        when(service.getAdminTable()).thenReturn(List.of());
        mvc.perform(get("/api/admin-table").param("managedRoles","  "))
                .andExpect(status().isOk());
        verify(service).getAdminTable();
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
        when(service.getUsersAccessListByUser("BOB")).thenReturn(new UserRoleInfo("BOB","bob@b.com", List.of()));
        mvc.perform(get("/api/user-access-list-by-user").param("userName","bob")).andExpect(status().isOk());
    }

    @Test void usersAccessListByUserNull() throws Exception {
        when(service.getUsersAccessListByUser("BOB")).thenReturn(null);
        mvc.perform(get("/api/user-access-list-by-user").param("userName","bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userRoles").isArray());
    }

    @Test void pageVisitAnalytics() throws Exception {
        when(service.getPageVisitAnalytics(30)).thenReturn(List.of(Map.of("p","home")));
        mvc.perform(get("/api/page-visit-analytics")).andExpect(status().isOk());
    }

    @Test void pageVisitSummary() throws Exception {
        when(service.getPageVisitSummary(30)).thenReturn(List.of(Map.of("s","1")));
        mvc.perform(get("/api/page-visit-summary")).andExpect(status().isOk());
    }

    // ── POST /api/user-role (createUserRole) ────────────────────────────────────

    @Test void createUserRoleSuccess() throws Exception {
        when(service.createUserRole(any(),any(),any(),any(),any(),any())).thenReturn(1);
        mvc.perform(post("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userEmail\":\"bob@cisco.com\",\"roleId\":1,\"userRole\":\"ADMIN\",\"enabledFlag\":\"Y\",\"createdBy\":\"ALICE\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test void createUserRoleDuplicate() throws Exception {
        when(service.createUserRole(any(),any(),any(),any(),any(),any())).thenReturn(0);
        mvc.perform(post("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userEmail\":\"bob@cisco.com\",\"roleId\":1,\"userRole\":\"ADMIN\",\"enabledFlag\":\"Y\",\"createdBy\":\"ALICE\"}"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test void createUserRoleException() throws Exception {
        when(service.createUserRole(any(),any(),any(),any(),any(),any())).thenThrow(new RuntimeException("DB error"));
        mvc.perform(post("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userEmail\":\"bob@cisco.com\",\"roleId\":1,\"userRole\":\"ADMIN\",\"enabledFlag\":\"Y\",\"createdBy\":\"ALICE\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── PUT /api/user-role (updateUserRole) ─────────────────────────────────────

    @Test void updateUserRoleSuccess() throws Exception {
        when(service.updateUserRole(any(),any(),any(),any(),any())).thenReturn(1);
        mvc.perform(put("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userRole\":\"ADMIN\",\"userEmail\":\"bob@cisco.com\",\"roleId\":1,\"enabledFlag\":\"Y\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test void updateUserRoleNotFound() throws Exception {
        when(service.updateUserRole(any(),any(),any(),any(),any())).thenReturn(0);
        mvc.perform(put("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userRole\":\"ADMIN\",\"userEmail\":\"bob@cisco.com\",\"roleId\":1,\"enabledFlag\":\"Y\"}"))
                .andExpect(status().isNotFound());
    }

    @Test void updateUserRoleException() throws Exception {
        when(service.updateUserRole(any(),any(),any(),any(),any())).thenThrow(new RuntimeException("DB"));
        mvc.perform(put("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userRole\":\"ADMIN\",\"userEmail\":\"bob@cisco.com\",\"roleId\":1,\"enabledFlag\":\"Y\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── DELETE /api/user-role (deleteUserRole) ──────────────────────────────────

    @Test void deleteUserRoleSuccess() throws Exception {
        when(service.deleteUserRole(any(),any(),any(),any())).thenReturn(1);
        mvc.perform(delete("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userRole\":\"ADMIN\",\"creationDate\":\"2024-01-01\",\"deleterUsername\":\"ALICE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test void deleteUserRoleNotFound() throws Exception {
        when(service.deleteUserRole(any(),any(),any(),any())).thenReturn(0);
        mvc.perform(delete("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userRole\":\"ADMIN\",\"creationDate\":\"2024-01-01\",\"deleterUsername\":\"ALICE\"}"))
                .andExpect(status().isNotFound());
    }

    @Test void deleteUserRoleMissingFields() throws Exception {
        mvc.perform(delete("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void deleteUserRoleException() throws Exception {
        when(service.deleteUserRole(any(),any(),any(),any())).thenThrow(new RuntimeException("DB"));
        mvc.perform(delete("/api/user-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"BOB\",\"userRole\":\"ADMIN\",\"creationDate\":\"2024-01-01\",\"deleterUsername\":\"ALICE\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── POST /api/log-page-visit ────────────────────────────────────────────────

    @Test void logPageVisit() throws Exception {
        when(service.logPageVisit(anyString(),anyString())).thenReturn(1);
        mvc.perform(post("/api/log-page-visit")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"alice\",\"pageRoute\":\"/home\"}"))
                .andExpect(status().isOk());
    }

    @Test void logPageVisitEmptyUser() throws Exception {
        when(service.logPageVisit(eq("LOCAL_TESTING"),anyString())).thenReturn(1);
        mvc.perform(post("/api/log-page-visit")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"\",\"pageRoute\":\"/home\"}"))
                .andExpect(status().isOk());
    }

    @Test void logPageVisitMissingRoute() throws Exception {
        mvc.perform(post("/api/log-page-visit")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"alice\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void logPageVisitException() throws Exception {
        when(service.logPageVisit(anyString(),anyString())).thenThrow(new RuntimeException("DB"));
        mvc.perform(post("/api/log-page-visit")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"alice\",\"pageRoute\":\"/home\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── POST /api/insert-role ───────────────────────────────────────────────────

    @Test void insertRoleSuccess() throws Exception {
        when(service.insertRole(any(),any(),any(),any(),any())).thenReturn(1);
        mvc.perform(post("/api/insert-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleName\":\"VIEWER\",\"roleValue\":\"viewer\",\"description\":\"View only\",\"dashboardName\":\"main\",\"username\":\"admin\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test void insertRoleDuplicate() throws Exception {
        when(service.insertRole(any(),any(),any(),any(),any())).thenReturn(0);
        mvc.perform(post("/api/insert-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleName\":\"VIEWER\",\"roleValue\":\"viewer\",\"description\":\"d\",\"dashboardName\":\"m\",\"username\":\"admin\"}"))
                .andExpect(status().isConflict());
    }

    @Test void insertRoleValidationError() throws Exception {
        when(service.insertRole(any(),any(),any(),any(),any())).thenThrow(new IllegalArgumentException("bad input"));
        mvc.perform(post("/api/insert-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleName\":\"X\",\"roleValue\":\"x\",\"description\":\"d\",\"dashboardName\":\"m\",\"username\":\"admin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void insertRoleException() throws Exception {
        when(service.insertRole(any(),any(),any(),any(),any())).thenThrow(new RuntimeException("DB"));
        mvc.perform(post("/api/insert-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleName\":\"X\",\"roleValue\":\"x\",\"description\":\"d\",\"dashboardName\":\"m\",\"username\":\"admin\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── PUT /api/update-role ────────────────────────────────────────────────────

    @Test void updateRoleSuccess() throws Exception {
        when(service.updateRole(anyInt(),any(),any(),any(),any(),any(),any())).thenReturn(1);
        mvc.perform(put("/api/update-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1,\"roleName\":\"ADMIN\",\"roleValue\":\"admin\",\"description\":\"d\",\"enabledFlag\":\"Y\",\"dashboardName\":\"m\",\"username\":\"admin\"}"))
                .andExpect(status().isOk());
    }

    @Test void updateRoleNotFound() throws Exception {
        when(service.updateRole(anyInt(),any(),any(),any(),any(),any(),any())).thenReturn(0);
        mvc.perform(put("/api/update-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":999,\"roleName\":\"X\",\"roleValue\":\"x\",\"description\":\"d\",\"enabledFlag\":\"Y\",\"dashboardName\":\"m\",\"username\":\"admin\"}"))
                .andExpect(status().isNotFound());
    }

    @Test void updateRoleValidationError() throws Exception {
        when(service.updateRole(anyInt(),any(),any(),any(),any(),any(),any())).thenThrow(new IllegalArgumentException("bad"));
        mvc.perform(put("/api/update-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1,\"roleName\":\"X\",\"roleValue\":\"x\",\"description\":\"d\",\"enabledFlag\":\"Y\",\"dashboardName\":\"m\",\"username\":\"admin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void updateRoleException() throws Exception {
        when(service.updateRole(anyInt(),any(),any(),any(),any(),any(),any())).thenThrow(new RuntimeException("DB"));
        mvc.perform(put("/api/update-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1,\"roleName\":\"X\",\"roleValue\":\"x\",\"description\":\"d\",\"enabledFlag\":\"Y\",\"dashboardName\":\"m\",\"username\":\"admin\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── DELETE /api/delete-role ──────────────────────────────────────────────────

    @Test void deleteRoleSuccess() throws Exception {
        when(service.deleteRole(anyInt(),any())).thenReturn(1);
        mvc.perform(delete("/api/delete-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1,\"username\":\"admin\"}"))
                .andExpect(status().isOk());
    }

    @Test void deleteRoleNotFound() throws Exception {
        when(service.deleteRole(anyInt(),any())).thenReturn(0);
        mvc.perform(delete("/api/delete-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":999,\"username\":\"admin\"}"))
                .andExpect(status().isNotFound());
    }

    @Test void deleteRoleMissingUsername() throws Exception {
        mvc.perform(delete("/api/delete-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1,\"username\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void deleteRoleValidationError() throws Exception {
        when(service.deleteRole(anyInt(),any())).thenThrow(new IllegalArgumentException("bad"));
        mvc.perform(delete("/api/delete-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1,\"username\":\"admin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void deleteRoleException() throws Exception {
        when(service.deleteRole(anyInt(),any())).thenThrow(new RuntimeException("DB"));
        mvc.perform(delete("/api/delete-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1,\"username\":\"admin\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── POST /api/create-user-access-role ───────────────────────────────────────

    @Test void createUserAccessRoleSuccess() throws Exception {
        when(service.createAccessRole(anyString(),anyString(),anyString(),anyInt(),anyString(),anyString(),anyString())).thenReturn(1);
        mvc.perform(post("/api/create-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\",\"roleId\":1,\"admin\":\"N\",\"readOnly\":\"N\",\"createdBy\":\"admin\"}"))
                .andExpect(status().isCreated());
    }

    @Test void createUserAccessRoleDuplicate() throws Exception {
        when(service.createAccessRole(anyString(),anyString(),anyString(),anyInt(),anyString(),anyString(),anyString())).thenReturn(0);
        mvc.perform(post("/api/create-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\",\"roleId\":1,\"admin\":\"N\",\"readOnly\":\"N\",\"createdBy\":\"admin\"}"))
                .andExpect(status().isConflict());
    }

    @Test void createUserAccessRoleMissingUserName() throws Exception {
        mvc.perform(post("/api/create-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\",\"roleId\":1}"))
                .andExpect(status().isBadRequest());
    }

    @Test void createUserAccessRoleMissingRoleId() throws Exception {
        mvc.perform(post("/api/create-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void createUserAccessRoleException() throws Exception {
        when(service.createAccessRole(anyString(),anyString(),anyString(),anyInt(),anyString(),anyString(),anyString())).thenThrow(new RuntimeException("DB"));
        mvc.perform(post("/api/create-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\",\"roleId\":1,\"admin\":\"N\",\"readOnly\":\"N\",\"createdBy\":\"admin\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── POST /api/bulk-create-user-access-roles ─────────────────────────────────

    @Test void bulkCreateSuccess() throws Exception {
        when(service.createAccessRole(anyString(),any(),any(),anyInt(),anyString(),anyString(),anyString())).thenReturn(1);
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"users\":[{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\"}],\"roleIds\":[1,2],\"createdBy\":\"admin\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalInserted").value(2));
    }

    @Test void bulkCreateMissingUsers() throws Exception {
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleIds\":[1],\"createdBy\":\"admin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void bulkCreateMissingRoleIds() throws Exception {
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"users\":[{\"userName\":\"bob\"}],\"createdBy\":\"admin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void bulkCreateMissingCreatedBy() throws Exception {
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"users\":[{\"userName\":\"bob\"}],\"roleIds\":[1]}"))
                .andExpect(status().isBadRequest());
    }

    @Test void bulkCreatePartialFailure() throws Exception {
        when(service.createAccessRole(anyString(),any(),any(),anyInt(),anyString(),anyString(),anyString()))
                .thenReturn(1).thenThrow(new RuntimeException("DB"));
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"users\":[{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\"}],\"roleIds\":[1,2],\"createdBy\":\"admin\"}"))
                .andExpect(status().isCreated());
    }

    @Test void bulkCreateAllFailed() throws Exception {
        when(service.createAccessRole(anyString(),any(),any(),anyInt(),anyString(),anyString(),anyString()))
                .thenThrow(new RuntimeException("DB"));
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"users\":[{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\"}],\"roleIds\":[1],\"createdBy\":\"admin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void bulkCreateSkipEmptyUserName() throws Exception {
        when(service.createAccessRole(anyString(),any(),any(),anyInt(),anyString(),anyString(),anyString())).thenReturn(1);
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"users\":[{\"userName\":\"\",\"userEmail\":\"b@b.com\"},{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\"}],\"roleIds\":[1],\"createdBy\":\"admin\"}"))
                .andExpect(status().isCreated());
    }

    @Test void bulkCreateDuplicateSkipped() throws Exception {
        when(service.createAccessRole(anyString(),any(),any(),anyInt(),anyString(),anyString(),anyString())).thenReturn(0);
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("{\"users\":[{\"userName\":\"bob\",\"userEmail\":\"b@b.com\",\"fullName\":\"Bob\"}],\"roleIds\":[1],\"createdBy\":\"admin\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalSkipped").value(1));
    }

    @Test void bulkCreateException() throws Exception {
        mvc.perform(post("/api/bulk-create-user-access-roles").contentType(MediaType.APPLICATION_JSON)
                .content("invalid json"))
                .andExpect(status().isBadRequest());
    }

    // ── PUT /api/update-user-access-role ────────────────────────────────────────

    @Test void updateUserAccessRoleSuccess() throws Exception {
        when(service.updateAccessRole(anyString(),anyInt(),any(),any(),any(),any()))
                .thenReturn(Map.of("rowsAffected", 1));
        mvc.perform(put("/api/update-user-access-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"bob\",\"roleId\":1,\"enabledFlag\":\"Y\",\"admin\":\"N\",\"readOnly\":\"N\",\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isOk());
    }

    @Test void updateUserAccessRoleNotFound() throws Exception {
        when(service.updateAccessRole(anyString(),anyInt(),any(),any(),any(),any()))
                .thenReturn(Map.of("rowsAffected", 0));
        mvc.perform(put("/api/update-user-access-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"bob\",\"roleId\":1,\"enabledFlag\":\"Y\",\"admin\":\"N\",\"readOnly\":\"N\",\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isNotFound());
    }

    @Test void updateUserAccessRoleWithDeleted() throws Exception {
        when(service.updateAccessRole(anyString(),anyInt(),any(),any(),any(),any()))
                .thenReturn(Map.of("rowsAffected", 1, "isDeleted", true));
        mvc.perform(put("/api/update-user-access-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"bob\",\"roleId\":1,\"enabledFlag\":\"Y\",\"admin\":\"N\",\"readOnly\":\"N\",\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDeleted").value(true));
    }

    @Test void updateUserAccessRoleMissingUserName() throws Exception {
        mvc.perform(put("/api/update-user-access-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleId\":1}"))
                .andExpect(status().isBadRequest());
    }

    @Test void updateUserAccessRoleMissingRoleId() throws Exception {
        mvc.perform(put("/api/update-user-access-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"bob\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void updateUserAccessRoleException() throws Exception {
        when(service.updateAccessRole(anyString(),anyInt(),any(),any(),any(),any()))
                .thenThrow(new RuntimeException("DB"));
        mvc.perform(put("/api/update-user-access-role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userName\":\"bob\",\"roleId\":1,\"enabledFlag\":\"Y\",\"admin\":\"N\",\"readOnly\":\"N\",\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isInternalServerError());
    }

    // ── PUT /api/delete-user-access-role ────────────────────────────────────────

    @Test void deleteUserAccessRoleSuccess() throws Exception {
        when(service.deleteAccessRole(anyString(),anyInt(),anyString())).thenReturn(1);
        mvc.perform(put("/api/delete-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"roleId\":1,\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isOk());
    }

    @Test void deleteUserAccessRoleNotFound() throws Exception {
        when(service.deleteAccessRole(anyString(),anyInt(),anyString())).thenReturn(0);
        mvc.perform(put("/api/delete-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"roleId\":1,\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isNotFound());
    }

    @Test void deleteUserAccessRoleMissingFields() throws Exception {
        mvc.perform(put("/api/delete-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"roleId\":1,\"lastUpdatedBy\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test void deleteUserAccessRoleException() throws Exception {
        when(service.deleteAccessRole(anyString(),anyInt(),anyString())).thenThrow(new RuntimeException("DB"));
        mvc.perform(put("/api/delete-user-access-role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"userName\":\"bob\",\"roleId\":1,\"lastUpdatedBy\":\"admin\"}"))
                .andExpect(status().isInternalServerError());
    }
}
