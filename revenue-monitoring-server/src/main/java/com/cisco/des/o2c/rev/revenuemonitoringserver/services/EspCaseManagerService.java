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
    private String vwI2cCategoryMatchStatus;
    private String vwI2cCoreIssueMatchStatus;
    private String xxcaseiqValidatedCasesAccuracyV;
    private String vwI2cCaseDetails;

    public EspCaseManagerService(JdbcManager jdbcManager, String espAgingCaseSummary,
            String espCaseServiceMetricSummary,
            String espWeeklyComparisonSummary, String sbpEspAgingCaseSummary,
            String sbpEspCaseServiceMetricSummary, String sbpEspWeeklyComparisonSummary,
            String vwI2cCategoryMatchStatus,
            String vwI2cCoreIssueMatchStatus,
            String xxcaseiqValidatedCasesAccuracyV,
            String vwI2cCaseDetails) {
        this.jdbcManager = jdbcManager;
        this.espAgingCaseSummary = espAgingCaseSummary;
        this.espCaseServiceMetricSummary = espCaseServiceMetricSummary;
        this.espWeeklyComparisonSummary = espWeeklyComparisonSummary;
        this.sbpEspAgingCaseSummary = sbpEspAgingCaseSummary;
        this.sbpEspCaseServiceMetricSummary = sbpEspCaseServiceMetricSummary;
        this.sbpEspWeeklyComparisonSummary = sbpEspWeeklyComparisonSummary;
        this.vwI2cCategoryMatchStatus = vwI2cCategoryMatchStatus;
        this.vwI2cCoreIssueMatchStatus = vwI2cCoreIssueMatchStatus;
        this.xxcaseiqValidatedCasesAccuracyV = xxcaseiqValidatedCasesAccuracyV;
        this.vwI2cCaseDetails = vwI2cCaseDetails;
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

    public List<Map<String, Object>> getVwI2cCategoryMatchStatus() {
        System.out.println("SERVICE: getVwI2cCategoryMatchStatus called");
        System.out.println("QUERY: " + vwI2cCategoryMatchStatus);
        return jdbcManager.queryForList(vwI2cCategoryMatchStatus);
    }

    public List<Map<String, Object>> getVwI2cCoreIssueMatchStatus() {
        System.out.println("SERVICE: getVwI2cCoreIssueMatchStatus called");
        System.out.println("QUERY: " + vwI2cCoreIssueMatchStatus);
        return jdbcManager.queryForList(vwI2cCoreIssueMatchStatus);
    }

    public List<Map<String, Object>> getXxcaseiqValidatedCasesAccuracyV() {
        System.out.println("SERVICE: getXxcaseiqValidatedCasesAccuracyV called");
        System.out.println("QUERY: " + xxcaseiqValidatedCasesAccuracyV);
        return jdbcManager.queryForList(xxcaseiqValidatedCasesAccuracyV);
    }

    public List<Map<String, Object>> getVwI2cCaseDetails() {
        System.out.println("SERVICE: getVwI2cCaseDetails called");
        System.out.println("QUERY: " + vwI2cCaseDetails);
        return jdbcManager.queryForList(vwI2cCaseDetails);
    }
}
