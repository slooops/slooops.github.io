package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.WIPSMonitoringService;
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
public class WIPSController {

    @Autowired
    WIPSMonitoringService service;

    @GetMapping("/wips-summary")
    public ResponseEntity<List<Map<String, Object>>> getWIPSSummary() {
        return new ResponseEntity<>(service.getWIPSSummaryData("om_control_tower_dfm_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/wips-details")
    public ResponseEntity<List<Map<String, Object>>> getWIPSDetails() {
        return new ResponseEntity<>(service.getWIPSDetailsData("om_control_tower_dfm_detail_view"), HttpStatus.OK);
    }
}
