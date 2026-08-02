package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.WIPSMonitoringService;
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
public class WIPSController {

    @Autowired
    WIPSMonitoringService service;

    @GetMapping("/wips-summary")
    public ResponseEntity<List<Map<String, Object>>> getWIPSSummary() {
        return new ResponseEntity<>(service.getWIPSSummaryData("om_control_tower_dfm_summary_view"), HttpStatus.OK);
    }

    @GetMapping("/wips-details")
    public ResponseEntity<List<Map<String, Object>>> getWIPSDetails() {
        return new ResponseEntity<>(service.getWIPSDetailsData("om_control_tower_dfm_detail_view"), HttpStatus.OK);
    }

    @GetMapping("/wips-jobs-details-filtered")
    public ResponseEntity<Map<String, Object>> getOMJobsDetailsFiltered(@RequestParam List<String> timestamps, @RequestParam List<String> scenarios) {
        try {
            List<Map<String, Object>> errorDetailsFiltered = new ArrayList<>();
            int minLength = Math.min(timestamps.size(), scenarios.size());

            for (int i = 0; i < minLength; i++) {
                String timestamp = timestamps.get(i);
                String scenario = scenarios.get(i);
                List<Map<String, Object>> result = service.getWIPSDetailsDataFiltered("om_control_tower_dfm_detail_view", timestamp, scenario);
                errorDetailsFiltered.addAll(result);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("errorDetailsFiltered", errorDetailsFiltered);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/wips-summary-update")
    public ResponseEntity<String> updateWIPSSummary(@RequestBody Map<String, String> updateData) {
        long test = service.updateWIPSSummary("omDfmAlertMonitorData", updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }
}
