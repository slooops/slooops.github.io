package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.*;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.DailyMonitoringService;
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
public class DailyMonitoringController {
    @Autowired
    private DailyMonitoringService service;

    private String authorizedUser;

    @GetMapping("/standard-ar-exceptions")
    public ResponseEntity<List<Map<String, Object>>> getStdArExceptions() {
        return new ResponseEntity<>(service.getStdArExceptions(), HttpStatus.OK);
    }

    @GetMapping("/tsv-topsku-exceptions")
    public ResponseEntity<List<Map<String, Object>>> getTsvTopSkuExceptions() {
        return new ResponseEntity<>(service.getTsvTopSkuExceptions(), HttpStatus.OK);
    }

    @GetMapping("/tsv-subsku-exceptions")
    public ResponseEntity<List<Map<String, Object>>> getTsvSubSkuExceptions() {
        return new ResponseEntity<>(service.getTsvSubSkuExceptions(), HttpStatus.OK);
    }

    @GetMapping("/revenue-controls")
    public ResponseEntity<List<Map<String, Object>>> getRevenueControls() {
        return new ResponseEntity<>(service.getRevenueControls(), HttpStatus.OK);
    }

    @GetMapping("/period-close-invoice-stats")
    public ResponseEntity<List<Map<String, Object>>> getPeriodCloseInvoiceStats() {
        return new ResponseEntity<>(service.getCloseInvStats(), HttpStatus.OK);
    }

    @GetMapping("/period-close-interface-load")
    public ResponseEntity<List<Map<String, Object>>> getPeriodCloseInterfaceLoad() {
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

    @GetMapping("/error-summary")
    public ResponseEntity<List<Map<String, Object>>> getErrorSummary() {
        return new ResponseEntity<>(service.getErrorSummary(), HttpStatus.OK);
    }

    @GetMapping("/error-details")
    public ResponseEntity<List<Map<String, Object>>> getAllErrorDetails() {
        return new ResponseEntity<>(service.getAllErrorDetails(), HttpStatus.OK);
    }

    @PostMapping("/selected-error-details")
    public ResponseEntity<List<Map<String, Object>>> getErrorDetails(@RequestBody List<ErrorSummaryModel> errorSummaryModel) {
        List<Map<String, Object>> errorDetails = new ArrayList<>();
        for (ErrorSummaryModel summary : errorSummaryModel) {
            List<Map<String, Object>> result = service.getErrorDetails(summary.getAPPLICATION_NAME(), summary.getBATCH_SOURCE(), summary.getENTITY(), summary.getTRANSACTION_TYPE());
            errorDetails.addAll(result);
        }
        return new ResponseEntity<>(errorDetails, HttpStatus.OK);
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


    @GetMapping("/invoice-tracker-header")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceTrackerHeader() {
        return new ResponseEntity<>(service.getInvoiceTrackerHeader(), HttpStatus.OK);
    }

    @GetMapping("/invoice-tracker-line")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceTrackerLine() {
        return new ResponseEntity<>(service.getInvoiceTrackerLine(), HttpStatus.OK);
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

    @PostMapping(value = "/order-lifecycle-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file, @RequestParam("username") String username) {
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

    @RequestMapping(value = "/update-invoice-eligible-date", method = RequestMethod.POST)
    public ResponseEntity<String> updateInvoiceEligibleDate(@RequestBody Map<String, String> updatedModel, @RequestBody String username) {
        try {
            System.out.println(username);
//            service.setUpdateInvoiceEligibleDate(updatedModel, username);
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload deal data.");
        }
    }

    @PostMapping(value = "/clo-bulk-upload-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> cloUploadByFile(@RequestParam("file") MultipartFile file, @RequestParam("username") String username) {
        if (!file.isEmpty()) {
            try {
                System.out.println(file);
                service.setCloBulkUpdateFromFile(file, username);
                return ResponseEntity.status(HttpStatus.OK).body("File uploaded successfully.");
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file.");
            }
        } else {
            return ResponseEntity.badRequest().body("Uploaded file is empty.");
        }
    }

    @RequestMapping(value = "/update-clo-comments", method = RequestMethod.POST)
    public ResponseEntity<String> updateCLOComments(@RequestBody Map<String, String> updatedModel, @RequestBody String username) {
        try {
            service.setCloCommentUpdate(updatedModel, username);
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload deal data.");
        }
    }

    @GetMapping("/kafka-errors")
    public ResponseEntity<List<Map<String, Object>>> getKafkaErrors() {
        return new ResponseEntity<>(service.getKafkaError(), HttpStatus.OK);
    }

    @GetMapping("/kafka-inbound")
    public ResponseEntity<List<Map<String, Object>>> getKafkaInbound() {
        return new ResponseEntity<>(service.getKafkaInbound(), HttpStatus.OK);
    }

    @GetMapping("/ar-trxn-missing")
    public ResponseEntity<List<Map<String, Object>>> getArTrxnMissing() {
        return new ResponseEntity<>(service.getArTrxnMissing(), HttpStatus.OK);
    }

    @GetMapping("/accruals-processing-errors")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsProcessingErrors() {
        return new ResponseEntity<>(service.getAccrualsProcessingErrors(), HttpStatus.OK);
    }

    @GetMapping("/accruals-distribution-errors")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsDistributionErrors() {
        return new ResponseEntity<>(service.getAccrualsDistributionErrors(), HttpStatus.OK);
    }

    @GetMapping("/accruals-summarization-errors")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsSummarizationErrors() {
        return new ResponseEntity<>(service.getAccrualsSummarizationErrors(), HttpStatus.OK);
    }

    @GetMapping("/kafka-publish-downstream")
    public ResponseEntity<List<Map<String, Object>>> getKafkaPublishToDownstream() {
        return new ResponseEntity<>(service.getKafkaPublishToDownstream(), HttpStatus.OK);
    }

    @GetMapping("/error-distribution-summarization")
    public ResponseEntity<List<Map<String, Object>>> getErrorDistributionSummarization() {
        return new ResponseEntity<>(service.getErrorDistributionSummarization(), HttpStatus.OK);
    }

    @PostMapping(value = "/delete-selected-deals")
    public ResponseEntity<String> deleteSelectedDeals(@RequestBody Map<String, Object> requestData) {
        try {
            List<Map<String, Object>> selectedDeals = (List<Map<String, Object>>) requestData.get("deleteRows");
            String username = (String) requestData.get("username");
            System.out.println("delete by: "+username);
            service.deleteSelectedDeals(selectedDeals, username);
            return ResponseEntity.status(HttpStatus.OK).body("successful.");
        } catch (Exception e) {
            System.out.println(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete.");
        }
    }


    @PostMapping(value = "/user-role")
    public ResponseEntity<UserRoleInfo> getUserRoles(@RequestBody String username) {
        System.out.println(username);
        UserRoleInfo userRoles = service.getUserRoles(username);
        System.out.println(userRoles.getUserRoles());
        return ResponseEntity.status(HttpStatus.OK).body(userRoles);
    }

    @GetMapping("/wd0-regression")
    public ResponseEntity<List<Map<String, Object>>> getWd0Regression() {
        return new ResponseEntity<>(service.getWd0Regression(), HttpStatus.OK);
    }

    @GetMapping("/wd0-current-month")
    public ResponseEntity<List<Map<String, Object>>> getWd0CurrentMonth() {
        return new ResponseEntity<>(service.getWd0CurrentMonth(), HttpStatus.OK);
    }

    @PostMapping("/clo-bulk-upload")
    public ResponseEntity<String> manualCLOUpload(@RequestBody UpdateCLOData input) {
        System.out.println("here");
        try {
            System.out.println(input.getUsername());
            service.setCloBulkUpdate(input, input.getUsername());
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e) {
            System.out.println(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload CLO data.");
        }
    }
}
