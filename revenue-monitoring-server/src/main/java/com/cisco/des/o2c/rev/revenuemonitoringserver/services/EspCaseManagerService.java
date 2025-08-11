package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class EspCaseManagerService {
    private JdbcManager jdbcManager;
    private String espAgingCaseSummary;
    private String espCaseServiceMetricSummary;
    private String espWeeklyComparisonSummary;
    private String sbpEspAgingCaseSummary;
    private String sbpEspCaseServiceMetricSummary;
    private String sbpEspWeeklyComparisonSummary;

    public EspCaseManagerService(JdbcManager jdbcManager,  String espAgingCaseSummary, String espCaseServiceMetricSummary,
                                 String espWeeklyComparisonSummary, String sbpEspAgingCaseSummary,
                                 String sbpEspCaseServiceMetricSummary, String sbpEspWeeklyComparisonSummary){
        this.jdbcManager = jdbcManager;
        this.espAgingCaseSummary = espAgingCaseSummary;
        this.espCaseServiceMetricSummary = espCaseServiceMetricSummary;
        this.espWeeklyComparisonSummary = espWeeklyComparisonSummary;
        this.sbpEspAgingCaseSummary = sbpEspAgingCaseSummary;
        this.sbpEspCaseServiceMetricSummary = sbpEspCaseServiceMetricSummary;
        this.sbpEspWeeklyComparisonSummary = sbpEspWeeklyComparisonSummary;
    }
    public List<Map<String, Object>> getEspCaseServiceMetricSummary() {
        return jdbcManager.queryForList(espCaseServiceMetricSummary);
    }

    public List<Map<String, Object>> getEspWeeklyComparisonSummary() {
        return jdbcManager.queryForList(espWeeklyComparisonSummary);
    }

    public List<Map<String, Object>> getEspAgingCaseSummary() {
        return jdbcManager.queryForList(espAgingCaseSummary);
    }

    public List<Map<String, Object>> getSbpEspCaseServiceMetricSummary() {
        return jdbcManager.queryForList(sbpEspCaseServiceMetricSummary);
    }

    public List<Map<String, Object>> getSbpEspWeeklyComparisonSummary() {
        return jdbcManager.queryForList(sbpEspWeeklyComparisonSummary);
    }

    public List<Map<String, Object>> getSbpEspAgingCaseSummary() {
        return jdbcManager.queryForList(sbpEspAgingCaseSummary);
    }
}
