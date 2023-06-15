package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.DailyMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.concurrent.ConcurrentHashMap;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class DailyMonitoringController {

    private DailyMonitoringService service;
    private final Map<String, List<Map<String, Object>>> cachedResults = new ConcurrentHashMap<>();

    @Autowired
    public DailyMonitoringController(DailyMonitoringService service) {
        this.service = service;
    }

    @GetMapping("/standard-ar-exceptions")
    public ResponseEntity<List<Map<String, Object>>> getStdArExceptions() {
        System.out.println("Standard ar execeptions");
        return new ResponseEntity<>(service.getStdArExceptions(), HttpStatus.OK);
    }

    @GetMapping("/tsv-topsku-exceptions")
    public ResponseEntity<List<Map<String, Object>>> getTsvTopSkuExceptions() {
        System.out.println("TSV top sku exceptions");
        return new ResponseEntity<>(service.getTsvTopSkuExceptions(), HttpStatus.OK);
    }

    @GetMapping("/tsv-subsku-exceptions")
    public ResponseEntity<List<Map<String, Object>>> getTsvSubSkuExceptions() {
        System.out.println("TSV sub sku exceptions");
        return new ResponseEntity<>(service.getTsvSubSkuExceptions(), HttpStatus.OK);
    }

    @GetMapping("/revenue-controls")
    public ResponseEntity<List<Map<String, Object>>> getRevenueControls() {
        System.out.println("Revenue Controls");
        return new ResponseEntity<>(service.getRevenueControls(), HttpStatus.OK);
    }

    @GetMapping("/period-close-invoice-stats")
    public ResponseEntity<List<Map<String, Object>>> getPeriodCloseInvoiceStats() {
        System.out.println("Period Close Invoice Stats");
        return new ResponseEntity<>(service.getCloseInvStats(), HttpStatus.OK);
    }

    @GetMapping("/period-close-interface-load")
    public ResponseEntity<List<Map<String, Object>>> getPeriodCloseInterfaceLoad() {
        System.out.println("Period Close Invoice Stats");
        return new ResponseEntity<>(service.getPeriodCloseInterfaceLoad(), HttpStatus.OK);
    }
    // getMonitoringDetails
    // @GetMapping("/last-program-run")
    // public ResponseEntity<List<Map<String, Object>>> getProgramLastRun() {
    //     System.out.println("last program run");
    //     return new ResponseEntity<>(service.getProgramLastRun(), HttpStatus.OK);
    // }

    @GetMapping("/period-quarter-details")
    public ResponseEntity<List<Map<String, Object>>> getPeriodQuarter() {
        return new ResponseEntity<>(service.getPeriodQuarter(), HttpStatus.OK);
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
}
