package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.OrderManagementMonitoringService;
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
public class OrderManagementMonitoringController {
    @Autowired
    private OrderManagementMonitoringService service;


    @GetMapping("/om-import-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMImportSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_import_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-import-details")
    public ResponseEntity<List<Map<String, Object>>> getOMImportDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_import_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-import-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMImportDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_import_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-import-summary-update")
    public ResponseEntity<String> updateOMImportSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/om-holds-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMHoldsSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_holds_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-holds-details")
    public ResponseEntity<List<Map<String, Object>>> getOMHoldsDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_holds_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-holds-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMHoldsDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_holds_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-holds-summary-update")
    public ResponseEntity<String> updateOMHoldsSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/om-bookings-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMBookingsSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_bookings_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-bookings-details")
    public ResponseEntity<List<Map<String, Object>>> getOMBookingsDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_bookings_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-bookings-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMBookingsDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_bookings_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-bookings-summary-update")
    public ResponseEntity<String> updateOMBookingsSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/om-workflow-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMWorkflowSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_workflow_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-workflow-details")
    public ResponseEntity<List<Map<String, Object>>> getOMWorkflowDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_workflow_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-workflow-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMWorkflowDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_workflow_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-workflow-summary-update")
    public ResponseEntity<String> updateOMWorkflowSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/om-processing-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMProcessingSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_processing_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-processing-details")
    public ResponseEntity<List<Map<String, Object>>> getOMProcessingDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_processing_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-processing-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMProcesingDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_processing_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-processing-summary-update")
    public ResponseEntity<String> updateOMProcessingSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/om-distribution-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMDistributionSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_distribution_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-distribution-details")
    public ResponseEntity<List<Map<String, Object>>> getOMDistributionDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_distribution_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-distribution-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMDistributionDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_distribution_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-distribution-summary-update")
    public ResponseEntity<String> updateOMDistributionSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/om-attribution-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMAttributionSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_attribution_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-attribution-details")
    public ResponseEntity<List<Map<String, Object>>> getOMAttributionDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_attribution_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-attribution-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMAttributionDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_attribution_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-attribution-summary-update")
    public ResponseEntity<String> updateOMAttributionSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/om-jobs-summary")
    public ResponseEntity<List<Map<String, Object>>> getOMJobsSummary() {
        return new ResponseEntity<>(service.getOMSummaryData("om_control_tower_jobs_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/om-jobs-details")
    public ResponseEntity<List<Map<String, Object>>> getOMJobsDetails() {
        return new ResponseEntity<>(service.getOMDetailsData("om_control_tower_jobs_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/om-jobs-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMJobsDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getOMDetailsDataFiltered("om_control_tower_jobs_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/om-jobs-summary-update")
    public ResponseEntity<String> updateOMJobsSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateOmSummary("oplAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }
}
