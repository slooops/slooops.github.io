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
    private String o2cOrderBieExceptionV;
    private String o2cOrderChExceptionV;
    private String o2cOrderPeExceptionV;
    private String o2cOrderOtExceptionV;
    private String o2cOrderBhExceptionV;
    private String o2cOrderEcExceptionV;
    private String o2cOrderSabExceptionV;
    private String o2cOrderSubotExceptionV;
    private String o2cOrderPreinvExceptionV;
    private String o2cOrderInvExceptionV;
    private String o2cOrderInvpidExceptionV;
    private String o2cOrderInvothExceptionV;
    private String o2cOrderCaExceptionV;
    private String o2cOrderSlaExceptionV;
    private String o2cOrderGlExceptionV;
    private String o2cOrderAccotExceptionV;
    private String o2cOrderPastdueExceptionV;
    private String o2cOrderPartialpayExceptionV;
    private String o2cOrderUnidentifiedExceptionV;
    private String o2cOrderCashothExceptionV;


    @Autowired
    public O2CMonitoringService(JdbcManager jdbcManager, String orderSummary, String invoiceSummary,
            String invoiceLineSummary, String subscriptionSummary,
            String subscriptionLineSummary, String o2cConnector, String sbpBillScheduleHeader, String sbpBillSchedules,
                                String sbpBillScheduleLines, String financialSummaryPgkProc, String tsvPkgProc,
                                String tsvTopSku, String tsvSubSku, String tsvAccounts, String financialSummaryView,
                                String o2cOrderBieExceptionV,     String o2cOrderChExceptionV,
                                String o2cOrderPeExceptionV,
                                String o2cOrderOtExceptionV,
                                String o2cOrderBhExceptionV,
                                String o2cOrderEcExceptionV,
                                String o2cOrderSabExceptionV,
                                String o2cOrderSubotExceptionV,
                                String o2cOrderPreinvExceptionV,
                                String o2cOrderInvExceptionV,
                                String o2cOrderInvpidExceptionV,
                                String o2cOrderInvothExceptionV,
                                String o2cOrderCaExceptionV,
                                String o2cOrderSlaExceptionV,
                                String o2cOrderGlExceptionV,
                                String o2cOrderAccotExceptionV,
                                String o2cOrderPastdueExceptionV,
                                String o2cOrderPartialpayExceptionV,
                                String o2cOrderUnidentifiedExceptionV,
                                String o2cOrderCashothExceptionV
    ) {
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
        this.o2cOrderBieExceptionV = o2cOrderBieExceptionV;
        this.o2cOrderChExceptionV = o2cOrderChExceptionV;
        this.o2cOrderPeExceptionV = o2cOrderPeExceptionV;
        this.o2cOrderOtExceptionV = o2cOrderOtExceptionV;
        this.o2cOrderBhExceptionV = o2cOrderBhExceptionV;
        this.o2cOrderEcExceptionV = o2cOrderEcExceptionV;
        this.o2cOrderSabExceptionV = o2cOrderSabExceptionV;
        this.o2cOrderSubotExceptionV = o2cOrderSubotExceptionV;
        this.o2cOrderPreinvExceptionV = o2cOrderPreinvExceptionV;
        this.o2cOrderInvExceptionV = o2cOrderInvExceptionV;
        this.o2cOrderInvpidExceptionV = o2cOrderInvpidExceptionV;
        this.o2cOrderInvothExceptionV = o2cOrderInvothExceptionV;
        this.o2cOrderCaExceptionV = o2cOrderCaExceptionV;
        this.o2cOrderSlaExceptionV = o2cOrderSlaExceptionV;
        this.o2cOrderGlExceptionV = o2cOrderGlExceptionV;
        this.o2cOrderAccotExceptionV = o2cOrderAccotExceptionV;
        this.o2cOrderPastdueExceptionV = o2cOrderPastdueExceptionV;
        this.o2cOrderPartialpayExceptionV = o2cOrderPartialpayExceptionV;
        this.o2cOrderUnidentifiedExceptionV = o2cOrderUnidentifiedExceptionV;
        this.o2cOrderCashothExceptionV = o2cOrderCashothExceptionV;
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
        List<Map<String, Object>> result = jdbcManager.sbpBillScheduleHeader(sbpBillScheduleHeader, subscriptionId);
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

    public List<Map<String, Object>> getO2cOrderBieExceptionV() {
        return jdbcManager.queryForList(o2cOrderBieExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderChExceptionV() {
        return jdbcManager.queryForList(o2cOrderChExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderPeExceptionV() {
        return jdbcManager.queryForList(o2cOrderPeExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderOtExceptionV() {
        return jdbcManager.queryForList(o2cOrderOtExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderBhExceptionV() {
        return jdbcManager.queryForList(o2cOrderBhExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderEcExceptionV() {
        return jdbcManager.queryForList(o2cOrderEcExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderSabExceptionV() {
        return jdbcManager.queryForList(o2cOrderSabExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderSubotExceptionV() {
        return jdbcManager.queryForList(o2cOrderSubotExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderPreinvExceptionV() {
        return jdbcManager.queryForList(o2cOrderPreinvExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderInvExceptionV() {
        return jdbcManager.queryForList(o2cOrderInvExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderInvpidExceptionV() {
        return jdbcManager.queryForList(o2cOrderInvpidExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderInvothExceptionV() {
        return jdbcManager.queryForList(o2cOrderInvothExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderCaExceptionV() {
        return jdbcManager.queryForList(o2cOrderCaExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderSlaExceptionV() {
        return jdbcManager.queryForList(o2cOrderSlaExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderGlExceptionV() {
        return jdbcManager.queryForList(o2cOrderGlExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderAccotExceptionV() {
        return jdbcManager.queryForList(o2cOrderAccotExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderPastdueExceptionV() {
        return jdbcManager.queryForList(o2cOrderPastdueExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderPartialpayExceptionV() {
        return jdbcManager.queryForList(o2cOrderPartialpayExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderUnidentifiedExceptionV() {
        return jdbcManager.queryForList(o2cOrderUnidentifiedExceptionV);
    }

    public List<Map<String, Object>> getO2cOrderCashothExceptionV() {
        return jdbcManager.queryForList(o2cOrderCashothExceptionV);
    }
}
