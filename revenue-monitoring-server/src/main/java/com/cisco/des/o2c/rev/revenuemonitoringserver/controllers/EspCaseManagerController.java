package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.EspCaseManagerService;
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
public class EspCaseManagerController {

    @Autowired
    private EspCaseManagerService service;
    @GetMapping("/esp-aging-case-summary")
    public ResponseEntity<List<Map<String, Object>>> getEspAgingCaseSummary() {
        return new ResponseEntity<>(service.getEspAgingCaseSummary(), HttpStatus.OK);
    }

    @GetMapping("/esp-case-service-metric-summary")
    public ResponseEntity<List<Map<String, Object>>> getEspCaseServiceMetricSummary() {
        return new ResponseEntity<>(service.getEspCaseServiceMetricSummary(), HttpStatus.OK);
    }

    @GetMapping("/esp-weekly-comparison-summary")
    public ResponseEntity<List<Map<String, Object>>> getEspWeeklyComparisonSummary() {
        return new ResponseEntity<>(service.getEspWeeklyComparisonSummary(), HttpStatus.OK);
    }

    @GetMapping("/sbp-esp-aging-case-summary")
    public ResponseEntity<List<Map<String, Object>>> getSbpEspAgingCaseSummary() {
        return new ResponseEntity<>(service.getSbpEspAgingCaseSummary(), HttpStatus.OK);
    }

    @GetMapping("/sbp-esp-case-service-metric-summary")
    public ResponseEntity<List<Map<String, Object>>> getSbpEspCaseServiceMetricSummary() {
        return new ResponseEntity<>(service.getSbpEspCaseServiceMetricSummary(), HttpStatus.OK);
    }

    @GetMapping("/sbp-esp-weekly-comparison-summary")
    public ResponseEntity<List<Map<String, Object>>> getSbpEspWeeklyComparisonSummary() {
        return new ResponseEntity<>(service.getSbpEspWeeklyComparisonSummary(), HttpStatus.OK);
    }

    @GetMapping("/vw-i2c-category-match-status")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCategoryMatchStatus() {
        System.out.println("hit 1");
        return new ResponseEntity<>(service.getVwI2cCategoryMatchStatus(), HttpStatus.OK);
    }

    @GetMapping("/vw-i2c-core-issue-match-status")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCoreIssueMatchStatus() {
        System.out.println("hit 2");
        return new ResponseEntity<>(service.getVwI2cCoreIssueMatchStatus(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-validated-cases-accuracy-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqValidatedCasesAccuracyV() {
        System.out.println("hit 3");
        return new ResponseEntity<>(service.getXxcaseiqValidatedCasesAccuracyV(), HttpStatus.OK);
    }

    @GetMapping("/vw-i2c-case-details")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCaseDetails() {
        System.out.println("hit 4");
        return new ResponseEntity<>(service.getVwI2cCaseDetails(), HttpStatus.OK);
    }
}
