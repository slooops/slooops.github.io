package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.ExcelReader;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
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
    private String espCaseAnalyzerGlobalSearch;
    private String espCaseAnalyzerMetrics;
    private String xxcaseiqEspCaseReopenedMetrics;
    private String xxcaseiqEspCaseReopenedUpdate;
    @Autowired
    private Common common;

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
                                 String xxcaseiqEspCaseAnalyzerTblUpdate, String xxcaseiqI2cCaseDetailsMatchY, String espCaseAnalyzerGlobalSearch,
                                 String espCaseAnalyzerMetrics, String xxcaseiqEspCaseReopenedMetrics, String xxcaseiqEspCaseReopenedUpdate) {
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
        this.espCaseAnalyzerGlobalSearch = espCaseAnalyzerGlobalSearch;
        this.espCaseAnalyzerMetrics = espCaseAnalyzerMetrics;
        this.xxcaseiqEspCaseReopenedMetrics = xxcaseiqEspCaseReopenedMetrics;
        this.xxcaseiqEspCaseReopenedUpdate = xxcaseiqEspCaseReopenedUpdate;
    }

    public int updateReopenedMetrics(Map<String, String> updateData) {
        return jdbcManager.executeUpdate(xxcaseiqEspCaseReopenedUpdate, updateData.get("reopenDecision"), updateData.get("reopenRejectCategory"),
                updateData.get("reopenRejectCoreIssue"), updateData.get("updateRejectReason"), updateData.get("reopenRejectTeam"), updateData.get("incidentNumber"));
    }

    public List<Map<String, Object>> getEspCaseReopenedMetrics() {
        return jdbcManager.queryForList(xxcaseiqEspCaseReopenedMetrics);
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
        List<Map<String, Object>> result = jdbcManager.queryForList(xxcaseiqI2cCaseDetailsV);
        result.forEach(data -> {
            common.renameKey(data,"Cancel prediction", "CANCEL_PREDICTION");
            common.renameKey(data,"LLM Summary", "LLM_SUMMARY");
        });
        return result;
    }

    public List<Map<String, Object>> getXxcaseiqAitCaseDetailsV() {
        List<Map<String, Object>> result = jdbcManager.queryForList(xxcaseiqAitCaseDetailsV);
        result.forEach(data -> {
            common.renameKey(data,"Cancel prediction", "CANCEL_PREDICTION");
            common.renameKey(data,"LLM Summary", "LLM_SUMMARY");
        });
        return result;
    }

    public List<Map<String, Object>> getXxcaseiqFppCaseDetailsV() {
        List<Map<String, Object>> result = jdbcManager.queryForList(xxcaseiqFppCaseDetailsV);
        result.forEach(data -> {
            common.renameKey(data,"Cancel prediction", "CANCEL_PREDICTION");
            common.renameKey(data,"LLM Summary", "LLM_SUMMARY");
        });
        return result;
    }

    public List<Map<String, Object>> getXxcaseiqOmCaseDetailsV() {
        List<Map<String, Object>> result = jdbcManager.queryForList(xxcaseiqOmCaseDetailsV);
        result.forEach(data -> {
            common.renameKey(data,"Cancel prediction", "CANCEL_PREDICTION");
            common.renameKey(data,"LLM Summary", "LLM_SUMMARY");
        });
        return result;
    }

    public List<Map<String, Object>> getXxcaseiqSmCaseDetailsV() {
        List<Map<String, Object>> result = jdbcManager.queryForList(xxcaseiqSmCaseDetailsV);
        result.forEach(data -> {
            common.renameKey(data,"Cancel prediction", "CANCEL_PREDICTION");
            common.renameKey(data,"LLM Summary", "LLM_SUMMARY");
        });
        return result;
    }

    public List<Map<String, Object>> getXxcaseiqP2pCaseDetailsV() {
        List<Map<String, Object>> result = jdbcManager.queryForList(xxcaseiqP2pCaseDetailsV);
        result.forEach(data -> {
            common.renameKey(data,"Cancel prediction", "CANCEL_PREDICTION");
            common.renameKey(data,"LLM Summary", "LLM_SUMMARY");
        });
        return result;
    }

    public List<Map<String, Object>> getXxcaseiqCapitalCaseDetailsV() {
        try {
            List<Map<String, Object>> result = jdbcManager.queryForList(xxcaseiqCapitalCaseDetailsV);
            result.forEach(data -> {
                common.renameKey(data,"Cancel prediction", "CANCEL_PREDICTION");
                common.renameKey(data,"LLM Summary", "LLM_SUMMARY");
            });
            return result;
        } catch (Exception e) {
            // ORA-06502: PL/SQL numeric or value error – character string buffer too small
            // This is a DB-side issue in XXCASEIQ_CAPITAL_CASE_DETAILS_SUPERVISOR_V.
            // The underlying PL/SQL function/view needs its VARCHAR2 buffer enlarged in Oracle.
            // Returning empty list so the Capital tab degrades gracefully instead of 500-ing.
            System.err.println("[getXxcaseiqCapitalCaseDetailsV] Query failed – likely ORA-06502 buffer overflow in view: " + e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    public void updateEspCaseAnalyzerTable(MultipartFile file, String username) throws IOException {
        try {
            List<Map<String, String>> data = ExcelReader.readExcel(file.getInputStream());
            for (Map<String, String> row : data) {
                jdbcManager.espCaseAnalyzerTableUpdate(xxcaseiqEspCaseAnalyzerTblUpdate, username, row.get("CATEGORY"), row.get("CATEGORY_ACTUAL"), row.get("COMMENTS"), row.get("CORE_ISSUE"), row.get("CORE_ISSUE_ACTUAL"), row.get("INCIDENT_NUMBER"), row.get("IMPACTED_SERVICE_OFFERING"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<Map<String, Object>> getXxcaseiqI2cCaseDetailsMatchY() {
        return jdbcManager.queryForList(xxcaseiqI2cCaseDetailsMatchY);
    }

    public List<Map<String, Object>> espCaseAnalyzerGlobalSearch(String incidentNumbersRaw) throws IOException {
        if (incidentNumbersRaw == null || incidentNumbersRaw.trim().isEmpty()) {
            return List.of();
        }

        String[] tokens = incidentNumbersRaw.split(",");
        List<Map<String, Object>> combinedResults = new ArrayList<>();

        for (String token : tokens) {
            String incidentNumber = token.trim();
            if (incidentNumber.isEmpty()) {
                continue;
            }
            List<Map<String, Object>> partial = jdbcManager.espCaseAnalyzerGlobalSearch(espCaseAnalyzerGlobalSearch, incidentNumber);
            if (partial != null && !partial.isEmpty()) {
                combinedResults.addAll(partial);
            }
        }

        return combinedResults;
    }

    public List<Map<String, Object>> getEspCaseAnalyzerMetrics() {
        List<Map<String, Object>> result = jdbcManager.queryForList(espCaseAnalyzerMetrics);
        result.forEach(data -> {
            Object val = data.get("FISCAL_QTR");
            if (val == null) return;

            String fiscalQtr = val.toString();

            if (fiscalQtr.matches("Q\\dFY\\d{4}")) {
                String converted =
                        fiscalQtr.substring(0, 4) +  // Q2FY
                                fiscalQtr.substring(fiscalQtr.length() - 2); // 26

                data.put("FISCAL_QTR", converted);
            }
        });
        return result;
    }

}
