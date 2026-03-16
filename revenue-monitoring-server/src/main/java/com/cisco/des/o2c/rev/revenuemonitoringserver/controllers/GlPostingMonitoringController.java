package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.GLPostingMonitoringService;
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
public class GlPostingMonitoringController {

    @Autowired
    private GLPostingMonitoringService service;

    @GetMapping("/gl-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getGlErrorSummary() {
        return new ResponseEntity<>(service.getGlErrorSummary(), HttpStatus.OK);
    }

    @GetMapping("/gl-error-details")
    public ResponseEntity<List<Map<String, Object>>> getGlErrorDetails() {
        return new ResponseEntity<>(service.getGlErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/gl-details-filtered")
    public ResponseEntity<Map<String, Object>> getGlDetailsFiltered(@RequestParam List<String> periodNames,
                                                                    @RequestParam List<String> applicationNames,
                                                                    @RequestParam List<String> processFlows,
                                                                    @RequestParam List<String> ledgerNames,
                                                                    @RequestParam List<String> glBatchNames,
                                                                    @RequestParam List<String> transactionDates) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(periodNames.size(), Math.min(applicationNames.size(), Math.min(processFlows.size(), Math.min(ledgerNames.size(), Math.min(glBatchNames.size(), transactionDates.size())))));
            for (int i = 0; i < minLength; i++) {
                String processFlow = processFlows.get(i);
                String ledgerName = ledgerNames.get(i);
                String appName = applicationNames.get(i);
                String periodName = periodNames.get(i);
                String glbatch = glBatchNames.get(i);
                String uniqueId = transactionDates.get(i);
                List<Map<String, Object>> result = service.getGlDetailsFilter(periodName, appName, processFlow, ledgerName,
                        glbatch, uniqueId);
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

    @GetMapping("/ait-error-summary")
    public ResponseEntity<List<Map<String, Object>>> getGlInterfaceErrorSummary() {
        return new ResponseEntity<>(service.getGlInterfaceErrorSummary(), HttpStatus.OK);
    }

    @GetMapping("/ait-error-details")
    public ResponseEntity<List<Map<String, Object>>> getGlInterfaceErrorDetails() {
        return new ResponseEntity<>(service.getGlInterfaceErrorDetails(), HttpStatus.OK);
    }

    @GetMapping("/ait-details-filtered")
    public ResponseEntity<Map<String, Object>> getAITGlInterfaceDetailsFilter(@RequestParam List<String> sources,
                                                                    @RequestParam List<String> ledgers,
                                                                    @RequestParam List<String> periods,
                                                                    @RequestParam List<String> batchNames,
                                                                    @RequestParam List<String> dateCreateds) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(sources.size(), Math.min(ledgers.size(), Math.min(periods.size(), Math.min(batchNames.size(),  dateCreateds.size()))));
            for (int i = 0; i < minLength; i++) {
                String source = sources.get(i);
                String ledger = ledgers.get(i);
                String period = periods.get(i);
                String batchName = batchNames.get(i);
                String dateCreated = dateCreateds.get(i);
                List<Map<String, Object>> result = service.getAITGlInterfaceDetailsFilter(source, ledger, period, batchName,
                        dateCreated);
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
