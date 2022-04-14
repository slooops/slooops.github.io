package com.cisco.des.o2c.rev.accrualsmonitoringserver.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class RestApiController {

    @GetMapping("/health")
    public String healthCheck() {
        System.out.println("health check");
        return "{ \"message\" : \"healthy\" }";
    }

}
