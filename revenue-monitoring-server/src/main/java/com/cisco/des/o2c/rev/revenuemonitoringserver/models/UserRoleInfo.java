package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.List;

public class UserRoleInfo {
    private String username;
    private String userEmail;
    private List<RoleEntry> userRoles;

    public UserRoleInfo(String username, String userEmail, List<RoleEntry> userRoles) {
        this.username = username;
        this.userEmail = userEmail;
        this.userRoles = userRoles;
    }

    public String getUsername() {
        return username;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public List<RoleEntry> getUserRoles() {
        return userRoles;
    }
}