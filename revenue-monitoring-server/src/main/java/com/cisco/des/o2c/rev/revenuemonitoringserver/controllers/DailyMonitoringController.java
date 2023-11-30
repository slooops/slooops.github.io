package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.ErrorSummaryModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.OrderLifecycleModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.OrderLifecycleSummaryModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.UpdateOrderModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.DailyMonitoringService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.UserRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class DailyMonitoringController {
    @Autowired
    private DailyMonitoringService service;

    @Autowired
    private UserRoleService userService;

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
    public ResponseEntity<List<Map<String, Object>>> getAllErrorDetails(){
        return new ResponseEntity<>(service.getAllErrorDetails(), HttpStatus.OK);
    }

    @PostMapping("/selected-error-details")
    public ResponseEntity<List<Map<String, Object>>> getErrorDetails(@RequestBody List<ErrorSummaryModel> errorSummaryModel){
        List<Map<String, Object>> errorDetails = new ArrayList<>();
        for(ErrorSummaryModel summary: errorSummaryModel){
            List<Map<String, Object>> result = service.getErrorDetails(summary.getAPPLICATION_NAME(),summary.getBATCH_SOURCE(), summary.getENTITY(), summary.getTRANSACTION_TYPE());
            errorDetails.addAll(result);
        }
        return new ResponseEntity<>(errorDetails, HttpStatus.OK);
    }

    @RequestMapping(value = "/pclose-update-dashboard-comments", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String,String> updateDashboardComments(@RequestBody String comments){
        String[] input = comments.split(",");
        String comment = input[0];
        String closeType = input[1];
        service.updateDashboardComments(comments, closeType);
        Map<String,String> result = new HashMap<>();
        result.put("message", "Comments updated.");
        return result;
    }

    @GetMapping("/dashboard-timestamp")
    public Map<String,Date> getDate(){
        Calendar calendar = Calendar.getInstance();
        Date date =  calendar.getTime();
        Map<String,Date> timeNow = new HashMap<>();
        timeNow.put("timeNow", date);
        return timeNow;
    }

    @GetMapping("/order-status-download")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusDownload(){
        return new ResponseEntity<>(service.getOrderStatusDownload(), HttpStatus.OK);
    }

    @GetMapping("/order-status")
    public ResponseEntity<OrderLifecycleModel> getOrderStatus(){
        return new ResponseEntity<>(service.getOrderStatus(), HttpStatus.OK);
    }



    @GetMapping("/invoice-tracker-header")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceTrackerHeader(){
        return new ResponseEntity<>(service.getInvoiceTrackerHeader(), HttpStatus.OK);
    }

    @GetMapping("/invoice-tracker-line")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceTrackerLine(){
        return new ResponseEntity<>(service.getInvoiceTrackerLine(), HttpStatus.OK);
    }

    @GetMapping("/wd0-ar-midclose-status")
    public ResponseEntity<List<Map<String, Object>>> getWd0ArMidCloseStatus(){
        return new ResponseEntity<>(service.getWd0ArMidCloseStatus(), HttpStatus.OK);
    }

    @GetMapping("/dashboard-current-timestamp")
    public Map<String,Date> getCurrentTimestamp() {
        Date date = new Date();
        Map<String,Date> timeNow = new HashMap<>();
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
    public ResponseEntity<List<OrderLifecycleSummaryModel>> getOrderStatusSummary(){
        return new ResponseEntity<>(service.getOrderStatusSummary(), HttpStatus.OK);
    }

    @GetMapping("/order-status-rev-summary")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusRevSummary(){
        return new ResponseEntity<>(service.getOrderStatusRevSummary(), HttpStatus.OK);
    }

    @PostMapping(value = "/order-lifecycle-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file) {
            if (!file.isEmpty()) {
                try {
                    service.setUpdateOrderStatusFromFile(file);
                    return ResponseEntity.status(HttpStatus.OK).body("File uploaded successfully.");
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file.");
                }
            } else {
                return ResponseEntity.badRequest().body("Uploaded file is empty.");
            }
    }

    @PostMapping(value = "/order-lifecycle-upload-manual")
    public ResponseEntity<String> manualUpload(@RequestBody UpdateOrderModel input){
        try{
            service.setUpdateOrderStatusFromData(input);
            return ResponseEntity.status(HttpStatus.OK).body("Data uploaded successfully.");
        } catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload deal data.");
        }
    }

    @RequestMapping(value = "/update-invoice-eligible-date", method = RequestMethod.POST)
    public Map<String,String> updateInvoiceEligibleDate(@RequestBody Map<String, String> updatedModel){
        System.out.println(updatedModel);
        return null;
    }

    @RequestMapping(value = "/update-clo-comments", method = RequestMethod.POST)
    public Map<String,String> updateCLOComments(@RequestBody Map<String, String> updatedModel){
        System.out.println(updatedModel);
        return null;
    }

    @GetMapping("/kafka-errors")
    public ResponseEntity<List<Map<String, Object>>> getKafkaErrors(){
        return new ResponseEntity<>(service.getKafkaError(), HttpStatus.OK);
    }

    @GetMapping("/kafka-inbound")
    public ResponseEntity<List<Map<String, Object>>> getKafkaInbound(){
        return new ResponseEntity<>(service.getKafkaInbound(), HttpStatus.OK);
    }

    @GetMapping("/ar-trxn-missing")
    public ResponseEntity<List<Map<String, Object>>> getArTrxnMissing(){
        return new ResponseEntity<>(service.getArTrxnMissing(), HttpStatus.OK);
    }

    @GetMapping("/accruals-processing-errors")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsProcessingErrors(){
        return new ResponseEntity<>(service.getAccrualsProcessingErrors(), HttpStatus.OK);
    }

    @GetMapping("/accruals-distribution-errors")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsDistributionErrors(){
        return new ResponseEntity<>(service.getAccrualsDistributionErrors(), HttpStatus.OK);
    }

    @GetMapping("/accruals-summarization-errors")
    public ResponseEntity<List<Map<String, Object>>> getAccrualsSummarizationErrors(){
        return new ResponseEntity<>(service.getAccrualsSummarizationErrors(), HttpStatus.OK);
    }

    @GetMapping("/kafka-publish-downstream")
    public ResponseEntity<List<Map<String, Object>>> getKafkaPublishToDownstream(){
        return new ResponseEntity<>(service.getKafkaPublishToDownstream(), HttpStatus.OK);
    }

    @GetMapping("/error-distribution-summarization")
    public ResponseEntity<List<Map<String, Object>>> getErrorDistributionSummarization(){
        return new ResponseEntity<>(service.getErrorDistributionSummarization(), HttpStatus.OK);
    }

    @PostMapping(value = "/invoice-eligible-date")
    public ResponseEntity<String> invoiceEligibleDateUpdate(@RequestBody List<Map<String,Object>> updatedDeals){
        service.updateInvoiceEligibleDate(updatedDeals);
        return ResponseEntity.status(HttpStatus.OK).body("successful.");
    }

    @GetMapping(value = "/user-role")
    public ResponseEntity<List<String>> getUserRoles(){
        List<String> userRoles = userService.userGroups();
        return ResponseEntity.status(HttpStatus.OK).body(userRoles);
    }
}
