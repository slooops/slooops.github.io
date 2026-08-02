package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class LandingPageService {

    private JdbcManager jdbcManager;
    private String landingPagePeriodData;
    private String landingPageIssues;
    private String landingPageHighPriorityIssues;
    private String landingPageIssuesList;
    private String landingPageIssuesDistribution;
    private String landingPageTransactionFailures;
    private String landingPageEspCases;
    @Autowired
    private Common common;

    public LandingPageService(JdbcManager jdbcManager, String landingPagePeriodData, String landingPageIssues, String landingPageHighPriorityIssues,
                               String landingPageIssuesList, String landingPageIssuesDistribution, String landingPageTransactionFailures, String landingPageEspCases){
        this.jdbcManager = jdbcManager;
        this.landingPagePeriodData = landingPagePeriodData;
        this.landingPageIssues = landingPageIssues;
        this.landingPageHighPriorityIssues = landingPageHighPriorityIssues;
        this.landingPageIssuesList=landingPageIssuesList;
        this.landingPageIssuesDistribution=landingPageIssuesDistribution;
        this.landingPageTransactionFailures = landingPageTransactionFailures;
        this.landingPageEspCases = landingPageEspCases;
    }

    public List<Map<String, Object>> getLandingPagePeriodData() {
        String[] dateColumns = { "PERIOD_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPagePeriodData);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getLandingPageIssues() {
        String[] dateColumns = { "PERIOD_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPageIssues);
//        result.forEach(data -> {
//            common.formatDateColumns(data, dateColumns);
//        });
        return result;
    }

    public List<Map<String, Object>> getLandingPageHighPriorityIssues() {
        String[] dateColumns = { "PERIOD_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPageHighPriorityIssues);
//        result.forEach(data -> {
//            common.formatDateColumns(data, dateColumns);
//        });
        return result;
    }

    public List<Map<String, Object>> getLandingPageIssuesList() {
        String[] dateColumns = { "LAST_UPDATED_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPageIssuesList);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            common.renameKey(data, "FUNCTIONAL)AREA","FUNCTIONAL_AREA");
        });
        return result;
    }

    public List<Map<String, Object>> getLandingPageIssuesDistribution() {
        String[] dateColumns = { "PERIOD_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPageIssuesDistribution);
//        result.forEach(data -> {
//            common.formatDateColumns(data, dateColumns);
//        });
        return result;
    }

    public List<Map<String, Object>> getLandingPageTransactionFailures() {
        String[] dateColumns = { "PERIOD_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPageTransactionFailures);
//        result.forEach(data -> {
//            common.formatDateColumns(data, dateColumns);
//        });
        return result;
    }

    public List<Map<String, Object>> getLandingPageEspCases() {
        String[] dateColumns = { "PERIOD_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPageEspCases);
//        result.forEach(data -> {
//            common.formatDateColumns(data, dateColumns);
//        });
        return result;
    }
}
