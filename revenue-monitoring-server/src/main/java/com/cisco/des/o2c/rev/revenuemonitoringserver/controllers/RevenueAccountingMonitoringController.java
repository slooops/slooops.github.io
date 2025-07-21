package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.RevenueAccountingMonitoringService;
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
public class RevenueAccountingMonitoringController {

    @Autowired
    private RevenueAccountingMonitoringService service;

    //Standard Revenue
    @GetMapping("/standard-revenue-errors-summary")
    public ResponseEntity<List<Map<String, Object>>> getStandardRevenueErrorSummary() {
        return new ResponseEntity<>(service.getStandardRevenueSummary(), HttpStatus.OK);
    }

    @GetMapping("/standard-revenue-error-details")
    public ResponseEntity<List<Map<String, Object>>> getStandardRevenueErrorDetails() {
        return new ResponseEntity<>(service.getStandardRevenueDetails(), HttpStatus.OK);
    }

    @GetMapping("/standard-revenue-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getStandardRevenueDetailsFiltered(@RequestParam List<String> periodNames,
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
                String processFlow = processFlows.get(i);
                String transactionDate = transactionDates.get(i);
                List<Map<String, Object>> result = service.getStandardRevenueDetailsFiltered(periodName, appName, processFlow, ouName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/standard-revenue-summary-update")
    public ResponseEntity<String> updateStandardRevenueSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateStandardRevenueSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }


    //ROL
    @GetMapping("/rol-errors-summary")
    public ResponseEntity<List<Map<String, Object>>> getRolErrorsSummary() {
        return new ResponseEntity<>(service.getRolErrorsSummary(), HttpStatus.OK);
    }

    @GetMapping("/rol-transaction-data")
    public ResponseEntity<List<Map<String, Object>>> getRolTransactionDetails() {
        return new ResponseEntity<>(service.getRolErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/rol-transaction-data-filter")
    public ResponseEntity<Map<String, Object>> getRolTransactionDataFilter(@RequestParam List<String> periodNames,
                                                                           @RequestParam List<String> orgNames,
                                                                           @RequestParam List<String> applicationNames,
                                                                           @RequestParam List<String> processFlows,
                                                                           @RequestParam List<String> sequenceNums) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(), Math.min(processFlows.size(), sequenceNums.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String appName = applicationNames.get(i);
                String uniqueId = sequenceNums.get(i);
                List<Map<String, Object>> result = service.getRolTransactionDetailsFilter(periodName, ouName, appName,
                        uniqueId);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/rol-errors-summary-update")
    public ResponseEntity<String> updateRolErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateRolErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/accruals-summary")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsSummary() {
        return new ResponseEntity<>(service.getAccrualsSummary(), HttpStatus.OK);
    }

    @GetMapping("/accruals-details")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsDetails() {
        return new ResponseEntity<>(service.getAccrualsDetails(), HttpStatus.OK);
    }

    //Accruals


    @GetMapping("/accruals-details-filtered")
    public ResponseEntity<Map<String, Object>> getAccrualsErrorDetailsFiltered(@RequestParam List<String> periodNames,
                                                                               @RequestParam List<String> orgNames,
                                                                               @RequestParam List<String> applicationNames,
                                                                               @RequestParam List<String> processFlows,
                                                                               @RequestParam List<String> sequenceNums) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(applicationNames.size(), Math.min(processFlows.size(), sequenceNums.size()))));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String ouName = orgNames.get(i);
                String processFlow = processFlows.get(i);
                String uniqueId = sequenceNums.get(i);
                List<Map<String, Object>> result = service.getAccrualsDetailsFiltered(periodName, ouName, processFlow,
                        uniqueId);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }

    }

    @PostMapping("/accruals-summary-update")
    public ResponseEntity<String> updateAccrualsErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateAccrualsErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    //Accounts
    @GetMapping("/tsp-account-summary-view")
    public ResponseEntity<List<Map<String, Object>>> getTspAccountSummaryView() {
        return new ResponseEntity<>(service.getTspAccountSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/tsp-account-detail-view")
    public ResponseEntity<List<Map<String, Object>>> getTspAccountDetailView() {
        return new ResponseEntity<>(service.getTspAccountDetailView(), HttpStatus.OK);
    }

    @GetMapping("/accounts-details-filtered")
    public ResponseEntity<Map<String, Object>> getTspAccountDetailViewFiltered(@RequestParam List<String> sequenceNumbers) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = sequenceNumbers.size();

            for (int i = 0; i < minLength; i++) {
                String sequenceNumber = sequenceNumbers.get(i);
                List<Map<String, Object>> result = service.getTspAccountDetailViewFiltered(sequenceNumber);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/tsp-account-summary-update")
    public ResponseEntity<String> updateTspAccountSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateTspAccountSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }
}
