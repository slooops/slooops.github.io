package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserRoleService {

    private JdbcManager jdbcManager;

    private String authorizedUser;

    String[] userRoleGroups = {"admin", "periodClose", "largeDeal", "wd0", "midcloseVolumes", "cloUpdate"};

    public String getAuthorizedUser() {
        return authorizedUser;
    }

    public void setAuthorizedUser(String authorizedUser) {
        this.authorizedUser = authorizedUser;
    }

    @Autowired
    public UserRoleService(JdbcManager jdbcManager) {
        this.jdbcManager = jdbcManager;
    }

    public List<String> userGroups(){
        List<String> userRoles = new ArrayList<>();
        userRoles.add("admin");
        return userRoles;

    }
}
