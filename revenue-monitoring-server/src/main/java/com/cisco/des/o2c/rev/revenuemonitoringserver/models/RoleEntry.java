package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

public class RoleEntry {
    private int roleId;
    private String roleName;

    public RoleEntry(int roleId, String roleName) {
        this.roleId = roleId;
        this.roleName = roleName;
    }

    public int getRoleId() {
        return roleId;
    }

    public String getRoleName() {
        return roleName;
    }
}
