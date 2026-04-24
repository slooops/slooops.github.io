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
}
