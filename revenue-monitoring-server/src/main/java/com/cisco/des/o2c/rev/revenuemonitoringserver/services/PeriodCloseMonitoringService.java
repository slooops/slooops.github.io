package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PeriodCloseMonitoringService {
    private JdbcManager jdbcManager;
    private String closeInvStats;
    private String closeInterfaceLoad;
    private String closeStartEndTime;
    private String closeVolume;
    private String closeMEStatus;
    private String closeQECashCollected;
    private String dashboardComments;
    private String updateComments;
    private String estimatedCompletionTime;
    private Boolean isQuarterEnd;
    private String periodName;

    @Autowired
    public PeriodCloseMonitoringService(JdbcManager jdbcManager, String closeInvStats,
            String closeInterfaceLoad, String closeStartEndTime, String closeVolume,
            String closeMEStatus, String closeQECashCollected, String dashboardComments,
            String updateComments,
            String estimatedCompletionTime,
            String periodName) {
        this.jdbcManager = jdbcManager;
        this.closeInvStats = closeInvStats;
        this.closeInterfaceLoad = closeInterfaceLoad;
        this.closeStartEndTime = closeStartEndTime;
        this.closeVolume = closeVolume;
        this.closeMEStatus = closeMEStatus;
        this.closeQECashCollected = closeQECashCollected;
        this.dashboardComments = dashboardComments;
        this.updateComments = updateComments;
        this.estimatedCompletionTime = estimatedCompletionTime;
        this.periodName = periodName;
    }

    public List<Map<String, Object>> getCloseInvStats() {
        return jdbcManager.queryForList(closeInvStats);
    }

    public Map<String, List<Map<String, Object>>> getPeriodCloseInterfaceLoad() {
        List<Map<String, Object>> pName = jdbcManager.queryForList(periodName);
        String[] period = pName.get(0).get("PERIOD_NAME").toString().split("-");
        boolean isQuarterEnd = period[0].equals("JAN") || period[0].equals("APR") || period[0].equals("JUL")
                || period[0].equals("OCT");

        List<Map<String, Object>> data = jdbcManager.queryForList(closeInterfaceLoad);

        Map<String, List<Map<String, Object>>> finalResult = new HashMap<>();
        finalResult.put("PRECLOSE", new ArrayList<>());
        finalResult.put("MIDCLOSE", new ArrayList<>());

        Map<String, Map<String, Object>> preCloseResults = new LinkedHashMap<>();
        Map<String, Map<String, Object>> midCloseResults = new LinkedHashMap<>();
        // Track only the LATEST row's percentages per (LINE_TYPE + CLOSE_TYPE).
        // Rows are pre-ordered by period_year, quarter, period_num in the SQL,
        // so each successive put() during the loop overwrites and the final value
        // corresponds to the latest quarter/period for that key. This prevents
        // stale prior-period percentages from leaking into the latest column
        // when the current period's QOQ/YOY (or MOM/PQM) values are NULL.
        Map<String, Map<String, Object>> latestPercentages = new HashMap<>();

        for (Map<String, Object> row : data) {
            String lineType = row.get("LINE_TYPE").toString();
            String closeType = row.get("CLOSE_TYPE").toString(); // "PRECLOSE" or "MIDCLOSE"
            String uniqueKey = lineType + "-" + closeType;

            Map<String, Object> resultMap = closeType.equals("PRECLOSE")
                    ? preCloseResults.computeIfAbsent(uniqueKey, k -> new LinkedHashMap<>())
                    : midCloseResults.computeIfAbsent(uniqueKey, k -> new LinkedHashMap<>());

            resultMap.put("LINE_TYPE", lineType);

            String periodKey = isQuarterEnd ? row.get("QUARTER").toString() : row.get("PERIOD_NAME").toString();
            resultMap.put(periodKey, row.get("LINE_COUNT"));

            // Emit percentage keys unconditionally (null values allowed) so the FE
            // always shows the latest quarter's actual %s, even if they are blank.
            Map<String, Object> latest = new LinkedHashMap<>();
            if (isQuarterEnd) {
                latest.put("QUARTER OVER QUARTER", row.get("QOQ_PERCENTAGE"));
                latest.put("YEAR OVER YEAR", row.get("YOY_PERCENTAGE"));
            } else {
                latest.put("MONTH OVER MONTH", row.get("MOM_PERCENTAGE"));
                latest.put("PRIOR QUARTER MONTH", row.get("PQM_PERCENTAGE"));
            }
            latestPercentages.put(uniqueKey, latest);
        }

        for (Map.Entry<String, Map<String, Object>> entry : preCloseResults.entrySet()) {
            Map<String, Object> latest = latestPercentages.get(entry.getKey());
            if (latest != null) {
                entry.getValue().putAll(latest);
            }
        }

        for (Map.Entry<String, Map<String, Object>> entry : midCloseResults.entrySet()) {
            Map<String, Object> latest = latestPercentages.get(entry.getKey());
            if (latest != null) {
                entry.getValue().putAll(latest);
            }
        }

        finalResult.get("PRECLOSE").addAll(preCloseResults.values());
        finalResult.get("MIDCLOSE").addAll(midCloseResults.values());

        return finalResult;
    }

    public List<Map<String, Object>> getCloseStartEndTime() {
        return jdbcManager.queryForList(closeStartEndTime);
    }

    public List<Map<String, Object>> getCloseVolume() {
        return jdbcManager.queryForList(closeVolume);
    }

    public List<Map<String, Object>> getCloseMEStatus() {
        return jdbcManager.queryForList(closeMEStatus);
    }

    public List<Map<String, Object>> getCloseQECashCollected() {
        return jdbcManager.queryForList(closeQECashCollected);
    }

    public List<Map<String, Object>> getDashboardComments() {
        return jdbcManager.queryForList(dashboardComments);
    }

    public int updateDashboardComments(String comments, String closeType) {
        return jdbcManager.updateComments(updateComments, closeType, comments);
    }

    public List<Map<String, Object>> getEstimatedCompletionTime() {
        List<Map<String, Object>> results = jdbcManager.queryForList(estimatedCompletionTime);

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

        for (Map<String, Object> row : results) {
            Object value = row.get("ESTIMATED_COMPLETION_TIME"); // <-- change key if needed

            if (value instanceof String) {
                OffsetDateTime dateTime = OffsetDateTime.parse((String) value);
                row.put("ESTIMATED_COMPLETION_TIME", dateTime.format(timeFormatter));
            }
        }

        return results;
    }

}
