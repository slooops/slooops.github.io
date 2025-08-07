package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

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
    private String sbpBillSchedules;
    private String sbpBillScheduleLines;

    @Autowired
    public O2CMonitoringService(JdbcManager jdbcManager, String orderSummary, String invoiceSummary,
            String invoiceLineSummary, String subscriptionSummary,
            String subscriptionLineSummary, String o2cConnector, String sbpBillScheduleHeader, String sbpBillSchedules,
                                String sbpBillScheduleLines) {
        this.jdbcManager = jdbcManager;
        this.orderSummary = orderSummary;
        this.invoiceSummary = invoiceSummary;
        this.invoiceLineSummary = invoiceLineSummary;
        this.subscriptionSummary = subscriptionSummary;
        this.subscriptionLineSummary = subscriptionLineSummary;
        this.o2cConnector = o2cConnector;
        this.sbpBillScheduleHeader = sbpBillScheduleHeader;
        this.sbpBillSchedules = sbpBillSchedules;
        this.sbpBillScheduleLines = sbpBillScheduleLines;
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
        String[] dateColumns = { "LAST_MODIFIED_DATE" };
        List<Map<String, Object>> result = jdbcManager.sbpBillScheduleHeader(sbpBillScheduleHeader, subscriptionId);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getSbpBillSchedule(String offsetId) {
        String[] dateColumns = { "BILL_DATE", "INVOICED_DATE" };
        List<Map<String, Object>> result = jdbcManager.getO2CBillSchedules(sbpBillSchedules, offsetId);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getSbpBillScheduleLines(String offsetId, String billDate) {
        List<Map<String, Object>> result = jdbcManager.getO2CBillScheduleList(sbpBillScheduleLines, offsetId, billDate);
        return result;
    }

    public List<Map<String, Object>> getO2cConnector() {
        return jdbcManager.queryForList(o2cConnector);
    }

    public List<Map<String, Object>> getO2cConnectorData(String field, String value) {
        return jdbcManager.queryForO2CConnectorData(o2cConnector, field, value);
    }

    private void formatDateColumns(Map<String, Object> data, String[] dateColumns) {
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");
        List<DateTimeFormatter> inputFormatters = Arrays.asList(
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("MM-dd-yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.S")
        );

        for (String column : dateColumns) {
            Object value = data.get(column);
            if (value != null) {
                String rawDate = value.toString().split(" ")[0].length() > 10 ? value.toString() : value.toString().split(" ")[0];
                boolean parsed = false;

                for (DateTimeFormatter formatter : inputFormatters) {
                    try {
                        LocalDate localDate = LocalDate.parse(rawDate, formatter);
                        data.put(column, outputFormatter.format(localDate));
                        parsed = true;
                        break;
                    } catch (Exception ignored) {}
                }

                if (!parsed) {
                    try {
                        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("EEE MMM dd HH:mm:ss zzz yyyy", Locale.ENGLISH);
                        Date utilDate = sdf.parse(value.toString());
                        LocalDate date = utilDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                        data.put(column, outputFormatter.format(date));
                        parsed = true;
                    } catch (Exception ignored) {}
                }

                if (!parsed) {
                    data.put(column, rawDate);
                }
            } else {
                data.put(column, "");
            }
        }
    }
}
