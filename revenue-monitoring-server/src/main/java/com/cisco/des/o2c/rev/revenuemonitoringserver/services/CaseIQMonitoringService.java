package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CiscoFiscalCalendar;

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

    private static final String NULL_CLASSIFICATION = "SELECT incident_number, team_name, category, core_issue, " +
            "case_analyzer_status, llm_summary, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE (category IS NULL OR core_issue IS NULL) " +
            "AND case_analyzer_status != 'NEW' " +
            "AND is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String UNKNOWN_TEAM = "SELECT incident_number, impacted_service_offering, category, core_issue, "
            +
            "llm_summary, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE team_name = 'UNKNOWN' " +
            "AND is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "ORDER BY caseiq_run_date DESC";

    private static final String API_RESOLUTION_ERRORS = "SELECT incident_number, team_name, category, core_issue, " +
            "resolution_api_status, caseiq_run_date " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE (resolution_api_status NOT IN ('SUCCESS', 'NOT_SUPPORTED', 'PARTIAL SUCCESS') " +
            "       OR resolution_api_status IS NULL) " +
            "AND is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
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

    // Template — {{QTR_START}} is replaced at runtime with the computed fiscal
    // quarter start date
    private static final String WEEKLY_THROUGHPUT_TEMPLATE = "SELECT " +
            "FLOOR((CAST(caseiq_run_date AS DATE) - DATE '{{QTR_START}}') / 7) AS run_hour, " +
            "COUNT(*) AS cases_processed, " +
            "COUNT(CASE WHEN resolution_api_status = 'SUCCESS' THEN 1 END) AS success_count, " +
            "COUNT(CASE WHEN resolution_api_status IN ('ERROR', 'FAILURE') THEN 1 END) AS error_count " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND fisc_qtr = :fisc_qtr " +
            "GROUP BY FLOOR((CAST(caseiq_run_date AS DATE) - DATE '{{QTR_START}}') / 7) " +
            "ORDER BY run_hour ASC";

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

    private static final String TEAM_VOLUME_SUMMARY = "WITH latest_per_incident AS ( " +
            "  SELECT incident_number, team_name, resolution_api_status, " +
            "    llm_summary, category, core_issue, case_analyzer_status, " +
            "    ROW_NUMBER() OVER (PARTITION BY incident_number ORDER BY caseiq_run_date DESC, ROWID DESC) AS rn " +
            "  FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "  WHERE is_active = 'TRUE' " +
            "  AND team_name IS NOT NULL " +
            "  AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "  {{FISC_QTR_FILTER}}" +
            ") " +
            "SELECT team_name, " +
            "COUNT(*) AS unique_incidents, " +
            "COUNT(*) AS total_records, " +
            "COUNT(CASE WHEN resolution_api_status IN ('SUCCESS', 'NOT_SUPPORTED', 'PARTIAL SUCCESS') THEN 1 END) AS success, "
            +
            "COUNT(CASE WHEN resolution_api_status = 'PARTIAL SUCCESS' THEN 1 END) AS partial, " +
            "COUNT(*) - COUNT(CASE WHEN resolution_api_status IN ('SUCCESS', 'NOT_SUPPORTED', 'PARTIAL SUCCESS') THEN 1 END) AS errors, "
            +
            "COUNT(CASE WHEN resolution_api_status IS NULL THEN 1 END) AS not_resolved, " +
            "COUNT(CASE WHEN resolution_api_status = 'NOT_SUPPORTED' THEN 1 END) AS not_supported, " +
            "COUNT(CASE WHEN llm_summary = 'Not Defined' THEN 1 END) + " +
            "COUNT(CASE WHEN (category IS NULL OR core_issue IS NULL) " +
            "  AND case_analyzer_status != 'NEW' THEN 1 END) AS warnings, " +
            "ROUND(COUNT(CASE WHEN resolution_api_status IN ('SUCCESS', 'NOT_SUPPORTED', 'PARTIAL SUCCESS') THEN 1 END) * 100.0 / "
            +
            "  NULLIF(COUNT(*), 0), 1) AS success_rate_pct " +
            "FROM latest_per_incident " +
            "WHERE rn = 1 " +
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

    private static final String TEAM_ISSUE_MATRIX = "SELECT NVL(a.team_name, 'UNKNOWN') AS team_name, " +
            "COUNT(*) AS total, " +
            "COUNT(CASE WHEN a.resolution_api_status = 'SUCCESS' " +
            "  AND (a.context_extracted IS NULL OR a.resolution_api_summary IS NULL " +
            "       OR LENGTH(a.resolution_api_summary) < 5) THEN 1 END) AS ghost_success, " +
            "COUNT(CASE WHEN a.llm_summary = 'Not Defined' THEN 1 END) AS not_defined, " +
            "COUNT(CASE WHEN (a.category IS NULL OR a.core_issue IS NULL) " +
            "  AND a.case_analyzer_status != 'NEW' THEN 1 END) AS null_classification, " +
            "COUNT(CASE WHEN UPPER(TRIM(a.category)) = 'ERROR' " +
            "  OR REGEXP_LIKE(a.core_issue, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') "
            +
            "  OR REGEXP_LIKE(a.llm_summary, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') "
            +
            "THEN 1 END) AS exceptions, " +
            "COUNT(CASE WHEN a.resolution_api_status NOT IN ('SUCCESS','NOT_SUPPORTED','PARTIAL SUCCESS') " +
            "  OR a.resolution_api_status IS NULL THEN 1 END) AS resolution_failures, " +
            "NVL((SELECT COUNT(*) FROM ARFINRO.XXCASEIQ_ESP_STAGING_TBL s " +
            "  WHERE s.case_analyzer_status = 'AWAITING_RESPONSE_FROM_BOT' " +
            "  AND NVL(s.team_name, 'UNKNOWN') = NVL(a.team_name, 'UNKNOWN') " +
            "  AND (:fisc_qtr IS NULL OR s.fisc_qtr = :fisc_qtr)), 0) AS awaiting_response_from_bot " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL a " +
            "WHERE a.is_active = 'TRUE' " +
            "AND a.caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "GROUP BY NVL(a.team_name, 'UNKNOWN') " +
            "ORDER BY total DESC";

    private static final String ISSUE_TREND_BASE = "SELECT " +
            "TRUNC(caseiq_run_date, 'IW') AS week_start, " +
            "COUNT(*) AS issue_count " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND NVL(team_name, 'UNKNOWN') = :team_name " +
            "AND caseiq_run_date >= SYSDATE - 84 ";
    // Dynamic condition appended per issue type, then GROUP BY / ORDER BY

    // Trend query for AWAITING_RESPONSE_FROM_BOT — lives in staging table
    private static final String AWAITING_BOT_TREND_BASE = "SELECT " +
            "TRUNC(run_date, 'IW') AS week_start, " +
            "COUNT(*) AS issue_count " +
            "FROM ARFINRO.XXCASEIQ_ESP_STAGING_TBL " +
            "WHERE case_analyzer_status = 'AWAITING_RESPONSE_FROM_BOT' " +
            "AND NVL(team_name, 'UNKNOWN') = :team_name " +
            "AND run_date >= SYSDATE - 84 ";

    private static final Map<String, String> ISSUE_CONDITIONS;
    static {
        ISSUE_CONDITIONS = new LinkedHashMap<>();
        ISSUE_CONDITIONS.put("GHOST_SUCCESS",
                "AND resolution_api_status = 'SUCCESS' " +
                        "AND (context_extracted IS NULL OR resolution_api_summary IS NULL " +
                        "     OR LENGTH(resolution_api_summary) < 5) ");
        ISSUE_CONDITIONS.put("NOT_DEFINED",
                "AND llm_summary = 'Not Defined' ");
        ISSUE_CONDITIONS.put("NULL_CLASSIFICATION",
                "AND (category IS NULL OR core_issue IS NULL) " +
                        "AND case_analyzer_status != 'NEW' ");
        ISSUE_CONDITIONS.put("EXCEPTIONS",
                "AND (UPPER(TRIM(category)) = 'ERROR' " +
                        "  OR REGEXP_LIKE(core_issue, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i') "
                        +
                        "  OR REGEXP_LIKE(llm_summary, '(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)', 'i')) ");
        ISSUE_CONDITIONS.put("RESOLUTION_FAILURES",
                "AND (resolution_api_status NOT IN ('SUCCESS','NOT_SUPPORTED','PARTIAL SUCCESS') " +
                        "     OR resolution_api_status IS NULL) ");
        ISSUE_CONDITIONS.put("AWAITING_RESPONSE_FROM_BOT",
                "AND case_analyzer_status = 'AWAITING_RESPONSE_FROM_BOT' ");
    }

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
            "MAX((SELECT COUNT(*) FROM ARFINRO.XXCASEIQ_ESP_STAGING_TBL " +
            "  WHERE case_analyzer_status = 'AWAITING_RESPONSE_FROM_BOT' " +
            "  AND (:fisc_qtr IS NULL OR fisc_qtr = :fisc_qtr))) AS awaiting_bot_cnt, " +
            "ROUND((CAST(SYSDATE AS DATE) - CAST(MAX(caseiq_run_date) AS DATE)) * 24 * 60, 1) AS minutes_since_last_run, "
            +
            "ROUND(AVG((CAST(caseiq_run_date AS DATE) - CAST(created_at AS DATE)) * 24 * 60), 2) AS avg_processing_minutes "
            +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND caseiq_run_date >= SYSDATE - :lookback_hours/24";

    private static final String P90_PROCESSING_TIME = "WITH staging_dedup AS ( " +
            "  SELECT incident_number, impacted_service_offering, " +
            "    created_at, created_on, " +
            "    ROW_NUMBER() OVER ( " +
            "      PARTITION BY incident_number, impacted_service_offering " +
            "      ORDER BY version_number DESC NULLS LAST, created_at DESC " +
            "    ) AS rn " +
            "  FROM ARFINRO.XXCASEIQ_ESP_STAGING_TBL " +
            "  WHERE created_at IS NOT NULL " +
            ") " +
            "SELECT " +
            "  COUNT(*) AS total_records, " +
            "  ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP ( " +
            "    ORDER BY (a.caseiq_run_date - CAST(s.created_at AS DATE)) * 86400 " +
            "  ), 1) AS p90_processing_secs, " +
            "  ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP ( " +
            "    ORDER BY (a.caseiq_run_date - CAST(s.created_on AS DATE)) * 86400 " +
            "  ), 1) AS p90_e2e_secs " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL a " +
            "JOIN staging_dedup s " +
            "  ON a.incident_number = s.incident_number " +
            "  AND a.impacted_service_offering = s.impacted_service_offering " +
            "  AND s.rn = 1 " +
            "WHERE a.caseiq_run_date IS NOT NULL " +
            "AND a.caseiq_run_date >= SYSDATE - :lookback_hours/24 " +
            "AND (:fisc_qtr IS NULL OR a.fisc_qtr = :fisc_qtr)";

    private static final String DISTINCT_QUARTERS = "SELECT DISTINCT fisc_qtr " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE fisc_qtr IS NOT NULL " +
            "ORDER BY SUBSTR(fisc_qtr, 3) ASC, SUBSTR(fisc_qtr, 2, 1) ASC";

    // ─── CaseIQ Analytics Chart Queries ─────────────────────────────────────────

    private static final String WEEKLY_CASE_VOLUME_BY_TEAM = "SELECT " +
            "quarter, team_name, week_number, incident_count " +
            "FROM ARFINRO.ASK_CASEIQ_METRICS_WEEKLY_V " +
            "WHERE quarter = :fisc_qtr " +
            "ORDER BY team_name, week_number";

    private static final String WEEKLY_CASE_VOLUME_BY_STATE = "SELECT " +
            "week_number, SUM(incident_count) AS case_count " +
            "FROM ARFINRO.ASK_CASEIQ_METRICS_WEEKLY_V " +
            "WHERE quarter = :fisc_qtr " +
            "GROUP BY week_number " +
            "ORDER BY week_number ASC";

    private static final String HOURLY_CASE_OPEN_PATTERN = "SELECT " +
            "EXTRACT(HOUR FROM CAST(caseiq_run_date AS TIMESTAMP)) AS hour_of_day, " +
            "COUNT(*) AS case_count " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' " +
            "AND caseiq_run_date > SYSDATE - :lookback_days " +
            "GROUP BY EXTRACT(HOUR FROM CAST(caseiq_run_date AS TIMESTAMP)) " +
            "ORDER BY EXTRACT(HOUR FROM CAST(caseiq_run_date AS TIMESTAMP))";

    private static final String TEAM_CATEGORY_ACCURACY = "SELECT category, " +
            "COUNT(*) AS total, " +
            "SUM(CASE WHEN case_analyzer_status = 'VALIDATED' AND category_match = 'Y' THEN 1 ELSE 0 END) AS correct, "
            +
            "ROUND(SUM(CASE WHEN case_analyzer_status = 'VALIDATED' AND category_match = 'Y' THEN 1 ELSE 0 END) " +
            "  / NULLIF(COUNT(*), 0) * 100, 1) AS accuracy_pct, " +
            "SUM(CASE WHEN case_analyzer_status = 'VALIDATED' THEN 1 ELSE 0 END) AS validated " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE caseiq_run_date > SYSDATE - :lookback_days " +
            "AND team_name = :team_name " +
            "AND category IS NOT NULL " +
            "GROUP BY category " +
            "HAVING COUNT(*) >= 3 " +
            "ORDER BY total DESC " +
            "FETCH FIRST 20 ROWS ONLY";

    private static final String TEAM_CORE_ISSUE_ACCURACY = "SELECT core_issue, " +
            "COUNT(*) AS total, " +
            "SUM(CASE WHEN case_analyzer_status = 'VALIDATED' AND core_issue_match = 'Y' THEN 1 ELSE 0 END) AS correct, "
            +
            "ROUND(SUM(CASE WHEN case_analyzer_status = 'VALIDATED' AND core_issue_match = 'Y' THEN 1 ELSE 0 END) " +
            "  / NULLIF(COUNT(*), 0) * 100, 1) AS accuracy_pct, " +
            "SUM(CASE WHEN case_analyzer_status = 'VALIDATED' THEN 1 ELSE 0 END) AS validated " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE caseiq_run_date > SYSDATE - :lookback_days " +
            "AND team_name = :team_name " +
            "AND core_issue IS NOT NULL " +
            "AND UPPER(core_issue) != 'NA' " +
            "GROUP BY core_issue " +
            "HAVING COUNT(*) >= 3 " +
            "ORDER BY total DESC " +
            "FETCH FIRST 20 ROWS ONLY";

    private static final String ACCURACY_OVER_TIME = "SELECT " +
            "TRUNC(caseiq_run_date, 'IW') AS week_start, " +
            "ROUND(SUM(CASE WHEN category_match = 'Y' THEN 1 ELSE 0 END) * 100.0 " +
            "  / NULLIF(SUM(CASE WHEN category_match IN ('Y','N') THEN 1 ELSE 0 END), 0), 1) AS category_accuracy, " +
            "ROUND(SUM(CASE WHEN core_issue_match = 'Y' THEN 1 ELSE 0 END) * 100.0 " +
            "  / NULLIF(SUM(CASE WHEN core_issue_match IN ('Y','N') THEN 1 ELSE 0 END), 0), 1) AS core_issue_accuracy, "
            +
            "SUM(CASE WHEN category_match IN ('Y','N') THEN 1 ELSE 0 END) AS cat_validated, " +
            "SUM(CASE WHEN core_issue_match IN ('Y','N') THEN 1 ELSE 0 END) AS core_validated " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE caseiq_run_date > SYSDATE - :lookback_days " +
            "GROUP BY TRUNC(caseiq_run_date, 'IW') " +
            "HAVING SUM(CASE WHEN category_match IN ('Y','N') THEN 1 ELSE 0 END) >= 5 " +
            "   OR SUM(CASE WHEN core_issue_match IN ('Y','N') THEN 1 ELSE 0 END) >= 5 " +
            "ORDER BY week_start";

    private static final String TEAM_VALIDATION_ACCURACY_SUMMARY = "SELECT " +
            "team_name, " +
            "fisc_qtr, " +
            "COUNT(*) AS total_cases, " +
            "SUM(CASE WHEN case_analyzer_status = 'VALIDATED' THEN 1 ELSE 0 END) AS validated_cases, " +
            "ROUND(SUM(CASE WHEN case_analyzer_status = 'VALIDATED' THEN 1 ELSE 0 END) * 100.0 " +
            "  / NULLIF(COUNT(*), 0), 1) AS validation_rate, " +
            "ROUND(SUM(CASE WHEN case_analyzer_status = 'VALIDATED' AND category_match = 'Y' THEN 1 ELSE 0 END) * 100.0 "
            +
            "  / NULLIF(SUM(CASE WHEN case_analyzer_status = 'VALIDATED' THEN 1 ELSE 0 END), 0), 1) AS accuracy_rate " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE team_name IS NOT NULL " +
            "AND team_name != 'UNKNOWN' " +
            "AND fisc_qtr IS NOT NULL " +
            "AND caseiq_run_date > SYSDATE - :lookback_days " +
            "GROUP BY team_name, fisc_qtr " +
            "ORDER BY team_name, fisc_qtr";

    // ─── Executive Dashboard: p80/p90 metrics, worknotes churn, coverage gap ───
    // The worknotes and coverage-gap statements below reproduce the definitions
    // of ASK_CASEIQ_WORKNOTES_DATA_V and ASK_CASEIQ_NOT_EXISTS_INC_V (which
    // hardcode FISCAL_QTR = 'Q4FY26') against the base table with a :fisc_qtr
    // bind so the executive contexts follow the quarter dropdown. The p80/p90
    // percentile metrics are pulled directly from the combined DSH_90_80 view,
    // which is already quarter-parameterized.

    // Combined p80/p90 view: response time (import + execution) and MTTR for
    // both percentiles in a single row per team.
    private static final String EXEC_METRICS = "SELECT fiscal_qtr, team_name, incident_count, " +
            "case_iq_execution_time_p80, mttr_80, case_iq_execution_time_p90, mttr_90 " +
            "FROM ARFINRO.ASK_CASEIQ_METRICS_DSH_90_80_V " +
            "WHERE fiscal_qtr = :fisc_qtr " +
            "ORDER BY team_name";

    // Global (all-teams) p80/p90 averages for a fiscal quarter. Minutes columns
    // only; the view exposes _HOUR duplicates that we don't need at the UI layer.
    private static final String AVG_EXEC_METRICS = "SELECT fiscal_qtr, " +
            "avg_execution_time_p80_min, mttr_80_min, " +
            "avg_execution_time_p90_min, mttr_90_min " +
            "FROM ARFINRO.ASK_CASEIQ_METRICS_AVG_EXEC_V " +
            "WHERE fiscal_qtr = :fisc_qtr";

    private static final String EXEC_WORKNOTES_CHURN = "SELECT team_name, work_notes_count, " +
            "  COUNT(incident_number) AS incident_count " +
            "FROM (" +
            "  SELECT team_name, incident_number, " +
            "    CASE WHEN work_notes_count <= 1 THEN 'UPDATED_ONCE' " +
            "         WHEN work_notes_count BETWEEN 2 AND 5 THEN '<5' " +
            "         WHEN work_notes_count BETWEEN 6 AND 10 THEN '<10' " +
            "         WHEN work_notes_count > 10 THEN '>10' END AS work_notes_count " +
            "  FROM (" +
            "    SELECT b.team_name, a.incident_number, COUNT(1) AS work_notes_count " +
            "    FROM ARFINRO.ASK_CASEIQ_WORK_NOTES_DATA a, ARFINRO.ASK_CASE_IQ_DATA_METRICS b " +
            "    WHERE a.incident_number = b.incident_number " +
            "      AND b.fiscal_qtr = :fisc_qtr AND b.exists_case_iq = 'Y' AND b.enabled_flag = 'Y' " +
            "      AND b.routed_ops = 'N' AND b.routed_agent = 'N' AND b.cancelled = '0' " +
            "      AND b.service_incident = 'N' AND b.incident_state IN ('Closed', 'Resolved') " +
            "      AND a.timestamp > (SELECT MAX(c.timestamp) FROM ARFINRO.ASK_CASEIQ_WORK_NOTES_DATA c " +
            "                          WHERE a.incident_number = c.incident_number AND c.resolution_api_flag = 'Y') " +
            "    GROUP BY b.team_name, a.incident_number)) " +
            "GROUP BY team_name, work_notes_count " +
            "ORDER BY team_name, work_notes_count";

    private static final String EXEC_COVERAGE_GAP = "SELECT team_name, COUNT(DISTINCT incident_number) AS incident_count "
            +
            "FROM ARFINRO.ASK_CASE_IQ_DATA_METRICS " +
            "WHERE fiscal_qtr = :fisc_qtr AND exists_case_iq = 'N' AND enabled_flag = 'Y' " +
            "GROUP BY team_name ORDER BY team_name";

    /**
     * Response time by component for a single fiscal quarter.
     *
     * Combines the two datasets the executive charts already use, but
     * quarter-parameterized (the DSH_80/DSH_90 and WORKNOTES views hardcode
     * Q4FY26):
     * - p90 import time / CaseIQ execution time and p60 resolution time (minutes),
     * matching ASK_CASEIQ_METRICS_DSH_90_V.
     * - case-churn buckets (worknote updates after the CaseIQ resolution call),
     * matching ASK_CASEIQ_WORKNOTES_DATA_V. Cases with no post-CaseIQ worknote
     * (or a single one) count as auto resolved.
     */
    private static final String EXEC_RESPONSE_TIME_BY_TEAM = "WITH metrics AS (" +
            "  SELECT team_name, " +
            "    ROUND((caseiq_import_date - DECODE(routed_in, 'Y', routed_in_date, opened_at)) * 1440, 1) AS import_time, "
            +
            "    ROUND((caseiq_executed_date - caseiq_import_date) * 1440, 1) AS exec_time, " +
            "    ROUND((resolved_at - opened_at) * 1440, 1) AS resolution_time " +
            "  FROM ARFINRO.ASK_CASE_IQ_DATA_METRICS " +
            "  WHERE fiscal_qtr = :fisc_qtr AND exists_case_iq = 'Y' AND enabled_flag = 'Y'" +
            "), " +
            "times AS (" +
            "  SELECT team_name, COUNT(1) AS incident_count, " +
            "    ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY import_time), 2) AS import_time, " +
            "    ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY exec_time), 2) AS execution_time, " +
            "    ROUND(PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY resolution_time), 2) AS resolution_time " +
            "  FROM metrics WHERE import_time BETWEEN -500 AND 500 " +
            "  GROUP BY team_name" +
            "), " +
            "churn_base AS (" +
            "  SELECT b.team_name, " +
            "    (SELECT COUNT(1) FROM ARFINRO.ASK_CASEIQ_WORK_NOTES_DATA a " +
            "      WHERE a.incident_number = b.incident_number " +
            "        AND a.timestamp > (SELECT MAX(c.timestamp) FROM ARFINRO.ASK_CASEIQ_WORK_NOTES_DATA c " +
            "                            WHERE c.incident_number = b.incident_number " +
            "                              AND c.resolution_api_flag = 'Y')) AS note_count " +
            "  FROM ARFINRO.ASK_CASE_IQ_DATA_METRICS b " +
            "  WHERE b.fiscal_qtr = :fisc_qtr AND b.exists_case_iq = 'Y' AND b.enabled_flag = 'Y' " +
            "    AND b.routed_ops = 'N' AND b.routed_agent = 'N' AND b.cancelled = '0' " +
            "    AND b.service_incident = 'N' AND b.incident_state IN ('Closed', 'Resolved')" +
            "), " +
            "churn AS (" +
            "  SELECT team_name, " +
            "    COUNT(CASE WHEN NVL(note_count, 0) <= 1 THEN 1 END) AS auto_resolved, " +
            "    COUNT(CASE WHEN note_count BETWEEN 2 AND 5 THEN 1 END) AS touched_lt_5, " +
            "    COUNT(CASE WHEN note_count BETWEEN 6 AND 10 THEN 1 END) AS touched_lt_10, " +
            "    COUNT(CASE WHEN note_count > 10 THEN 1 END) AS touched_gt_10 " +
            "  FROM churn_base GROUP BY team_name" +
            ") " +
            "SELECT t.team_name, t.incident_count, t.import_time, t.execution_time, t.resolution_time, " +
            "  NVL(c.auto_resolved, 0) AS auto_resolved, NVL(c.touched_lt_5, 0) AS touched_lt_5, " +
            "  NVL(c.touched_lt_10, 0) AS touched_lt_10, NVL(c.touched_gt_10, 0) AS touched_gt_10 " +
            "FROM times t LEFT JOIN churn c ON c.team_name = t.team_name " +
            "ORDER BY t.team_name";

    /**
     * Same shape as {@link #EXEC_RESPONSE_TIME_BY_TEAM} but broken out by
     * core issue for a single component. Backs the response time drilldown
     * modal, which only fetches when opened (279 core issues across the seven
     * components).
     */
    private static final String EXEC_RESPONSE_TIME_BY_CORE_ISSUE = "WITH metrics AS (" +
            "  SELECT NVL(core_issue_text, 'Unclassified') AS core_issue, " +
            "    ROUND((caseiq_import_date - DECODE(routed_in, 'Y', routed_in_date, opened_at)) * 1440, 1) AS import_time, "
            +
            "    ROUND((caseiq_executed_date - caseiq_import_date) * 1440, 1) AS exec_time, " +
            "    ROUND((resolved_at - opened_at) * 1440, 1) AS resolution_time " +
            "  FROM ARFINRO.ASK_CASE_IQ_DATA_METRICS " +
            "  WHERE fiscal_qtr = :fisc_qtr AND team_name = :team_name " +
            "    AND exists_case_iq = 'Y' AND enabled_flag = 'Y'" +
            "), " +
            "times AS (" +
            "  SELECT core_issue, COUNT(1) AS incident_count, " +
            "    ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY import_time), 2) AS import_time, " +
            "    ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY exec_time), 2) AS execution_time, " +
            "    ROUND(PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY resolution_time), 2) AS resolution_time " +
            "  FROM metrics WHERE import_time BETWEEN -500 AND 500 " +
            "  GROUP BY core_issue" +
            "), " +
            "churn_base AS (" +
            "  SELECT NVL(b.core_issue_text, 'Unclassified') AS core_issue, " +
            "    (SELECT COUNT(1) FROM ARFINRO.ASK_CASEIQ_WORK_NOTES_DATA a " +
            "      WHERE a.incident_number = b.incident_number " +
            "        AND a.timestamp > (SELECT MAX(c.timestamp) FROM ARFINRO.ASK_CASEIQ_WORK_NOTES_DATA c " +
            "                            WHERE c.incident_number = b.incident_number " +
            "                              AND c.resolution_api_flag = 'Y')) AS note_count " +
            "  FROM ARFINRO.ASK_CASE_IQ_DATA_METRICS b " +
            "  WHERE b.fiscal_qtr = :fisc_qtr AND b.team_name = :team_name " +
            "    AND b.exists_case_iq = 'Y' AND b.enabled_flag = 'Y' " +
            "    AND b.routed_ops = 'N' AND b.routed_agent = 'N' AND b.cancelled = '0' " +
            "    AND b.service_incident = 'N' AND b.incident_state IN ('Closed', 'Resolved')" +
            "), " +
            "churn AS (" +
            "  SELECT core_issue, " +
            "    COUNT(CASE WHEN NVL(note_count, 0) <= 1 THEN 1 END) AS auto_resolved, " +
            "    COUNT(CASE WHEN note_count BETWEEN 2 AND 5 THEN 1 END) AS touched_lt_5, " +
            "    COUNT(CASE WHEN note_count BETWEEN 6 AND 10 THEN 1 END) AS touched_lt_10, " +
            "    COUNT(CASE WHEN note_count > 10 THEN 1 END) AS touched_gt_10 " +
            "  FROM churn_base GROUP BY core_issue" +
            ") " +
            "SELECT t.core_issue, t.incident_count, t.import_time, t.execution_time, t.resolution_time, " +
            "  NVL(c.auto_resolved, 0) AS auto_resolved, NVL(c.touched_lt_5, 0) AS touched_lt_5, " +
            "  NVL(c.touched_lt_10, 0) AS touched_lt_10, NVL(c.touched_gt_10, 0) AS touched_gt_10 " +
            "FROM times t LEFT JOIN churn c ON c.core_issue = t.core_issue " +
            "ORDER BY t.incident_count DESC, t.core_issue";

    private static final String AUTO_RESOLVE_METRICS = "SELECT team_name, case_count AS incident_count, " +
            "import_time, case_iq_execution_time AS execution_time, resolution_time " +
            "FROM ARFINRO.ASK_CASEIQ_AUTO_RESOLVE_METRICS_V " +
            "WHERE fiscal_qtr = :fisc_qtr " +
            "ORDER BY team_name";

    private static final String NOT_INTERFACED_BY_TEAM = "SELECT team_name, kafka_miss, " +
            "awaiting_bot_response, technical_issue " +
            "FROM ARFINRO.ASK_CASEIQ_NOT_INTERFACED_V " +
            "WHERE fiscal_qtr = :fisc_qtr " +
            "ORDER BY team_name";

    private static final String RESOLUTION_STATUS_BY_TEAM = "SELECT team_name, " +
            "COUNT(DISTINCT core_issue) AS core_issue_count, " +
            "SUM(success) AS success, SUM(not_supported) AS not_supported, " +
            "SUM(error) AS error, SUM(warning) AS warning, SUM(unknown) AS unknown " +
            "FROM ARFINRO.ASK_CASEIQ_RESOLUTION_STATUS_V " +
            "WHERE fiscal_qtr = :fisc_qtr " +
            "GROUP BY team_name " +
            "ORDER BY team_name";

    private static final String RESOLUTION_STATUS_BY_CORE_ISSUE = "SELECT core_issue, success, " +
            "not_supported, error, warning, unknown " +
            "FROM ARFINRO.ASK_CASEIQ_RESOLUTION_STATUS_V " +
            "WHERE fiscal_qtr = :fisc_qtr AND team_name = :team_name " +
            "ORDER BY (success + not_supported + error + warning + unknown) DESC, core_issue";

    // ─── Fiscal quarter injection ───────────────────────────────────────────────

    private static final Pattern FISC_QTR_INJECT_PATTERN = Pattern.compile("\\s+(GROUP BY|ORDER BY|FETCH)",
            Pattern.CASE_INSENSITIVE);

    /**
     * Matches date-lookback conditions that should be removed when a fiscal quarter
     * is selected.
     */
    private static final Pattern DATE_LOOKBACK_PATTERN = Pattern.compile(
            "AND\\s+(?:a\\.)?(?:caseiq_run_date|created_at|run_date)\\s*>=\\s*SYSDATE\\s*-\\s*:lookback_hours/24\\s*"
                    + "|" +
                    "WHERE\\s+(?:opened_at|caseiq_run_date)\\s*>\\s*SYSDATE\\s*-\\s*:lookback_days\\s+AND\\s+"
                    + "|" +
                    "AND\\s+(?:opened_at|caseiq_run_date)\\s*>\\s*SYSDATE\\s*-\\s*:lookback_days\\s*",
            Pattern.CASE_INSENSITIVE);

    /**
     * When the lookback condition is the first WHERE clause (WHERE opened_at > ...
     * AND ...),
     * the replacement consumes the trailing AND so the next condition becomes the
     * WHERE clause.
     * The replacement injects "WHERE " to keep the SQL valid.
     */
    private String stripDateLookback(String sql) {
        Matcher m = DATE_LOOKBACK_PATTERN.matcher(sql);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String matched = m.group();
            // If we matched "WHERE opened_at ... AND ", replace with "WHERE "
            if (matched.trim().toUpperCase().startsWith("WHERE")) {
                m.appendReplacement(sb, "WHERE ");
            } else {
                m.appendReplacement(sb, "");
            }
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private String injectFiscQtr(String sql) {
        Matcher m = FISC_QTR_INJECT_PATTERN.matcher(sql);
        if (m.find()) {
            return sql.substring(0, m.start()) + " AND fisc_qtr = :fisc_qtr " + sql.substring(m.start());
        }
        return sql.strip() + " AND fisc_qtr = :fisc_qtr";
    }

    private List<Map<String, Object>> runQuery(String sql, Map<String, Object> params, String fiscQtr) {
        // Always bind fisc_qtr (null when not selected) so staging subqueries can
        // reference it
        params.put("fisc_qtr", (fiscQtr != null && !fiscQtr.isBlank()) ? fiscQtr : null);
        if (fiscQtr != null && !fiscQtr.isBlank()) {
            sql = stripDateLookback(sql);
            sql = injectFiscQtr(sql);
            params.remove("lookback_hours");
            params.remove("lookback_days");
        }
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(sql, params);
        return results;
    }

    private Map<String, Object> buildParams(String key, Object value) {
        Map<String, Object> params = new HashMap<>();
        params.put(key, value);
        return params;
    }

    // ─── Health score computation ───────────────────────────────────────────────

    public Map<String, Object> computeHealthScore(Map<String, Object> data, boolean includeStaleness) {
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
                + toInt(data.get("EXCEPTION_CNT"))
                + toInt(data.get("AWAITING_BOT_CNT"));

        double successRate = (double) success / total;
        double errorRate = (double) errors / total;
        double anomalyRate = (double) anomalies / total;

        double score;
        if (includeStaleness) {
            // Live view: anomaly(40) + freshness(30) + error(20) + success(10)
            double stalenessMins = toDouble(data.get("MINUTES_SINCE_LAST_RUN"));
            score = Math.max(0, (1 - anomalyRate)) * 40
                    + Math.max(0, (1 - Math.min(stalenessMins, 65) / 65)) * 30
                    + Math.max(0, (1 - errorRate)) * 20
                    + successRate * 10;
        } else {
            // Historical quarter: re-weight without staleness (4:2:1 ratio →
            // 57.14:28.57:14.29)
            score = Math.max(0, (1 - anomalyRate)) * (400.0 / 7)
                    + Math.max(0, (1 - errorRate)) * (200.0 / 7)
                    + successRate * (100.0 / 7);
        }
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

    /**
     * Sanitizes user-controlled input before logging to prevent log injection.
     * Strips newlines, carriage returns, tabs, and truncates to a safe length.
     */
    private static String sanitizeForLog(String input) {
        if (input == null)
            return "null";
        return input.replaceAll("[\\r\\n\\t]", "_").substring(0, Math.min(input.length(), 100));
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
        boolean includeStaleness = fiscQtr == null || fiscQtr.isBlank();
        return computeHealthScore(rows.get(0), includeStaleness);
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
        return runQuery(EXCEPTION_IN_FIELDS, buildParams("lookback_hours", lookbackHours), fiscQtr);
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

    public List<Map<String, Object>> getApiResolutionErrors(int lookbackHours, String fiscQtr) {
        return runQuery(API_RESOLUTION_ERRORS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public Map<String, Object> getP90ProcessingTime(int lookbackHours, String fiscQtr) {
        String sql = P90_PROCESSING_TIME;
        Map<String, Object> params = new HashMap<>();
        params.put("fisc_qtr", fiscQtr);
        if (fiscQtr != null && !fiscQtr.isBlank()) {
            sql = stripDateLookback(sql);
        } else {
            params.put("lookback_hours", lookbackHours);
        }
        List<Map<String, Object>> rows = jdbcManager.queryWithNamedParams(sql, params);
        if (rows.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("TOTAL_RECORDS", 0);
            empty.put("P90_PROCESSING_SECS", 0.0);
            empty.put("P90_E2E_SECS", 0.0);
            return empty;
        }
        return rows.get(0);
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
        if (fiscQtr != null && !fiscQtr.isBlank()) {
            LocalDate qtrStart = CiscoFiscalCalendar.quarterStartFromString(fiscQtr);
            LocalDate qtrEnd = CiscoFiscalCalendar.quarterEndFromString(fiscQtr);
            // Inline the date literal — value is computed internally, not from user input
            String sql = WEEKLY_THROUGHPUT_TEMPLATE.replace("{{QTR_START}}", qtrStart.toString());
            Map<String, Object> params = new HashMap<>();
            params.put("fisc_qtr", fiscQtr);
            try {
                List<Map<String, Object>> sparse = jdbcManager.queryWithNamedParams(sql, params);

                // Gap-fill: all weeks in the quarter with zeros where no throughput
                LocalDate today = LocalDate.now();
                LocalDate effectiveEnd = today.isBefore(qtrEnd) ? today : qtrEnd;
                int totalWeeks = (int) ((effectiveEnd.toEpochDay() - qtrStart.toEpochDay()) / 7) + 1;

                Map<Integer, Map<String, Object>> weekData = new HashMap<>();
                for (Map<String, Object> row : sparse) {
                    int week = ((Number) row.get("RUN_HOUR")).intValue();
                    if (week >= 0 && week < totalWeeks) {
                        weekData.put(week, row);
                    }
                }

                List<Map<String, Object>> dense = new ArrayList<>();
                for (int w = 0; w < totalWeeks; w++) {
                    if (weekData.containsKey(w)) {
                        dense.add(weekData.get(w));
                    } else {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("RUN_HOUR", w);
                        row.put("CASES_PROCESSED", 0);
                        row.put("SUCCESS_COUNT", 0);
                        row.put("ERROR_COUNT", 0);
                        dense.add(row);
                    }
                }
                return dense;
            } catch (Exception e) {
                log.error("[CaseIQ] getThroughput FAILED for fiscQtr={}: {}", sanitizeForLog(fiscQtr), e.getMessage());
                throw e;
            }
        }
        return runQuery(HOURLY_THROUGHPUT, buildParams("lookback_hours", lookbackHours), null);
    }

    public List<Map<String, Object>> getTimeByStatus(int lookbackHours, String fiscQtr) {
        return runQuery(PROCESSING_TIME_BY_STATUS, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getTeamSummary(int lookbackHours, String fiscQtr) {
        Map<String, Object> params = new HashMap<>();
        String sql = TEAM_VOLUME_SUMMARY;
        if (fiscQtr != null && !fiscQtr.isBlank()) {
            sql = stripDateLookback(sql);
            sql = sql.replace("{{FISC_QTR_FILTER}}", "AND fisc_qtr = :fisc_qtr ");
            params.put("fisc_qtr", fiscQtr);
        } else {
            sql = sql.replace("{{FISC_QTR_FILTER}}", "");
            params.put("lookback_hours", lookbackHours);
        }
        List<Map<String, Object>> results = jdbcManager.queryWithNamedParams(sql, params);
        return results;
    }

    public List<Map<String, Object>> getDailyTrend(int lookbackDays, String fiscQtr) {
        return runQuery(DAILY_TREND, buildParams("lookback_days", lookbackDays), fiscQtr);
    }

    public List<Map<String, Object>> getTopErrors(int lookbackHours, String fiscQtr) {
        return runQuery(TOP_ERROR_CATEGORIES, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getTeamIssueMatrix(int lookbackHours, String fiscQtr) {
        return runQuery(TEAM_ISSUE_MATRIX, buildParams("lookback_hours", lookbackHours), fiscQtr);
    }

    public List<Map<String, Object>> getIssueTrend(String teamName, String issueType, String fiscQtr) {
        String condition = ISSUE_CONDITIONS.get(issueType);
        if (condition == null) {
            log.warn("[CaseIQ] Unknown issue type: {}", sanitizeForLog(issueType));
            return Collections.emptyList();
        }

        Map<String, Object> params = new HashMap<>();
        params.put("team_name", teamName);
        String sql;

        // AWAITING_RESPONSE_FROM_BOT lives in the staging table — special path
        if ("AWAITING_RESPONSE_FROM_BOT".equals(issueType)) {
            return getAwaitingBotTrend(teamName, fiscQtr);
        }

        if (fiscQtr != null && !fiscQtr.isBlank()) {
            // Use fiscal-calendar-aware weekly grouping
            LocalDate qtrStart = CiscoFiscalCalendar.quarterStartFromString(fiscQtr);
            LocalDate qtrEnd = CiscoFiscalCalendar.quarterEndFromString(fiscQtr);
            String dateLiteral = qtrStart.toString(); // YYYY-MM-DD
            sql = "SELECT " +
                    "FLOOR((CAST(caseiq_run_date AS DATE) - DATE '" + dateLiteral + "') / 7) AS week_start, " +
                    "COUNT(*) AS issue_count " +
                    "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                    "WHERE is_active = 'TRUE' " +
                    "AND NVL(team_name, 'UNKNOWN') = :team_name " +
                    "AND fisc_qtr = :fisc_qtr " +
                    condition +
                    "GROUP BY FLOOR((CAST(caseiq_run_date AS DATE) - DATE '" + dateLiteral + "') / 7) " +
                    "ORDER BY week_start";
            params.put("fisc_qtr", fiscQtr);

            List<Map<String, Object>> sparse = jdbcManager.queryWithNamedParams(sql, params);

            // Gap-fill: show all weeks in the quarter, zeros where no issues exist
            LocalDate today = LocalDate.now();
            LocalDate effectiveEnd = today.isBefore(qtrEnd) ? today : qtrEnd;
            int totalWeeks = (int) ((effectiveEnd.toEpochDay() - qtrStart.toEpochDay()) / 7) + 1;

            Map<Integer, Integer> weekCounts = new HashMap<>();
            for (Map<String, Object> row : sparse) {
                int week = ((Number) row.get("WEEK_START")).intValue();
                int count = ((Number) row.get("ISSUE_COUNT")).intValue();
                if (week >= 0 && week < totalWeeks) {
                    weekCounts.put(week, count);
                }
            }

            List<Map<String, Object>> dense = new ArrayList<>();
            for (int w = 0; w < totalWeeks; w++) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("WEEK_START", w);
                row.put("ISSUE_COUNT", weekCounts.getOrDefault(w, 0));
                dense.add(row);
            }
            return dense;
        } else {
            sql = ISSUE_TREND_BASE + condition +
                    "GROUP BY TRUNC(caseiq_run_date, 'IW') " +
                    "ORDER BY week_start";

            List<Map<String, Object>> sparse = jdbcManager.queryWithNamedParams(sql, params);

            // Gap-fill: 12 ISO weeks from SYSDATE-84 to now
            LocalDate today = LocalDate.now();
            LocalDate windowStart = today.minusDays(84);
            // Align to Monday (ISO week start)
            LocalDate firstMonday = windowStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

            // Build a lookup from date string → count
            Map<String, Integer> weekCounts = new LinkedHashMap<>();
            for (Map<String, Object> row : sparse) {
                Object ws = row.get("WEEK_START");
                LocalDate weekDate;
                if (ws instanceof java.sql.Timestamp) {
                    weekDate = ((java.sql.Timestamp) ws).toLocalDateTime().toLocalDate();
                } else if (ws instanceof java.sql.Date) {
                    weekDate = ((java.sql.Date) ws).toLocalDate();
                } else {
                    weekDate = LocalDate.parse(ws.toString().substring(0, 10));
                }
                int count = ((Number) row.get("ISSUE_COUNT")).intValue();
                weekCounts.put(weekDate.toString(), count);
            }

            List<Map<String, Object>> dense = new ArrayList<>();
            LocalDate cursor = firstMonday;
            LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            while (!cursor.isAfter(currentMonday)) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("WEEK_START", cursor.toString()); // ISO date string for frontend
                row.put("ISSUE_COUNT", weekCounts.getOrDefault(cursor.toString(), 0));
                dense.add(row);
                cursor = cursor.plusWeeks(1);
            }
            return dense;
        }
    }

    private List<Map<String, Object>> getAwaitingBotTrend(String teamName, String fiscQtr) {
        Map<String, Object> params = new HashMap<>();
        params.put("team_name", teamName);
        List<Map<String, Object>> sparse;

        if (fiscQtr != null && !fiscQtr.isBlank()) {
            LocalDate qtrStart = CiscoFiscalCalendar.quarterStartFromString(fiscQtr);
            LocalDate qtrEnd = CiscoFiscalCalendar.quarterEndFromString(fiscQtr);
            String dateLiteral = qtrStart.toString();
            String sql = "SELECT " +
                    "FLOOR((CAST(run_date AS DATE) - DATE '" + dateLiteral + "') / 7) AS week_start, " +
                    "COUNT(*) AS issue_count " +
                    "FROM ARFINRO.XXCASEIQ_ESP_STAGING_TBL " +
                    "WHERE case_analyzer_status = 'AWAITING_RESPONSE_FROM_BOT' " +
                    "AND NVL(team_name, 'UNKNOWN') = :team_name " +
                    "AND fisc_qtr = :fisc_qtr " +
                    "GROUP BY FLOOR((CAST(run_date AS DATE) - DATE '" + dateLiteral + "') / 7) " +
                    "ORDER BY week_start";
            params.put("fisc_qtr", fiscQtr);
            sparse = jdbcManager.queryWithNamedParams(sql, params);

            LocalDate today = LocalDate.now();
            LocalDate effectiveEnd = today.isBefore(qtrEnd) ? today : qtrEnd;
            int totalWeeks = (int) ((effectiveEnd.toEpochDay() - qtrStart.toEpochDay()) / 7) + 1;

            Map<Integer, Integer> weekCounts = new HashMap<>();
            for (Map<String, Object> row : sparse) {
                int week = ((Number) row.get("WEEK_START")).intValue();
                int count = ((Number) row.get("ISSUE_COUNT")).intValue();
                if (week >= 0 && week < totalWeeks)
                    weekCounts.put(week, count);
            }

            List<Map<String, Object>> dense = new ArrayList<>();
            for (int w = 0; w < totalWeeks; w++) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("WEEK_START", w);
                row.put("ISSUE_COUNT", weekCounts.getOrDefault(w, 0));
                dense.add(row);
            }
            return dense;
        } else {
            String sql = AWAITING_BOT_TREND_BASE +
                    "GROUP BY TRUNC(run_date, 'IW') " +
                    "ORDER BY week_start";
            sparse = jdbcManager.queryWithNamedParams(sql, params);

            LocalDate today = LocalDate.now();
            LocalDate windowStart = today.minusDays(84);
            LocalDate firstMonday = windowStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

            Map<String, Integer> weekCounts = new LinkedHashMap<>();
            for (Map<String, Object> row : sparse) {
                Object ws = row.get("WEEK_START");
                LocalDate weekDate;
                if (ws instanceof java.sql.Timestamp) {
                    weekDate = ((java.sql.Timestamp) ws).toLocalDateTime().toLocalDate();
                } else if (ws instanceof java.sql.Date) {
                    weekDate = ((java.sql.Date) ws).toLocalDate();
                } else {
                    continue;
                }
                weekCounts.put(weekDate.toString(), ((Number) row.get("ISSUE_COUNT")).intValue());
            }

            List<Map<String, Object>> dense = new ArrayList<>();
            LocalDate cursor = firstMonday;
            LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            while (!cursor.isAfter(currentMonday)) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("WEEK_START", cursor.toString());
                row.put("ISSUE_COUNT", weekCounts.getOrDefault(cursor.toString(), 0));
                dense.add(row);
                cursor = cursor.plusWeeks(1);
            }
            return dense;
        }
    }

    // ─── Paginated Error Incidents (UNION ALL of all anomaly types) ─────────────

    private static final String EXCEPTION_REGEX = "(Error in analysis|Exception in analysis|Traceback|\\w+(Error|Exception)\\b)";

    public Map<String, Object> getErrorIncidentsPaged(int lookbackHours, String fiscQtr,
            String team, String issueType, int page, int pageSize) {

        Map<String, Object> params = new HashMap<>();
        String fiscFilter = "";
        boolean hasQuarter = fiscQtr != null && !fiscQtr.isBlank();

        if (hasQuarter) {
            fiscFilter = "AND fisc_qtr = :fisc_qtr ";
            params.put("fisc_qtr", fiscQtr);
        }
        if (!hasQuarter) {
            params.put("lookback_hours", lookbackHours);
        }

        String union =
                // Ghost Success
                "SELECT incident_number, team_name, category, core_issue, llm_summary, caseiq_run_date, " +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'Ghost Success' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                        "WHERE resolution_api_status = 'SUCCESS' AND is_active = 'TRUE' " +
                        "AND (context_extracted IS NULL OR resolution_api_summary IS NULL OR LENGTH(resolution_api_summary) < 5) "
                        +
                        "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " + fiscFilter +

                        "UNION ALL " +

                        // Not Defined
                        "SELECT incident_number, team_name, category, core_issue, llm_summary, caseiq_run_date, " +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'Not Defined' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                        "WHERE llm_summary = 'Not Defined' AND is_active = 'TRUE' " +
                        "AND created_at >= SYSDATE - :lookback_hours/24 " + fiscFilter +

                        "UNION ALL " +

                        // No Resolution
                        "SELECT incident_number, team_name, category, core_issue, llm_summary, caseiq_run_date, " +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'No Resolution' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                        "WHERE resolution_api_status IS NULL AND is_active = 'TRUE' " +
                        "AND created_at >= SYSDATE - :lookback_hours/24 " + fiscFilter +

                        "UNION ALL " +

                        // Exception
                        "SELECT incident_number, team_name, category, core_issue, llm_summary, caseiq_run_date, " +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'Exception' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                        "WHERE is_active = 'TRUE' " +
                        "AND (UPPER(TRIM(category)) = 'ERROR' " +
                        "  OR REGEXP_LIKE(core_issue, '" + EXCEPTION_REGEX + "', 'i') " +
                        "  OR REGEXP_LIKE(llm_summary, '" + EXCEPTION_REGEX + "', 'i')) " +
                        "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " + fiscFilter +

                        "UNION ALL " +

                        // Null Classification
                        "SELECT incident_number, team_name, category, core_issue, llm_summary, caseiq_run_date, " +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'Null Classification' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                        "WHERE (category IS NULL OR core_issue IS NULL) AND case_analyzer_status != 'NEW' " +
                        "AND is_active = 'TRUE' " +
                        "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " + fiscFilter +

                        "UNION ALL " +

                        // Unknown Team
                        "SELECT incident_number, 'UNKNOWN' AS team_name, category, core_issue, llm_summary, caseiq_run_date, "
                        +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'Unknown Team' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                        "WHERE team_name = 'UNKNOWN' AND is_active = 'TRUE' " +
                        "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " + fiscFilter +

                        "UNION ALL " +

                        // Resolution Error
                        "SELECT incident_number, team_name, category, core_issue, NULL AS llm_summary, caseiq_run_date, "
                        +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'Resolution Error' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
                        "WHERE (resolution_api_status NOT IN ('SUCCESS', 'NOT_SUPPORTED', 'PARTIAL SUCCESS') " +
                        "  OR resolution_api_status IS NULL) " +
                        "AND is_active = 'TRUE' " +
                        "AND caseiq_run_date >= SYSDATE - :lookback_hours/24 " + fiscFilter +

                        "UNION ALL " +

                        // Awaiting Bot Response — lives in staging table (never reaches analyzer table
                        // until the ConvBot responds). Alias run_date -> caseiq_run_date so the outer
                        // SELECT can consume it uniformly with the other branches.
                        "SELECT incident_number, NVL(team_name, 'UNKNOWN') AS team_name, " +
                        "category, core_issue, llm_summary, run_date AS caseiq_run_date, " +
                        "DBMS_LOB.SUBSTR(incident_description, 2000, 1) AS incident_description, " +
                        "DBMS_LOB.SUBSTR(resolution_api_summary, 2000, 1) AS resolution_api_summary, " +
                        "'Awaiting Bot Response' AS anomaly_label " +
                        "FROM ARFINRO.XXCASEIQ_ESP_STAGING_TBL " +
                        "WHERE case_analyzer_status = 'AWAITING_RESPONSE_FROM_BOT' " +
                        "AND run_date >= SYSDATE - :lookback_hours/24 " + fiscFilter;

        if (hasQuarter) {
            union = stripDateLookback(union);
        }

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT incident_number, team_name, category, core_issue, llm_summary, ");
        sql.append("incident_description, resolution_api_summary, ");
        sql.append("caseiq_run_date, anomaly_label, COUNT(*) OVER() AS total_count ");
        sql.append("FROM (").append(union).append(") all_incidents WHERE 1=1 ");

        if (team != null && !team.isBlank()) {
            sql.append("AND team_name = :team ");
            params.put("team", team);
        }
        if (issueType != null && !issueType.isBlank()) {
            sql.append("AND anomaly_label = :issue_type ");
            params.put("issue_type", issueType);
        }

        sql.append("ORDER BY caseiq_run_date DESC ");

        if (pageSize > 0) {
            sql.append("OFFSET :offset ROWS FETCH NEXT :page_size ROWS ONLY");
            params.put("offset", (page - 1) * pageSize);
            params.put("page_size", pageSize);
        }

        List<Map<String, Object>> rows = jdbcManager.queryWithNamedParams(sql.toString(), params);

        long totalCount = 0;
        if (!rows.isEmpty()) {
            totalCount = ((Number) rows.get(0).get("TOTAL_COUNT")).longValue();
            rows.forEach(r -> r.remove("TOTAL_COUNT"));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rows", rows);
        result.put("totalCount", totalCount);
        result.put("page", page);
        result.put("pageSize", pageSize);
        return result;
    }

    public List<String> getDistinctQuarters() {
        List<Map<String, Object>> rows = jdbcManager.queryWithNamedParams(DISTINCT_QUARTERS, new HashMap<>());
        List<String> quarters = new java.util.ArrayList<>();
        for (Map<String, Object> row : rows) {
            Object val = row.get("FISC_QTR");
            if (val != null)
                quarters.add(val.toString());
        }
        return quarters;
    }

    // ─── CaseIQ Analytics Chart Service Methods ─────────────────────────────────

    public List<Map<String, Object>> getWeeklyCaseVolumeByTeam(String fiscQtr) {
        Map<String, Object> params = buildParams("fisc_qtr", fiscQtr);
        return jdbcManager.queryWithNamedParams(WEEKLY_CASE_VOLUME_BY_TEAM, params);
    }

    public List<Map<String, Object>> getWeeklyCaseVolumeByState(String fiscQtr) {
        Map<String, Object> params = buildParams("fisc_qtr", fiscQtr);
        return jdbcManager.queryWithNamedParams(WEEKLY_CASE_VOLUME_BY_STATE, params);
    }

    public List<Map<String, Object>> getHourlyCaseOpenPattern(int lookbackDays, String fiscQtr) {
        return runQuery(HOURLY_CASE_OPEN_PATTERN, buildParams("lookback_days", lookbackDays), fiscQtr);
    }

    public List<Map<String, Object>> getAccuracyOverTime(int lookbackDays, String fiscQtr) {
        return runQuery(ACCURACY_OVER_TIME, buildParams("lookback_days", lookbackDays), fiscQtr);
    }

    public List<Map<String, Object>> getTeamCategoryAccuracy(int lookbackDays, String teamName, String fiscQtr) {
        Map<String, Object> params = buildParams("lookback_days", lookbackDays);
        params.put("team_name", teamName);
        return runQuery(TEAM_CATEGORY_ACCURACY, params, fiscQtr);
    }

    public List<Map<String, Object>> getTeamCoreIssueAccuracy(int lookbackDays, String teamName, String fiscQtr) {
        Map<String, Object> params = buildParams("lookback_days", lookbackDays);
        params.put("team_name", teamName);
        return runQuery(TEAM_CORE_ISSUE_ACCURACY, params, fiscQtr);
    }

    public List<Map<String, Object>> getTeamValidationAccuracySummary(int lookbackDays, String fiscQtr) {
        return runQuery(TEAM_VALIDATION_ACCURACY_SUMMARY, buildParams("lookback_days", lookbackDays), fiscQtr);
    }

    // ─── Executive Dashboard Service Methods ────────────────────────────────────

    /**
     * Combined p80/p90 percentile metrics per team for one fiscal quarter:
     * response time (import + execution) at both percentiles plus MTTR at both
     * percentiles, sourced from ASK_CASEIQ_METRICS_DSH_90_80_V.
     */
    public List<Map<String, Object>> getExecMetrics(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(EXEC_METRICS, buildParams("fisc_qtr", fiscQtr));
    }

    /**
     * Global (dashboard-wide) p80/p90 averages for one fiscal quarter, sourced
     * from ASK_CASEIQ_METRICS_AVG_EXEC_V. Returns a single row per quarter.
     */
    public List<Map<String, Object>> getAvgExecMetrics(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(AVG_EXEC_METRICS, buildParams("fisc_qtr", fiscQtr));
    }

    /**
     * Case churn buckets per team: how many times cases are touched after CaseIQ
     * recommendation, for one fiscal quarter.
     */
    public List<Map<String, Object>> getExecWorknotesChurn(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(EXEC_WORKNOTES_CHURN, buildParams("fisc_qtr", fiscQtr));
    }

    /** Cases in ESP but not picked up by CaseIQ (coverage gap) for one quarter. */
    public List<Map<String, Object>> getExecCoverageGap(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(EXEC_COVERAGE_GAP, buildParams("fisc_qtr", fiscQtr));
    }

    /**
     * Response times (import / execution / MTTR) plus post-CaseIQ churn buckets
     * per component, filtered to a single fiscal quarter.
     */
    public List<Map<String, Object>> getExecResponseTimeByTeam(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(EXEC_RESPONSE_TIME_BY_TEAM, buildParams("fisc_qtr", fiscQtr));
    }

    /**
     * Same breakdown as {@link #getExecResponseTimeByTeam(String)} but per core
     * issue within a single component. Fetched on demand by the drilldown modal.
     */
    public List<Map<String, Object>> getExecResponseTimeByCoreIssue(String fiscQtr, String teamName) {
        Map<String, Object> params = new HashMap<>();
        params.put("fisc_qtr", fiscQtr);
        params.put("team_name", teamName);
        return jdbcManager.queryWithNamedParams(EXEC_RESPONSE_TIME_BY_CORE_ISSUE, params);
    }

    /**
     * Per-team auto-resolve metrics (incident count + import/execution/resolution
     * timings) for one fiscal quarter, sourced from the pre-aggregated
     * ASK_CASEIQ_AUTO_RESOLVE_METRICS_V view.
     */
    public List<Map<String, Object>> getAutoResolveMetrics(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(AUTO_RESOLVE_METRICS, buildParams("fisc_qtr", fiscQtr));
    }

    /**
     * Per-team not-interfaced counts (kafka miss / awaiting bot response /
     * technical issue) for one fiscal quarter.
     */
    public List<Map<String, Object>> getNotInterfacedByTeam(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(NOT_INTERFACED_BY_TEAM, buildParams("fisc_qtr", fiscQtr));
    }

    /**
     * Per-team roll-up of resolution outcomes for one fiscal quarter — one row
     * per team with core-issue count and summed success/not_supported/error/
     * warning/unknown volumes.
     */
    public List<Map<String, Object>> getResolutionStatusByTeam(String fiscQtr) {
        return jdbcManager.queryWithNamedParams(RESOLUTION_STATUS_BY_TEAM, buildParams("fisc_qtr", fiscQtr));
    }

    /**
     * Per-core-issue resolution outcomes for one team + fiscal quarter — powers
     * the ctx-4 resolution-status drilldown modal.
     */
    public List<Map<String, Object>> getResolutionStatusByCoreIssue(String fiscQtr, String teamName) {
        Map<String, Object> params = new HashMap<>();
        params.put("fisc_qtr", fiscQtr);
        params.put("team_name", teamName);
        return jdbcManager.queryWithNamedParams(RESOLUTION_STATUS_BY_CORE_ISSUE, params);
    }
}
