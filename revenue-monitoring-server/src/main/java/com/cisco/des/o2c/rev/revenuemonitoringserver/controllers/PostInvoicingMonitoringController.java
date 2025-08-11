package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.PostInvoicingMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class PostInvoicingMonitoringController {

    @Autowired
    private PostInvoicingMonitoringService service;

    //Post Invoice
    @GetMapping("/post-invoice-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getCMAmortErrorSummary() {
        return new ResponseEntity<>(service.getCMAmortErrorSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/post-invoice-error-details")
    public ResponseEntity<List<Map<String, Object>>> getCMAmortErrorDetails() {
        return new ResponseEntity<>(service.getCMAmortErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/post-invoice-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getCMAmortErrorDetailsFiltered(
            @RequestParam List<String> periodNames,
            @RequestParam List<String> orgNames,
            @RequestParam List<String> applicationNames,
            @RequestParam List<String> processFlows,
            @RequestParam List<String> transactionDates) {

        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(), Math.min(processFlows.size(), transactionDates.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String transactionDate = transactionDates.get(i);
                String processFlow = processFlows.get(i);
                List<Map<String, Object>> result = service.getCMAmortErrorDetailsFiltered(periodName, appName, processFlow, ouName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/post-invoice-error-summary-update")
    public ResponseEntity<String> updateCMAmortErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateCMAmortErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/print-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getPrintErrorSummary() {
        return new ResponseEntity<>(service.getPrintErrorSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/print-error-details")
    public ResponseEntity<List<Map<String, Object>>> getPrintErrorDetails() {
        return new ResponseEntity<>(service.getPrintErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/print-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getPrintDetailsFiltered(
            @RequestParam List<String> periodNames,
            @RequestParam List<String> orgNames,
            @RequestParam List<String> applicationNames,
            @RequestParam List<String> processFlows,
            @RequestParam List<String> transactionDates) {

        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(), Math.min(processFlows.size(), transactionDates.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String transactionDate = transactionDates.get(i);
                String processFlow = processFlows.get(i);
                List<Map<String, Object>> result = service.getPrintErrorDetailsFiltered(periodName, appName, processFlow, ouName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/print-error-summary-update")
    public ResponseEntity<String> updatePrintErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updatePrintErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/credit-card-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getCreditCardErrorSummary() {
        return new ResponseEntity<>(service.getCreditCardSummary(), HttpStatus.OK);
    }

    @GetMapping("/credit-card-error-details")
    public ResponseEntity<List<Map<String, Object>>> getCreditCardErrorDetails() {
        return new ResponseEntity<>(service.getCreditCardDetails(), HttpStatus.OK);
    }

    @GetMapping("/credit-card-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getCreditCardErrorDetailsFiltered(
            @RequestParam List<String> periodNames,
            @RequestParam List<String> orgNames,
            @RequestParam List<String> applicationNames,
            @RequestParam List<String> processFlows,
            @RequestParam List<String> transactionDates) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(), Math.min(processFlows.size(), transactionDates.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String transactionDate = transactionDates.get(i);
                String processFlow = processFlows.get(i);
                List<Map<String, Object>> result = service.getCreditCardDetailsFiltered(periodName, appName, processFlow, ouName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/rpo-extract-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getRpoExtractSummary() {
        return new ResponseEntity<>(service.getRpoExtractSummary(), HttpStatus.OK);
    }

    @GetMapping("/rpo-extract-error-details")
    public ResponseEntity<List<Map<String, Object>>> getRpoExtractDetails() {
        return new ResponseEntity<>(service.getRpoExtractDetails(), HttpStatus.OK);
    }

    @GetMapping("/rpo-extract-details-filtered")
    public ResponseEntity<Map<String, Object>> getRpoExtractDetailsFiltered(
            @RequestParam List<String> periodNames,
            @RequestParam List<String> orgNames,
            @RequestParam List<String> applicationNames,
            @RequestParam List<String> processFlows,
            @RequestParam List<String> transactionDates) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(), Math.min(processFlows.size(), transactionDates.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String transactionDate = transactionDates.get(i);
                String processFlow = processFlows.get(i);
                List<Map<String, Object>> result = service.getRpoExtractDetailsFiltered(periodName, appName, processFlow, ouName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/rpo-extract-summary-update")
    public ResponseEntity<String> updateRPOExtractSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateRPOExtractSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/srt-process-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getSrtProcessSummary() {
        return new ResponseEntity<>(service.getSrtProcessSummary(), HttpStatus.OK);
    }

    @GetMapping("/srt-process-error-details")
    public ResponseEntity<List<Map<String, Object>>> getSrtProcessDetails() {
        return new ResponseEntity<>(service.getSrtProcessDetails(), HttpStatus.OK);
    }

    @GetMapping("/srt-process-details-filtered")
    public ResponseEntity<Map<String, Object>> getSRTProcessDetailsFiltered(
            @RequestParam List<String> periodNames,
            @RequestParam List<String> orgNames,
            @RequestParam List<String> processFlows,
            @RequestParam List<String> srtDates) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                     Math.min(processFlows.size(), srtDates.size())));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String srtDate = srtDates.get(i);
                String processFlow = processFlows.get(i);
                List<Map<String, Object>> result = service.getSRTProcessDetailsFiltered(periodName, processFlow, ouName, srtDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/srt-process-summary-update")
    public ResponseEntity<String> updateSRTProcessSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateSRTProcessSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/pcm-application-summary")
    public ResponseEntity<List<Map<String, Object>>> getPcmApplicationSummary() {
        return new ResponseEntity<>(service.getPCMApplicationSummary(), HttpStatus.OK);
    }

    @GetMapping("/pcm-application-details")
    public ResponseEntity<List<Map<String, Object>>> getPcmApplicationDetails() {
        return new ResponseEntity<>(service.getPCMApplicationDetails(), HttpStatus.OK);
    }

    @GetMapping("/pcm-application-details-filtered")
    public ResponseEntity<Map<String, Object>> getPcmApplicationDetailsFiltered(
            @RequestParam List<String> periodNames,
            @RequestParam List<String> orgNames,
            @RequestParam List<String> applicationNames,
            @RequestParam List<String> processFlows,
            @RequestParam List<String> transactionDates) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(), Math.min(processFlows.size(), transactionDates.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String transactionDate = transactionDates.get(i);
                String processFlow = processFlows.get(i);
                List<Map<String, Object>> result = service.getPCMApplicationDetailsFiltered(periodName, appName, processFlow, ouName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/pcm-application-summary-update")
    public ResponseEntity<String> updatePCMApplicationSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updatePCMApplicationSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

}
