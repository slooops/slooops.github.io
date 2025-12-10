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
    public ResponseEntity<List<Map<String, Object>>> getAdminTable() {
        return new ResponseEntity<>(service.getAdminTable(), HttpStatus.OK);
    }

    /**
     * POST endpoint to create a new user role.
     * 
     * HTTP Method: POST
     * Endpoint: /api/user-role
     * Content-Type: application/json
     * 
     * Request Body Example:
     * {
     *   "userName": "JSMITH",
     *   "userEmail": "jsmith@cisco.com",
     *   "roleId": 1,
     *   "userRole": "Admin",
     *   "enabledFlag": "Y"
     * }
     * 
     * @param request The CreateUserRoleRequest object deserialized from JSON
     * @return ResponseEntity with success/error message and HTTP status code
     * 
     * How this works:
     * 1. @PostMapping tells Spring this handles POST requests to "/api/user-role"
     * 2. @RequestBody tells Spring to deserialize the JSON into CreateUserRoleRequest
     * 3. Spring automatically calls the setters on CreateUserRoleRequest
     * 4. We call service.createUserRole() to insert into database
     * 5. We return HTTP 201 CREATED on success, 500 on error
     */
    @PostMapping("/user-role")
    public ResponseEntity<Map<String, Object>> createUserRole(@RequestBody CreateUserRoleRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Log the incoming request for debugging
            System.out.println("Received POST request to create user: " + request);
            
            // Call the service layer to insert into database
            int rowsAffected = service.createUserRole(
                request.getUserName(),
                request.getUserEmail(),
                request.getRoleId(),
                request.getUserRole(),
                request.getEnabledFlag()
            );
            
            // Check if insert was successful
            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "User role created successfully");
                response.put("rowsAffected", rowsAffected);
                return new ResponseEntity<>(response, HttpStatus.CREATED); // 201 status
            } else {
                response.put("success", false);
                response.put("message", "Failed to create user role - no rows affected");
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

    /**
     * PUT endpoint to update an existing user role.
     * 
     * HTTP Method: PUT
     * Endpoint: /api/user-role/{userId}
     * Content-Type: application/json
     * 
     * URL Example: PUT /api/user-role/3312
     * 
     * Request Body Example:
     * {
     *   "userName": "JSMITH",
     *   "userEmail": "jsmith@cisco.com",
     *   "roleId": 1,
     *   "userRole": "Admin",
     *   "enabledFlag": "N"
     * }
     * 
     * @param userId The user ID from the URL path (e.g., 3312)
     * @param request The CreateUserRoleRequest object with updated data
     * @return ResponseEntity with success/error message and HTTP status code
     * 
     * How this works:
     * 1. @PutMapping tells Spring this handles PUT requests to "/api/user-role/{userId}"
     * 2. @PathVariable extracts userId from the URL (e.g., /user-role/3312 → userId=3312)
     * 3. @RequestBody deserializes the JSON into CreateUserRoleRequest object
     * 4. We call service.updateUserRole() to update the database
     * 5. We return HTTP 200 OK on success, 404 if not found, 500 on error
     */
    @PutMapping("/user-role/{userId}")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable Integer userId,
            @RequestBody CreateUserRoleRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Log the incoming request for debugging
            System.out.println("Received PUT request to update user ID: " + userId);
            System.out.println("Request data: " + request);
            
            // Call the service layer to update the database
            int rowsAffected = service.updateUserRole(
                userId,
                request.getUserName(),
                request.getUserEmail(),
                request.getRoleId(),
                request.getUserRole(),
                request.getEnabledFlag()
            );
            
            // Check if update was successful
            if (rowsAffected > 0) {
                response.put("success", true);
                response.put("message", "User role updated successfully");
                response.put("rowsAffected", rowsAffected);
                return new ResponseEntity<>(response, HttpStatus.OK); // 200 status
            } else {
                // No rows affected means user ID wasn't found
                response.put("success", false);
                response.put("message", "User not found with ID: " + userId);
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
}
