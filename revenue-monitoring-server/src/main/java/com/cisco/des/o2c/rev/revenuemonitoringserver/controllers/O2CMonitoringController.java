package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.O2CMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class O2CMonitoringController {

    @Autowired
    private O2CMonitoringService service;

    @GetMapping("/order-summary")
    public ResponseEntity<List<Map<String, Object>>> getOrderSummary(@RequestParam List<String> orderIds) {
        System.out.println(orderIds);
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = orderIds.size();

            for (int i = 0; i < minLength; i++) {
                String value = orderIds.get(i);
                List<Map<String, Object>> result = service.getOrderSummary(value);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/invoice-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceSummary(@RequestParam List<String> invoiceIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = invoiceIds.size();

            for (int i = 0; i < minLength; i++) {
                String value = invoiceIds.get(i);
                List<Map<String, Object>> result = service.getInvoiceSummary(value);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/invoice-line-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceLineSummary(@RequestParam List<String> invoiceIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = invoiceIds.size();

            for (int i = 0; i < minLength; i++) {
                String value = invoiceIds.get(i);
                List<Map<String, Object>> result = service.getInvoiceLineSummary(value);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/subscription-summary")
    public ResponseEntity<List<Map<String, Object>>> getSubscriptionSummary(@RequestParam List<String> subRefIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = subRefIds.size();

            for (int i = 0; i < minLength; i++) {
                String value = subRefIds.get(i);
                List<Map<String, Object>> result = service.getSubscriptionSummary(value);
                details.addAll(result);
            }

            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/subscription-line-summary")
    public ResponseEntity<List<Map<String, Object>>> getSubscriptionLineSummary(@RequestParam List<String> subRefIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = subRefIds.size();

            for (int i = 0; i < minLength; i++) {
                String value = subRefIds.get(i);
                List<Map<String, Object>> result = service.getSubscriptionLineSummary(value);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

//    @GetMapping("/o2c-connector")
//    public ResponseEntity<List<Map<String, Object>>> getO2cConnector() {
//        return new ResponseEntity<>(service.getO2cConnector(), HttpStatus.OK);
//    }

    @PostMapping("/o2c-connector-search")
    public ResponseEntity<List<Map<String, Object>>> getO2cConnector(@RequestBody Map<String, String> data) {
        String field = data.get("column");
        String value = data.get("value");
        return new ResponseEntity<>(service.getO2cConnectorData(field,value), HttpStatus.OK);
    }
}
