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

    @PostMapping("/invoice-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceSummary(@RequestBody Map<String, List<String>> request) {
        try {
            List<String> invoiceIds = request.get("invoiceIds");
            if (invoiceIds == null || invoiceIds.isEmpty()) {
                return new ResponseEntity<>(new ArrayList<>(), HttpStatus.OK);
            }

            List<Map<String, Object>> details = new ArrayList<>();
            for (String invoiceId : invoiceIds) {
                List<Map<String, Object>> result = service.getInvoiceSummary(invoiceId);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/invoice-line-summary")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceLineSummary(@RequestBody Map<String, List<String>> request) {
        try {
            List<String> invoiceIds = request.get("invoiceIds");
            if (invoiceIds == null || invoiceIds.isEmpty()) {
                return new ResponseEntity<>(new ArrayList<>(), HttpStatus.OK);
            }

            List<Map<String, Object>> details = new ArrayList<>();
            for (String invoiceId : invoiceIds) {
                List<Map<String, Object>> result = service.getInvoiceLineSummary(invoiceId);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/subscription-summary")
    public ResponseEntity<List<Map<String, Object>>> getSubscriptionSummary(@RequestParam List<String> subRefIds, @RequestParam List<String> subCodes) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = Math.min(subRefIds.size(), subCodes.size());


            for (int i = 0; i < minLength; i++) {
                String value = subRefIds.get(i);
                String code = subCodes.get(i);
                List<Map<String, Object>> result = service.getSubscriptionSummary(value, code);
                details.addAll(result);
            }

            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/subscription-line-summary")
    public ResponseEntity<List<Map<String, Object>>> getSubscriptionLineSummary(@RequestParam List<String> subRefIds, @RequestParam List<String> subCodes) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = Math.min(subRefIds.size(), subCodes.size());

            for (int i = 0; i < minLength; i++) {
                String value = subRefIds.get(i);
                String code = subCodes.get(i);
                List<Map<String, Object>> result = service.getSubscriptionLineSummary(value, code);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/sbp-bill-schedule-header")
    public ResponseEntity<List<Map<String, Object>>> getSbpBillScheduleHeader(@RequestParam List<String> subRefId) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = subRefId.size();

            for (int i = 0; i < minLength; i++) {
                String value = subRefId.get(i);
                List<Map<String, Object>> result = service.getSbpBillScheduleHeader(value);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);

        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/sbp-bill-schedule")
    public ResponseEntity<List<Map<String, Object>>> getSbpBillSchedule(@RequestParam List<String> offsetId) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = offsetId.size();

            for (int i = 0; i < minLength; i++) {
                String value = offsetId.get(i);
                List<Map<String, Object>> result = service.getSbpBillSchedule(value);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/sbp-bill-schedule-lines")
    public ResponseEntity<List<Map<String, Object>>> getSbpBillScheduleLines(@RequestParam List<String> offsetId, @RequestParam List<String> billDate) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            int minLength = Math.min(offsetId.size(), billDate.size());

            for (int i = 0; i < minLength; i++) {
                String offset = offsetId.get(i);
                String date = billDate.get(i);
                List<Map<String, Object>> result = service.getSbpBillScheduleLines(offset, date);
                details.addAll(result);
            }
            return new ResponseEntity<>(details, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    // @GetMapping("/o2c-connector")
    // public ResponseEntity<List<Map<String, Object>>> getO2cConnector() {
    // return new ResponseEntity<>(service.getO2cConnector(), HttpStatus.OK);
    // }

    @PostMapping("/o2c-connector-search")
    public ResponseEntity<List<Map<String, Object>>> getO2cConnector(@RequestBody Map<String, String> data) {
        String field = data.get("column");
        String value = data.get("value");
        return new ResponseEntity<>(service.getO2cConnectorData(field, value), HttpStatus.OK);
    }

    @PostMapping("/financial-summary")
    public ResponseEntity<List<Map<String, Object>>> getFinancialSummary(@RequestBody Map<String, String> data) {
        System.out.println(data);
        String field = data.get("column");
        String value = data.get("value");
        return new ResponseEntity<>(service.callFinancialSummaryView(field, value), HttpStatus.OK);
    }

    @GetMapping("/tsv-pkg-proc")
    public ResponseEntity<String> updateTsvPkgProc(@RequestParam String subscriptionIds, @RequestParam String webOrderLineIds) {
        try {
            service.callTsvPkgProc(subscriptionIds, webOrderLineIds);
            return new ResponseEntity<>("Updated", HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/tsv-top-sku")
    public ResponseEntity<List<Map<String, Object>>> getTsvTopSku(@RequestParam String subscriptionIds, @RequestParam String webOrderLineIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            System.out.println(subscriptionIds);
            System.out.println(webOrderLineIds);
            List<Map<String, Object>> result = service.callTsvTopSku(subscriptionIds, webOrderLineIds);
            details.addAll(result);
            return new ResponseEntity<>(details, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/tsv-sub-sku")
    public ResponseEntity<List<Map<String, Object>>> getTsvSubSku(@RequestParam String subscriptionIds, @RequestParam String webOrderLineIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            System.out.println(subscriptionIds);
            System.out.println(webOrderLineIds);
            List<Map<String, Object>> result = service.callTsvSubSku(subscriptionIds, webOrderLineIds);
            details.addAll(result);
            return new ResponseEntity<>(details, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/tsv-accounts")
    public ResponseEntity<List<Map<String, Object>>> getTsvAccounts(@RequestParam String subscriptionIds, @RequestParam String webOrderLineIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
            System.out.println(subscriptionIds);
            System.out.println(webOrderLineIds);
            List<Map<String, Object>> result = service.callTsvAccounts(subscriptionIds, webOrderLineIds);
            details.addAll(result);
            return new ResponseEntity<>(details, HttpStatus.OK);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/o2c-order-bie-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderBieExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderBieExceptionV(), HttpStatus.OK);
    }
}
