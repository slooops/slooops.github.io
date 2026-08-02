package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;

@Service
public class GLPostingMonitoringService{
    private JdbcManager jdbcManager;
    private String glErrorSummary;
    private String glErrorDetails;
    private String glPostingDetailsFiltered;
    private String glPostingSummaryUpdate;
    private String glInterfaceSummary;
    private String glInterfaceDetails;
    private String glInterfaceDetailsFiltered;
    private String glInterfaceSummaryUpdate;
    private String glFaJobsSummary;
    private String glFaJobsDetails;
    private String glFaJobsDetailsFiltered;
    private String glFaJobsSummaryUpdate;
    private String glUnpostedSummary;
    private String glUnpostedDetails;
    private String glUnpostedDetailsFiltered;
    private String glUnpostedSummaryUpdate;
    @Autowired
    private Common common;
    @Autowired
    private CacheCommon cacheCommon;

    private Boolean useRedisGlPosting = false;


    public GLPostingMonitoringService(JdbcManager jdbcManager, String glErrorSummary, String glErrorDetails,
                                      String glPostingDetailsFiltered, String glPostingSummaryUpdate, String glInterfaceSummary,
                                      String glInterfaceDetails, String glInterfaceDetailsFiltered, String glInterfaceSummaryUpdate,
                                      String glFaJobsSummary, String glFaJobsDetails, String glFaJobsDetailsFiltered, String glFaJobsSummaryUpdate,
                                      String glUnpostedSummary, String glUnpostedDetails, String glUnpostedDetailsFiltered, String glUnpostedSummaryUpdate) {
        this.jdbcManager = jdbcManager;
        this.glErrorSummary = glErrorSummary;
        this.glErrorDetails = glErrorDetails;
        this.glPostingDetailsFiltered = glPostingDetailsFiltered;
        this.glPostingSummaryUpdate = glPostingSummaryUpdate;
        this.glInterfaceSummary = glInterfaceSummary;
        this.glInterfaceDetails = glInterfaceDetails;
        this.glInterfaceDetailsFiltered = glInterfaceDetailsFiltered;
        this.glInterfaceSummaryUpdate = glInterfaceSummaryUpdate;
        this.glFaJobsSummary = glFaJobsSummary;
        this.glFaJobsDetails = glFaJobsDetails;
        this.glFaJobsDetailsFiltered = glFaJobsDetailsFiltered;
        this.glFaJobsSummaryUpdate = glFaJobsSummaryUpdate;
        this.glUnpostedSummary = glUnpostedSummary;
        this.glUnpostedDetails = glUnpostedDetails;
        this.glUnpostedDetailsFiltered = glUnpostedDetailsFiltered;
        this.glUnpostedSummaryUpdate = glUnpostedSummaryUpdate;
    }

    // General Ledger
    public List<Map<String, Object>> getGlErrorSummary() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("GlErrorSummary", glErrorSummary, useRedisGlPosting);
        String[] dateColumns = { "TRANSACTION_DATE", "ASSIGNED_DATE" };
        result.forEach(data -> {
            data.remove("AGING");
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("AGING")) {
                reorderedData.put("AGING", common.calculateAging(data.get("TRANSACTION_DATE")));
            }
            data.clear();
            data.putAll(reorderedData);
        });
        return result;
    }

    public List<Map<String, Object>> getGlErrorDetails() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("GlErrorDetails", glErrorDetails, useRedisGlPosting);
        return result;
    }

    public List<Map<String, Object>> getGlDetailsFilter(String periodName, String applicationName, String processFlow, String ledgerName,
                                                        String glbatch, String transactionDate) {
        List<Map<String, Object>> result = jdbcManager.getGlDetailsFilter(glPostingDetailsFiltered, periodName, applicationName, processFlow, ledgerName,
                glbatch, transactionDate);
        return result;
    }

    public int updateGlErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String assignedBy = updateData.get("username");
        String comments = updateData.get("comments");
        String glBatchName = updateData.get("glBatchName");
        int test = jdbcManager.updateGlErrorsSummaryData(glPostingSummaryUpdate, assignedTo, assignedBy, comments,
                glBatchName);
        refreshGlPostingMonitoringCache();
        return 1;
    }

    public void refreshGlPostingMonitoringCache() {
        Map<String, String> glErrorSummaryMap = Map.of("GlErrorSummary", glErrorSummary);
        Map<String, String> glErrorDetailsMap = Map.of("GlErrorDetails", glErrorDetails);
        if(useRedisGlPosting) {
            System.out.println("refresh from gl posting service");

            cacheCommon.refreshExceptionMonitoringCache(glErrorSummaryMap);
            cacheCommon.refreshExceptionMonitoringCache(glErrorDetailsMap);
        }
    }

    //AIT
    public List<Map<String, Object>> getGlInterfaceErrorSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForListAIT(glInterfaceSummary);
        String[] dateColumns = { "DATE_CREATED" };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGlInterfaceErrorDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForListAIT(glInterfaceDetails);
        String[] dateColumns = { "DATE_CREATED", "ACCOUNTING_DATE", "FIRST_SEEN", "LAST_REFRESHED" };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getAITGlInterfaceDetailsFilter(String userJeSourceName, String ledgerName,
                                                                    String periodName, String batchName,
                                                                    String dateCreated) {
        List<Map<String, Object>> result = jdbcManager.getAITGlInterfaceDetailsFilter(glInterfaceDetailsFiltered, userJeSourceName, ledgerName, periodName, batchName, dateCreated);
        String[] dateColumns = { "DATE_CREATED", "ACCOUNTING_DATE", "FIRST_SEEN", "LAST_REFRESHED" };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }
//
    public int updateAITGlErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String comments = updateData.get("comments");
        String userJeSourceName = updateData.get("userJeSourceName");
        String ledgerName = updateData.get("ledgerName");
        String periodName = updateData.get("periodName");
        String batchName = updateData.get("batchName");
        String reference4 = updateData.get("reference4");
        int test = jdbcManager.AITGlInterfaceSummaryUpdate(glInterfaceSummaryUpdate, assignedTo, comments,
                userJeSourceName, ledgerName, periodName, batchName, reference4);
        refreshGlPostingMonitoringCache();
        return 1;
    }

    public List<Map<String, Object>> getGlFaJobsSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForListAIT(glFaJobsSummary);
        String[] dateColumns = {  };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGlFaDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForListAIT(glFaJobsDetails);
        String[] dateColumns = {};
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGlFaDetailsFilter(String jobDate, String module,
                                                                    String ctmFolder, String ctmStatus) {
        List<Map<String, Object>> result = jdbcManager.getGlFaDetailsFilter(glFaJobsDetailsFiltered, jobDate, module, ctmFolder, ctmStatus);
        String[] dateColumns = { };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updateGlFaErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String comments = updateData.get("comments");
        String jobDate = updateData.get("jobDate");
        String module = updateData.get("module");
        String ctmFolder = updateData.get("ctmFolder");
        String ctmStatus = updateData.get("ctmStatus");
        int test = jdbcManager.glFaSummaryUpdate(glFaJobsSummaryUpdate, assignedTo, comments,
                jobDate, module, ctmFolder, ctmStatus);
        refreshGlPostingMonitoringCache();
        return 1;
    }

    public List<Map<String, Object>> getGlUnpostedSummary() {
        List<Map<String, Object>> result = jdbcManager.queryForListAIT(glUnpostedSummary);
        String[] dateColumns = {  };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGlUnpostedDetails() {
        List<Map<String, Object>> result = jdbcManager.queryForListAIT(glUnpostedDetails);
        String[] dateColumns = {};
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public List<Map<String, Object>> getGlUnpostedDetailsFilter(String userJeSourceName, String ledgerName,
                                                                String periodName, String batchName) {
        List<Map<String, Object>> result = jdbcManager.getAITGlUnpostedDetailsFilter(glUnpostedDetailsFiltered, userJeSourceName, ledgerName, periodName, batchName);
        String[] dateColumns = { };
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }

    public int updateGlUnpostedErrorSummary(Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String comments = updateData.get("comments");
        String userJeSourceName = updateData.get("userJeSourceName");
        String ledgerName = updateData.get("ledgerName");
        String periodName = updateData.get("periodName");
        String batchName = updateData.get("batchName");
        int test = jdbcManager.AITGlUnpostedSummaryUpdate(glUnpostedSummaryUpdate,assignedTo, comments, batchName, userJeSourceName, ledgerName, periodName);
        refreshGlPostingMonitoringCache();
        return 1;
    }
}

