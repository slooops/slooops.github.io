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
    @Autowired
    private Common common;
    @Autowired
    private CacheCommon cacheCommon;

    public GLPostingMonitoringService(JdbcManager jdbcManager, String glErrorSummary, String glErrorDetails,
                                      String glPostingDetailsFiltered, String glPostingSummaryUpdate) {
        this.jdbcManager = jdbcManager;
        this.glErrorSummary = glErrorSummary;
        this.glErrorDetails = glErrorDetails;
        this.glPostingDetailsFiltered = glPostingDetailsFiltered;
        this.glPostingSummaryUpdate = glPostingSummaryUpdate;
    }

    // General Ledger
    public List<Map<String, Object>> getGlErrorSummary() {
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("GlErrorSummary", glErrorSummary);
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
        List<Map<String, Object>> result = cacheCommon.checkRedisForCachedData("GlErrorDetails", glErrorDetails);
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
        String ledgerName = updateData.get("ledgerName");
        String processFlow = updateData.get("processFlow");
        String applicationName = updateData.get("applicationName");
        String journalSource = updateData.get("journalSource");
        String accountSeg = updateData.get("accountSeg");
        String transactionDate = updateData.get("transactionDate");
        int test = jdbcManager.updateGlErrorsSummaryData(glPostingSummaryUpdate, assignedTo, assignedBy, comments,
                processFlow, ledgerName, applicationName, journalSource, accountSeg, transactionDate);
        return 1;
    }

    public void refreshGlPostingMonitoringCache() {
        Map<String, String> cacheKeyToQueryMap = Map.of(
                "GlErrorSummary", glErrorSummary,
                "GlErrorDetails", glErrorDetails
        );
        System.out.println("refresh from gl posting service");
        cacheCommon.refreshExceptionMonitoringCache(cacheKeyToQueryMap);
    }

}

