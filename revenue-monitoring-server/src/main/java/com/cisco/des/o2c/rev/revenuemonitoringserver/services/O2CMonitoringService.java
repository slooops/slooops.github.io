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

    @Autowired
    public O2CMonitoringService(JdbcManager jdbcManager, String orderSummary, String invoiceSummary, String invoiceLineSummary, String subscriptionSummary, String subscriptionLineSummary) {
        this.jdbcManager = jdbcManager;
        this.orderSummary = orderSummary;
        this.invoiceSummary = invoiceSummary;
        this.invoiceLineSummary = invoiceLineSummary;
        this.subscriptionSummary = subscriptionSummary;
        this.subscriptionLineSummary = subscriptionLineSummary;
    }

    public List<Map<String, Object>> getOrderSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForO2CData(orderSummary);
        return result;
    }

    public List<Map<String, Object>> getInvoiceSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForO2CData(invoiceSummary);
        return result;
    }

    public List<Map<String, Object>> getInvoiceLineSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForO2CData(invoiceLineSummary);
        return result;
    }

    public List<Map<String, Object>> getSubscriptionSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForO2CData(subscriptionSummary);
        return result;
    }

    public List<Map<String, Object>> getSubscriptionLineSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForO2CData(subscriptionLineSummary);
        return result;
    }
}
