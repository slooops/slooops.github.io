package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.OperationsControlsService;
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
public class OperationsControlsController {

    @Autowired
    private OperationsControlsService service;

    @GetMapping("/rev-controls-errors-summary")
    public ResponseEntity<List<Map<String, Object>>> getRevControlsErrorSummary() {
        return new ResponseEntity<>(service.getRevControlsSummary(), HttpStatus.OK);
    }

    @GetMapping("/rev-controls-error-details")
    public ResponseEntity<List<Map<String, Object>>> getRevControlsErrorDetails() {
        return new ResponseEntity<>(service.getRevControlsDetails(), HttpStatus.OK);
    }

    @GetMapping("/i2c-controls-errors-summary")
    public ResponseEntity<List<Map<String, Object>>> getI2CControlsErrorSummary() {
        return new ResponseEntity<>(service.geti2cControlsSummary(), HttpStatus.OK);
    }

    @GetMapping("/i2c-controls-error-details")
    public ResponseEntity<List<Map<String, Object>>> getI2CControlsErrorDetails() {
        return new ResponseEntity<>(service.getI2CControlsDetails(), HttpStatus.OK);
    }
    @GetMapping("/i2c-controls-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getI2CControlsErrorDetailsFiltered(@RequestParam List<String> periodNames,
                                                                                  @RequestParam List<String> orgNames,
                                                                                  @RequestParam List<String> applicationNames,
                                                                                  @RequestParam List<String> transactionDates,
                                                                                  @RequestParam List<String> ruleNames) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(),Math.min(transactionDates.size(), ruleNames.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String transactionDate = transactionDates.get(i);
                String ruleName = ruleNames.get(i);
                List<Map<String, Object>> result = service.getI2CControlsDetailsFiltered(periodName, appName, ouName, transactionDate, ruleName);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/rev-controls-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getRevControlsErrorDetailsFiltered(@RequestParam List<String> periodNames,
                                                                                  @RequestParam List<String> orgNames,
                                                                                  @RequestParam List<String> applicationNames,
                                                                                  @RequestParam List<String> transactionDates,
                                                                                  @RequestParam List<String> ruleNames) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(),Math.min(transactionDates.size(), ruleNames.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String transactionDate = transactionDates.get(i);
                String ruleName = ruleNames.get(i);
                System.out.println("here");
                List<Map<String, Object>> result = service.getRevControlsDetailsFiltered(periodName, appName, ouName, transactionDate, ruleName);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/gtc-controls-errors-summary")
    public ResponseEntity<List<Map<String, Object>>> getGtcControlsErrorSummary() {
        return new ResponseEntity<>(service.getGtcControlsSummary(), HttpStatus.OK);
    }

    @GetMapping("/gtc-controls-error-details")
    public ResponseEntity<List<Map<String, Object>>> getGtcControlsErrorDetails() {
        return new ResponseEntity<>(service.getGtcControlsDetails(), HttpStatus.OK);
    }

    @GetMapping("/gtc-controls-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getGtcControlsErrorDetailsFiltered(@RequestParam List<String> processFlows,
                                                                                  @RequestParam List<String> bookingEntitys,
                                                                                  @RequestParam List<String> transactionDates) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(processFlows.size(),Math.min(transactionDates.size(), bookingEntitys.size()));

            for (int i = 0; i < minLength; i++) {
                String processFlow = processFlows.get(i);
                String entityName = bookingEntitys.get(i);
                String transactionDate = transactionDates.get(i);
                List<Map<String, Object>> result = service.getGtcControlsDetailsFiltered(processFlow, entityName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }
}
