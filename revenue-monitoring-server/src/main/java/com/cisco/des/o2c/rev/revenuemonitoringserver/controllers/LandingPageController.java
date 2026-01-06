package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.LandingPageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class LandingPageController {

    @Autowired
    private LandingPageService service;

    @GetMapping("/landing-page-period-data")
    public ResponseEntity<List<Map<String, Object>>> getLandingPagePeriodData() {
        return new ResponseEntity<>(service.getLandingPagePeriodData(), HttpStatus.OK);
    }
}
