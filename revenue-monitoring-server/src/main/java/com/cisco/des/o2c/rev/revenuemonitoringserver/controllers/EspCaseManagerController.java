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
        System.out.println("=== ENDPOINT HIT: /api/sbp-esp-weekly-comparison-summary ===");
        return new ResponseEntity<>(service.getSbpEspWeeklyComparisonSummary(), HttpStatus.OK);
    }

    @GetMapping("/vw-i2c-category-match-status")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCategoryMatchStatus() {
        System.out.println("=== ENDPOINT HIT: /api/vw-i2c-category-match-status ===");
        try {
            List<Map<String, Object>> result = service.getVwI2cCategoryMatchStatus();
            System.out.println("SUCCESS: Returned " + result.size() + " records");
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("ERROR in vw-i2c-category-match-status: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/vw-i2c-core-issue-match-status")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCoreIssueMatchStatus() {
        System.out.println("=== ENDPOINT HIT: /api/vw-i2c-core-issue-match-status ===");
        try {
            List<Map<String, Object>> result = service.getVwI2cCoreIssueMatchStatus();
            System.out.println("SUCCESS: Returned " + result.size() + " records");
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("ERROR in vw-i2c-core-issue-match-status: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/xxcaseiq-validated-cases-accuracy-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqValidatedCasesAccuracyV() {
        System.out.println("=== ENDPOINT HIT: /api/xxcaseiq-validated-cases-accuracy-v ===");
        try {
            List<Map<String, Object>> result = service.getXxcaseiqValidatedCasesAccuracyV();
            System.out.println("SUCCESS: Returned " + result.size() + " records");
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("ERROR in xxcaseiq-validated-cases-accuracy-v: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/vw-i2c-case-details")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCaseDetails() {
        System.out.println("=== ENDPOINT HIT: /api/vw-i2c-case-details ===");
        try {
            List<Map<String, Object>> result = service.getVwI2cCaseDetails();
            System.out.println("SUCCESS: Returned " + result.size() + " records");
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("ERROR in vw-i2c-case-details: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
