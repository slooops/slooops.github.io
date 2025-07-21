package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CommonService;
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
public class CommonController {

    @Autowired
    CommonService service;

    //Summaries
    @GetMapping("/invoice-to-cash-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceoCashSummary() {
        return new ResponseEntity<>(service.getInvoiceToCashSummary(), HttpStatus.OK);
    }

    //Common Methods
    @GetMapping("/summary-assignment-users")
    public ResponseEntity<List<Map<String, Object>>> getSummaryAssignmentUsers() {
        return new ResponseEntity<>(service.getSummaryAssignmentUsers(), HttpStatus.OK);
    }

    @GetMapping("/monitoring-period-status")
    public ResponseEntity<List<Map<String, Object>>> getMonitoringPeriodStatus() {
        return new ResponseEntity<>(service.getMonitoringPeriodStatus(), HttpStatus.OK);
    }
}
