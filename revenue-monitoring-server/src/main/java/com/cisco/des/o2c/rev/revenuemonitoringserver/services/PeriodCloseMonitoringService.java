package com.cisco.des.o2c.rev.revenuemonitoringserver.services;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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
                                          String periodName
                                        ) {
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
        boolean isQuarterEnd = period[0].equals("JAN") || period[0].equals("APR") || period[0].equals("JUL") || period[0].equals("OCT");

        List<Map<String, Object>> data = jdbcManager.queryForList(closeInterfaceLoad);

        Map<String, List<Map<String, Object>>> finalResult = new HashMap<>();
        finalResult.put("PRECLOSE", new ArrayList<>());
        finalResult.put("MIDCLOSE", new ArrayList<>());

        Map<String, Map<String, Object>> preCloseResults = new LinkedHashMap<>();
        Map<String, Map<String, Object>> midCloseResults = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> percentageBuffer = new HashMap<>();

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

            Map<String, Object> temp = new LinkedHashMap<>();
            if (isQuarterEnd) {
                if (row.get("QOQ_PERCENTAGE") != null) temp.put("QUARTER OVER QUARTER", row.get("QOQ_PERCENTAGE"));
                if (row.get("YOY_PERCENTAGE") != null) temp.put("YEAR OVER YEAR", row.get("YOY_PERCENTAGE"));
            } else {
                if (row.get("MOM_PERCENTAGE") != null) temp.put("MONTH OVER MONTH", row.get("MOM_PERCENTAGE"));
                if (row.get("PQM_PERCENTAGE") != null) temp.put("PRIOR QUARTER MONTH", row.get("PQM_PERCENTAGE"));
            }

            if (!temp.isEmpty()) {
                String percentKey = lineType + "-" + closeType;
                percentageBuffer.computeIfAbsent(percentKey, k -> new ArrayList<>()).add(temp);
            }
        }

        for (Map.Entry<String, Map<String, Object>> entry : preCloseResults.entrySet()) {
            String key = entry.getKey();
            List<Map<String, Object>> percentList = percentageBuffer.getOrDefault(key, Collections.emptyList());
            for (Map<String, Object> percentMap : percentList) {
                for (Map.Entry<String, Object> p : percentMap.entrySet()) {
                    entry.getValue().put(p.getKey(), p.getValue());
                }
            }
        }

        for (Map.Entry<String, Map<String, Object>> entry : midCloseResults.entrySet()) {
            String key = entry.getKey();
            List<Map<String, Object>> percentList = percentageBuffer.getOrDefault(key, Collections.emptyList());
            for (Map<String, Object> percentMap : percentList) {
                for (Map.Entry<String, Object> p : percentMap.entrySet()) {
                    entry.getValue().put(p.getKey(), p.getValue());
                }
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
        return jdbcManager.queryForList(estimatedCompletionTime);
    }


}
