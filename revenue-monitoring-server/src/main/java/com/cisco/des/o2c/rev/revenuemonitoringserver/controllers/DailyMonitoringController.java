package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.DailyMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class DailyMonitoringController {

    private DailyMonitoringService service;

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
    // getMonitoringDetails
    // @GetMapping("/last-program-run")
    // public ResponseEntity<List<Map<String, Object>>> getProgramLastRun() {
    //     System.out.println("last program run");
    //     return new ResponseEntity<>(service.getProgramLastRun(), HttpStatus.OK);
    // }
}
