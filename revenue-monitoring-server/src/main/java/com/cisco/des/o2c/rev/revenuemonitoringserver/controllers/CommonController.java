package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.CreateUserRoleRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UserRoleInfo;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CommonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class CommonController {

    @Autowired
    CommonService service;

    // Summaries
    @GetMapping("/invoice-to-cash-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceoCashSummary() {
        return new ResponseEntity<>(service.getInvoiceToCashSummary(), HttpStatus.OK);
    }

    // Common Methods
    @GetMapping("/summary-assignment-users")
    public ResponseEntity<List<Map<String, Object>>> getSummaryAssignmentUsers() {
        return new ResponseEntity<>(service.getSummaryAssignmentUsers(), HttpStatus.OK);
    }

    @GetMapping("/monitoring-period-status")
    public ResponseEntity<List<Map<String, Object>>> getMonitoringPeriodStatus() {
        return new ResponseEntity<>(service.getMonitoringPeriodStatus(), HttpStatus.OK);
    }

    @GetMapping(value = "/user-roles")
    public ResponseEntity<List<Map<String, Object>>> getAllUserRoles() {
        return new ResponseEntity<>(service.getAllUserRoles(), HttpStatus.OK);
    }

    @GetMapping(value = "/user-role")
    public ResponseEntity<UserRoleInfo> getUserRoles(@RequestParam String username) {
        UserRoleInfo userRoles = service.getUserRoles(username);
        return ResponseEntity.status(HttpStatus.OK).body(userRoles);
    }

    @GetMapping(value = "/process-flow-total")
    public ResponseEntity<List<Map<String, Object>>> getProcessFlowtotal(@RequestParam String compName) {
        return new ResponseEntity<>(service.getProcessFlowTotals(compName), HttpStatus.OK);
    }

    @GetMapping("/admin-table")
    public ResponseEntity<List<Map<String, Object>>> getAdminTable(
            @RequestParam(required = false) String managedRoles) {
        // If managedRoles is provided (comma-separated), filter results to only show
        // users with those roles
        if (managedRoles != null && !managedRoles.trim().isEmpty()) {
            // Split comma-separated roles and trim/uppercase each
            String[] rolesArray = managedRoles.split(",");
            List<String> rolesList = new java.util.ArrayList<>();
            for (String role : rolesArray) {
                String trimmed = role.trim().toUpperCase();
                if (!trimmed.isEmpty()) {
                    rolesList.add(trimmed);
                }
            }
            if (!rolesList.isEmpty()) {
                return new ResponseEntity<>(service.getAdminTableFiltered(rolesList), HttpStatus.OK);
            }
        }
        return new ResponseEntity<>(service.getAdminTable(), HttpStatus.OK);
    }

    @PostMapping("/user-role")
    public ResponseEntity<Map<String, Object>> createUserRole(@RequestBody CreateUserRoleRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {

            // Call the service layer to insert into database
            int rowsAffected = service.createUserRole(
                    request.getUserName(),
                    request.getUserEmail(),
                    request.getRoleId(),
                    request.getUserRole(),
                    request.getEnabledFlag(),
                    request.getCreatedBy());

            // Check if insert was successful
            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "User role created successfully");
                response.put("rowsAffected", rowsAffected);
                return new ResponseEntity<>(response, HttpStatus.CREATED); // 201 status
            } else {
                response.put("success", false);
                response.put("message",
                        "Failed to create user role - duplicate active record exists (userName + userRole combination already in use)");
                return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR); // 500 status
            }

        } catch (Exception e) {
            // Handle any errors (database errors, validation errors, etc.)
            System.err.println("Error creating user role: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "Error creating user role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR); // 500 status
        }
    }

    @PutMapping("/user-role")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @RequestBody CreateUserRoleRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {

            // Call service layer using COMPOSITE KEY (userName + userRole)
            // Service returns number of rows affected (1 = success, 0 = not found)
            int rowsAffected = service.updateUserRole(
                    request.getUserName(), // WHERE clause (composite key part 1)
                    request.getUserRole(), // WHERE clause (composite key part 2)
                    request.getUserEmail(), // SET clause
                    request.getRoleId(), // SET clause
                    request.getEnabledFlag()); // SET clause

            // Check if update was successful
            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "User role updated successfully");
                response.put("rowsAffected", rowsAffected);
                return new ResponseEntity<>(response, HttpStatus.OK); // 200 status
            } else {
                // No rows affected - combination not found
                response.put("success", false);
                response.put("message", "User role combination not found (userName=" +
                        request.getUserName() + ", userRole=" + request.getUserRole() + ")");
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND); // 404 status
            }

        } catch (Exception e) {
            // Handle any errors (database errors, validation errors, etc.)
            System.err.println("Error updating user role: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "Error updating user role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR); // 500 status
        }
    }

    /**
     * DELETE endpoint to soft delete a user role with forensic tracking.
     * 
     * HTTP Method: DELETE
     * Endpoint: /api/user-role
     * Content-Type: application/json
     * 
     * SOFT DELETE MECHANISM:
     * - Does NOT remove row from database
     * - Sets USER_EMAIL to "deleted by: {deleterUsername}"
     * - Sets ENABLED_FLAG to NULL
     * - GET queries filter WHERE ENABLED_FLAG IS NOT NULL
     * 
     * Request Body Example:
     * {
     * "userName": "JASLOOP",
     * "userRole": "PERIOD_CLOSE",
     * "deleterUsername": "ADMIN_USER"
     * }
     * 
     * Backend Query:
     * UPDATE ... SET USER_EMAIL='deleted by: ADMIN_USER', ENABLED_FLAG=NULL
     * WHERE USER_NAME='JASLOOP' AND USER_ROLE='PERIOD_CLOSE'
     * 
     * @param request Must contain userName, userRole (composite key), and
     *                deleterUsername
     * @return ResponseEntity with success/error message
     * 
     *         Returns:
     *         - 200 OK: Soft delete successful
     *         - 404 NOT FOUND: No row matches userName + userRole
     *         - 500 INTERNAL SERVER ERROR: Validation or database error
     */
    @DeleteMapping("/user-role")
    public ResponseEntity<Map<String, Object>> deleteUserRole(
            @RequestBody Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            String userName = (String) request.get("userName");
            String userRole = (String) request.get("userRole");
            String creationDateStr = (String) request.get("creationDate");
            String deleterUsername = (String) request.get("deleterUsername");

            // Validate required fields
            if (userName == null || userRole == null || creationDateStr == null || deleterUsername == null) {
                response.put("success", false);
                response.put("message", "userName, userRole, creationDate, and deleterUsername are required");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }

            // Pass raw creation date string directly - JDBC will handle the conversion
            // This ensures exact match with database format (whether "2024-02-23" or
            // "2024-03-21 09:11:15")

            // Call service layer to perform soft delete
            int rowsAffected = service.deleteUserRole(userName, userRole, creationDateStr, deleterUsername);

            if (rowsAffected > 0) {
                // Success - row was soft deleted
                response.put("success", true);
                response.put("message", "User role soft deleted successfully");
                response.put("forensicNote", "Deleted by: " + deleterUsername);
                response.put("rowsAffected", rowsAffected);
                return new ResponseEntity<>(response, HttpStatus.OK); // 200 status
            } else {
                // No rows affected - combination not found
                response.put("success", false);
                response.put("message", "User role combination not found (userName=" +
                        userName + ", userRole=" + userRole + ")");
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND); // 404 status
            }

        } catch (Exception e) {
            // Handle any errors (database errors, validation errors, etc.)
            System.err.println("Error soft deleting user role: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "Error soft deleting user role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR); // 500 status
        }
    }

    /**
     * POST endpoint to log a page visit for analytics.
     * Uses MERGE pattern to upsert: one record per user+route+day.
     * 
     * HTTP Method: POST
     * Endpoint: /api/log-page-visit
     * Content-Type: application/json
     * 
     * Request Body Example:
     * {
     * "userName": "JASLOOP",
     * "pageRoute": "/period-close-tracking"
     * }
     * 
     * @param request Must contain userName and pageRoute
     * @return ResponseEntity with success/error message
     */
    @PostMapping("/log-page-visit")
    public ResponseEntity<Map<String, Object>> logPageVisit(
            @RequestBody Map<String, String> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            String userName = request.get("userName");
            String pageRoute = request.get("pageRoute");

            // Handle empty/null userName for local development
            if (userName == null || userName.trim().isEmpty()) {
                userName = "LOCAL_TESTING";
            }

            if (pageRoute == null || pageRoute.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "pageRoute is required");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }

            // Call service layer to log the visit
            int rowsAffected = service.logPageVisit(userName, pageRoute);

            response.put("success", true);
            response.put("message", "Page visit logged");
            response.put("rowsAffected", rowsAffected);
            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            // Analytics should fail silently - log error but don't expose details
            System.err.println("Error logging page visit: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to log page visit");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/page-visit-analytics
     * Retrieves all page visit analytics data for the analytics dashboard.
     * 
     * @param days Lookback period in days (7, 30, or 90). Defaults to 30.
     * @return List of page visit records with user, route, date, and visit count
     */
    @GetMapping("/page-visit-analytics")
    public ResponseEntity<List<Map<String, Object>>> getPageVisitAnalytics(
            @RequestParam(defaultValue = "30") int days) {
        return new ResponseEntity<>(service.getPageVisitAnalytics(days), HttpStatus.OK);
    }

    /**
     * GET /api/page-visit-summary
     * Retrieves aggregated page visit data grouped by route.
     * 
     * @param days Lookback period in days (7, 30, or 90). Defaults to 30.
     * @return List of routes with total visits and unique user counts
     */
    @GetMapping("/page-visit-summary")
    public ResponseEntity<List<Map<String, Object>>> getPageVisitSummary(
            @RequestParam(defaultValue = "30") int days) {
        return new ResponseEntity<>(service.getPageVisitSummary(days), HttpStatus.OK);
    }

    /**
     * GET /api/dashboard-metrics
     * Retrieves dashboard metrics for the landing page cockpit.
     * 
     * @return List of dashboard metrics ordered by section and display order
     */
    @GetMapping("/dashboard-metrics")
    public ResponseEntity<List<Map<String, Object>>> getDashboardMetrics() {
        return new ResponseEntity<>(service.getDashboardMetrics(), HttpStatus.OK);
    }

    @PostMapping("/insert-summary-assignment-user")
    public ResponseEntity<String> insertSummaryAssignmentUser(@RequestBody Map<String, String> updateData) {
        int test = service.insertSummaryAssignmentUser(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("Successful");
    }

    @GetMapping("/disable-summary-assignment-user")
    public ResponseEntity<String> disableSummaryAssignmentUser(@RequestParam String email) {
        int test = service.disableSummaryAssignmentUser(email);
        return ResponseEntity.status(HttpStatus.OK).body("Successful");
    }

    @GetMapping("/enable-summary-assignment-user")
    public ResponseEntity<String> enableSummaryAssignmentUser(@RequestParam String email) {
        int test = service.enableSummaryAssignmentUser(email);
        return ResponseEntity.status(HttpStatus.OK).body("Successful");
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, Object>>> getAllRoles() {
        return new ResponseEntity<>(service.getAllRoles(), HttpStatus.OK);
    }

    @GetMapping("/user-access-list")
    public ResponseEntity<List<Map<String, Object>>> getUsersAccessList() {
        return new ResponseEntity<>(service.getAllUsersAccessList(), HttpStatus.OK);
    }

    @GetMapping("/user-access-list-by-user")
    public ResponseEntity<?> getUsersAccessListByUser(@RequestParam String userName) {
        UserRoleInfo result = service.getUsersAccessListByUser(userName.toUpperCase());
        if (result == null) {
            return new ResponseEntity<>(Map.of("userRoles", List.of()), HttpStatus.OK);
        }
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    /**
     * POST /api/insert-role
     * Inserts a new role definition into XXCFI_CTL_TOWER_ROLE_DEF.
     * Called from the update-role-dialog component's Add Role form.
     */
    @PostMapping("/insert-role")
    public ResponseEntity<Map<String, Object>> insertRole(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String roleName = request.get("roleName");
            String roleValue = request.get("roleValue");
            String description = request.get("description");
            String dashboardName = request.get("dashboardName");
            String username = request.get("username");

            int rowsAffected = service.insertRole(roleName, roleValue, description, dashboardName, username);

            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "Role created successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "Role was not created (may already exist)");
                return new ResponseEntity<>(response, HttpStatus.CONFLICT);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("Error creating role: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Error creating role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/update-role
     * Updates an existing role definition in XXCFI_CTL_TOWER_ROLE_DEF.
     * Called from the update-role-dialog component's Edit Role form and toggle.
     */
    @PutMapping("/update-role")
    public ResponseEntity<Map<String, Object>> updateRole(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            int roleId = ((Number) request.get("roleId")).intValue();
            String roleName = (String) request.get("roleName");
            String roleValue = (String) request.get("roleValue");
            String description = (String) request.get("description");
            String enabledFlag = (String) request.get("enabledFlag");
            String dashboardName = (String) request.get("dashboardName");
            String username = (String) request.get("username");

            int rowsAffected = service.updateRole(roleId, roleName, roleValue, description,
                    enabledFlag, dashboardName, username);

            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "Role updated successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "Role not found with id: " + roleId);
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("Error updating role: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Error updating role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /api/delete-role
     * Soft-deletes a role definition from XXCFI_CTL_TOWER_ROLE_DEF.
     * Sets enabled_flag = NULL so GET queries exclude it.
     * Called from the update-role-dialog component's trash icon.
     */
    @DeleteMapping("/delete-role")
    public ResponseEntity<Map<String, Object>> deleteRole(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            int roleId = ((Number) request.get("roleId")).intValue();
            String username = (String) request.get("username");

            if (username == null || username.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "username is required");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }

            int rowsAffected = service.deleteRole(roleId, username);

            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "Role deleted successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "Role not found with id: " + roleId);
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("Error deleting role: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Error deleting role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /api/create-user-access-role
     * Inserts a new role for an existing user in XXCFI_CTL_TOWER_USER_ACCESS.
     * Prevents duplicates via a NOT EXISTS guard in the SQL.
     */
    @PostMapping("/create-user-access-role")
    public ResponseEntity<Map<String, Object>> createUserAccessRole(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userName = (String) request.get("userName");
            String userEmail = (String) request.get("userEmail");
            String fullName = (String) request.get("fullName");
            Object roleIdObj = request.get("roleId");
            String admin = (String) request.get("admin");
            String readOnly = (String) request.get("readOnly");
            String createdBy = (String) request.get("createdBy");

            if (userName == null || userName.trim().isEmpty()) {
                throw new IllegalArgumentException("userName is required");
            }
            if (roleIdObj == null) {
                throw new IllegalArgumentException("roleId is required");
            }
            int roleId = (roleIdObj instanceof Integer) ? (Integer) roleIdObj : Integer.parseInt(roleIdObj.toString());

            int rowsInserted = service.createAccessRole(userName, userEmail, fullName,
                    roleId, admin != null ? admin : "N", readOnly != null ? readOnly : "N", createdBy);

            if (rowsInserted > 0) {
                response.put("success", true);
                response.put("message", "User access role created successfully");
                return new ResponseEntity<>(response, HttpStatus.CREATED);
            } else {
                response.put("success", false);
                response.put("message", "Role already exists for this user (duplicate prevented)");
                return new ResponseEntity<>(response, HttpStatus.CONFLICT);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("Error creating user access role: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Error creating user access role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /api/bulk-create-user-access-roles
     * Bulk-inserts user access roles for multiple users × multiple roles.
     * Expects a JSON body with:
     *   - users: [ { userName, userEmail, fullName } ]
     *   - roleIds: [ 1, 2, 3 ]
     *   - createdBy: "ADMIN_USER"
     * Reuses service.createAccessRole for each (user, role) combination.
     */
    @PostMapping("/bulk-create-user-access-roles")
    public ResponseEntity<Map<String, Object>> bulkCreateUserAccessRoles(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, String>> users = (List<Map<String, String>>) request.get("users");
            List<?> rawRoleIds = (List<?>) request.get("roleIds");
            String createdBy = (String) request.get("createdBy");

            if (users == null || users.isEmpty()) {
                throw new IllegalArgumentException("users array is required and must not be empty");
            }
            if (rawRoleIds == null || rawRoleIds.isEmpty()) {
                throw new IllegalArgumentException("roleIds array is required and must not be empty");
            }
            if (createdBy == null || createdBy.trim().isEmpty()) {
                throw new IllegalArgumentException("createdBy is required");
            }

            int totalInserted = 0;
            int totalSkipped = 0;
            int totalFailed = 0;
            List<Map<String, Object>> errors = new java.util.ArrayList<>();

            for (Map<String, String> user : users) {
                String userName = user.get("userName");
                String userEmail = user.get("userEmail");
                String fullName = user.get("fullName");

                if (userName == null || userName.trim().isEmpty()) {
                    totalFailed++;
                    Map<String, Object> err = new HashMap<>();
                    err.put("userName", userName);
                    err.put("error", "userName is required");
                    errors.add(err);
                    continue;
                }

                for (Object roleIdObj : rawRoleIds) {
                    try {
                        int roleId = (roleIdObj instanceof Integer)
                                ? (Integer) roleIdObj
                                : Integer.parseInt(roleIdObj.toString());

                        int rows = service.createAccessRole(
                                userName, userEmail, fullName,
                                roleId, "N", "N", createdBy);

                        if (rows > 0) {
                            totalInserted++;
                        } else {
                            totalSkipped++;
                        }
                    } catch (Exception e) {
                        totalFailed++;
                        Map<String, Object> err = new HashMap<>();
                        err.put("userName", userName);
                        err.put("roleId", roleIdObj);
                        err.put("error", e.getMessage());
                        errors.add(err);
                    }
                }
            }

            response.put("success", true);
            response.put("totalInserted", totalInserted);
            response.put("totalSkipped", totalSkipped);
            response.put("totalFailed", totalFailed);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            response.put("message", String.format(
                    "Bulk create complete: %d inserted, %d duplicates skipped, %d failed",
                    totalInserted, totalSkipped, totalFailed));

            HttpStatus status = (totalFailed > 0 && totalInserted == 0)
                    ? HttpStatus.BAD_REQUEST
                    : HttpStatus.CREATED;
            return new ResponseEntity<>(response, status);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("Error in bulk create user access roles: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Error in bulk create: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/update-user-access-role
     * Updates a user access role's ENABLED_FLAG, ADMIN, and READ_ONLY columns.
     * Called from the admin component's toggle switches on expanded child rows.
     */
    @PutMapping("/update-user-access-role")
    public ResponseEntity<Map<String, Object>> updateUserAccessRole(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userName = (String) request.get("userName");
            Object roleIdObj = request.get("roleId");
            String enabledFlag = (String) request.get("enabledFlag");
            String admin = (String) request.get("admin");
            String readOnly = (String) request.get("readOnly");
            String lastUpdatedBy = (String) request.get("lastUpdatedBy");

            if (userName == null || userName.trim().isEmpty()) {
                throw new IllegalArgumentException("userName is required");
            }
            if (roleIdObj == null) {
                throw new IllegalArgumentException("roleId is required");
            }
            int roleId = (roleIdObj instanceof Integer) ? (Integer) roleIdObj : Integer.parseInt(roleIdObj.toString());

            Map<String, Object> result = service.updateAccessRole(userName, roleId, enabledFlag, admin, readOnly, lastUpdatedBy);
            int rowsAffected = (int) result.get("rowsAffected");

            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "User access role updated successfully");
                if (result.containsKey("isDeleted")) {
                    response.put("isDeleted", result.get("isDeleted"));
                }
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "No matching enabled user access role found");
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error updating user access role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/delete-user-access-role
     * Soft-deletes a user access role from XXCFI_CTL_TOWER_USER_ACCESS.
     * Sets ENABLED_FLAG = NULL so GET queries exclude it.
     * Called from the admin component's trash icon on expanded child rows.
     */
    @PutMapping("/delete-user-access-role")
    public ResponseEntity<Map<String, Object>> deleteUserAccessRole(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userName = (String) request.get("userName");
            int roleId = ((Number) request.get("roleId")).intValue();
            String lastUpdatedBy = (String) request.get("lastUpdatedBy");

            if (userName == null || userName.trim().isEmpty()
                    || lastUpdatedBy == null || lastUpdatedBy.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "userName and lastUpdatedBy are required");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }

            int rowsAffected = service.deleteAccessRole(userName, roleId, lastUpdatedBy);

            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "User access role deleted successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "User access role not found for userName=" + userName + ", roleId=" + roleId);
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("Error deleting user access role: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Error deleting user access role: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
