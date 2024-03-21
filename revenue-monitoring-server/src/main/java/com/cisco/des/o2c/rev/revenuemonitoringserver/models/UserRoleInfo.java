package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.List;

public class UserRoleInfo {
    private String username;
    private String userEmail;
    private List<String> userRoles;

    public UserRoleInfo(String username, String userEmail, List<String> userRoles) {
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

    public List<String> getUserRoles() {
        return userRoles;
    }
}