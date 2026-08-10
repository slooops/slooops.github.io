package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.RoleEntry;
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
    private String logPageVisit;
    private String pageVisitAnalytics;
    private String pageVisitSummary;
    private String dashboardMetrics;
    private String insertSummaryAssignmentUsers;
    private String disableSummaryAssignmentUsers;
    private String enableSummaryAssignmentUsers;
    private String ctlTwrRoles;
    private String ctlTwrRoleUpdate;
    private String ctlTwrRoleInsert;
    private String ctlTwrRoleDelete;
    private String ctlTwrUserAccess;
    private String ctlTwrUserAccessCreateUserRole;
    private String ctlTwrUserAccessUpdateUserRole;
    private String ctlTwrUserAccessCheckDeletedUser;
    private String ctlTwrUserAccessByUser;
    @Autowired
    private Common common;
    @Autowired
    private CacheCommon cacheCommon;

    // Email validation pattern (RFC 5322 simplified, backtrack-safe)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,7}$");

    // Username validation pattern (alphanumeric, underscore, hyphen only)
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    // Role validation pattern (letters, numbers, spaces, underscores only)
    private static final Pattern ROLE_PATTERN = Pattern.compile("^[a-zA-Z0-9_ ]+$");

    // Allowed lookback periods (days) for analytics queries
    private static final java.util.Set<Integer> ALLOWED_DAYS = java.util.Set.of(7, 30, 90);

    // Inline parameterized analytics queries (replaces envfile versions)
    private static final String PAGE_VISIT_SUMMARY_SQL = "SELECT PAGE_ROUTE, SUM(VISIT_COUNT) AS TOTAL_VISITS, COUNT(DISTINCT USER_NAME) AS UNIQUE_USERS "
            +
            "FROM ARFINRO.CTL_TWR_JSR_PAGE_VISIT_LOG " +
            "WHERE VISIT_DATE >= TRUNC(SYSDATE) - ? " +
            "GROUP BY PAGE_ROUTE ORDER BY TOTAL_VISITS DESC";

    private static final String PAGE_VISIT_ANALYTICS_SQL = "SELECT USER_NAME, PAGE_ROUTE, VISIT_DATE, " +
            "TO_CHAR(FIRST_VISIT_TIME, 'YYYY-MM-DD HH24:MI:SS') AS FIRST_VISIT_TIME, " +
            "TO_CHAR(LAST_VISIT_TIME, 'YYYY-MM-DD HH24:MI:SS') AS LAST_VISIT_TIME, " +
            "VISIT_COUNT FROM ARFINRO.CTL_TWR_JSR_PAGE_VISIT_LOG " +
            "WHERE VISIT_DATE >= TRUNC(SYSDATE) - ? " +
            "ORDER BY VISIT_DATE DESC, VISIT_COUNT DESC";

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
            @Qualifier("deleteUserRole") String deleteUserRole,
            @Qualifier("logPageVisit") String logPageVisit,
            @Qualifier("pageVisitAnalytics") String pageVisitAnalytics,
            @Qualifier("pageVisitSummary") String pageVisitSummary,
            @Qualifier("dashboardMetrics") String dashboardMetrics,
            @Qualifier("insertSummaryAssignmentUsers") String insertSummaryAssignmentUsers,
            @Qualifier("disableSummaryAssignmentUsers") String disableSummaryAssignmentUsers,
            @Qualifier("enableSummaryAssignmentUsers") String enableSummaryAssignmentUsers,
            @Qualifier("ctlTwrRoles") String ctlTwrRoles,
            @Qualifier("ctlTwrUserAccess") String ctlTwrUserAccess,
            @Qualifier("ctlTwrUserAccessCreateUserRole") String ctlTwrUserAccessCreateUserRole,
            @Qualifier("ctlTwrRoleInsert") String ctlTwrRoleInsert,
            @Qualifier("ctlTwrRoleUpdate") String ctlTwrRoleUpdate,
            @Qualifier("ctlTwrUserAccessUpdateUserRole") String ctlTwrUserAccessUpdateUserRole,
            @Qualifier("ctlTwrRoleDelete") String ctlTwrRoleDelete,
            @Qualifier("ctlTwrUserAccessCheckDeletedUser") String ctlTwrUserAccessCheckDeletedUser,
            @Qualifier("ctlTwrUserAccessByUser") String ctlTwrUserAccessByUser) {
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
        this.logPageVisit = logPageVisit;
        this.pageVisitAnalytics = pageVisitAnalytics;
        this.pageVisitSummary = pageVisitSummary;
        this.dashboardMetrics = dashboardMetrics;
        this.insertSummaryAssignmentUsers = insertSummaryAssignmentUsers;
        this.disableSummaryAssignmentUsers = disableSummaryAssignmentUsers;
        this.enableSummaryAssignmentUsers = enableSummaryAssignmentUsers;
        this.ctlTwrRoles = ctlTwrRoles;
        this.ctlTwrUserAccess = ctlTwrUserAccess;
        this.ctlTwrUserAccessCreateUserRole = ctlTwrUserAccessCreateUserRole;
        this.ctlTwrRoleInsert = ctlTwrRoleInsert;
        this.ctlTwrRoleUpdate = ctlTwrRoleUpdate;
        this.ctlTwrUserAccessUpdateUserRole = ctlTwrUserAccessUpdateUserRole;
        this.ctlTwrRoleDelete = ctlTwrRoleDelete;
        this.ctlTwrUserAccessCheckDeletedUser = ctlTwrUserAccessCheckDeletedUser;
        this.ctlTwrUserAccessByUser = ctlTwrUserAccessByUser;
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

            List<RoleEntry> roles = rolesList.stream()
                    .filter(u -> upperUsername.equals(u.get("USER_NAME")))
                    .map(u -> new RoleEntry(
                            u.get("ROLE_ID") != null ? ((Number) u.get("ROLE_ID")).intValue() : 0,
                            (String) u.get("USER_ROLE"),
                            (String) u.get("ADMIN") != null ? (String) u.get("ADMIN") : "Y"))
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
     * Gets admin table filtered by multiple roles.
     * Used for sub-admin view: only shows users with any of the managed roles.
     * 
     * @param managedRoles List of roles to filter by (e.g., ["CASE_IQ_I2C",
     *                     "CASE_IQ_SBP"])
     * @return List of users who have any of the specified roles
     */
    public List<Map<String, Object>> getAdminTableFiltered(List<String> managedRoles) {
        // Validate each role parameter to prevent SQL injection
        List<String> sanitizedRoles = new java.util.ArrayList<>();
        for (String role : managedRoles) {
            validateRole(role);
            sanitizedRoles.add(sanitizeInput(role, 100).toUpperCase());
        }

        // Build IN clause with placeholders: AND UPPER(USER_ROLE) IN (?, ?, ?)
        String placeholders = String.join(", ", java.util.Collections.nCopies(sanitizedRoles.size(), "?"));
        String filteredQuery = adminTable + " AND UPPER(USER_ROLE) IN (" + placeholders + ")";

        return jdbcManager.queryForListWithParams(filteredQuery, sanitizedRoles.toArray());
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
            return "";
        }

        String sanitized = input.trim();

        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    /**
     * Logs a page visit using MERGE (upsert) pattern.
     * If user+route+date already exists, updates last_visit_time and increments
     * count.
     * Otherwise inserts a new record.
     * 
     * @param userName  The username visiting the page
     * @param pageRoute The route/URL being visited
     * @return Number of rows affected (should be 1)
     */
    public int logPageVisit(String userName, String pageRoute) {
        // Sanitize inputs
        String sanitizedUserName = sanitizeInput(userName, 100).toUpperCase();
        String sanitizedRoute = sanitizeInput(pageRoute, 500);

        // Execute MERGE statement with userName and pageRoute parameters
        return jdbcManager.executeUpdatePrimary(logPageVisit, sanitizedUserName, sanitizedRoute);
    }

    /**
     * Retrieves all page visit analytics data for a given lookback period.
     * 
     * @param days Number of days to look back (7, 30, or 90)
     * @return List of page visit records
     */
    public List<Map<String, Object>> getPageVisitAnalytics(int days) {
        int safeDays = ALLOWED_DAYS.contains(days) ? days : 30;
        return jdbcManager.queryForListWithParams(PAGE_VISIT_ANALYTICS_SQL, safeDays);
    }

    /**
     * Retrieves aggregated page visit summary grouped by route.
     * 
     * @param days Number of days to look back (7, 30, or 90)
     * @return List of routes with total visits and unique users
     */
    public List<Map<String, Object>> getPageVisitSummary(int days) {
        int safeDays = ALLOWED_DAYS.contains(days) ? days : 30;
        return jdbcManager.queryForListWithParams(PAGE_VISIT_SUMMARY_SQL, safeDays);
    }

    /**
     * Retrieves dashboard metrics for the landing page cockpit.
     * 
     * @return List of dashboard metrics ordered by section and display order
     */
    public List<Map<String, Object>> getDashboardMetrics() {
        return jdbcManager.queryForList(dashboardMetrics);
    }

    public int insertSummaryAssignmentUser(Map<String, String> updateData) {
        return jdbcManager.insertSummaryAssignmentUser(insertSummaryAssignmentUsers, updateData.get("name"),
                updateData.get("email"), updateData.get("team"));
    }

    public int disableSummaryAssignmentUser(String userEmail) {
        return jdbcManager.disableSummaryAssignmentUser(disableSummaryAssignmentUsers, userEmail);
    }

    public int enableSummaryAssignmentUser(String userEmail) {
        return jdbcManager.disableSummaryAssignmentUser(enableSummaryAssignmentUsers, userEmail);
    }

    public List<Map<String, Object>> getAllRoles() {
        return jdbcManager.queryForList(ctlTwrRoles);
    }

    /**
     * Inserts a new role into XXCFI_CTL_TOWER_ROLE_DEF.
     * Uses ctlTwrRoleInsert bean which auto-generates role_id via sequence.
     * Called from POST /api/insert-role (update-role-dialog component).
     *
     * @return Number of rows inserted (1 = success)
     */
    public int insertRole(String roleName, String roleValue, String description,
            String dashboardName, String username) {
        validateRole(roleName);
        validateRole(roleValue);

        String sanitizedRoleName = sanitizeInput(roleName, 100).toUpperCase();
        String sanitizedRoleValue = sanitizeInput(roleValue, 100).toUpperCase();
        String sanitizedDescription = sanitizeInput(description, 500);
        String sanitizedDashboardName = sanitizeInput(dashboardName, 200);
        String sanitizedUsername = sanitizeInput(username, 50);

        return jdbcManager.insertCtlTwrRole(ctlTwrRoleInsert, sanitizedRoleName,
                sanitizedRoleValue, sanitizedDescription, sanitizedDashboardName, sanitizedUsername);
    }

    /**
     * Updates an existing role in XXCFI_CTL_TOWER_ROLE_DEF by role_id.
     * Uses ctlTwrRoleUpdate bean.
     * Called from PUT /api/update-role (update-role-dialog component).
     *
     * @return Number of rows updated (1 = success, 0 = not found)
     */
    public int updateRole(int roleId, String roleName, String roleValue, String description,
            String enabledFlag, String dashboardName, String username) {
        validateRole(roleName);
        validateRole(roleValue);
        validateEnabledFlag(enabledFlag);

        String sanitizedRoleName = sanitizeInput(roleName, 100).toUpperCase();
        String sanitizedRoleValue = sanitizeInput(roleValue, 100).toUpperCase();
        String sanitizedDescription = sanitizeInput(description, 500);
        String sanitizedFlag = sanitizeInput(enabledFlag, 1).toUpperCase();
        String sanitizedDashboardName = sanitizeInput(dashboardName, 200);
        String sanitizedUsername = sanitizeInput(username, 50);

        return jdbcManager.updateCtlTwrRole(ctlTwrRoleUpdate, sanitizedRoleName,
                sanitizedRoleValue, sanitizedDescription, sanitizedFlag,
                sanitizedDashboardName, sanitizedUsername, roleId);
    }

    /**
     * Soft-deletes a role from XXCFI_CTL_TOWER_ROLE_DEF by setting enabled_flag =
     * NULL.
     * Uses ctlTwrRoleDelete bean.
     * Called from DELETE /api/delete-role (update-role-dialog component).
     *
     * @param roleId   The role_id to soft-delete
     * @param username The user performing the deletion (for last_updated_by)
     * @return Number of rows updated (1 = success, 0 = not found)
     */
    public int deleteRole(int roleId, String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required for deletion tracking");
        }

        String sanitizedUsername = sanitizeInput(username, 50);

        return jdbcManager.executeUpdatePrimary(ctlTwrRoleDelete, sanitizedUsername, roleId);
    }

    public int createUserRole(String userName, String userEmail, Integer roleId,
            String userRole, String enabledFlag, String createdBy) {

        // Validate all inputs (NEVER TRUST CLIENT INPUT)
        validateUsername(userName);
        validateEmail(userEmail);
        validateRole(userRole);
        validateEnabledFlag(enabledFlag);
        if (createdBy != null && !createdBy.trim().isEmpty()) {
            validateUsername(createdBy); // Same validation rules as userName
        }

        // Sanitize inputs (trim whitespace, enforce length limits)
        String sanitizedUserName = sanitizeInput(userName, 50);
        String sanitizedEmail = sanitizeInput(userEmail, 254);
        String sanitizedRole = sanitizeInput(userRole, 100).toUpperCase();
        String sanitizedFlag = sanitizeInput(enabledFlag, 1).toUpperCase();
        String sanitizedCreatedBy = createdBy != null ? sanitizeInput(createdBy, 50) : null;

        // Query has duplicate prevention: INSERT ... SELECT ... WHERE NOT EXISTS
        // Parameters: userName, userEmail, roleId, userRole, enabledFlag, createdBy,
        // userName (for EXISTS check), userRole (for EXISTS check)
        return jdbcManager.insertUserRole(createUserRole, sanitizedUserName, sanitizedEmail,
                roleId, sanitizedRole, sanitizedFlag, sanitizedCreatedBy);
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

    /**
     * Creates a new user access role in XXCFI_CTL_TOWER_USER_ACCESS.
     * Uses INSERT ... SELECT FROM DUAL WHERE NOT EXISTS to prevent duplicates.
     * Called from POST /api/create-user-access-role.
     *
     * @param userName  The username to add the role for
     * @param userEmail The user's email address
     * @param fullName  The user's full name
     * @param roleId    The role_id to assign
     * @param admin     Admin flag ('Y' or 'N')
     * @param readOnly  Read-only flag ('Y' or 'N')
     * @param createdBy The user creating this record
     * @return Number of rows inserted (1 = success, 0 = duplicate exists)
     */
    public int createAccessRole(String userName, String userEmail, String fullName,
            int roleId, String admin, String readOnly, String createdBy) {
        validateUsername(userName);

        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("userEmail is required");
        }
        if (createdBy == null || createdBy.trim().isEmpty()) {
            throw new IllegalArgumentException("createdBy is required");
        }
        if (admin == null || (!admin.equals("Y") && !admin.equals("N"))) {
            throw new IllegalArgumentException("admin must be 'Y' or 'N'");
        }
        if (readOnly == null || (!readOnly.equals("Y") && !readOnly.equals("N"))) {
            throw new IllegalArgumentException("readOnly must be 'Y' or 'N'");
        }

        String sanitizedUserName = sanitizeInput(userName, 50).toUpperCase();
        String sanitizedEmail = sanitizeInput(userEmail, 100);
        String sanitizedFullName = (fullName != null) ? sanitizeInput(fullName, 100) : "";
        String sanitizedCreatedBy = sanitizeInput(createdBy, 50);

        return jdbcManager.insertCtlTwrUserAccessRole(ctlTwrUserAccessCreateUserRole,
                sanitizedUserName, sanitizedEmail, sanitizedFullName, roleId,
                admin, readOnly, sanitizedCreatedBy, sanitizedCreatedBy);
    }

    /**
     * Updates a user access role in XXCFI_CTL_TOWER_USER_ACCESS.
     * Sets ENABLED_FLAG, ADMIN, READ_ONLY columns.
     * Uses ctlTwrUserAccessUpdateUserRole bean.
     * Called from PUT /api/update-user-access-role.
     *
     * When enabledFlag is 'Y' (re-enabling), also checks if the user was
     * previously soft-deleted using ctlTwrUserAccessCheckDeletedUser.
     *
     * @param userName      The user whose access role is being updated
     * @param roleId        The role_id to update
     * @param enabledFlag   New enabled flag value ('Y' or 'N')
     * @param admin         New admin flag value ('Y' or 'N')
     * @param readOnly      New read-only flag value ('Y' or 'N')
     * @param lastUpdatedBy The user performing the update
     * @return Map with "rowsAffected" (int) and optionally "isDeleted" (String
     *         'TRUE'/'FALSE')
     */
    public Map<String, Object> updateAccessRole(String userName, int roleId, String enabledFlag,
            String admin, String readOnly, String lastUpdatedBy) {
        validateUsername(userName);

        if (lastUpdatedBy == null || lastUpdatedBy.trim().isEmpty()) {
            throw new IllegalArgumentException("lastUpdatedBy is required for update tracking");
        }
        if (enabledFlag == null || (!enabledFlag.equals("Y") && !enabledFlag.equals("N"))) {
            throw new IllegalArgumentException("enabledFlag must be 'Y' or 'N'");
        }
        if (admin == null || (!admin.equals("Y") && !admin.equals("N"))) {
            throw new IllegalArgumentException("admin must be 'Y' or 'N'");
        }
        if (readOnly == null || (!readOnly.equals("Y") && !readOnly.equals("N"))) {
            throw new IllegalArgumentException("readOnly must be 'Y' or 'N'");
        }

        String sanitizedUserName = sanitizeInput(userName, 50).toUpperCase();
        String sanitizedUpdatedBy = sanitizeInput(lastUpdatedBy, 50);

        int rowsAffected = jdbcManager.updateCtlTwrUserAccessRole(ctlTwrUserAccessUpdateUserRole,
                enabledFlag, admin, readOnly, sanitizedUpdatedBy, sanitizedUserName, roleId);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("rowsAffected", rowsAffected);

        // When enabling a role, check if the user was previously soft-deleted
        if ("Y".equals(enabledFlag) && rowsAffected > 0) {
            List<Map<String, Object>> checkResult = jdbcManager.queryForListWithParams(
                    ctlTwrUserAccessCheckDeletedUser, sanitizedUserName, roleId);
            if (checkResult != null && !checkResult.isEmpty()) {
                result.put("isDeleted", checkResult.get(0).get("IS_DELETED"));
            }
        }

        return result;
    }

    /**
     * Soft-deletes a user access role from XXCFI_CTL_TOWER_USER_ACCESS.
     * Reuses the combined CASE WHEN query with action='DELETE'.
     * CASE branches set ENABLED_FLAG=NULL and preserve existing ADMIN/READ_ONLY.
     * Called from PUT /api/delete-user-access-role.
     *
     * @param userName      The user whose access role is being deleted
     * @param roleId        The role_id to remove
     * @param lastUpdatedBy The user performing the deletion
     * @return Number of rows updated (1 = success, 0 = not found)
     */
    public int deleteAccessRole(String userName, int roleId, String lastUpdatedBy) {
        validateUsername(userName);

        if (lastUpdatedBy == null || lastUpdatedBy.trim().isEmpty()) {
            throw new IllegalArgumentException("lastUpdatedBy is required for deletion tracking");
        }

        String sanitizedUserName = sanitizeInput(userName, 50).toUpperCase();
        String sanitizedUpdatedBy = sanitizeInput(lastUpdatedBy, 50);

        // '0' sentinel: CASE sets ENABLED_FLAG=NULL, preserves ADMIN/READ_ONLY
        return jdbcManager.updateCtlTwrUserAccessRole(ctlTwrUserAccessUpdateUserRole,
                "0", "0", "0", sanitizedUpdatedBy, sanitizedUserName, roleId);
    }

    public List<Map<String, Object>> getAllUsersAccessList() {
        return jdbcManager.queryForList(ctlTwrUserAccess);
    }

    public UserRoleInfo getUsersAccessListByUser(String userName) {
        String upperUserName = userName.toUpperCase();
        List<Map<String, Object>> accessList = jdbcManager.queryForListWithSingleParam(ctlTwrUserAccessByUser,
                upperUserName);

        Optional<Map<String, Object>> userOptional = accessList.stream()
                .filter(row -> "Y".equals(row.get("ENABLED_FLAG")))
                .findFirst();

        if (userOptional.isPresent()) {
            Map<String, Object> user = userOptional.get();
            String name = (String) user.get("USER_NAME");
            String email = (String) user.get("USER_EMAIL");

            List<RoleEntry> roles = accessList.stream()
                    .filter(row -> "Y".equals(row.get("ENABLED_FLAG")))
                    .map(row -> new RoleEntry(
                            ((Number) row.get("ROLE_ID")).intValue(),
                            (String) row.get("ROLE_NAME"),
                            (String) row.get("ADMIN")))
                    .collect(Collectors.toList());

            return new UserRoleInfo(name, email, roles);
        }
        return null;
    }

}
