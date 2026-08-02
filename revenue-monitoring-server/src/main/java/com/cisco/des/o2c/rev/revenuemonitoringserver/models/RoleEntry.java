package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

public class RoleEntry {
    private int roleId;
    private String roleName;
    private String roleAdmin;

    public RoleEntry(int roleId, String roleName, String roleAdmin) {
        this.roleId = roleId;
        this.roleName = roleName;
        this.roleAdmin = roleAdmin;
    }

    public int getRoleId() {
        return roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public String getRoleAdmin() { return roleAdmin; }
}
