package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CiscoFiscalCalendar;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Landing page context engine service.
 *
 * Provides live data for the landing page cockpit organized by context:
 * - Context 1: Period Close (entity progress, interface loads, completion %)
 * - Context 2: CaseIQ (health, team volumes, throughput)
 * - Context 3: Large Deal / Revenue (order lifecycle, revenue estimates)
 */
@Service
public class LandingContextService {

    private final JdbcManager jdbcManager;

    // ─── Context 1: Period Close Queries ────────────────────────────────────────

    private static final String PERIOD_INFO = "SELECT PERIOD_NAME, CLOSE_START_TIME, CLOSE_END_TIME, " +
            "ACTUAL_CLOSE_END_TIME, CURRENT_PERIOD_FLAG " +
            "FROM ARFINRO.ASK_QE_ME_INTERFACE_LOAD " +
            "WHERE line_type = 'PRODUCT' AND enabled_flag = 'Y' AND current_period_flag = 'Y' AND ROWNUM = 1";

    private static final String INTERFACE_LOAD_CURRENT = "SELECT close_type, line_type, line_count, " +
            "MOM_PERCENTAGE, PQM_PERCENTAGE, QOQ_PERCENTAGE, YOY_PERCENTAGE, " +
            "quarter, period_name " +
            "FROM ARFINRO.ASK_QE_ME_INTERFACE_LOAD " +
            "WHERE current_period_flag = 'Y' AND enabled_flag = 'Y' " +
            "ORDER BY close_type, line_type";

    private static final String CLOSE_STATUS_SUMMARY = "SELECT close_type, category, " +
            "COUNT(*) AS total_ous, " +
            "SUM(CASE WHEN close_status = 'Completed' THEN 1 ELSE 0 END) AS completed_ous, " +
            "SUM(CASE WHEN close_status = 'NA' THEN 1 ELSE 0 END) AS na_ous, " +
            "SUM(CASE WHEN close_status NOT IN ('Completed', 'NA') THEN 1 ELSE 0 END) AS pending_ous " +
            "FROM ARFINRO.ASK_QE_ME_CLOSE_STATUS a, HR_OPERATING_UNITS b " +
            "WHERE a.operating_unit = b.name AND current_period_flag = 'Y' " +
            "GROUP BY close_type, category " +
            "ORDER BY close_type, category";

    private static final String CLOSE_PROGRESS_OVERALL = "SELECT close_type, " +
            "COUNT(*) AS total_steps, " +
            "SUM(CASE WHEN close_status = 'Completed' THEN 1 ELSE 0 END) AS completed_steps, " +
            "SUM(CASE WHEN close_status = 'NA' THEN 1 ELSE 0 END) AS na_steps, " +
            "ROUND(SUM(CASE WHEN close_status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / " +
            "  NULLIF(COUNT(*) - SUM(CASE WHEN close_status = 'NA' THEN 1 ELSE 0 END), 0), 1) AS completion_pct " +
            "FROM ARFINRO.ASK_QE_ME_CLOSE_STATUS a, HR_OPERATING_UNITS b " +
            "WHERE a.operating_unit = b.name AND current_period_flag = 'Y' " +
            "GROUP BY close_type";

    private static final String ENTITY_COUNT = "SELECT COUNT(*) AS total_operating_units FROM HR_OPERATING_UNITS";

    // ─── Context 2: CaseIQ Queries ──────────────────────────────────────────────

    private static final String CASEIQ_HEALTH = "SELECT " +
            "COUNT(*) AS total_cases, " +
            "SUM(CASE WHEN resolution_api_status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count, " +
            "SUM(CASE WHEN resolution_api_status = 'PARTIAL SUCCESS' THEN 1 ELSE 0 END) AS partial_success, " +
            "SUM(CASE WHEN resolution_api_status IN ('ERROR', 'FAILURE') THEN 1 ELSE 0 END) AS error_count, " +
            "SUM(CASE WHEN resolution_api_status IS NULL THEN 1 ELSE 0 END) AS null_status " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' AND caseiq_run_date >= SYSDATE - 7";

    private static final String CASEIQ_TEAM_VOLUME = "SELECT team_name, " +
            "COUNT(*) AS case_count, " +
            "SUM(CASE WHEN resolution_api_status = 'SUCCESS' THEN 1 ELSE 0 END) AS resolved " +
            "FROM ARFINRO.XXCASEIQ_ESP_CASE_ANALYZER_TBL " +
            "WHERE is_active = 'TRUE' AND caseiq_run_date >= SYSDATE - 7 " +
            "GROUP BY team_name ORDER BY case_count DESC";

    private static final String CASEIQ_WEEKLY_TREND = "SELECT quarter, team_name, week_number, incident_count " +
            "FROM ARFINRO.ASK_CASEIQ_METRICS_WEEKLY_V " +
            "WHERE quarter = :quarter " +
            "ORDER BY team_name, week_number";

    // ─── Context 3: Large Deal / Revenue Queries ────────────────────────────────

    private static final String LARGE_DEAL_SUMMARY = "SELECT " +
            "COUNT(DISTINCT deal_id) AS deal_count, " +
            "SUM(sales_order_count) AS total_orders, " +
            "SUM(total_order_value) AS total_order_value, " +
            "SUM(current_qtr_rev_estimate) AS revenue_estimate, " +
            "SUM(current_qtr_accr_gl_rev) AS accrued_gl_rev, " +
            "SUM(current_qtr_revenue_recog) AS revenue_recognized, " +
            "SUM(revenue_not_recog) AS revenue_not_recognized " +
            "FROM ARFINRO.XXCFI_ASK_LARG_REV_SUMM_DASH_V";

    private static final String ORDER_STATUS_COMPLETION = "SELECT program_name, " +
            "COUNT(*) AS order_count, " +
            "invoicing_status AS status, " +
            "ROUND((COUNT(*) * 100.0) / SUM(COUNT(*)) OVER (PARTITION BY program_name), 1) AS completion_pct " +
            "FROM ARFINRO.XXCFI_ASK_LARG_ORDER_STATUS " +
            "WHERE enabled_flag = 'Y' AND NVL(order_value, 0) != 0 " +
            "GROUP BY program_name, invoicing_status " +
            "ORDER BY program_name, invoicing_status";

    private static final String LARGE_DEAL_BY_STATUS = "SELECT order_status, " +
            "COUNT(*) AS deal_count, " +
            "SUM(total_order_value) AS total_value " +
            "FROM ARFINRO.XXCFI_ASK_LARG_REV_SUMM_DASH_V " +
            "GROUP BY order_status ORDER BY total_value DESC";

    @Autowired
    public LandingContextService(JdbcManager jdbcManager) {
        this.jdbcManager = jdbcManager;
    }

    // ─── Public API ─────────────────────────────────────────────────────────────

    /**
     * Get all context data for the landing page.
     * Returns a map with keys: periodInfo, context1, context2, context3
     */
    public Map<String, Object> getContextData() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodInfo", getPeriodInfo());
        result.put("context1", getPeriodCloseContext());
        result.put("context2", getCaseIQContext());
        result.put("context3", getLargeDealContext());
        return result;
    }

    /**
     * Get only a specific context (1, 2, or 3).
     */
    public Map<String, Object> getContextData(int context) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodInfo", getPeriodInfo());
        switch (context) {
            case 1:
                result.put("data", getPeriodCloseContext());
                break;
            case 2:
                result.put("data", getCaseIQContext());
                break;
            case 3:
                result.put("data", getLargeDealContext());
                break;
            default:
                result.put("data", getPeriodCloseContext());
        }
        return result;
    }

    // ─── Context 1: Period Close ────────────────────────────────────────────────

    private Map<String, Object> getPeriodCloseContext() {
        Map<String, Object> ctx = new LinkedHashMap<>();

        // Entity count
        List<Map<String, Object>> entityRows = jdbcManager.queryForList(ENTITY_COUNT);
        int entityCount = 0;
        if (!entityRows.isEmpty()) {
            entityCount = ((Number) entityRows.get(0).get("TOTAL_OPERATING_UNITS")).intValue();
        }
        ctx.put("entityCount", entityCount);

        // Overall completion percentages (preclose & midclose)
        List<Map<String, Object>> progressRows = jdbcManager.queryForList(CLOSE_PROGRESS_OVERALL);
        Map<String, Object> progress = new LinkedHashMap<>();
        for (Map<String, Object> row : progressRows) {
            String closeType = row.get("CLOSE_TYPE").toString();
            progress.put(closeType, row);
        }
        ctx.put("progress", progress);

        // Per-category completion (for arc dials)
        List<Map<String, Object>> categoryRows = jdbcManager.queryForList(CLOSE_STATUS_SUMMARY);
        Map<String, List<Map<String, Object>>> byCloseType = new LinkedHashMap<>();
        for (Map<String, Object> row : categoryRows) {
            String closeType = row.get("CLOSE_TYPE").toString();
            byCloseType.computeIfAbsent(closeType, k -> new ArrayList<>()).add(row);
        }
        ctx.put("categoryStatus", byCloseType);

        // Interface load volumes (current period)
        List<Map<String, Object>> loadRows = jdbcManager.queryForList(INTERFACE_LOAD_CURRENT);
        Map<String, List<Map<String, Object>>> loadByType = new LinkedHashMap<>();
        for (Map<String, Object> row : loadRows) {
            String closeType = row.get("CLOSE_TYPE").toString();
            loadByType.computeIfAbsent(closeType, k -> new ArrayList<>()).add(row);
        }
        ctx.put("interfaceLoad", loadByType);

        return ctx;
    }

    // ─── Context 2: CaseIQ ──────────────────────────────────────────────────────

    private Map<String, Object> getCaseIQContext() {
        Map<String, Object> ctx = new LinkedHashMap<>();

        // Health overview (last 7 days)
        List<Map<String, Object>> healthRows = jdbcManager.queryForList(CASEIQ_HEALTH);
        if (!healthRows.isEmpty()) {
            Map<String, Object> health = healthRows.get(0);
            long total = ((Number) health.getOrDefault("TOTAL_CASES", 0)).longValue();
            long success = ((Number) health.getOrDefault("SUCCESS_COUNT", 0)).longValue();
            long partial = ((Number) health.getOrDefault("PARTIAL_SUCCESS", 0)).longValue();

            double successRate = total > 0 ? Math.round(((success + partial) * 1000.0) / total) / 10.0 : 0;
            health.put("SUCCESS_RATE", successRate);
            ctx.put("health", health);
        }

        // Team volumes
        List<Map<String, Object>> teamRows = jdbcManager.queryForList(CASEIQ_TEAM_VOLUME);
        ctx.put("teamVolumes", teamRows);

        // Weekly trend for current quarter
        String currentQuarter = getCurrentFiscalQuarter();
        Map<String, Object> params = new HashMap<>();
        params.put("quarter", currentQuarter);
        List<Map<String, Object>> trendRows = jdbcManager.queryWithNamedParams(CASEIQ_WEEKLY_TREND, params);
        ctx.put("weeklyTrend", trendRows);
        ctx.put("currentQuarter", currentQuarter);

        return ctx;
    }

    // ─── Context 3: Large Deal / Revenue ────────────────────────────────────────

    private Map<String, Object> getLargeDealContext() {
        Map<String, Object> ctx = new LinkedHashMap<>();

        // Deal summary totals
        List<Map<String, Object>> summaryRows = jdbcManager.queryForList(LARGE_DEAL_SUMMARY);
        if (!summaryRows.isEmpty()) {
            ctx.put("summary", summaryRows.get(0));
        }

        // Deals by invoicing status
        List<Map<String, Object>> statusRows = jdbcManager.queryForList(LARGE_DEAL_BY_STATUS);
        ctx.put("byStatus", statusRows);

        // Order status completion by program
        List<Map<String, Object>> orderRows = jdbcManager.queryForList(ORDER_STATUS_COMPLETION);
        ctx.put("orderCompletion", orderRows);

        return ctx;
    }

    // ─── Period Info (shared across all contexts) ───────────────────────────────

    private Map<String, Object> getPeriodInfo() {
        Map<String, Object> info = new LinkedHashMap<>();

        List<Map<String, Object>> rows = jdbcManager.queryForList(PERIOD_INFO);
        if (!rows.isEmpty()) {
            Map<String, Object> row = rows.get(0);
            info.put("periodName", row.get("PERIOD_NAME"));
            info.put("closeStartTime", row.get("CLOSE_START_TIME"));
            info.put("closeEndTime", row.get("CLOSE_END_TIME"));
            info.put("actualCloseEndTime", row.get("ACTUAL_CLOSE_END_TIME"));
        }

        // Compute period end date from fiscal calendar
        LocalDate today = LocalDate.now();
        int fy = today.getMonthValue() <= 7 ? today.getYear() : today.getYear() + 1;
        LocalDate[] periodEnds = CiscoFiscalCalendar.periodEndDates(fy);

        // Find current period end (next period end after today)
        LocalDate periodEndDate = null;
        for (LocalDate pe : periodEnds) {
            if (!pe.isBefore(today)) {
                periodEndDate = pe;
                break;
            }
        }
        if (periodEndDate == null) {
            // Past all periods in this FY, use next FY's first period
            periodEndDate = CiscoFiscalCalendar.periodEndDates(fy + 1)[0];
        }

        info.put("periodEndDate", periodEndDate.format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        info.put("lastUpdated", new java.text.SimpleDateFormat("M/dd/yyyy, h:mm:ss a").format(new Date()));
        info.put("fiscalQuarter", getCurrentFiscalQuarter());

        // Determine if we're in quarter-end month
        String periodName = info.get("periodName") != null ? info.get("periodName").toString() : "";
        String month = periodName.contains("-") ? periodName.split("-")[0] : "";
        boolean isQuarterEnd = month.equals("OCT") || month.equals("JAN") || month.equals("APR") || month.equals("JUL");
        info.put("isQuarterEnd", isQuarterEnd);

        return info;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private String getCurrentFiscalQuarter() {
        LocalDate today = LocalDate.now();
        int fy = today.getMonthValue() <= 7 ? today.getYear() : today.getYear() + 1;

        for (int q = 1; q <= 4; q++) {
            LocalDate qStart = CiscoFiscalCalendar.quarterStart(fy, q);
            LocalDate qEnd = CiscoFiscalCalendar.quarterEnd(fy, q);
            if (!today.isBefore(qStart) && !today.isAfter(qEnd)) {
                return "Q" + q + "FY" + (fy % 100);
            }
        }
        // Fallback
        return "Q4FY" + (fy % 100);
    }
}
