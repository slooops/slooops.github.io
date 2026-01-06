package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.*;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.BusinessInsightsMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class BusinessInsightsMonitoringController {

    @Autowired
    private BusinessInsightsMonitoringService service;

    @GetMapping("/issue-reporting")
    public ResponseEntity<List<Map<String, Object>>> getIssueReporting() {
        return new ResponseEntity<>(service.getIssueReportingData(), HttpStatus.OK);
    }

    @GetMapping("/issue-reporting-summary")
    public ResponseEntity<List<Map<String, Object>>> getIssueReportingSummary() {
        return new ResponseEntity<>(service.getIssueReportingDataSummary(), HttpStatus.OK);
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

    @PostMapping(value = "/issue-reporting-comments-update")
    public ResponseEntity<String> updateCommentsIssueReport(@RequestBody Map<String, Object> requestData) {
        try {
            String comments = (String)requestData.get("comments");
            String approvedBy = (String) requestData.get("username");
            String incidentNum = (String)requestData.get("incidentNumber");
            service.updateCommentsIssueReporting(comments, approvedBy, incidentNum);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to Approve/ Reject.");
        }
    }

    @PostMapping(value = "/issue-reporting-fix-details-update")
    public ResponseEntity<String> updateFixDetailsIssueReport(@RequestBody Map<String, Object> requestData) {
        try {
            String fixDetails = (String)requestData.get("fixDetails");
            String approvedBy = (String) requestData.get("username");
            String incidentNum = (String)requestData.get("incidentNumber");
            service.updateFixDetailsIssueReporting(fixDetails, approvedBy, incidentNum);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to Approve/ Reject.");
        }
    }

    @PostMapping(value = "/issue-reporting-status-update")
    public ResponseEntity<String> updateStatusIssueReport(@RequestBody Map<String, Object> requestData) {
        try {
            String status = (String)requestData.get("status");
            String approvedBy = (String) requestData.get("username");
            String incidentNum = (String)requestData.get("incidentNumber");
            service.updateStatusIssueReporting(status, approvedBy, incidentNum);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to Approve/ Reject.");
        }
    }

    @PostMapping(value = "/issue-reporting-issue-desc-update")
    public ResponseEntity<String> updateIssueDescIssueReport(@RequestBody Map<String, Object> requestData) {
        try {
            String issue = (String)requestData.get("issue");
            String rootCause = (String)requestData.get("rootCause");
            String businessImpact = (String)requestData.get("businessImpact");
            String approvedBy = (String) requestData.get("username");
            String incidentNum = (String)requestData.get("incidentNumber");
            service.updateIssueDescIssueReporting(issue, rootCause, businessImpact, approvedBy, incidentNum);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to Approve/ Reject.");
        }
    }

    @GetMapping("/wd0-ar-midclose-header-data")
    public ResponseEntity<List<Map<String, Object>>> getWd0ArMidCloseHeaderData() {
        return new ResponseEntity<>(service.getWd0ArMidCloseHeaderData(), HttpStatus.OK);
    }

    @GetMapping("/wd0-ar-midclose-status")
    public ResponseEntity<List<Map<String, Object>>> getWd0ArMidCloseStatus() {
        return new ResponseEntity<>(service.getWd0ArMidCloseStatus(), HttpStatus.OK);
    }

    @GetMapping("/wd0-historical-data")
    public ResponseEntity<List<Map<String, Object>>> getWd0HistoricalData() {
        return new ResponseEntity<>(service.getWd0HistoricalData(), HttpStatus.OK);
    }

    @GetMapping("/wd0-regression")
    public ResponseEntity<List<Map<String, Object>>> getWd0Regression() {
        return new ResponseEntity<>(service.getWd0Regression(), HttpStatus.OK);
    }

    @GetMapping("/wd0-current-month")
    public ResponseEntity<List<Map<String, Object>>> getWd0CurrentMonth() {
        return new ResponseEntity<>(service.getWd0CurrentMonth(), HttpStatus.OK);
    }

    @GetMapping("/wd0-volumes")
    public ResponseEntity<List<Map<String, Object>>> getWd0Volumes() {
        return new ResponseEntity<>(service.getWd0Volumes(), HttpStatus.OK);
    }


    @GetMapping("/wd0-midclose-actuals-product")
    public ResponseEntity<List<Map<String, Object>>> getWd0MidcloseActualsProduct() {
        return new ResponseEntity<>(service.getWd0MidcloseActualsProduct(), HttpStatus.OK);
    }

    @GetMapping("/wd0-midclose-actuals-service")
    public ResponseEntity<List<Map<String, Object>>> getWd0MidcloseActualsService() {
        return new ResponseEntity<>(service.getWd0MidcloseActualsService(), HttpStatus.OK);
    }

    @GetMapping("/large-deal-summary-account")
    public ResponseEntity<List<LargeDealSummaryByAccountModel>> getLargeDealSummaryByAccount() {
        return new ResponseEntity<>(service.getLargeDealSummaryByAccount(), HttpStatus.OK);
    }

    @GetMapping("/clo-sample-download-data")
    public ResponseEntity<List<Map<String, Object>>> getCloSampleDownloadData() {
        return new ResponseEntity<>(service.getCloSampleDownloadData(), HttpStatus.OK);
    }

    @GetMapping("/order-status-summary")
    public ResponseEntity<List<OrderLifecycleSummaryModel>> getOrderStatusSummary() {
        return new ResponseEntity<>(service.getOrderStatusSummary(), HttpStatus.OK);
    }
    @GetMapping("/order-status-rev-summary")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusRevSummary() {
        return new ResponseEntity<>(service.getOrderStatusRevSummary(), HttpStatus.OK);
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

    @GetMapping("/order-status-download")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusDownload() {
        return new ResponseEntity<>(service.getOrderStatusDownload(), HttpStatus.OK);
    }

    @GetMapping("/order-status")
    public ResponseEntity<OrderLifecycleModel> getOrderStatus() {
        return new ResponseEntity<>(service.getOrderStatus(), HttpStatus.OK);
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
}
