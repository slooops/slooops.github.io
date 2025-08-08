package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
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
    private String tsvPkgProc;
    private String financialSummaryPgkProc;
    private String tsvTopSku;
    private String tsvSubSku;
    private String tsvAccounts;
    private String financialSummaryView;


    @Autowired
    public O2CMonitoringService(JdbcManager jdbcManager, String orderSummary, String invoiceSummary,
            String invoiceLineSummary, String subscriptionSummary,
            String subscriptionLineSummary, String o2cConnector, String sbpBillScheduleHeader, String sbpBillSchedules,
                                String sbpBillScheduleLines, String financialSummaryPgkProc, String tsvPkgProc,
                                String tsvTopSku, String tsvSubSku, String tsvAccounts, String financialSummaryView) {
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
        this.financialSummaryPgkProc = financialSummaryPgkProc;
        this.tsvPkgProc = tsvPkgProc;
        this.tsvTopSku = tsvTopSku;
        this.tsvSubSku = tsvSubSku;
        this.tsvAccounts = tsvAccounts;
        this.financialSummaryView = financialSummaryView;
    }

    public List<Map<String, Object>> getOrderSummary(String orderId) {
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

    public List<Map<String, Object>> getSubscriptionSummary(String subscriptionId, String subscriptionCode) {
        List<Map<String, Object>> result = jdbcManager.o2cSubscriptionSummary(subscriptionSummary, subscriptionId, subscriptionCode);
        return result;
    }

    public List<Map<String, Object>> getSubscriptionLineSummary(String subscriptionId, String subscriptionCode) {
        List<Map<String, Object>> result = jdbcManager.o2cSubscriptionLineSummary(subscriptionLineSummary,
                subscriptionId, subscriptionCode);
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
        callFinancialSummaryPkgProc(field,value);
        return jdbcManager.queryForO2CConnectorData(o2cConnector, field, value);
    }

    public List<Map<String, Object>> callFinancialSummaryView(String field, String value) {
        return jdbcManager.callFinancialSummaryView(financialSummaryView, field, value);
    }

    public void callFinancialSummaryPkgProc(String field, String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Search value cannot be empty");
        }

        try {
            switch (field) {
                case "WEBORDER_ID":
                    jdbcManager.callFinancialSummaryPkgProc(financialSummaryPgkProc, null, value, null);
                    break;
                case "SUBSCRIPTION_REF_ID":
                    jdbcManager.callFinancialSummaryPkgProc(financialSummaryPgkProc, value, null, null);
                    break;
                case "TRX_NUMBER": // Assuming this is the third field
                    jdbcManager.callFinancialSummaryPkgProc(financialSummaryPgkProc, null, null, value);
                    break;
                default:
                    throw new IllegalArgumentException("Invalid search field: " + field);
            }
        } catch (DataAccessException e) {
            // Log the error
            System.out.println("Error calling financial summary procedure: "+ e.getMessage());
            throw new RuntimeException("Failed to retrieve financial summary data", e);
        }
    }

    public void callTsvPkgProc(String subscriptionId, String webOrderLineId) {
        jdbcManager.callTsvPkgProc(tsvPkgProc, subscriptionId, webOrderLineId);
    }

    public List<Map<String, Object>> callTsvTopSku(String subscriptionId, String webOrderLineId) {
        String[] dateColumns = { "SUBSCRIPTION_START_DATE", "SUBSCRIPTION_END_DATE", "CHARGE_START_DATE", "CHARGE_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.tsvTopSku(tsvTopSku, subscriptionId, webOrderLineId);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> callTsvSubSku(String subscriptionId, String webOrderLineId) {
        String[] dateColumns = { "RULE_START_DATE", "RULE_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.tsvSubSku(tsvSubSku, subscriptionId, webOrderLineId);
        result.forEach(data -> {
            formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> callTsvAccounts(String subscriptionId, String webOrderLineId) {
        return jdbcManager.tsvAccounts(tsvAccounts, subscriptionId, webOrderLineId);
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
