package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.RoleEntry;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UserRoleInfo;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommonServiceTest {

    @Mock private JdbcManager jdbcManager;
    @Mock private Common common;
    @Mock private CacheCommon cacheCommon;
    private CommonService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new CommonService(jdbcManager,
                "i2c", "sau", "rolErr", "par", "pft", "admin", "create", "update", "delete",
                "log", "pva", "pvs", "dm", "isau", "dsau", "esau",
                "ctlRoles", "ctlUA", "ctlUACreate", "ctlRoleInsert", "ctlRoleUpdate",
                "ctlUAUpdate", "ctlRoleDelete", "ctlUACheckDel", "ctlUAByUser");
        // Inject @Autowired fields
        setField("common", common);
        setField("cacheCommon", cacheCommon);
    }

    private void setField(String name, Object value) throws Exception {
        Field f = CommonService.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(service, value);
    }

    @Test void getInvoiceToCashSummary() {
        when(jdbcManager.queryForList("i2c")).thenReturn(List.of(Map.of("k", "v")));
        assertEquals(1, service.getInvoiceToCashSummary().size());
    }

    @Test void getMonitoringPeriodStatus() {
        Map<String, Object> row = new HashMap<>();
        row.put("END_DATE", "2024-01-01");
        when(jdbcManager.queryForList("rolErr")).thenReturn(List.of(row));
        List<Map<String, Object>> result = service.getMonitoringPeriodStatus();
        assertEquals(1, result.size());
        verify(common).formatDateColumns(any(), any());
    }

    @Test void getSummaryAssignmentUsers() {
        when(jdbcManager.queryForList("sau")).thenReturn(List.of());
        assertNotNull(service.getSummaryAssignmentUsers());
    }

    @Test void getAllUserRoles() {
        when(jdbcManager.queryForList("par")).thenReturn(List.of(Map.of("USER_ROLE", "ADMIN")));
        assertEquals(1, service.getAllUserRoles().size());
    }

    @Test
    void getUserRoles_found() {
        Map<String, Object> row = new HashMap<>();
        row.put("USER_NAME", "TESTUSER");
        row.put("USER_EMAIL", "test@cisco.com");
        row.put("ROLE_ID", 1);
        row.put("USER_ROLE", "ADMIN");
        when(jdbcManager.queryForList("par")).thenReturn(List.of(row));

        UserRoleInfo info = service.getUserRoles("testuser");
        assertNotNull(info);
        assertEquals("TESTUSER", info.getUsername());
        assertEquals(1, info.getUserRoles().size());
    }

    @Test
    void getUserRoles_notFound() {
        when(jdbcManager.queryForList("par")).thenReturn(List.of());
        assertNull(service.getUserRoles("nobody"));
    }

    @Test void getProcessFlowTotals() {
        when(jdbcManager.getProcessFlowTotal("pft", "comp")).thenReturn(List.of());
        assertNotNull(service.getProcessFlowTotals("comp"));
    }

    @Test void getAdminTable() {
        when(jdbcManager.queryForList("admin")).thenReturn(List.of());
        assertNotNull(service.getAdminTable());
    }

    @Test void getAdminTableFiltered() {
        when(jdbcManager.queryForListWithParams(anyString(), any(Object[].class))).thenReturn(List.of());
        assertNotNull(service.getAdminTableFiltered(List.of("ADMIN", "USER")));
    }

    @Test void getAdminTableFiltered_invalidRole_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.getAdminTableFiltered(List.of("bad!role")));
    }

    @Test void logPageVisit() {
        when(jdbcManager.executeUpdatePrimary(eq("log"), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.logPageVisit("testuser", "/home"));
    }

    @Test void getPageVisitAnalytics() {
        when(jdbcManager.queryForListWithParams(anyString(), anyInt())).thenReturn(List.of());
        assertNotNull(service.getPageVisitAnalytics(30));
    }

    @Test void getPageVisitSummary() {
        when(jdbcManager.queryForListWithParams(anyString(), anyInt())).thenReturn(List.of());
        assertNotNull(service.getPageVisitSummary(30));
    }

    @Test void getDashboardMetrics() {
        when(jdbcManager.queryForList("dm")).thenReturn(List.of(Map.of("metric", "value")));
        assertEquals(1, service.getDashboardMetrics().size());
    }

    @Test void insertSummaryAssignmentUser() {
        when(jdbcManager.insertSummaryAssignmentUser(eq("isau"), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.insertSummaryAssignmentUser(Map.of("name", "n", "email", "e", "team", "t")));
    }

    @Test void disableSummaryAssignmentUser() {
        when(jdbcManager.disableSummaryAssignmentUser("dsau", "email@test.com")).thenReturn(1);
        assertEquals(1, service.disableSummaryAssignmentUser("email@test.com"));
    }

    @Test void enableSummaryAssignmentUser() {
        when(jdbcManager.disableSummaryAssignmentUser("esau", "email@test.com")).thenReturn(1);
        assertEquals(1, service.enableSummaryAssignmentUser("email@test.com"));
    }

    @Test void getAllRoles() {
        when(jdbcManager.queryForList("ctlRoles")).thenReturn(List.of());
        assertNotNull(service.getAllRoles());
    }

    @Test void insertRole() {
        when(jdbcManager.insertCtlTwrRole(eq("ctlRoleInsert"), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.insertRole("RoleName", "RoleValue", "desc", "dash", "user1"));
    }

    @Test void insertRole_invalidName_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.insertRole("bad!@#", "value", "d", "d", "u"));
    }

    @Test void updateRole() {
        when(jdbcManager.updateCtlTwrRole(eq("ctlRoleUpdate"), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyInt())).thenReturn(1);
        assertEquals(1, service.updateRole(1, "RoleName", "RoleValue", "desc", "Y", "dash", "user1"));
    }

    @Test void updateRole_invalidFlag_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.updateRole(1, "Role", "Val", "d", "X", "d", "u"));
    }

    @Test void deleteRole() {
        when(jdbcManager.executeUpdatePrimary(eq("ctlRoleDelete"), anyString(), anyInt())).thenReturn(1);
        assertEquals(1, service.deleteRole(1, "user1"));
    }

    @Test void deleteRole_nullUsername_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.deleteRole(1, null));
    }

    @Test
    void createUserRole_success() {
        when(jdbcManager.insertUserRole(eq("create"), anyString(), anyString(), anyInt(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.createUserRole("testuser", "test@cisco.com", 1, "ADMIN", "Y", "creator"));
    }

    @Test void createUserRole_invalidEmail_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createUserRole("testuser", "bademail", 1, "ADMIN", "Y", "creator"));
    }

    @Test void createUserRole_shortUsername_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createUserRole("ab", "test@cisco.com", 1, "ADMIN", "Y", "creator"));
    }

    @Test
    void updateUserRole_success() {
        when(jdbcManager.updateUserRole(eq("update"), anyString(), anyInt(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.updateUserRole("testuser", "ADMIN", "test@cisco.com", 1, "Y"));
    }

    @Test void updateUserRole_invalidRole_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.updateUserRole("testuser", "bad!role", "test@cisco.com", 1, "Y"));
    }

    @Test
    void deleteUserRole_success() {
        when(jdbcManager.deleteUserRole(eq("delete"), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.deleteUserRole("testuser", "ADMIN", "2024-01-01", "deleter"));
    }

    @Test void deleteUserRole_nullDeleter_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.deleteUserRole("testuser", "ADMIN", "2024-01-01", null));
    }

    @Test void deleteUserRole_nullCreationDate_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.deleteUserRole("testuser", "ADMIN", null, "deleter"));
    }

    @Test
    void createAccessRole_success() {
        when(jdbcManager.insertCtlTwrUserAccessRole(eq("ctlUACreate"), anyString(), anyString(), anyString(), anyInt(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.createAccessRole("testuser", "test@cisco.com", "Test User", 1, "Y", "N", "creator"));
    }

    @Test void createAccessRole_invalidAdmin_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createAccessRole("testuser", "test@cisco.com", "name", 1, "X", "N", "creator"));
    }

    @Test void createAccessRole_nullCreatedBy_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createAccessRole("testuser", "test@cisco.com", "name", 1, "Y", "N", null));
    }

    @Test
    void updateAccessRole_success() {
        when(jdbcManager.updateCtlTwrUserAccessRole(eq("ctlUAUpdate"), anyString(), anyString(), anyString(), anyString(), anyString(), anyInt())).thenReturn(1);
        Map<String, Object> result = service.updateAccessRole("testuser", 1, "Y", "N", "N", "updater");
        assertEquals(1, result.get("rowsAffected"));
    }

    @Test
    void updateAccessRole_enableChecksDeleted() {
        when(jdbcManager.updateCtlTwrUserAccessRole(eq("ctlUAUpdate"), anyString(), anyString(), anyString(), anyString(), anyString(), anyInt())).thenReturn(1);
        when(jdbcManager.queryForListWithParams(eq("ctlUACheckDel"), anyString(), anyInt()))
                .thenReturn(List.of(Map.of("IS_DELETED", "TRUE")));
        Map<String, Object> result = service.updateAccessRole("testuser", 1, "Y", "N", "N", "updater");
        assertEquals("TRUE", result.get("isDeleted"));
    }

    @Test void updateAccessRole_invalidFlag_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.updateAccessRole("testuser", 1, "X", "N", "N", "updater"));
    }

    @Test
    void deleteAccessRole_success() {
        when(jdbcManager.updateCtlTwrUserAccessRole(eq("ctlUAUpdate"), anyString(), anyString(), anyString(), anyString(), anyString(), anyInt())).thenReturn(1);
        assertEquals(1, service.deleteAccessRole("testuser", 1, "deleter"));
    }

    @Test void deleteAccessRole_nullUpdater_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.deleteAccessRole("testuser", 1, null));
    }

    @Test void getAllUsersAccessList() {
        when(jdbcManager.queryForList("ctlUA")).thenReturn(List.of());
        assertNotNull(service.getAllUsersAccessList());
    }

    @Test
    void getUsersAccessListByUser_found() {
        Map<String, Object> row = new HashMap<>();
        row.put("USER_NAME", "TESTUSER");
        row.put("USER_EMAIL", "test@cisco.com");
        row.put("ROLE_ID", 1);
        row.put("ROLE_NAME", "ADMIN");
        row.put("ENABLED_FLAG", "Y");
        when(jdbcManager.queryForListWithSingleParam("ctlUAByUser", "TESTUSER")).thenReturn(List.of(row));

        UserRoleInfo info = service.getUsersAccessListByUser("testuser");
        assertNotNull(info);
        assertEquals("TESTUSER", info.getUsername());
    }

    @Test
    void getUsersAccessListByUser_notFound() {
        when(jdbcManager.queryForListWithSingleParam("ctlUAByUser", "NOBODY")).thenReturn(List.of());
        assertNull(service.getUsersAccessListByUser("nobody"));
    }

    @Test
    void getUsersAccessListByUser_allDisabled() {
        Map<String, Object> row = new HashMap<>();
        row.put("USER_NAME", "TESTUSER");
        row.put("ENABLED_FLAG", "N");
        when(jdbcManager.queryForListWithSingleParam("ctlUAByUser", "TESTUSER")).thenReturn(List.of(row));
        assertNull(service.getUsersAccessListByUser("testuser"));
    }
}
