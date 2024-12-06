package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.ExceptionMonitoringService;
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
public class ExceptionMonitoringController {

    @Autowired
    private ExceptionMonitoringService service;


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

    @GetMapping("/rol-errors-summary")
    public ResponseEntity<List<Map<String, Object>>> getRolErrorsSummary() {
        return new ResponseEntity<>(service.getRolErrorsSummary(), HttpStatus.OK);
    }

    @GetMapping("/summary-assignment-users")
    public ResponseEntity<List<Map<String, Object>>> getSummaryAssignmentUsers() {
        return new ResponseEntity<>(service.getSummaryAssignmentUsers(), HttpStatus.OK);
    }

    @GetMapping("/auto-invoice-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getAutoInvoiceErrorSummary() {
        return new ResponseEntity<>(service.getAutoInvoiceErrorSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/auto-invoice-error-details")
    public ResponseEntity<List<Map<String, Object>>> getAutoInvoiceErrorDetails() {
        return new ResponseEntity<>(service.getAutoInvoiceErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/pre-invoice-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getPreInvoiceErrorSummary() {
        return new ResponseEntity<>(service.getPreInvoiceErrorSummaryView(), HttpStatus.OK);
    }

    @GetMapping("/pre-invoice-error-details")
    public ResponseEntity<List<Map<String, Object>>> getPreInvoiceErrorDetails() {
        return new ResponseEntity<>(service.getPreInvoiceErrorDetails(), HttpStatus.OK);
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
                List<Map<String, Object>> result = service.getPreInvoiceErrorDetailsFiltered(appName, ouName,
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

    @PostMapping("/rol-errors-summary-update")
    public ResponseEntity<String> updateRolErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateRolErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @PostMapping("/auto-invoice-error-summary-update")
    public ResponseEntity<String> updateAutoInvoiceErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateAutoInvoiceErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @PostMapping("/pre-invoice-error-summary-update")
    public ResponseEntity<String> updatePreInvoiceErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updatePreInvoiceErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @PostMapping("/accruals-summary-update")
    public ResponseEntity<String> updateAccrualsErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateAccrualsErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/monitoring-period-status")
    public ResponseEntity<List<Map<String, Object>>> getMonitoringPeriodStatus() {
        return new ResponseEntity<>(service.getMonitoringPeriodStatus(), HttpStatus.OK);
    }

    @GetMapping("/rol-chart-totals")
    public ResponseEntity<List<Map<String, Object>>> getRolChartTotals() {
        return new ResponseEntity<>(service.getRolChartTotals(), HttpStatus.OK);
    }

    @GetMapping("/rol-chart-details")
    public ResponseEntity<List<Map<String, Object>>> getRolChartDetails() {
        return new ResponseEntity<>(service.getRolChartDetails(), HttpStatus.OK);
    }

    @GetMapping("/sbp-summary")
    public ResponseEntity<List<Map<String, Object>>> getSbpSummary() {
        return new ResponseEntity<>(service.getSbpSummary(), HttpStatus.OK);
    }

    @GetMapping("/sbp-details")
    public ResponseEntity<List<Map<String, Object>>> getSbpDetails() {
        return new ResponseEntity<>(service.getSbpDetails(), HttpStatus.OK);
    }

    @GetMapping("/accruals-summary")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsSummary() {
        return new ResponseEntity<>(service.getAccrualsSummary(), HttpStatus.OK);
    }

    @GetMapping("/accruals-details")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsDetails() {
        return new ResponseEntity<>(service.getAccrualsDetails(), HttpStatus.OK);
    }

    @GetMapping("/invoice-to-cash-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceTOoCashSummary() {
        return new ResponseEntity<>(service.getInvoiceToCashSummary(), HttpStatus.OK);
    }

    @GetMapping("/gl-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getGlErrorSummary() {
        return new ResponseEntity<>(service.getGlErrorSummary(), HttpStatus.OK);
    }

    @GetMapping("/gl-error-details")
    public ResponseEntity<List<Map<String, Object>>> getGlErrorDetails() {
        return new ResponseEntity<>(service.getGlErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/gl-details-filtered")
    public ResponseEntity<Map<String, Object>> getGlDetailsFiltered(@RequestParam List<String> processFlows,
                                                                    @RequestParam List<String> ledgerNames,
                                                                    @RequestParam List<String> applicationNames,
                                                                    @RequestParam List<String> journalSources,
                                                                    @RequestParam List<String> accountSegs,
                                                                    @RequestParam List<String> transactionDates) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(ledgerNames.size(), Math.min(journalSources.size(), Math.min(applicationNames.size(),
                    Math.min(processFlows.size(), Math.min(accountSegs.size(), transactionDates.size())))));

            for (int i = 0; i < minLength; i++) {
                String processFlow = processFlows.get(i);
                String ledgerName = ledgerNames.get(i);
                String appName = applicationNames.get(i);
                String journalSource = journalSources.get(i);
                String accountseg = accountSegs.get(i);
                String uniqueId = transactionDates.get(i);
                List<Map<String, Object>> result = service.getGlDetailsFilter(processFlow, ledgerName, appName,
                        journalSource, accountseg, uniqueId);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }

    }

    @PostMapping("/gl-summary-update")
    public ResponseEntity<String> updateGlErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateGlErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

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

    @GetMapping("/tsp-account-summary-view")
    public ResponseEntity<List<Map<String, Object>>> getTspAccountSummaryView() {
        return new ResponseEntity<>(service.getTspAccountSummaryView(), HttpStatus.OK);
    }

//    @GetMapping("/tsp-account-detail-view")
//    public ResponseEntity<List<Map<String, Object>>> getTspAccountDetailView() {
//        return new ResponseEntity<>(service.getTspAccountDetailView(), HttpStatus.OK);
//    }
}
