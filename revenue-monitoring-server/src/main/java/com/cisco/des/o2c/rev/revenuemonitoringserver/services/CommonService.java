package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UserRoleInfo;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CommonService {

    private JdbcManager jdbcManager;
    private String invoiceToCashSummary;
    private String summaryAssignmentUsers;
    private String rolErrorsSummaryPeriodStatus;
    private String personaAccessRoles;
    private String processFlowTotal;
    private String adminTable;
    private String createUserRole;
    private String updateUserRole;
    private String deleteUserRole;
    @Autowired
    private Common common;
    @Autowired
    private CacheCommon cacheCommon;

    // Email validation pattern (RFC 5322 simplified)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");

    // Username validation pattern (alphanumeric, underscore, hyphen only)
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    // Role validation pattern (letters, numbers, spaces, underscores only)
    private static final Pattern ROLE_PATTERN = Pattern.compile("^[a-zA-Z0-9_ ]+$");

    public CommonService(
            JdbcManager jdbcManager,
            @Qualifier("invoiceToCashSummary") String invoiceToCashSummary,
            @Qualifier("summaryAssignmentUsers") String summaryAssignmentUsers,
            @Qualifier("rolErrorsSummaryPeriodStatus") String rolErrorsSummaryPeriodStatus,
            @Qualifier("personaAccessRoles") String personaAccessRoles,
            @Qualifier("processFlowTotal") String processFlowTotal,
            @Qualifier("adminTable") String adminTable,
            @Qualifier("createUserRole") String createUserRole,
            @Qualifier("updateUserRole") String updateUserRole,
            @Qualifier("deleteUserRole") String deleteUserRole) {
        this.jdbcManager = jdbcManager;
        this.rolErrorsSummaryPeriodStatus = rolErrorsSummaryPeriodStatus;
        this.summaryAssignmentUsers = summaryAssignmentUsers;
        this.invoiceToCashSummary = invoiceToCashSummary;
        this.personaAccessRoles = personaAccessRoles;
        this.processFlowTotal = processFlowTotal;
        this.adminTable = adminTable;
        this.createUserRole = createUserRole;
        this.updateUserRole = updateUserRole;
        this.deleteUserRole = deleteUserRole;
    }

    // Summaries
    public List<Map<String, Object>> getInvoiceToCashSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(invoiceToCashSummary);
        return result;
    }

    // Common methods
    public List<Map<String, Object>> getMonitoringPeriodStatus() {
        String[] dateColumns = { "END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(rolErrorsSummaryPeriodStatus);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getSummaryAssignmentUsers() {
        List<Map<String, Object>> result = jdbcManager.queryForList(summaryAssignmentUsers);
        return result;
    }

    public List<Map<String, Object>> getAllUserRoles() {
        List<Map<String, Object>> result = jdbcManager.queryForList(personaAccessRoles);
        return result;
    }

    public UserRoleInfo getUserRoles(String username) {
        String upperUsername = username.toUpperCase();
        List<Map<String, Object>> rolesList = jdbcManager.queryForList(personaAccessRoles);
        Optional<Map<String, Object>> userOptional = rolesList.stream()
                .filter(user -> upperUsername.equals(user.get("USER_NAME")))
                .findFirst();

        if (userOptional.isPresent()) {
            Map<String, Object> user = userOptional.get();
            String userName = (String) user.get("USER_NAME");
            String userEmail = (String) user.get("USER_EMAIL");

            List<String> roles = rolesList.stream()
                    .filter(u -> upperUsername.equals(u.get("USER_NAME")))
                    .map(u -> (String) u.get("USER_ROLE"))
                    .collect(Collectors.toList());

            return new UserRoleInfo(userName, userEmail, roles);
        }
        return null;
    }

    public List<Map<String, Object>> getProcessFlowTotals(String compName) {
        List<Map<String, Object>> result = jdbcManager.getProcessFlowTotal(processFlowTotal, compName);
        return result;
    }

    public List<Map<String, Object>> getAdminTable() {
        return jdbcManager.queryForList(adminTable);
    }

    /**
     * SERVER-SIDE VALIDATION METHODS
     * Validates email format using regex pattern.
     * Prevents malformed emails and potential injection attacks.
     */
    private void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        String trimmedEmail = email.trim();

        if (trimmedEmail.length() > 254) {
            throw new IllegalArgumentException("Email exceeds maximum length of 254 characters");
        }

        if (!EMAIL_PATTERN.matcher(trimmedEmail).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }

    /**
     * Validates username format and constraints.
     * - Must be alphanumeric with optional underscores/hyphens
     * - No spaces allowed
     * - Length constraints for database
     */
    private void validateUsername(String userName) {
        if (userName == null || userName.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        String trimmedUsername = userName.trim();

        if (trimmedUsername.length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters");
        }

        if (trimmedUsername.length() > 50) {
            throw new IllegalArgumentException("Username exceeds maximum length of 50 characters");
        }

        if (!USERNAME_PATTERN.matcher(trimmedUsername).matches()) {
            throw new IllegalArgumentException("Username can only contain letters, numbers, underscores, and hyphens");
        }
    }

    /**
     * Validates role name format.
     * Prevents injection attacks and ensures data integrity.
     */
    private void validateRole(String userRole) {
        if (userRole == null || userRole.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }

        String trimmedRole = userRole.trim();

        if (trimmedRole.length() > 100) {
            throw new IllegalArgumentException("Role exceeds maximum length of 100 characters");
        }

        if (!ROLE_PATTERN.matcher(trimmedRole).matches()) {
            throw new IllegalArgumentException("Role can only contain letters, numbers, spaces, and underscores");
        }
    }

    /**
     * Validates enabled flag value.
     * Only 'Y' or 'N' are allowed.
     */
    private void validateEnabledFlag(String enabledFlag) {
        if (enabledFlag == null || enabledFlag.trim().isEmpty()) {
            throw new IllegalArgumentException("Enabled flag is required");
        }

        String trimmed = enabledFlag.trim().toUpperCase();

        if (!trimmed.equals("Y") && !trimmed.equals("N")) {
            throw new IllegalArgumentException("Enabled flag must be 'Y' or 'N'");
        }
    }

    /**
     * Sanitizes input by trimming whitespace and limiting length.
     * Additional protection against injection attacks.
     */
    private String sanitizeInput(String input, int maxLength) {
        if (input == null) {
            return null;
        }

        String sanitized = input.trim();

        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    public int createUserRole(String userName, String userEmail, Integer roleId,
            String userRole, String enabledFlag) {

        // Validate all inputs (NEVER TRUST CLIENT INPUT)
        validateUsername(userName);
        validateEmail(userEmail);
        validateRole(userRole);
        validateEnabledFlag(enabledFlag);

        // Sanitize inputs (trim whitespace, enforce length limits)
        String sanitizedUserName = sanitizeInput(userName, 50);
        String sanitizedEmail = sanitizeInput(userEmail, 254);
        String sanitizedRole = sanitizeInput(userRole, 100).toUpperCase();
        String sanitizedFlag = sanitizeInput(enabledFlag, 1).toUpperCase();

        // Return 1 to simulate success
        // return 1;
        return jdbcManager.insertUserRole(createUserRole, sanitizedUserName, sanitizedEmail,
                roleId, sanitizedRole, sanitizedFlag);
    }
    
    public int updateUserRole(String userName, String userRole, String userEmail,
            Integer roleId, String enabledFlag) {

        // Validate all inputs (NEVER TRUST CLIENT INPUT)
        validateUsername(userName);
        validateRole(userRole);
        validateEmail(userEmail);
        validateEnabledFlag(enabledFlag);

        // Sanitize inputs
        String sanitizedUserName = sanitizeInput(userName, 50);
        String sanitizedRole = sanitizeInput(userRole, 100).toUpperCase();
        String sanitizedEmail = sanitizeInput(userEmail, 254);
        String sanitizedFlag = sanitizeInput(enabledFlag, 1).toUpperCase();

        // Update using composite key: userName + userRole
        return jdbcManager.updateUserRole(updateUserRole, sanitizedEmail, roleId,
                sanitizedFlag, sanitizedUserName, sanitizedRole);
    }

    /**
     * Soft deletes a user role with forensic tracking.
     * 
     * SOFT DELETE MECHANISM:
     * 1. Sets USER_EMAIL to "deleted by: {deleterUsername}" for forensic tracking
     * 2. Sets ENABLED_FLAG to NULL to hide row from GET queries
     * 3. Row remains in database for audit purposes
     * 
     * EMAIL VALIDATION SKIPPED: The forensic string does NOT get validated as
     * email.
     * This is intentional - we're repurposing the email field as a forensic log.
     * Since email = username + @cisco.com, we lose no real information.
     * 
     * @param userName        The user's username (part of composite key)
     * @param userRole        The role name (part of composite key)
     * @param creationDate    Raw creation date string from database (exact format
     *                        match)
     * @param deleterUsername The username of person performing deletion
     * @return Number of rows soft-deleted (1 = success, 0 = not found)
     * @throws IllegalArgumentException if validation fails
     */
    public int deleteUserRole(String userName, String userRole, String creationDate,
            String deleterUsername) {

        System.out.println("\n[SOFT DELETE] userName='" + userName + "', role='" + userRole +
                "', createdAt='" + creationDate + "', deletedBy='" + deleterUsername + "'");

        // Validate composite key (NEVER TRUST CLIENT INPUT)
        validateUsername(userName);
        validateRole(userRole);

        // Validate deleter username
        if (deleterUsername == null || deleterUsername.trim().isEmpty()) {
            throw new IllegalArgumentException("Deleter username is required for forensic tracking");
        }

        // Validate creation date
        if (creationDate == null || creationDate.trim().isEmpty()) {
            throw new IllegalArgumentException("Creation date is required for safe deletion");
        }

        // Sanitize inputs
        String sanitizedUserName = sanitizeInput(userName, 50);
        String sanitizedRole = sanitizeInput(userRole, 100).toUpperCase();
        String sanitizedDeleter = sanitizeInput(deleterUsername, 50);

        // Create forensic email string (NO EMAIL VALIDATION)
        String forensicEmail = "deleted by: " + sanitizedDeleter;

        System.out.println("[DELETE] WHERE userName='" + sanitizedUserName + "' AND userRole='" +
                sanitizedRole + "' AND creationDate='" + creationDate + "'");
        System.out.println("[DELETE] SET email='" + forensicEmail + "', enabled=NULL");

        // Soft delete: Update email to forensic string, null the enabled flag
        // Uses userName + userRole + creationDate for precise row targeting
        return jdbcManager.deleteUserRole(deleteUserRole, forensicEmail,
                sanitizedUserName, sanitizedRole, creationDate);

    }

}
