package com.cisco.des.o2c.rev.revenuemonitoringserver.services;


import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OperationsControlsService {

    private JdbcManager jdbcManager;
    private String i2cControlsSummary;
    private String i2cControlsDetails;
    private String i2cControlsDetailsFiltered;
    private String revControlsSummary;
    private String revControlsDetails;
    private String revControlsDetailsFiltered;
    private String gtcControlsSummary;
    private String gtcControlsDetails;
    private String gtcControlsDetailsFiltered;

    @Autowired
    private Common common;

    public OperationsControlsService(JdbcManager jdbcManager, String i2cControlsSummary, String i2cControlsDetails, String i2cControlsDetailsFiltered,
                                     String revControlsSummary, String revControlsDetails, String revControlsDetailsFiltered,
                                     String gtcControlsSummary, String gtcControlsDetails, String gtcControlsDetailsFiltered){
        this.jdbcManager = jdbcManager;
        this.i2cControlsSummary = i2cControlsSummary;
        this.i2cControlsDetails = i2cControlsDetails;
        this.i2cControlsDetailsFiltered = i2cControlsDetailsFiltered;
        this.revControlsSummary = revControlsSummary;
        this.revControlsDetails = revControlsDetails;
        this.revControlsDetailsFiltered = revControlsDetailsFiltered;
        this.gtcControlsSummary = gtcControlsSummary;
        this.gtcControlsDetails = gtcControlsDetails;
        this.gtcControlsDetailsFiltered = gtcControlsDetailsFiltered;
    }
    public List<Map<String, Object>> getRevControlsSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(revControlsSummary);
        String[] dateColumns = { "TRANSACTION_DATE" };
        result.forEach(data -> {
            common.renameKey(data, "Transaction Date", "TRANSACTION_DATE");
            common.renameKey(data, "Comments", "COMMENTS");
            common.renameKey(data, "Period Num", "PERIOD_NAME");
            common.renameKey(data, "Amount in USD", "AMOUNT");
            common.renameKey(data, "Operating Unit Name", "ORG_NAME");
            common.renameKey(data, "APPLICATION", "APPLICATION_NAME");
            common.renameKey(data, "Rule Name", "RULE_NAME");

            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("Aging", common.calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("Aging")) {
                reorderedData.put("Aging", common.calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getRevControlsDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(revControlsDetails);
        String[] dateColumns = { "TRANSACTION_DATE" };
        result.forEach(data -> {
            data.remove("PERIOD_YEAR");
            data.remove("TXN_CURRENCY_CODE");
            common.renameKey(data, "OPERATING_UNIT_NAME", "ORG_NAME");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> geti2cControlsSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(i2cControlsSummary);
        String[] dateColumns = { "TRANSACTION_DATE" };
        result.forEach(data -> {
            common.renameKey(data, "Transaction Date", "TRANSACTION_DATE");
            common.renameKey(data, "Comments", "COMMENTS");
            common.renameKey(data, "Period Num", "PERIOD_NAME");
            common.renameKey(data, "Amount in USD", "AMOUNT");
            common.renameKey(data, "Application", "APPLICATION");
            common.renameKey(data, "Operating Unit Name", "ORG_NAME");
            common.renameKey(data, "APPLICATION", "APPLICATION_NAME");
            common.renameKey(data, "Rule Name", "RULE_NAME");
            data.remove("Aging");
            data.remove("Period Year");
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("Aging", common.calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("Aging")) {
                reorderedData.put("Aging", common.calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getI2CControlsDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(i2cControlsDetails);
        String[] dateColumns = { "TRANSACTION_DATE", "ISSUE_IDENTIFIED_DATE", "ISSUE_RESOLVED_DATE" };
        result.forEach(data -> {
            data.remove("PERIOD_YEAR");
            data.remove("TXN_CURRENCY_CODE");
            common.renameKey(data, "OPERATING_UNIT_NAME", "ORG_NAME");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getI2CControlsDetailsFiltered(String periodName, String appName,
                                                                   String operatingUnit, String transactionDate, String ruleName) {
        List<Map<String, Object>> result = jdbcManager.filterI2cControls(i2cControlsDetailsFiltered, periodName, appName, operatingUnit, transactionDate);
        String[] dateColumns = { "TRANSACTION_DATE", "ISSUE_IDENTIFIED_DATE", "ISSUE_RESOLVED_DATE" };
        result.forEach(data -> {
            data.remove("PERIOD_YEAR");
            data.remove("TXN_CURRENCY_CODE");
            common.renameKey(data, "OPERATING_UNIT_NAME", "ORG_NAME");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getRevControlsDetailsFiltered(String periodName, String appName,
                                                                   String operatingUnit, String transactionDate, String ruleName) {
        List<Map<String, Object>> result = jdbcManager.filterRevControls(revControlsDetailsFiltered, periodName, appName, operatingUnit, transactionDate);
        String[] dateColumns = { "TRANSACTION_DATE"};
        result.forEach(data -> {
            data.remove("PERIOD_YEAR");
            data.remove("TXN_CURRENCY_CODE");
            common.renameKey(data, "OPERATING_UNIT_NAME", "ORG_NAME");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGtcControlsSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(gtcControlsSummary);
        String[] dateColumns = { "TRANSACTION_DATE" };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGtcControlsDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForList(gtcControlsDetails);
        String[] dateColumns = { "TRANSACTION_DATE"};
        result.forEach(data -> {
            data.remove("AGING");
            data.remove("ASSIGNED_TO");
            data.remove("ASSIGNED_DATE");
            data.remove("COMMENTS");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGtcControlsDetailsFiltered(String processFlow, String entityName, String transactionDate) {
        System.out.println(gtcControlsDetailsFiltered);
        System.out.println(processFlow);
        System.out.println(entityName);
        System.out.println(transactionDate);
        List<Map<String, Object>> result = jdbcManager.filterGtcControls(gtcControlsDetailsFiltered, processFlow, entityName, transactionDate);
        String[] dateColumns = { "TRANSACTION_DATE"};
        result.forEach(data -> {
            data.remove("AGING");
            data.remove("ASSIGNED_TO");
            data.remove("ASSIGNED_DATE");
            data.remove("COMMENTS");
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

}
