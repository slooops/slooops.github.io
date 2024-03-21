package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class UserRoleService {

    private JdbcManager jdbcManager;

    private String authorizedUser = "avudutha@cisco.com";
//    private String personaAccessRoles;

//
//    public UserRoleService(JdbcManager jdbcManager, String personaAccessRoles){
//        this.personaAccessRoles = personaAccessRoles;
//    }

    String[] userRoleGroups = {"admin", "periodClose", "largeDeal", "wd0", "midcloseVolumes", "cloUpdate", "dealUpload"};

//    public String getAuthorizedUser() {
//        return authorizedUser;
//    }
//
//    public void setAuthorizedUser(String authorizedUser) {
//        this.authorizedUser = authorizedUser;
//    }

    @Autowired
    public UserRoleService(JdbcManager jdbcManager) {
        this.jdbcManager = jdbcManager;
    }

    public List<String> userGroups(){
        List<String> userRoles = new ArrayList<>();
        userRoles.add("admin");
//        userRoles.add("cloUpdate");
        return userRoles;

    }
//
//    public List<Map<String, Object>> getUserRoles() {
//        return jdbcManager.queryForList(personaAccessRoles);
//    }
}
