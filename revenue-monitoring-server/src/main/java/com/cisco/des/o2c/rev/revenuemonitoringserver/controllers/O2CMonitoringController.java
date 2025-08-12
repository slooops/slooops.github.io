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
    public void updateTsvPkgProc(@RequestParam String subscriptionIds, @RequestParam String webOrderLineIds) {
        try {
            service.callTsvPkgProc(subscriptionIds, webOrderLineIds);
        } catch (Exception e) {
            System.out.println(e);
        }
    }

    @GetMapping("/tsv-top-sku")
    public ResponseEntity<List<Map<String, Object>>> getTsvTopSku(@RequestParam String subscriptionIds, @RequestParam String webOrderLineIds) {
        try {
            List<Map<String, Object>> details = new ArrayList<>();
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

    @GetMapping("/o2c-order-ch-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderChExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderChExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-pe-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderPeExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderPeExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-ot-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderOtExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderOtExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-bh-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderBhExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderBhExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-ec-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderEcExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderEcExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-sab-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderSabExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderSabExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-subot-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderSubotExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderSubotExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-preinv-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderPreinvExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderPreinvExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-inv-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderInvExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderInvExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-invpid-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderInvpidExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderInvpidExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-invoth-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderInvothExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderInvothExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-ca-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderCaExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderCaExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-sla-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderSlaExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderSlaExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-gl-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderGlExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderGlExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-accot-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderAccotExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderAccotExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-pastdue-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderPastdueExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderPastdueExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-partialpay-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderPartialpayExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderPartialpayExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-unidentified-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderUnidentifiedExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderUnidentifiedExceptionV(), HttpStatus.OK);
    }

    @GetMapping("/o2c-order-cashoth-exception-v")
    public ResponseEntity<List<Map<String, Object>>> getO2cOrderCashothExceptionV() {
        return new ResponseEntity<>(service.getO2cOrderCashothExceptionV(), HttpStatus.OK);
    }
}
