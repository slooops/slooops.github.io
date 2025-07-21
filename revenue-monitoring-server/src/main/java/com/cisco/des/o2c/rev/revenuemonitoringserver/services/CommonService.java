package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CommonService {

    private JdbcManager jdbcManager;
    private String invoiceToCashSummary;
    private String summaryAssignmentUsers;
    private String rolErrorsSummaryPeriodStatus;

    @Autowired
    private Common common;

    @Autowired
    private CacheCommon cacheCommon;

    public CommonService(JdbcManager jdbcManager, String invoiceToCashSummary, String summaryAssignmentUsers, String rolErrorsSummaryPeriodStatus) {
        this.jdbcManager = jdbcManager;
        this.rolErrorsSummaryPeriodStatus = rolErrorsSummaryPeriodStatus;
        this.summaryAssignmentUsers = summaryAssignmentUsers;
        this.invoiceToCashSummary = invoiceToCashSummary;
    }


    //Summaries
    public List<Map<String, Object>> getInvoiceToCashSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(invoiceToCashSummary);
        return result;
    }

    // Common methods
    public List<Map<String, Object>> getMonitoringPeriodStatus() {
        String[] dateColumns = { "END_DATE" };
        List<Map<String, Object>> result =  jdbcManager.queryForList(rolErrorsSummaryPeriodStatus);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getSummaryAssignmentUsers() {
        List<Map<String, Object>> result = jdbcManager.queryForList(summaryAssignmentUsers);
        return result;
    }

}
