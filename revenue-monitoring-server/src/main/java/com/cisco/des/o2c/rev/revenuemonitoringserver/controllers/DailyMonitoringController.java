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

    @GetMapping("/rol-transaction-data")
    public ResponseEntity<Map<String, Object>> getRolTransactionData(@RequestParam(defaultValue = "0") int page,
                                                                          @RequestParam(defaultValue = "100") int size) {
        List<RolTransactionData> rolTransactionData = service.getRolTransactionData(page, size);
        int totalRecords = service.getTotalRecords();
        Map<String, Object> response = new HashMap<>();
        response.put("rolTransactionData", rolTransactionData);
        response.put("totalRecords", totalRecords);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/rol-transaction-data-filter")
    public ResponseEntity<Map<String, Object>> getRolTransactionDataFilter(@RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(defaultValue = "100") int size,         @RequestParam List<String> periodNames,
                                                                           @RequestParam List<String> ouNames,
                                                                           @RequestParam List<String> appNames ) {

        List<RolTransactionData> rolTransactionDataFiltered = new ArrayList<>();
        int minLength = Math.min(periodNames.size(), Math.min(ouNames.size(), appNames.size()));
        for (int i = 0; i < minLength; i++) {
            String periodName = periodNames.get(i);
            String ouName = ouNames.get(i);
            String appName = appNames.get(i);

            List<RolTransactionData> result = service.getRolTransactionDataFilter(page, size, periodName, ouName, appName);
            rolTransactionDataFiltered.addAll(result);  // Collect results
        }
        Map<String, Object> response = new HashMap<>();
        response.put("rolTransactionDataFiltered", rolTransactionDataFiltered);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/rol-errors-summary")
    public ResponseEntity<List<Map<String, Object>>> getRolErrorsSummary() {
        return new ResponseEntity<>(service.getRolErrorsSummary(), HttpStatus.OK);
    }

    @PostMapping("/rol-errors-summary-update")
    public ResponseEntity<String> updateRolErrorsSummary(@RequestBody Map<String, String> updateData) {
        int test = service.updateRolErrorSummary(updateData);
        return ResponseEntity.status(HttpStatus.OK).body("User assignment successful.");
    }

    @GetMapping("/rol-errors-summary-period-status")
    public ResponseEntity<List<Map<String, Object>>> getRolErrorsSummaryPeriodStatus() {
        return new ResponseEntity<>(service.getRolErrorSummaryPeriodStatus(), HttpStatus.OK);
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

    @GetMapping("/wd0-regression")
    public ResponseEntity<List<Map<String, Object>>> getWd0Regression() {
        return new ResponseEntity<>(service.getWd0Regression(), HttpStatus.OK);
    }

    @GetMapping("/wd0-current-month")
    public ResponseEntity<List<Map<String, Object>>> getWd0CurrentMonth() {
        return new ResponseEntity<>(service.getWd0CurrentMonth(), HttpStatus.OK);
    }

    @PostMapping(value = "/user-role")
    public ResponseEntity<UserRoleInfo> getUserRoles(@RequestBody String username) {
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
    public ResponseEntity<String> cloUploadByFile(@RequestParam("file") MultipartFile file, @RequestParam("username") String username) {
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
    public ResponseEntity<List<Map<String, Object>>> getCloSampleDownloadData(){
        return new ResponseEntity<>(service.getCloSampleDownloadData(), HttpStatus.OK);
    }

    @GetMapping("/rol-transaction-data-count")
    public ResponseEntity<Integer> getRolTransactionDataCount() {
        return new ResponseEntity<>(service.getTotalRecords(), HttpStatus.OK);
    }

    @GetMapping("/case-service-metrics-summary")
    public ResponseEntity<List<Map<String, Object>>> getCaseServiceMetricsSummary() {
        return new ResponseEntity<>(service.getCaseServiceMetricsSummary(), HttpStatus.OK);
    }
}
