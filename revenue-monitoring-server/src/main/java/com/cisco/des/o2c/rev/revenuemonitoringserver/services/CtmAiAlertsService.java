package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CtmAiAlertsService {

    private static final Logger log = LoggerFactory.getLogger(CtmAiAlertsService.class);

    private final JdbcManager jdbcManager;

    @Autowired
    public CtmAiAlertsService(JdbcManager jdbcManager) {
        this.jdbcManager = jdbcManager;
    }

    // ─── SQL Query Constants ────────────────────────────────────────────────────

    private static final String ALL_ALERTS = "SELECT " +
            "ID, CTM_JOB_ID, JOB_NAME, APPLICATION, SUB_APPLICATION, " +
            "RETURN_CODE, ALERT_TIME, ALERT_TYPE, STATUS, PRIORITY, " +
            "CATEGORY, ACTIVITY_PHASE, SERVER, ORDER_DATE, " +
            "START_TIME, END_TIME, RUN_TIME_SEC, " +
            "DOWNSTREAM_BLOCKED_COUNT, DOWNSTREAM_BLOCKED_JOBS, JOB_COMMAND " +
            "FROM ARFINRO.CTM_AI_ALERTS " +
            "ORDER BY ALERT_TIME DESC";

    private static final String SUMMARY_COUNTS = "SELECT " +
            "COUNT(*) AS total, " +
            "COUNT(CASE WHEN STATUS = 'PENDING' THEN 1 END) AS pending, " +
            "COUNT(CASE WHEN STATUS = 'RESOLVED' THEN 1 END) AS resolved, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'FAILED' THEN 1 END) AS failed, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'DELAYED' THEN 1 END) AS delayed, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'LATE_START' THEN 1 END) AS late_start, " +
            "COUNT(CASE WHEN PRIORITY = 'P1' THEN 1 END) AS p1, " +
            "COUNT(CASE WHEN PRIORITY = 'P2' THEN 1 END) AS p2, " +
            "COUNT(CASE WHEN PRIORITY = 'P3' THEN 1 END) AS p3, " +
            "COUNT(CASE WHEN PRIORITY = 'P4' THEN 1 END) AS p4 " +
            "FROM ARFINRO.CTM_AI_ALERTS";

    private static final String ALERT_TYPE_DISTRIBUTION = "SELECT " +
            "ALERT_TYPE, " +
            "COUNT(*) AS cnt, " +
            "ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) AS pct " +
            "FROM ARFINRO.CTM_AI_ALERTS " +
            "GROUP BY ALERT_TYPE " +
            "ORDER BY cnt DESC";

    private static final String PRIORITY_DISTRIBUTION = "SELECT " +
            "NVL(PRIORITY, 'None') AS priority_level, " +
            "COUNT(*) AS cnt, " +
            "ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) AS pct " +
            "FROM ARFINRO.CTM_AI_ALERTS " +
            "GROUP BY PRIORITY " +
            "ORDER BY cnt DESC";

    private static final String TOP_DOWNSTREAM_BLOCKED = "SELECT " +
            "JOB_NAME, APPLICATION, DOWNSTREAM_BLOCKED_COUNT, ALERT_TYPE, STATUS " +
            "FROM ARFINRO.CTM_AI_ALERTS " +
            "WHERE DOWNSTREAM_BLOCKED_COUNT IS NOT NULL " +
            "AND DOWNSTREAM_BLOCKED_COUNT > 0 " +
            "ORDER BY DOWNSTREAM_BLOCKED_COUNT DESC " +
            "FETCH FIRST 10 ROWS ONLY";

    private static final String APPLICATION_BREAKDOWN = "SELECT " +
            "APPLICATION, " +
            "COUNT(*) AS total, " +
            "COUNT(CASE WHEN STATUS = 'PENDING' THEN 1 END) AS pending, " +
            "COUNT(CASE WHEN STATUS = 'RESOLVED' THEN 1 END) AS resolved, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'FAILED' THEN 1 END) AS failed, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'DELAYED' THEN 1 END) AS delayed, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'LATE_START' THEN 1 END) AS late_start " +
            "FROM ARFINRO.CTM_AI_ALERTS " +
            "GROUP BY APPLICATION " +
            "ORDER BY total DESC";

    private static final String HOURLY_TREND = "SELECT " +
            "TRUNC(ALERT_TIME, 'HH') AS alert_hour, " +
            "COUNT(*) AS total_alerts, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'FAILED' THEN 1 END) AS failed_count, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'DELAYED' THEN 1 END) AS delayed_count, " +
            "COUNT(CASE WHEN ALERT_TYPE = 'LATE_START' THEN 1 END) AS late_start_count " +
            "FROM ARFINRO.CTM_AI_ALERTS " +
            "GROUP BY TRUNC(ALERT_TIME, 'HH') " +
            "ORDER BY alert_hour DESC";

    // ─── Service methods ────────────────────────────────────────────────────────

    public List<Map<String, Object>> getAllAlerts() {
        log.info("[CTM] getAllAlerts");
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(ALL_ALERTS, Collections.emptyMap());
        log.info("[CTM] getAllAlerts returned {} rows", results.size());
        return results;
    }

    public List<Map<String, Object>> getSummary() {
        log.info("[CTM] getSummary");
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(SUMMARY_COUNTS, Collections.emptyMap());
        log.info("[CTM] getSummary returned {} rows", results.size());
        return results;
    }

    public List<Map<String, Object>> getAlertTypeDistribution() {
        log.info("[CTM] getAlertTypeDistribution");
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(ALERT_TYPE_DISTRIBUTION,
                Collections.emptyMap());
        log.info("[CTM] getAlertTypeDistribution returned {} rows", results.size());
        return results;
    }

    public List<Map<String, Object>> getPriorityDistribution() {
        log.info("[CTM] getPriorityDistribution");
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(PRIORITY_DISTRIBUTION,
                Collections.emptyMap());
        log.info("[CTM] getPriorityDistribution returned {} rows", results.size());
        return results;
    }

    public List<Map<String, Object>> getTopDownstreamBlocked() {
        log.info("[CTM] getTopDownstreamBlocked");
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(TOP_DOWNSTREAM_BLOCKED,
                Collections.emptyMap());
        log.info("[CTM] getTopDownstreamBlocked returned {} rows", results.size());
        return results;
    }

    public List<Map<String, Object>> getApplicationBreakdown() {
        log.info("[CTM] getApplicationBreakdown");
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(APPLICATION_BREAKDOWN,
                Collections.emptyMap());
        log.info("[CTM] getApplicationBreakdown returned {} rows", results.size());
        return results;
    }

    public List<Map<String, Object>> getHourlyTrend() {
        log.info("[CTM] getHourlyTrend");
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(HOURLY_TREND, Collections.emptyMap());
        log.info("[CTM] getHourlyTrend returned {} rows", results.size());
        return results;
    }
}
