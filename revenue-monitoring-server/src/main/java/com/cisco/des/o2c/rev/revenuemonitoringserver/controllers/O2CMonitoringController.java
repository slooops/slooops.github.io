package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.O2CMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class O2CMonitoringController {

    @Autowired
    private O2CMonitoringService service;

    @GetMapping("/order-summary")
    public ResponseEntity<List<Map<String, Object>>> getOrderSummary() {
        return new ResponseEntity<>(service.getOrderSummary(), HttpStatus.OK);
    }

    @GetMapping("/invoice-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceSummary() {
        return new ResponseEntity<>(service.getInvoiceSummary(), HttpStatus.OK);
    }

    @GetMapping("/invoice-line-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceLineSummary() {
        return new ResponseEntity<>(service.getInvoiceLineSummary(), HttpStatus.OK);
    }

    @GetMapping("/subscription-summary")
    public ResponseEntity<List<Map<String, Object>>> getSubscriptionSummary() {
        return new ResponseEntity<>(service.getSubscriptionSummary(), HttpStatus.OK);
    }

    @GetMapping("/subscription-line-summary")
    public ResponseEntity<List<Map<String, Object>>> getSubscriptionLineSummary() {
        return new ResponseEntity<>(service.getSubscriptionLineSummary(), HttpStatus.OK);
    }

    @GetMapping("/o2c-connector")
    public ResponseEntity<List<Map<String, Object>>> getO2cConnector() {
        return new ResponseEntity<>(service.getO2cConnector(), HttpStatus.OK);
    }

    @PostMapping("/o2c-connector")
    public ResponseEntity<List<Map<String, Object>>> getO2cConnector(@RequestBody Map<String, String> data) {
        System.out.println(data);
        String field = data.get("field");
        String value = data.get("value");
        return new ResponseEntity<>(service.getO2cConnectorData(field,value), HttpStatus.OK);
    }
}
