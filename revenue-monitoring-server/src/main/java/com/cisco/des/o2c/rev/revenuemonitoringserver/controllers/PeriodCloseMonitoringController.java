package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.*;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.EspCaseManagerService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.PeriodCloseMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class PeriodCloseMonitoringController {
    @Autowired
    private PeriodCloseMonitoringService service;

    @Autowired
    private EspCaseManagerService espCaseManagerService;

    @GetMapping("/period-close-invoice-stats")
    public ResponseEntity<List<Map<String, Object>>> getPeriodCloseInvoiceStats() {
        return new ResponseEntity<>(service.getCloseInvStats(), HttpStatus.OK);
    }

    @GetMapping("/period-close-interface-load")
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getPeriodCloseInterfaceLoad() {
        return new ResponseEntity<>(service.getPeriodCloseInterfaceLoad(), HttpStatus.OK);
    }

    @GetMapping("/preclose-start-end-time")
    public ResponseEntity<List<Map<String, Object>>> getCloseStartEndTime() {
        return new ResponseEntity<>(service.getCloseStartEndTime(), HttpStatus.OK);
    }

    @GetMapping("/preclose-volume")
    public ResponseEntity<List<Map<String, Object>>> getCloseVolume() {
        return new ResponseEntity<>(service.getCloseVolume(), HttpStatus.OK);
    }

    @GetMapping("/preclose-me-status")
    public ResponseEntity<List<Map<String, Object>>> getCloseMEStatus() {
        return new ResponseEntity<>(service.getCloseMEStatus(), HttpStatus.OK);
    }

    @GetMapping("/pclose-qe-cash-collected")
    public ResponseEntity<List<Map<String, Object>>> getCloseQECashCollected() {
        return new ResponseEntity<>(service.getCloseQECashCollected(), HttpStatus.OK);
    }

    @GetMapping("/pclose-dashboard-comments")
    public ResponseEntity<List<Map<String, Object>>> getDashboardComments() {
        return new ResponseEntity<>(service.getDashboardComments(), HttpStatus.OK);
    }

    @RequestMapping(value = "/pclose-update-dashboard-comments", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> updateDashboardComments(@RequestBody String comments) {
        String[] input = comments.split(",");
        String comment = input[0];
        String closeType = input[1];
        service.updateDashboardComments(comments, closeType);
        Map<String, String> result = new HashMap<>();
        result.put("message", "Comments updated.");
        return result;
    }

    @GetMapping("/dashboard-timestamp")
    public Map<String, Date> getDate() {
        Calendar calendar = Calendar.getInstance();
        Date date = calendar.getTime();
        Map<String, Date> timeNow = new HashMap<>();
        timeNow.put("timeNow", date);
        return timeNow;
    }


    @GetMapping("/dashboard-current-timestamp")
    public Map<String, Date> getCurrentTimestamp() {
        Date date = new Date();
        Map<String, Date> timeNow = new HashMap<>();
        timeNow.put("timeNow", date);
        return timeNow;
    }

    @GetMapping("/estimated-completion-time")
    public ResponseEntity<List<Map<String, Object>>> getEstimatedCompletionTime() {
        return new ResponseEntity<>(service.getEstimatedCompletionTime(), HttpStatus.OK);
    }

    @GetMapping("/vw-i2c-category-match-status")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCategoryMatchStatus() {
        return new ResponseEntity<>(espCaseManagerService.getVwI2cCategoryMatchStatus(), HttpStatus.OK);
    }

    @GetMapping("/vw-i2c-core-issue-match-status")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCoreIssueMatchStatus() {
        return new ResponseEntity<>(espCaseManagerService.getVwI2cCoreIssueMatchStatus(), HttpStatus.OK);
    }

    @GetMapping("/xxcaseiq-validated-cases-accuracy-v")
    public ResponseEntity<List<Map<String, Object>>> getXxcaseiqValidatedCasesAccuracyV() {
        return new ResponseEntity<>(espCaseManagerService.getXxcaseiqValidatedCasesAccuracyV(), HttpStatus.OK);
    }

    @GetMapping("/vw-i2c-case-details")
    public ResponseEntity<List<Map<String, Object>>> getVwI2cCaseDetails() {
        return new ResponseEntity<>(espCaseManagerService.getVwI2cCaseDetails(), HttpStatus.OK);
    }

}
