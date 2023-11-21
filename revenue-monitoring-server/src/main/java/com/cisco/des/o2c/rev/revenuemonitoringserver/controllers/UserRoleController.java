package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/user")
public class UserRoleController {

    @PostMapping(value = "/auth-user")
    public ResponseEntity<String> getAuthUser(@RequestBody Map<String,String> authUser){
        System.out.println(authUser);
        return ResponseEntity.status(HttpStatus.OK).body("successful.");
    }

}
