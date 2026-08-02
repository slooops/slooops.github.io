package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.EspCaseManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @GetMapping("/xxcaseiq-category-graph-v-ait")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCategoryGraphVAit() {
        return new ResponseEntity<>(service.getXxcaseiqCategoryGraphVAit(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-category-graph-v-capital")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCategoryGraphVCapital() {
        return new ResponseEntity<>(service.getXxcaseiqCategoryGraphVCapital(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-category-graph-v-fpp")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCategoryGraphVFpp() {
        return new ResponseEntity<>(service.getXxcaseiqCategoryGraphVFpp(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-category-graph-v-i2c")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCategoryGraphVI2c() {
        return new ResponseEntity<>(service.getXxcaseiqCategoryGraphVI2c(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-category-graph-v-om")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCategoryGraphVOm() {
        return new ResponseEntity<>(service.getXxcaseiqCategoryGraphVOm(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-category-graph-v-p2p")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCategoryGraphVP2p() {
        return new ResponseEntity<>(service.getXxcaseiqCategoryGraphVP2p(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-category-graph-v-sm")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCategoryGraphVSm() {
        return new ResponseEntity<>(service.getXxcaseiqCategoryGraphVSm(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-core-issue-graph-v-ait")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCoreIssueGraphVAit() {
        return new ResponseEntity<>(service.getXxcaseiqCoreIssueGraphVAit(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-core-issue-graph-v-capital")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCoreIssueGraphVCapital() {
        return new ResponseEntity<>(service.getXxcaseiqCoreIssueGraphVCapital(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-core-issue-graph-v-fpp")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCoreIssueGraphVFpp() {
        return new ResponseEntity<>(service.getXxcaseiqCoreIssueGraphVFpp(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-core-issue-graph-v-i2c")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCoreIssueGraphVI2c() {
        return new ResponseEntity<>(service.getXxcaseiqCoreIssueGraphVI2c(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-core-issue-graph-v-om")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCoreIssueGraphVOm() {
        return new ResponseEntity<>(service.getXxcaseiqCoreIssueGraphVOm(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-core-issue-graph-v-p2p")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCoreIssueGraphVP2p() {
        return new ResponseEntity<>(service.getXxcaseiqCoreIssueGraphVP2p(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-core-issue-graph-v-sm")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCoreIssueGraphVSm() {
        return new ResponseEntity<>(service.getXxcaseiqCoreIssueGraphVSm(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-i2c-case-details-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqI2cCaseDetailsV() {
        return new ResponseEntity<>(service.getXxcaseiqI2cCaseDetailsV(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-i2c-case-details-match-y")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqI2cCaseDetailsMatchY() {
        return new ResponseEntity<>(service.getXxcaseiqI2cCaseDetailsMatchY(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-ait-case-details-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqAitCaseDetailsV() {
        return new ResponseEntity<>(service.getXxcaseiqAitCaseDetailsV(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-fpp-case-details-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqFppCaseDetailsV() {
        return new ResponseEntity<>(service.getXxcaseiqFppCaseDetailsV(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-om-case-details-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqOmCaseDetailsV() {
        return new ResponseEntity<>(service.getXxcaseiqOmCaseDetailsV(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-sm-case-details-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqSmCaseDetailsV() {
        return new ResponseEntity<>(service.getXxcaseiqSmCaseDetailsV(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-p2p-case-details-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqP2pCaseDetailsV() {
        return new ResponseEntity<>(service.getXxcaseiqP2pCaseDetailsV(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-capital-case-details-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqCapitalCaseDetailsV() {
        return new ResponseEntity<>(service.getXxcaseiqCapitalCaseDetailsV(), HttpStatus.OK);
    }

    @PostMapping(value = "/xxcaseiq-esp-case-analyzer-table-update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> espCaseAnalyzerTableUpdate(@RequestParam("file") MultipartFile file,
                                                             @RequestParam("username") String username) {
        if (!file.isEmpty()) {
            try {
                service.updateEspCaseAnalyzerTable(file, username);
                return ResponseEntity.status(HttpStatus.OK).body("File uploaded successfully.");
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file.");
            }
        } else {
            return ResponseEntity.badRequest().body("Uploaded file is empty.");
        }
    }

    @PostMapping("/xxcaseiq-global-search")
    public ResponseEntity<List<Map<String, Object>>> espCaseManagerGlobalSearch(@RequestParam("incidentNumber") String incidentNumber) throws IOException {
        return new ResponseEntity<>(service.espCaseAnalyzerGlobalSearch(incidentNumber), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-metrics")
    public ResponseEntity<List<Map<String, Object>>> getEspCaseAnalyzerMetrics() {
        return new ResponseEntity<>(service.getEspCaseAnalyzerMetrics(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-reopen-metrics")
    public ResponseEntity<List<Map<String, Object>>> getEspCaseReopenedMetrics() {
        return new ResponseEntity<>(service.getEspCaseReopenedMetrics(), HttpStatus.OK);
    }

    @PostMapping("/xxcaseiq-reopen-update")
    public ResponseEntity<Integer> espCaseManagerGlobalSearch(@RequestBody Map<String, String> updateData) throws IOException {
        System.out.println(updateData);
        return new ResponseEntity<Integer>(service.updateReopenedMetrics(updateData), HttpStatus.OK);
    }
}
