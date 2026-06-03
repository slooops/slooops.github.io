package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.LandingContextService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.LandingPageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class LandingPageController {

    @Autowired
    private LandingPageService service;

    @Autowired
    private LandingContextService contextService;

    /**
     * GET /api/landing-context
     * Returns all context data (period close, caseiq, large deal).
     */
    @GetMapping("/landing-context")
    public ResponseEntity<Map<String, Object>> getLandingContext() {
        return new ResponseEntity<>(contextService.getContextData(), HttpStatus.OK);
    }

    /**
     * GET /api/landing-context/{contextId}
     * Returns data for a specific context (1=period close, 2=caseiq, 3=large deal).
     */
    @GetMapping("/landing-context/{contextId}")
    public ResponseEntity<Map<String, Object>> getLandingContextById(
            @PathVariable int contextId) {
        return new ResponseEntity<>(contextService.getContextData(contextId), HttpStatus.OK);
    }

    @GetMapping("/landing-page-period-data")
    public ResponseEntity<List<Map<String, Object>>> getLandingPagePeriodData() {
        return new ResponseEntity<>(service.getLandingPagePeriodData(), HttpStatus.OK);
    }

    @GetMapping("/landing-page-issues")
    public ResponseEntity<List<Map<String, Object>>> getLandingPageIssues() {
        return new ResponseEntity<>(service.getLandingPageIssues(), HttpStatus.OK);
    }

    @GetMapping("/landing-page-high-priority-issues")
    public ResponseEntity<List<Map<String, Object>>> getLandingPageHighPriorityIssues() {
        return new ResponseEntity<>(service.getLandingPageHighPriorityIssues(), HttpStatus.OK);
    }

    @GetMapping("/landing-page-issues-list")
    public ResponseEntity<List<Map<String, Object>>> getLandingPageIssuesList() {
        return new ResponseEntity<>(service.getLandingPageIssuesList(), HttpStatus.OK);
    }

    @GetMapping("/landing-page-issues-distribution")
    public ResponseEntity<List<Map<String, Object>>> getLandingPageIssuesDistribution() {
        return new ResponseEntity<>(service.getLandingPageIssuesDistribution(), HttpStatus.OK);
    }

    @GetMapping("/landing-page-transaction-failures")
    public ResponseEntity<List<Map<String, Object>>> getLandingPageTransactionFailures() {
        return new ResponseEntity<>(service.getLandingPageTransactionFailures(), HttpStatus.OK);
    }

    @GetMapping("/landing-page-esp-cases")
    public ResponseEntity<List<Map<String, Object>>> getLandingPageEspCases() {
        return new ResponseEntity<>(service.getLandingPageEspCases(), HttpStatus.OK);
    }
}
