package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CtmAiAlertsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api/ctm-alerts")
public class CtmAiAlertsController {

    @Autowired
    private CtmAiAlertsService service;

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> allAlerts() {
        return new ResponseEntity<>(service.getAllAlerts(), HttpStatus.OK);
    }

    @GetMapping("/summary")
    public ResponseEntity<List<Map<String, Object>>> summary() {
        return new ResponseEntity<>(service.getSummary(), HttpStatus.OK);
    }

    @GetMapping("/by-type")
    public ResponseEntity<List<Map<String, Object>>> alertTypeDistribution() {
        return new ResponseEntity<>(service.getAlertTypeDistribution(), HttpStatus.OK);
    }

    @GetMapping("/by-priority")
    public ResponseEntity<List<Map<String, Object>>> priorityDistribution() {
        return new ResponseEntity<>(service.getPriorityDistribution(), HttpStatus.OK);
    }

    @GetMapping("/top-downstream")
    public ResponseEntity<List<Map<String, Object>>> topDownstream() {
        return new ResponseEntity<>(service.getTopDownstreamBlocked(), HttpStatus.OK);
    }

    @GetMapping("/by-application")
    public ResponseEntity<List<Map<String, Object>>> applicationBreakdown() {
        return new ResponseEntity<>(service.getApplicationBreakdown(), HttpStatus.OK);
    }

    @GetMapping("/hourly-trend")
    public ResponseEntity<List<Map<String, Object>>> hourlyTrend() {
        return new ResponseEntity<>(service.getHourlyTrend(), HttpStatus.OK);
    }
}
