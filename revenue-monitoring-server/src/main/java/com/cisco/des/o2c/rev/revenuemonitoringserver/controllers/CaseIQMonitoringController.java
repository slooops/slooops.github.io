package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CaseIQMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api/caseiq")
public class CaseIQMonitoringController {

    @Autowired
    private CaseIQMonitoringService service;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthOverview(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getHealthOverview(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/ghost-success")
    public ResponseEntity<List<Map<String, Object>>> ghostSuccess(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getGhostSuccess(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/null-status")
    public ResponseEntity<List<Map<String, Object>>> nullStatus(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getNullStatus(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/not-defined")
    public ResponseEntity<List<Map<String, Object>>> notDefined(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getNotDefined(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/error-no-reason")
    public ResponseEntity<List<Map<String, Object>>> errorNoReason(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getErrorNoReason(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/error-breakdown")
    public ResponseEntity<List<Map<String, Object>>> errorBreakdown(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getErrorBreakdown(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/unknown-status")
    public ResponseEntity<List<Map<String, Object>>> unknownStatus(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getUnknownStatus(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/failure")
    public ResponseEntity<List<Map<String, Object>>> failure(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getFailureStatus(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/exceptions")
    public ResponseEntity<List<Map<String, Object>>> exceptions(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getExceptions(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/staleness")
    public ResponseEntity<List<Map<String, Object>>> staleness() {
        return new ResponseEntity<>(service.getStaleness(), HttpStatus.OK);
    }

    @GetMapping("/anomalies/null-classification")
    public ResponseEntity<List<Map<String, Object>>> nullClassification(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getNullClassification(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/unknown-team")
    public ResponseEntity<List<Map<String, Object>>> unknownTeam(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getUnknownTeam(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/status/resolution")
    public ResponseEntity<List<Map<String, Object>>> resolutionDistribution(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getResolutionDistribution(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/status/analyzer")
    public ResponseEntity<List<Map<String, Object>>> analyzerDistribution(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getAnalyzerDistribution(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/performance/processing-time")
    public ResponseEntity<List<Map<String, Object>>> processingTime(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getProcessingTime(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/performance/throughput")
    public ResponseEntity<List<Map<String, Object>>> throughput(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getThroughput(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/performance/time-by-status")
    public ResponseEntity<List<Map<String, Object>>> timeByStatus(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getTimeByStatus(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/volume/team-summary")
    public ResponseEntity<List<Map<String, Object>>> teamSummary(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getTeamSummary(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/volume/daily-trend")
    public ResponseEntity<List<Map<String, Object>>> dailyTrend(
            @RequestParam(defaultValue = "7") int lookbackDays,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getDailyTrend(lookbackDays, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/volume/top-errors")
    public ResponseEntity<List<Map<String, Object>>> topErrors(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getTopErrors(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/team-issue-matrix")
    public ResponseEntity<List<Map<String, Object>>> teamIssueMatrix(
            @RequestParam(defaultValue = "24") int lookbackHours,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getTeamIssueMatrix(lookbackHours, fiscQtr), HttpStatus.OK);
    }

    @GetMapping("/anomalies/issue-trend")
    public ResponseEntity<List<Map<String, Object>>> issueTrend(
            @RequestParam String team,
            @RequestParam String issueType,
            @RequestParam(required = false) String fiscQtr) {
        return new ResponseEntity<>(service.getIssueTrend(team, issueType, fiscQtr), HttpStatus.OK);
    }
}
