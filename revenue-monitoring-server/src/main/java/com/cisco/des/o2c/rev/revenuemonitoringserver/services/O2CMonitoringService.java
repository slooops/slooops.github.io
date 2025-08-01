package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class O2CMonitoringService {

    private JdbcManager jdbcManager;

    private String orderSummary;
    private String invoiceSummary;
    private String invoiceLineSummary;
    private String subscriptionSummary;
    private String subscriptionLineSummary;
    private String o2cConnector;
    private String sbpBillScheduleHeader;

    @Autowired
    public O2CMonitoringService(JdbcManager jdbcManager, String orderSummary, String invoiceSummary,
            String invoiceLineSummary, String subscriptionSummary,
            String subscriptionLineSummary, String o2cConnector, String sbpBillScheduleHeader) {
        this.jdbcManager = jdbcManager;
        this.orderSummary = orderSummary;
        this.invoiceSummary = invoiceSummary;
        this.invoiceLineSummary = invoiceLineSummary;
        this.subscriptionSummary = subscriptionSummary;
        this.subscriptionLineSummary = subscriptionLineSummary;
        this.o2cConnector = o2cConnector;
        this.sbpBillScheduleHeader = sbpBillScheduleHeader;
    }

    public List<Map<String, Object>> getOrderSummary(String orderId) {
        System.out.println(orderId);
        List<Map<String, Object>> result = jdbcManager.o2cOrderSummary(orderSummary, orderId);
        return result;
    }

    public List<Map<String, Object>> getInvoiceSummary(String invoiceId) {
        List<Map<String, Object>> result = jdbcManager.o2cInvoiceSummary(invoiceSummary, invoiceId);
        return result;
    }

    public List<Map<String, Object>> getInvoiceLineSummary(String invoiceId) {
        List<Map<String, Object>> result = jdbcManager.o2cInvoiceLineSummary(invoiceLineSummary, invoiceId);
        return result;
    }

    public List<Map<String, Object>> getSubscriptionSummary(String subscriptionId) {
        List<Map<String, Object>> result = jdbcManager.o2cSubscriptionSummary(subscriptionSummary, subscriptionId);
        return result;
    }

    public List<Map<String, Object>> getSubscriptionLineSummary(String subscriptionId) {
        List<Map<String, Object>> result = jdbcManager.o2cSubscriptionLineSummary(subscriptionLineSummary,
                subscriptionId);
        return result;
    }

    public List<Map<String, Object>> getSbpBillScheduleHeader(String subscriptionId) {
        List<Map<String, Object>> result = jdbcManager.sbpBillScheduleHeader(sbpBillScheduleHeader, subscriptionId);
        return result;
    }

    public List<Map<String, Object>> getO2cConnector() {
        return jdbcManager.queryForList(o2cConnector);
    }

    public List<Map<String, Object>> getO2cConnectorData(String field, String value) {
        return jdbcManager.queryForO2CConnectorData(o2cConnector, field, value);
    }
}
