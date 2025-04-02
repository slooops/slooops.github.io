package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.*;
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

    @GetMapping("/order-status-download")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusDownload() {
        return new ResponseEntity<>(service.getOrderStatusDownload(), HttpStatus.OK);
    }

    @GetMapping("/order-status")
    public ResponseEntity<OrderLifecycleModel> getOrderStatus() {
        return new ResponseEntity<>(service.getOrderStatus(), HttpStatus.OK);
    }

    @GetMapping("/wd0-ar-midclose-status")
    public ResponseEntity<List<Map<String, Object>>> getWd0ArMidCloseStatus() {
        return new ResponseEntity<>(service.getWd0ArMidCloseStatus(), HttpStatus.OK);
    }

    @GetMapping("/dashboard-current-timestamp")
    public Map<String, Date> getCurrentTimestamp() {
        Date date = new Date();
        Map<String, Date> timeNow = new HashMap<>();
        timeNow.put("timeNow", date);
        return timeNow;
    }

    @GetMapping("/wd0-ar-midclose-header-data")
    public ResponseEntity<List<Map<String, Object>>> getWd0ArMidCloseHeaderData() {
        return new ResponseEntity<>(service.getWd0ArMidCloseHeaderData(), HttpStatus.OK);
    }

    @GetMapping("/wd0-historical-data")
    public ResponseEntity<List<Map<String, Object>>> getWd0HistoricalData() {
        return new ResponseEntity<>(service.getWd0HistoricalData(), HttpStatus.OK);
    }

    @GetMapping("/order-status-summary")
    public ResponseEntity<List<OrderLifecycleSummaryModel>> getOrderStatusSummary() {
        return new ResponseEntity<>(service.getOrderStatusSummary(), HttpStatus.OK);
    }

    @GetMapping("/order-status-rev-summary")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusRevSummary() {
        return new ResponseEntity<>(service.getOrderStatusRevSummary(), HttpStatus.OK);
    }

    @GetMapping("/issue-reporting")
    public ResponseEntity<List<Map<String, Object>>> getIssueReporting() {
        return new ResponseEntity<>(service.getIssueReportingData(), HttpStatus.OK);
    }

    @PostMapping(value = "/issue-reporting-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> insertIssueReport(@RequestParam("file") MultipartFile file,
                                                   @RequestParam("username") String username) {
        if (!file.isEmpty()) {
            try {
                service.insertIssueReportingData(file, username);
                return ResponseEntity.status(HttpStatus.OK).body("File uploaded successfully.");
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file.");
            }
        } else {
            return ResponseEntity.badRequest().body("Uploaded file is empty.");
        }
    }

    @PostMapping(value = "/issue-reporting-approval")
    public ResponseEntity<String> approveRejectIssueReport(@RequestBody Map<String, Object> requestData) {
        try {
            String approval = (String)requestData.get("approvalStatus");
            String approvedBy = (String)requestData.get("username");
            String incidentNum = (String)requestData.get("incidentNumber");
            service.approveRejectIssueReporting(approval, approvedBy, incidentNum);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to Approve/ Reject.");
        }
    }

    @PostMapping(value = "/issue-reporting-approval-bulk")
    public ResponseEntity<String> bulkApproveRejectIssueReport(@RequestBody List<Map<String, Object>> requestData) {
        try {
            service.bulkApproveRejectIssueReporting(requestData);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to Approve/ Reject.");
        }
    }
    @PostMapping(value = "/order-lifecycle-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file,
            @RequestParam("username") String username) {
        if (!file.isEmpty()) {
            try {
                service.setUpdateOrderStatusFromFile(file, username);
                return ResponseEntity.status(HttpStatus.OK).body("File uploaded successfully.");
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file.");
            }
        } else {
            return ResponseEntity.badRequest().body("Uploaded file is empty.");
        }
    }

    @PostMapping(value = "/order-lifecycle-upload-manual")
    public ResponseEntity<String> manualUpload(@RequestBody UpdateOrderModel input) {
        try {
            service.setUpdateOrderStatusFromData(input);
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload deal data.");
        }
    }

    @GetMapping("/wd0-regression")
    public ResponseEntity<List<Map<String, Object>>> getWd0Regression() {
        return new ResponseEntity<>(service.getWd0Regression(), HttpStatus.OK);
    }

    @GetMapping("/wd0-current-month")
    public ResponseEntity<List<Map<String, Object>>> getWd0CurrentMonth() {
        return new ResponseEntity<>(service.getWd0CurrentMonth(), HttpStatus.OK);
    }

    @GetMapping(value = "/user-role")
    public ResponseEntity<UserRoleInfo> getUserRoles(@RequestParam String username) {
        UserRoleInfo userRoles = service.getUserRoles(username);
        return ResponseEntity.status(HttpStatus.OK).body(userRoles);
    }

    @PostMapping(value = "/delete-selected-deals")
    public ResponseEntity<String> deleteSelectedDeals(@RequestBody Map<String, Object> requestData) {
        try {
            List<Map<String, Object>> selectedDeals = (List<Map<String, Object>>) requestData.get("deleteRows");
            String username = (String) requestData.get("username");
            service.deleteSelectedDeals(selectedDeals, username);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete.");
        }
    }

    @PostMapping("/clo-bulk-upload")
    public ResponseEntity<String> manualCLOUpload(@RequestBody UpdateCLOData input) {
        try {
            service.setCloBulkUpdate(input, input.getUsername());
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload CLO data.");
        }
    }

    @PostMapping(value = "/clo-bulk-upload-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> cloUploadByFile(@RequestParam("file") MultipartFile file,
            @RequestParam("username") String username) {
        if (!file.isEmpty()) {
            try {
                service.setCloBulkUpdateFromFile(file, username);
                return ResponseEntity.status(HttpStatus.OK).body("File uploaded successfully.");
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file.");
            }
        } else {
            return ResponseEntity.badRequest().body("Uploaded file is empty.");
        }
    }

    @RequestMapping(value = "/update-invoice-eligible-date", method = RequestMethod.POST)
    public ResponseEntity<String> updateInvoiceEligibleDate(@RequestBody Map<String, String> updatedModel) {
        try {
            String username = (String) updatedModel.get("username");
            service.setUpdateInvoiceEligibleDate(updatedModel, username);
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload deal data.");
        }
    }

    @RequestMapping(value = "/update-clo-comments", method = RequestMethod.POST)
    public ResponseEntity<String> updateCLOComments(@RequestBody Map<String, String> updatedModel) {
        try {
            String username = (String) updatedModel.get("username");
            service.setCloCommentUpdate(updatedModel, username);
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload deal data.");
        }
    }

    @GetMapping("/estimated-completion-time")
    public ResponseEntity<List<Map<String, Object>>> getEstimatedCompletionTime() {
        return new ResponseEntity<>(service.getEstimatedCompletionTime(), HttpStatus.OK);
    }

    @GetMapping("/large-deal-summary-account")
    public ResponseEntity<List<LargeDealSummaryByAccountModel>> getLargeDealSummaryByAccount() {
        return new ResponseEntity<>(service.getLargeDealSummaryByAccount(), HttpStatus.OK);
    }

    @GetMapping("/clo-sample-download-data")
    public ResponseEntity<List<Map<String, Object>>> getCloSampleDownloadData() {
        return new ResponseEntity<>(service.getCloSampleDownloadData(), HttpStatus.OK);
    }

    @GetMapping("/wd0-volumes")
    public ResponseEntity<List<Map<String, Object>>> getWd0Volumes() {
        return new ResponseEntity<>(service.getWd0Volumes(), HttpStatus.OK);
    }

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
}
