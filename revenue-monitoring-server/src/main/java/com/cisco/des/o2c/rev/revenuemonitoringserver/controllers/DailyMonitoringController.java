package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.packages.ErrorSummaryModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.DailyMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class DailyMonitoringController {
    @Autowired
    private DailyMonitoringService service;

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
        service.updateDashboardComments(comment, closeType);
        Map<String,String> result = new HashMap<>();
        result.put("message", "Comments updated.");
        return result;
    }

    @GetMapping("/pclose-dashboard-timestamp")
    public Map<String,Date> getDate(){
        Date date = new Date();
        Map<String,Date> timeNow = new HashMap<>();
        timeNow.put("timeNow", date);
        return timeNow;
    }

    @GetMapping("/order-status")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatus(HttpServletRequest request, @RequestHeader HttpHeaders header){
        System.out.println(request.getHeader("auth_user"));
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

}
