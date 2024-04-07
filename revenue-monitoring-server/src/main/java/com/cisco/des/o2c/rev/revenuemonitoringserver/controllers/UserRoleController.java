package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.DailyMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/user")
public class UserRoleController {

    @Autowired
    private DailyMonitoringService userService;

//    @PostMapping(value = "/auth-user")
//    public ResponseEntity<String> getAuthUser(@RequestBody Map<String,String> authUser){
//        System.out.println("loggedinUser:"+authUser.get("auth_user"));
//        userService.setAuthorizedUser(authUser.get("auth_user"));
//        return ResponseEntity.status(HttpStatus.OK).body("successful.");
//    }


}
