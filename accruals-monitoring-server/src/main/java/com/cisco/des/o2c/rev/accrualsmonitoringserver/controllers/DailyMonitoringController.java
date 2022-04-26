package com.cisco.des.o2c.rev.accrualsmonitoringserver.controllers;

import com.cisco.des.o2c.rev.accrualsmonitoringserver.services.DailyMonitoringService;
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
public class DailyMonitoringController {

    private DailyMonitoringService service;

    @Autowired
    public DailyMonitoringController(DailyMonitoringService service) {
        this.service = service;
    }

    @GetMapping("/daily-monitoring")
    public ResponseEntity<List<Map<String, Object>>> getDailyMonitoringSummary() {
        System.out.println("daily monitoring");
        return new ResponseEntity<>(service.getDailyMonitoringSummary(), HttpStatus.OK);
    }

    @GetMapping("/daily-monitoring/details")
    public ResponseEntity<List<Map<String, Object>>> getDailyMonitoringDetails() {
        System.out.println("daily monitoring details");
        return new ResponseEntity<>(service.getMonitoringDetails(), HttpStatus.OK);
    }

    @GetMapping("/last-program-run")
    public ResponseEntity<List<Map<String, Object>>> getProgramLastRun() {
        System.out.println("last program run");
        return new ResponseEntity<>(service.getProgramLastRun(), HttpStatus.OK);
    }

}
