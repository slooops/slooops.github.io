package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.Date;

/**
 * Data Transfer Object (DTO) for creating a new user role.
 * This class represents the JSON payload sent from the frontend.
 * 
 * Example JSON:
 * {
 * "userName": "JSMITH",
 * "userEmail": "jsmith@cisco.com",
 * "roleId": 1,
 * "userRole": "Admin",
 * "enabledFlag": "Y",
 * "createdBy": "ADMIN_USER"
 * }
 */
public class CreateUserRoleRequest {

    private String userName;
    private String userEmail;
    private Integer roleId;
    private String userRole;
    private String enabledFlag;
    private String createdBy;

    // Default constructor (required by Jackson for JSON deserialization)
    public CreateUserRoleRequest() {
    }

    // Constructor with all fields (useful for testing)
    public CreateUserRoleRequest(String userName, String userEmail, Integer roleId,
            String userRole, String enabledFlag, String createdBy) {
        this.userName = userName;
        this.userEmail = userEmail;
        this.roleId = roleId;
        this.userRole = userRole;
        this.enabledFlag = enabledFlag;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    // Spring uses these to map JSON fields to Java object properties

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getEnabledFlag() {
        return enabledFlag;
    }

    public void setEnabledFlag(String enabledFlag) {
        this.enabledFlag = enabledFlag;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    @Override
    public String toString() {
        return "CreateUserRoleRequest{" +
                "userName='" + userName + '\'' +
                ", userEmail='" + userEmail + '\'' +
                ", roleId=" + roleId +
                ", userRole='" + userRole + '\'' +
                ", enabledFlag='" + enabledFlag + '\'' +
                ", createdBy='" + createdBy + '\'' +
                '}';
    }
}
