package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.InvoiceToCashMonitoringService;
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
public class InvoiceToCashMonitoringController {

    @Autowired
    InvoiceToCashMonitoringService service;

    @GetMapping("/credit-card-check-summary-view")
    public ResponseEntity<List<Map<String, Object>>> getCreditCardCheckSummaryView() {
        return new ResponseEntity<>(service.getCreditCardCheckSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/credit-card-check-detail-view")
    public ResponseEntity<List<Map<String, Object>>> getCreditCardCheckDetailView() {
        return new ResponseEntity<>(service.getCreditCardCheckDetailView(), HttpStatus.OK);
    }

    @GetMapping("/credit-card-check-detail-view-filtered")
    public ResponseEntity<Map<String, Object>> getCreditCardCheckDetailFilteredView(@RequestParam List<String> periodNames,
                                                                                    @RequestParam List<String> orgNames,
                                                                                    @RequestParam List<String> holdApplyDates,
                                                                                    @RequestParam List<String> processFlows) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(orgNames.size(),
                    Math.min(holdApplyDates.size(), processFlows.size())));

            for (int i = 0; i < minLength; i++) {
                String periodName = periodNames.get(i);
                String orgName = orgNames.get(i);
                String holdApplyDate = holdApplyDates.get(i);
                String processFlow = processFlows.get(i);
                List<Map<String, Object>> result = service.getCreditCardCheckDetailFilteredView(periodName, orgName, holdApplyDate, processFlow);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/credit-card-check-summary-update")
    public ResponseEntity<String> updateCreditCardCheckSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateCreditCardCheckSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }


    //Pre-Invoice
    @GetMapping("/pre-invoice-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getPreInvoiceErrorSummary() {
        return new ResponseEntity<>(service.getPreInvoiceErrorSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/pre-invoice-error-details")
    public ResponseEntity<List<Map<String, Object>>> getPreInvoiceErrorDetails() {
        return new ResponseEntity<>(service.getPreInvoiceErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/pre-invoice-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getPreInvoiceErrorDetailsFiltered(@RequestParam List<String> periodNames,
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
                List<Map<String, Object>> result = service.getPreInvoiceErrorDetailsFiltered(appName, ouName,
                        periodName, processFlow, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }

    }

    @PostMapping("/pre-invoice-error-summary-update")
    public ResponseEntity<String> updatePreInvoiceErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updatePreInvoiceErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    //Auto-Invoice
    @GetMapping("/auto-invoice-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getAutoInvoiceErrorSummary() {
        return new ResponseEntity<>(service.getAutoInvoiceErrorSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/auto-invoice-error-details")
    public ResponseEntity<List<Map<String, Object>>> getAutoInvoiceErrorDetails() {
        return new ResponseEntity<>(service.getAutoInvoiceErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/auto-invoice-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getAutoInvoiceErrorDetailsFiltered(
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
                List<Map<String, Object>> result = service.getAutoInvoiceErrorDetailsFiltered(appName, ouName,
                        periodName, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/auto-invoice-error-summary-update")
    public ResponseEntity<String> updateAutoInvoiceErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateAutoInvoiceErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    //eInvoicing
    @GetMapping("/einvoicing-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getEInvoicingErrorSummary() {
        return new ResponseEntity<>(service.getEInvoicingSummary(), HttpStatus.OK);
    }

    @GetMapping("/einvoicing-error-details")
    public ResponseEntity<List<Map<String, Object>>> getEInvoicingErrorDetails() {
        return new ResponseEntity<>(service.getEInvoicingDetails(), HttpStatus.OK);
    }

    @GetMapping("/einvoicing-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getEInvoiceErrorDetailsFiltered(
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
                String processFlow = processFlows.get(i);
                String transactionDate = transactionDates.get(i);
                List<Map<String, Object>> result = service.getEInvoicingDetailsFiltered(ouName, periodName, appName,
                        processFlow, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/einvoicing-error-summary-update")
    public ResponseEntity<String> updateEInvoicingErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateEInvoicingErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/fusion-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getFusionErrorSummary() {
        return new ResponseEntity<>(service.getFusionErrorSummary(), HttpStatus.OK);
    }

    @GetMapping("/fusion-error-details")
    public ResponseEntity<List<Map<String, Object>>> getFusionErrorDetails() {
        return new ResponseEntity<>(service.getFusionDetails(), HttpStatus.OK);
    }

    @GetMapping("/fusion-error-details-filtered")
    public ResponseEntity<Map<String, Object>> getFusionErrorDetailsFiltered(
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
                String processFlow = processFlows.get(i);
                String transactionDate = transactionDates.get(i);
                List<Map<String, Object>> result = service.getFusionDetailsFiltered(ouName, periodName, appName,
                        processFlow, transactionDate);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/fusion-error-summary-update")
    public ResponseEntity<String> updateFusionErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateFusionErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }
}
