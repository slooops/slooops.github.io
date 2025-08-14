package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.ExcelReader;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class BusinessInsightsMonitoringService {

    private JdbcManager jdbcManager;
    private String issueReportingDash;
    private String issueReportingDashInsert;
    private String issueReportingDashApprove;
    private String issueReportingDashCommentsUpdate;
    private String issueReportingDashFixDetailsUpdate;
    private String issueReportingDashStatusUpdate;
    private String issueReportingDashIssueDescUpdate;
    private String issueReportingDashSummary;
    private String wd0ArMidCloseStatusQuery;
    private String wd0ArMidCloseHeaderDataQuery;
    private String wd0MidcloseActualsProduct;
    private String wd0MidcloseActualsService;
    private String wd0Volumes;
    private String wd0HistoricalDataQuery;
    private String wd0Regression;
    private String wd0CurrentMonth;
    @Autowired
    private Common common;


    public BusinessInsightsMonitoringService(JdbcManager jdbcManager, String issueReportingDash,
                                             String issueReportingDashInsert, String issueReportingDashApprove,
                                             String issueReportingDashCommentsUpdate, String issueReportingDashFixDetailsUpdate,
                                             String issueReportingDashStatusUpdate, String issueReportingDashIssueDescUpdate,
                                             String issueReportingDashSummary, String wd0ArMidCloseStatusQuery,
                                             String wd0ArMidCloseHeaderDataQuery, String wd0HistoricalDataQuery,
                                             String wd0Regression, String wd0CurrentMonth, String wd0Volumes,
                                             String wd0MidcloseActualsProduct, String wd0MidcloseActualsService) {
        this.jdbcManager = jdbcManager;
        this.issueReportingDash = issueReportingDash;
        this.issueReportingDashInsert = issueReportingDashInsert;
        this.issueReportingDashApprove = issueReportingDashApprove;
        this.issueReportingDashCommentsUpdate = issueReportingDashCommentsUpdate;
        this.issueReportingDashFixDetailsUpdate = issueReportingDashFixDetailsUpdate;
        this.issueReportingDashStatusUpdate = issueReportingDashStatusUpdate;
        this.issueReportingDashIssueDescUpdate = issueReportingDashIssueDescUpdate;
        this.issueReportingDashSummary = issueReportingDashSummary;
        this.wd0ArMidCloseStatusQuery = wd0ArMidCloseStatusQuery;
        this.wd0ArMidCloseHeaderDataQuery = wd0ArMidCloseHeaderDataQuery;
        this.wd0MidcloseActualsProduct = wd0MidcloseActualsProduct;
        this.wd0MidcloseActualsService = wd0MidcloseActualsService;
        this.wd0Regression = wd0Regression;
        this.wd0CurrentMonth = wd0CurrentMonth;
        this.wd0HistoricalDataQuery = wd0HistoricalDataQuery;
        this.wd0Volumes = wd0Volumes;
    }

    public List<Map<String, Object>> getIssueReportingData() {
        String[] dateColumns = { "START_DATE", "REPORTED_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(issueReportingDash);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getIssueReportingDataSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForList(issueReportingDashSummary);
        List<Map<String, Object>> finalRes = common.transformForActiveIncidentsSummary(result);
        return finalRes;
    }

    public void insertIssueReportingData(MultipartFile file, String username) throws IOException {
        try {
            List<Map<String, String>> data = ExcelReader.readExcel(file.getInputStream());

            for (Map<String, String> row : data) {
                jdbcManager.insertIssueReport(issueReportingDashInsert, row.get("TRACK"), row.get("ISSUE_DESCRIPTION"), row.get("ROOT_CAUSE"), row.get("BUSINESS_IMPACT"),
                        row.get("FIX_DETAILS"), row.get("INCIDENT_NUMBER"), row.get("ISSUE_STARTED"), row.get("ISSUE_REPORTED_ON"), row.get("ISSUE_REPORTED_BY"),
                        row.get("QUARTER"), row.get("PERIOD_NAME"), row.get("PRIORITY"), row.get("CODE_FIX"), row.get("PDF_REQUIRED"), row.get("BUSINESS_APROVAL"),
                        row.get("IT_APPROVAL"), row.get("APPROVAL_COMMENTS"), row.get("PERIOD_CLOSE_IMPACTING"), row.get("ISSUE_STATUS"), row.get("EOC_INCIDENT"), username);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public int approveRejectIssueReporting(String approval, String approvedBy, String incidentNum) {
        int test = jdbcManager.approveRejectIssueReport(issueReportingDashApprove, approval, approvedBy, incidentNum);
        return test;
    }

    public int updateCommentsIssueReporting(String comments, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateCommentsIssueReport(issueReportingDashCommentsUpdate, comments, approvedBy, incidentNum);
        return test;
    }

    public int updateFixDetailsIssueReporting(String fixDetails, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateFixDetailsIssueReport(issueReportingDashFixDetailsUpdate, fixDetails, approvedBy, incidentNum);
        return test;
    }

    public int updateStatusIssueReporting(String status, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateStatusIssueReport(issueReportingDashStatusUpdate, status, approvedBy, incidentNum);
        return test;
    }

    public int updateIssueDescIssueReporting(String issue, String rootCause, String businessImpact, String approvedBy, String incidentNum) {
        int test = jdbcManager.updateIssueDescIssueReport(issueReportingDashIssueDescUpdate, issue, rootCause, businessImpact, approvedBy, incidentNum);
        return test;
    }

    public void bulkApproveRejectIssueReporting(List<Map<String, Object>> approveData){
        for(Map<String, Object> data: approveData) {
            approveRejectIssueReporting((String)data.get("status"), (String)data.get("approvedBy"), (String)data.get("incidentNumber"));
        }
    }

    public List<Map<String, Object>> getWd0ArMidCloseStatus() {
        return jdbcManager.queryForList(wd0ArMidCloseStatusQuery);
    }

    public List<Map<String, Object>> getWd0ArMidCloseHeaderData() {
        return jdbcManager.queryForList(wd0ArMidCloseHeaderDataQuery);
    }
    public List<Map<String, Object>> getWd0HistoricalData() {
        return jdbcManager.queryForList(wd0HistoricalDataQuery);
    }

    public List<Map<String, Object>> getWd0Regression() {
        return jdbcManager.queryForList(wd0Regression);
    }

    public List<Map<String, Object>> getWd0CurrentMonth() {
        return jdbcManager.queryForList(wd0CurrentMonth);
    }

    public List<Map<String, Object>> getWd0Volumes() {
        return jdbcManager.queryForList(wd0Volumes);
    }

    public List<Map<String, Object>> getWd0MidcloseActualsProduct() {
        return jdbcManager.queryForList(wd0MidcloseActualsProduct);
    }

    public List<Map<String, Object>> getWd0MidcloseActualsService() {
        return jdbcManager.queryForList(wd0MidcloseActualsService);
    }
}
