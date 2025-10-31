package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.ExcelReader;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private String xxcaseiqCategoryGraphVAit;
    private String xxcaseiqCategoryGraphVCapital;
    private String xxcaseiqCategoryGraphVFpp;
    private String xxcaseiqCategoryGraphVI2c;
    private String xxcaseiqCategoryGraphVOm;
    private String xxcaseiqCategoryGraphVP2p;
    private String xxcaseiqCategoryGraphVSm;
    private String xxcaseiqCoreIssueGraphVAit;
    private String xxcaseiqCoreIssueGraphVCapital;
    private String xxcaseiqCoreIssueGraphVFpp;
    private String xxcaseiqCoreIssueGraphVI2c;
    private String xxcaseiqCoreIssueGraphVOm;
    private String xxcaseiqCoreIssueGraphVP2p;
    private String xxcaseiqCoreIssueGraphVSm;
    private String xxcaseiqI2cCaseDetailsV;
    private String xxcaseiqAitCaseDetailsV;
    private String xxcaseiqFppCaseDetailsV;
    private String xxcaseiqOmCaseDetailsV;
    private String xxcaseiqSmCaseDetailsV;
    private String xxcaseiqP2pCaseDetailsV;
    private String xxcaseiqCapitalCaseDetailsV;
    private String xxcaseiqEspCaseAnalyzerTblUpdate;
    private String xxcaseiqI2cCaseDetailsMatchY;

    public EspCaseManagerService(JdbcManager jdbcManager, String espAgingCaseSummary,
            String espCaseServiceMetricSummary,
            String espWeeklyComparisonSummary, String sbpEspAgingCaseSummary,
            String sbpEspCaseServiceMetricSummary, String sbpEspWeeklyComparisonSummary,
            String vwI2cCategoryMatchStatus,
            String vwI2cCoreIssueMatchStatus,
            String xxcaseiqValidatedCasesAccuracyV,
            String vwI2cCaseDetails,
            String xxcaseiqCategoryGraphVAit,
            String xxcaseiqCategoryGraphVCapital,
            String xxcaseiqCategoryGraphVFpp,
            String xxcaseiqCategoryGraphVI2c,
            String xxcaseiqCategoryGraphVOm,
            String xxcaseiqCategoryGraphVP2p,
            String xxcaseiqCategoryGraphVSm,
            String xxcaseiqCoreIssueGraphVAit,
            String xxcaseiqCoreIssueGraphVCapital,
            String xxcaseiqCoreIssueGraphVFpp,
            String xxcaseiqCoreIssueGraphVI2c,
            String xxcaseiqCoreIssueGraphVOm,
            String xxcaseiqCoreIssueGraphVP2p,
            String xxcaseiqCoreIssueGraphVSm,
            String xxcaseiqI2cCaseDetailsV,
            String xxcaseiqAitCaseDetailsV,
            String xxcaseiqFppCaseDetailsV,
            String xxcaseiqOmCaseDetailsV,
            String xxcaseiqSmCaseDetailsV,
            String xxcaseiqP2pCaseDetailsV,
            String xxcaseiqCapitalCaseDetailsV,
                                 String xxcaseiqEspCaseAnalyzerTblUpdate, String xxcaseiqI2cCaseDetailsMatchY) {
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
        this.xxcaseiqCategoryGraphVAit = xxcaseiqCategoryGraphVAit;
        this.xxcaseiqCategoryGraphVCapital = xxcaseiqCategoryGraphVCapital;
        this.xxcaseiqCategoryGraphVFpp = xxcaseiqCategoryGraphVFpp;
        this.xxcaseiqCategoryGraphVI2c = xxcaseiqCategoryGraphVI2c;
        this.xxcaseiqCategoryGraphVOm = xxcaseiqCategoryGraphVOm;
        this.xxcaseiqCategoryGraphVP2p = xxcaseiqCategoryGraphVP2p;
        this.xxcaseiqCategoryGraphVSm = xxcaseiqCategoryGraphVSm;
        this.xxcaseiqCoreIssueGraphVAit = xxcaseiqCoreIssueGraphVAit;
        this.xxcaseiqCoreIssueGraphVCapital = xxcaseiqCoreIssueGraphVCapital;
        this.xxcaseiqCoreIssueGraphVFpp = xxcaseiqCoreIssueGraphVFpp;
        this.xxcaseiqCoreIssueGraphVI2c = xxcaseiqCoreIssueGraphVI2c;
        this.xxcaseiqCoreIssueGraphVOm = xxcaseiqCoreIssueGraphVOm;
        this.xxcaseiqCoreIssueGraphVP2p = xxcaseiqCoreIssueGraphVP2p;
        this.xxcaseiqCoreIssueGraphVSm = xxcaseiqCoreIssueGraphVSm;
        this.xxcaseiqI2cCaseDetailsV = xxcaseiqI2cCaseDetailsV;
        this.xxcaseiqAitCaseDetailsV = xxcaseiqAitCaseDetailsV;
        this.xxcaseiqFppCaseDetailsV = xxcaseiqFppCaseDetailsV;
        this.xxcaseiqOmCaseDetailsV = xxcaseiqOmCaseDetailsV;
        this.xxcaseiqSmCaseDetailsV = xxcaseiqSmCaseDetailsV;
        this.xxcaseiqP2pCaseDetailsV = xxcaseiqP2pCaseDetailsV;
        this.xxcaseiqCapitalCaseDetailsV = xxcaseiqCapitalCaseDetailsV;
        this.xxcaseiqEspCaseAnalyzerTblUpdate = xxcaseiqEspCaseAnalyzerTblUpdate;
        this.xxcaseiqI2cCaseDetailsMatchY = xxcaseiqI2cCaseDetailsMatchY;
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
        return jdbcManager.queryForList(vwI2cCategoryMatchStatus);
    }

    public List<Map<String, Object>> getVwI2cCoreIssueMatchStatus() {
        return jdbcManager.queryForList(vwI2cCoreIssueMatchStatus);
    }

    public List<Map<String, Object>> getXxcaseiqValidatedCasesAccuracyV() {
        return jdbcManager.queryForList(xxcaseiqValidatedCasesAccuracyV);
    }

    public List<Map<String, Object>> getVwI2cCaseDetails() {
        return jdbcManager.queryForList(vwI2cCaseDetails);
    }

    public List<Map<String, Object>> getXxcaseiqCategoryGraphVAit() {
        return jdbcManager.queryForList(xxcaseiqCategoryGraphVAit);
    }

    public List<Map<String, Object>> getXxcaseiqCategoryGraphVCapital() {
        return jdbcManager.queryForList(xxcaseiqCategoryGraphVCapital);
    }

    public List<Map<String, Object>> getXxcaseiqCategoryGraphVFpp() {
        return jdbcManager.queryForList(xxcaseiqCategoryGraphVFpp);
    }

    public List<Map<String, Object>> getXxcaseiqCategoryGraphVI2c() {
        return jdbcManager.queryForList(xxcaseiqCategoryGraphVI2c);
    }

    public List<Map<String, Object>> getXxcaseiqCategoryGraphVOm() {
        return jdbcManager.queryForList(xxcaseiqCategoryGraphVOm);
    }

    public List<Map<String, Object>> getXxcaseiqCategoryGraphVP2p() {
        return jdbcManager.queryForList(xxcaseiqCategoryGraphVP2p);
    }

    public List<Map<String, Object>> getXxcaseiqCategoryGraphVSm() {
        return jdbcManager.queryForList(xxcaseiqCategoryGraphVSm);
    }

    public List<Map<String, Object>> getXxcaseiqCoreIssueGraphVAit() {
        return jdbcManager.queryForList(xxcaseiqCoreIssueGraphVAit);
    }

    public List<Map<String, Object>> getXxcaseiqCoreIssueGraphVCapital() {
        return jdbcManager.queryForList(xxcaseiqCoreIssueGraphVCapital);
    }

    public List<Map<String, Object>> getXxcaseiqCoreIssueGraphVFpp() {
        return jdbcManager.queryForList(xxcaseiqCoreIssueGraphVFpp);
    }

    public List<Map<String, Object>> getXxcaseiqCoreIssueGraphVI2c() {
        return jdbcManager.queryForList(xxcaseiqCoreIssueGraphVI2c);
    }

    public List<Map<String, Object>> getXxcaseiqCoreIssueGraphVOm() {
        return jdbcManager.queryForList(xxcaseiqCoreIssueGraphVOm);
    }

    public List<Map<String, Object>> getXxcaseiqCoreIssueGraphVP2p() {
        return jdbcManager.queryForList(xxcaseiqCoreIssueGraphVP2p);
    }

    public List<Map<String, Object>> getXxcaseiqCoreIssueGraphVSm() {
        return jdbcManager.queryForList(xxcaseiqCoreIssueGraphVSm);
    }

    public List<Map<String, Object>> getXxcaseiqI2cCaseDetailsV() {
        return jdbcManager.queryForList(xxcaseiqI2cCaseDetailsV);
    }

    public List<Map<String, Object>> getXxcaseiqAitCaseDetailsV() {
        return jdbcManager.queryForList(xxcaseiqAitCaseDetailsV);
    }

    public List<Map<String, Object>> getXxcaseiqFppCaseDetailsV() {
        return jdbcManager.queryForList(xxcaseiqFppCaseDetailsV);
    }

    public List<Map<String, Object>> getXxcaseiqOmCaseDetailsV() {
        return jdbcManager.queryForList(xxcaseiqOmCaseDetailsV);
    }

    public List<Map<String, Object>> getXxcaseiqSmCaseDetailsV() {
        return jdbcManager.queryForList(xxcaseiqSmCaseDetailsV);
    }

    public List<Map<String, Object>> getXxcaseiqP2pCaseDetailsV() {
        return jdbcManager.queryForList(xxcaseiqP2pCaseDetailsV);
    }

    public List<Map<String, Object>> getXxcaseiqCapitalCaseDetailsV() {
        return jdbcManager.queryForList(xxcaseiqCapitalCaseDetailsV);
    }

    public void updateEspCaseAnalyzerTable(MultipartFile file) throws IOException {
        try {
            List<Map<String, String>> data = ExcelReader.readExcel(file.getInputStream());
            for (Map<String, String> row : data) {
                jdbcManager.espCaseAnalyzerTableUpdate(xxcaseiqEspCaseAnalyzerTblUpdate, row.get("CATEGORY"), row.get("CATEGORY_ACTUAL"), row.get("COMMENTS"), row.get("CORE_ISSUE"), row.get("CORE_ISSUE_ACTUAL"), row.get("INCIDENT_NUMBER"), row.get("IMPACTED_SERVICE_OFFERING"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<Map<String, Object>> getXxcaseiqI2cCaseDetailsMatchY() {
        return jdbcManager.queryForList(xxcaseiqI2cCaseDetailsMatchY);
    }

}
