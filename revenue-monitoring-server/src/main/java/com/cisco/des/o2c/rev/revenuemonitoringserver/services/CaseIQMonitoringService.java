package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CaseIQMonitoringService {

    private static final Logger log = LoggerFactory.getLogger(CaseIQMonitoringService.class);

    private final JdbcManager jdbcManager;

    @Autowired
    public CaseIQMonitoringService(JdbcManager jdbcManager) {
        this.jdbcManager = jdbcManager;
    }

    // ─── SQL Query Constants ────────────────────────────────────────────────────

    private static final String GHOST_SUCCESS = "SELECT incident_number, team_name, category, core_issue, " +
            "resolution_api_status, caseiq_run_date, " +
            "CASE " +
            "  WHEN context_extracted IS NULL THEN 'MISSING_CONTEXT' " +
            "  WHEN resolution_api_summary IS NULL THEN 'MISSING_SUMMARY' " +
            "  WHEN LENGTH(resolution_api_summary) < 5 THEN 'EMPTY_SUMMARY' " +
            "  ELSE 'BOTH_MISSING' " +
            "END AS anomaly_type " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE resolution_api_status = 'SUCCESS' " +
            "AND is_active = 'TRUE' " +
            "AND (context_extracted IS NULL " +
            "     OR resolution_api_summary IS NULL " +
            "     OR LENGTH(resolution_api_summary) < 5) " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String NULL_RESOLUTION_STATUS = "SELECT incident_number, team_name, category, core_issue, " +
            "case_analyzer_status, llm_summary, " +
            "resolution_api_status, " +
            "caseiq_run_date, created_at " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE resolution_api_status IS NULL " +
            "AND is_active = 'TRUE' " +
            "AND created_at >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY created_at DESC";

    private static final String NOT_DEFINED_SUMMARY = "SELECT incident_number, team_name, category, core_issue, " +
            "resolution_api_status, case_analyzer_status, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE llm_summary = 'Not Defined' " +
            "AND is_active = 'TRUE' " +
            "AND created_at >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String ERROR_WITHOUT_REASON = "SELECT incident_number, team_name, category, core_issue, " +
            "resolution_api_status, resolution_api_summary, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE resolution_api_status = 'ERROR' " +
            "AND is_active = 'TRUE' " +
            "AND (resolution_api_summary IS NULL " +
            "     OR LENGTH(resolution_api_summary) < 10) " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String ERROR_BREAKDOWN = "SELECT team_name, category, core_issue, " +
            "resolution_api_status, " +
            "COUNT(*) AS error_count " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE resolution_api_status IN ('ERROR', 'FAILURE', 'Unknown') " +
            "AND is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY team_name, category, core_issue, resolution_api_status " +
            "ORDER BY error_count DESC";

    private static final String UNKNOWN_STATUS = "SELECT incident_number, team_name, category, core_issue, " +
            "llm_summary, case_analyzer_status, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE resolution_api_status = 'Unknown' " +
            "AND is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String FAILURE_STATUS = "SELECT incident_number, team_name, category, core_issue, " +
            "resolution_api_summary, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE resolution_api_status = 'FAILURE' " +
            "AND is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String EXCEPTION_IN_FIELDS = "SELECT incident_number, team_name, category, core_issue, " +
            "llm_summary, resolution_api_status, caseiq_run_date, " +
            "CASE " +
            "  WHEN UPPER(TRIM(category)) = 'ERROR' THEN 'CATEGORY' " +
            "  WHEN REGEXP_LIKE(core_issue, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') THEN 'CORE_ISSUE' "
            +
            "  WHEN REGEXP_LIKE(llm_summary, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') THEN 'LLM_SUMMARY' "
            +
            "END AS exception_field " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND (UPPER(TRIM(category)) = 'ERROR' " +
            "     OR REGEXP_LIKE(core_issue, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') "
            +
            "     OR REGEXP_LIKE(llm_summary, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i')) "
            +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String STALENESS_CHECK = "SELECT " +
            "MAX(caseiq_run_date) AS last_run, " +
            "ROUND((CAST(SYSDATE AS DATE) - CAST(MAX(caseiq_run_date) AS DATE)) * 24 * 60, 1) AS minutes_since_last_run, "
            +
            "COUNT(*) AS records_last_hour " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE caseiq_run_date >= SYSDATE - 1/24 " +
            "AND is_active = 'TRUE'";

    private static final String NULL_CLASSIFICATION = "SELECT incident_number, team_name, llm_summary, " +
            "case_analyzer_status, resolution_api_status, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND (category IS NULL OR core_issue IS NULL) " +
            "AND case_analyzer_status != 'NEW' " +
            "AND created_at >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String UNKNOWN_TEAM = "SELECT incident_number, impacted_service_offering, category, core_issue, "
            +
            "case_analyzer_status, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE team_name = 'UNKNOWN' " +
            "AND is_active = 'TRUE' " +
            "AND created_at >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String RESOLUTION_STATUS_DISTRIBUTION = "SELECT resolution_api_status, " +
            "COUNT(*) AS cnt, " +
            "ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pct " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY resolution_api_status " +
            "ORDER BY cnt DESC";

    private static final String CASE_ANALYZER_STATUS_DISTRIBUTION = "SELECT case_analyzer_status, " +
            "COUNT(*) AS cnt, " +
            "ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pct " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND created_at >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY case_analyzer_status " +
            "ORDER BY cnt DESC";

    private static final String PROCESSING_TIME_STATS = "SELECT " +
            "team_name, " +
            "COUNT(*) AS total_cases, " +
            "ROUND(AVG((CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 2) AS avg_minutes, " +
            "ROUND(MEDIAN((CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 2) AS median_minutes, " +
            "ROUND(MIN((CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 2) AS min_minutes, " +
            "ROUND(MAX((CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 2) AS max_minutes, " +
            "ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 2) AS p95_minutes, "
            +
            "ROUND(AVG((CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60 * 60), 1) AS avg_seconds, " +
            "ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60 * 60), 1) AS p95_seconds "
            +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND updated_at IS NOT NULL " +
            "AND created_at IS NOT NULL " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY team_name " +
            "ORDER BY avg_minutes DESC";

    private static final String HOURLY_THROUGHPUT = "SELECT " +
            "TRUNC(caseiq_run_date, 'HH') AS run_hour, " +
            "COUNT(*) AS cases_processed, " +
            "COUNT(CASE WHEN resolution_api_status = 'SUCCESS' THEN 1 END) AS success_count, " +
            "COUNT(CASE WHEN resolution_api_status IN ('ERROR', 'FAILURE') THEN 1 END) AS error_count " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY TRUNC(caseiq_run_date, 'HH') " +
            "ORDER BY run_hour DESC";

    private static final String PROCESSING_TIME_BY_STATUS = "SELECT " +
            "resolution_api_status, " +
            "COUNT(*) AS total, " +
            "ROUND(AVG((CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 1) AS avg_minutes, " +
            "ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (CAST(updated_at AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 1) AS p95_minutes "
            +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND updated_at IS NOT NULL AND created_at IS NOT NULL " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY resolution_api_status " +
            "ORDER BY total DESC";

    private static final String TEAM_VOLUME_SUMMARY = "SELECT team_name, " +
            "COUNT(DISTINCT incident_number) AS unique_incidents, " +
            "COUNT(*) AS total_records, " +
            "COUNT(CASE WHEN resolution_api_status IN ('SUCCESS', 'NOT_SUPPORTED', 'PARTIAL SUCCESS') THEN 1 END) AS success, "
            +
            "COUNT(CASE WHEN resolution_api_status = 'PARTIAL SUCCESS' THEN 1 END) AS partial, " +
            "COUNT(CASE WHEN resolution_api_status IN ('ERROR', 'FAILURE') THEN 1 END) AS errors, " +
            "COUNT(CASE WHEN resolution_api_status IS NULL THEN 1 END) AS not_resolved, " +
            "COUNT(CASE WHEN resolution_api_status = 'NOT_SUPPORTED' THEN 1 END) AS not_supported, " +
            "ROUND(COUNT(CASE WHEN resolution_api_status IN ('SUCCESS', 'NOT_SUPPORTED', 'PARTIAL SUCCESS') THEN 1 END) * 100.0 / "
            +
            "      NULLIF(COUNT(*), 0), 1) AS success_rate_pct " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND team_name IS NOT NULL " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY team_name " +
            "ORDER BY unique_incidents DESC";

    private static final String DAILY_TREND = "SELECT " +
            "TRUNC(caseiq_run_date) AS run_date, " +
            "COUNT(*) AS total, " +
            "COUNT(CASE WHEN resolution_api_status = 'SUCCESS' THEN 1 END) AS success, " +
            "COUNT(CASE WHEN resolution_api_status IN ('ERROR','FAILURE') THEN 1 END) AS errors, " +
            "ROUND(COUNT(CASE WHEN resolution_api_status = 'SUCCESS' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) AS success_rate "
            +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_days " +
            "GROUP BY TRUNC(caseiq_run_date) " +
            "ORDER BY run_date DESC";

    private static final String TOP_ERROR_CATEGORIES = "SELECT team_name, category, core_issue, " +
            "COUNT(*) AS error_count, " +
            "ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pct_of_all_errors " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE resolution_api_status IN ('ERROR', 'FAILURE', 'Unknown') " +
            "AND is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY team_name, category, core_issue " +
            "ORDER BY error_count DESC " +
            "FETCH FIRST 20 ROWS ONLY";

    private static final String HEALTH_SCORE = "SELECT " +
            "COUNT(*) AS total_processed, " +
            "COUNT(CASE WHEN resolution_api_status = 'NOT_SUPPORTED' THEN 1 END) AS not_supported_cnt, " +
            "COUNT(CASE WHEN resolution_api_status = 'SUCCESS' THEN 1 END) AS success_cnt, " +
            "COUNT(CASE WHEN resolution_api_status = 'PARTIAL SUCCESS' THEN 1 END) AS partial_cnt, " +
            "COUNT(CASE WHEN resolution_api_status IN ('ERROR','FAILURE') THEN 1 END) AS error_cnt, " +
            "COUNT(CASE WHEN resolution_api_status = 'Unknown' THEN 1 END) AS unknown_cnt, " +
            "COUNT(CASE WHEN resolution_api_status IS NULL THEN 1 END) AS null_status_cnt, " +
            "COUNT(CASE WHEN llm_summary = 'Not Defined' THEN 1 END) AS not_defined_cnt, " +
            "COUNT(CASE WHEN category IS NULL AND case_analyzer_status != 'NEW' THEN 1 END) AS null_category_cnt, " +
            "COUNT(CASE WHEN team_name = 'UNKNOWN' THEN 1 END) AS unknown_team_cnt, " +
            "COUNT(CASE WHEN resolution_api_status = 'SUCCESS' " +
            "AND (context_extracted IS NULL OR resolution_api_summary IS NULL " +
            "OR LENGTH(resolution_api_summary) < 5) THEN 1 END) AS ghost_success_cnt, " +
            "COUNT(CASE WHEN UPPER(TRIM(category)) = 'ERROR' " +
            "OR REGEXP_LIKE(core_issue, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') "
            +
            "OR REGEXP_LIKE(llm_summary, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') "
            +
            "THEN 1 END) AS exception_cnt, " +
            "ROUND((CAST(SYSDATE AS DATE) - CAST(MAX(caseiq_run_date) AS DATE)) * 24 * 60, 1) AS minutes_since_last_run, "
            +
            "ROUND(AVG((CAST(caseiq_run_date AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 2) AS avg_processing_minutes "
            +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24";

    // ─── Fiscal quarter injection ───────────────────────────────────────────────

    private static final Pattern FISC_QTR_INJECT_PATTERN = Pattern.compile("\\s+(GROUP BY|ORDER BY|FETCH)",
            Pattern.CASE_INSENSITIVE);

    private String injectFiscQtr(String sql) {
        Matcher m = FISC_QTR_INJECT_PATTERN.matcher(sql);
        if (m.find()) {
            return sql.substring(0, m.start()) + " AND fisc_qtr = :fisc_qtr " + sql.substring(m.start());
        }
        return sql.strip() + " AND fisc_qtr = :fisc_qtr";
    }

    private List<Map<String, Object>> runQuery(String sql, Map<String, Object> params, String fiscQtr) {
        if (fiscQtr != null && !fiscQtr.isBlank()) {
            sql = injectFiscQtr(sql);
            params.put("fisc_qtr", fiscQtr);
            if (params.containsKey("lookback_hours")) {
                params.put("lookback_hours", 8760);
            }
        }
        log.info("[CaseIQ] runQuery params={} fiscQtr={}", params, fiscQtr);
        log.info("[CaseIQ] runQuery SQL=\n{}", sql);
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(sql, params);
        log.info("[CaseIQ] runQuery returned {} rows", results.size());
        return results;
    }

    private Map<String, Object> buildParams(String key, Object value) {
        Map<String, Object> params = new HashMap<>();
        params.put(key, value);
        return params;
    }

    // ─── Health score computation ───────────────────────────────────────────────

    public Map<String, Object> computeHealthScore(Map<String, Object> data) {
        int total = toInt(data.get("TOTAL_PROCESSED"));
        if (total <= 0) {
            Map<String, Object> result = new LinkedHashMap<>(data);
            result.put("health_score", 0.0);
            result.put("health_status", "NO_DATA");
            result.put("success_rate_pct", 0.0);
            result.put("error_rate_pct", 0.0);
            result.put("anomaly_rate_pct", 0.0);
            return result;
        }

        int notSupported = toInt(data.get("NOT_SUPPORTED_CNT"));
        int success = toInt(data.get("SUCCESS_CNT")) + toInt(data.get("PARTIAL_CNT")) + notSupported;
        int errors = toInt(data.get("ERROR_CNT")) + toInt(data.get("UNKNOWN_CNT"));
        int anomalies = toInt(data.get("NULL_STATUS_CNT"))
                + toInt(data.get("NOT_DEFINED_CNT"))
                + toInt(data.get("NULL_CATEGORY_CNT"))
                + toInt(data.get("UNKNOWN_TEAM_CNT"))
                + toInt(data.get("GHOST_SUCCESS_CNT"))
                + toInt(data.get("EXCEPTION_CNT"));

        double successRate = (double) success / total;
        double errorRate = (double) errors / total;
        double anomalyRate = (double) anomalies / total;
        double stalenessMins = toDouble(data.get("MINUTES_SINCE_LAST_RUN"));

        double score = Math.max(0, (1 - anomalyRate)) * 40
                + Math.max(0, (1 - Math.min(stalenessMins, 65) / 65)) * 30
                + Math.max(0, (1 - errorRate)) * 20
                + successRate * 10;
        score = Math.round(Math.min(100, Math.max(0, score)) * 10.0) / 10.0;

        String status;
        if (score >= 90) {
            status = "HEALTHY";
        } else if (score >= 70) {
            status = "WARNING";
        } else {
            status = "CRITICAL";
        }

        Map<String, Object> result = new LinkedHashMap<>(data);
        result.put("health_score", score);
        result.put("health_status", status);
        result.put("success_rate_pct", Math.round(successRate * 1000.0) / 10.0);
        result.put("error_rate_pct", Math.round(errorRate * 1000.0) / 10.0);
        result.put("anomaly_rate_pct", Math.round(anomalyRate * 1000.0) / 10.0);
        return result;
    }

    private int toInt(Object val) {
        if (val == null)
            return 0;
        if (val instanceof Number)
            return ((Number) val).intValue();
        return 0;
    }

    private double toDouble(Object val) {
        if (val == null)
            return 0.0;
        if (val instanceof Number)
            return ((Number) val).doubleValue();
        return 0.0;
    }

    // ─── Service methods ────────────────────────────────────────────────────────

    public Map<String, Object> getHealthOverview(int lookbackHours, String fiscQtr) {
        List<Map<String, Object>> rows = runQuery(HEALTH_SCORE, buildParams("lookback_hours", lookbackHours), fiscQtr);
        if (rows.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("health_score", 0.0);
            empty.put("health_status", "NO_DATA");
            return empty;
        }
        return computeHealthScore(rows.get(0));
    }

    public List<Map<String, Object>> getGhostSuccess(int lookbackHours, String fiscQtr) {
        return runQuery(GHOST_SUCCESS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getNullStatus(int lookbackHours, String fiscQtr) {
        return runQuery(NULL_RESOLUTION_STATUS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getNotDefined(int lookbackHours, String fiscQtr) {
        return runQuery(NOT_DEFINED_SUMMARY, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getErrorNoReason(int lookbackHours, String fiscQtr) {
        return runQuery(ERROR_WITHOUT_REASON, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getErrorBreakdown(int lookbackHours, String fiscQtr) {
        return runQuery(ERROR_BREAKDOWN, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getUnknownStatus(int lookbackHours, String fiscQtr) {
        return runQuery(UNKNOWN_STATUS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getFailureStatus(int lookbackHours, String fiscQtr) {
        return runQuery(FAILURE_STATUS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getExceptions(int lookbackHours, String fiscQtr) {
        log.info("[CaseIQ] getExceptions called: lookbackHours={}, fiscQtr={}", lookbackHours, fiscQtr);
        List<Map<String, Object>> results = runQuery(EXCEPTION_IN_FIELDS, buildParams("lookback_hours", lookbackHours),
                fiscQtr);
        log.info("[CaseIQ] getExceptions returning {} records", results.size());
        if (!results.isEmpty()) {
            log.info("[CaseIQ] getExceptions first row keys: {}", results.get(0).keySet());
        }
        return results;
    }

    public List<Map<String, Object>> getStaleness() {
        return jdbcManager.queryWithNamedParams(STALENESS_CHECK, Collections.emptyMap());
    }

    public List<Map<String, Object>> getNullClassification(int lookbackHours, String fiscQtr) {
        return runQuery(NULL_CLASSIFICATION, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getUnknownTeam(int lookbackHours, String fiscQtr) {
        return runQuery(UNKNOWN_TEAM, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getResolutionDistribution(int lookbackHours, String fiscQtr) {
        return runQuery(RESOLUTION_STATUS_DISTRIBUTION, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getAnalyzerDistribution(int lookbackHours, String fiscQtr) {
        return runQuery(CASE_ANALYZER_STATUS_DISTRIBUTION, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getProcessingTime(int lookbackHours, String fiscQtr) {
        return runQuery(PROCESSING_TIME_STATS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getThroughput(int lookbackHours, String fiscQtr) {
        return runQuery(HOURLY_THROUGHPUT, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getTimeByStatus(int lookbackHours, String fiscQtr) {
        return runQuery(PROCESSING_TIME_BY_STATUS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getTeamSummary(int lookbackHours, String fiscQtr) {
        return runQuery(TEAM_VOLUME_SUMMARY, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getDailyTrend(int lookbackDays, String fiscQtr) {
        return runQuery(DAILY_TREND, buildParams("lookback_days", lookbackDays), fiscQtr);
    }

    public List<Map<String, Object>> getTopErrors(int lookbackHours, String fiscQtr) {
        return runQuery(TOP_ERROR_CATEGORIES, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }
}
