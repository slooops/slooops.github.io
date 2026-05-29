package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CiscoFiscalCalendar;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * WD0 Predictive Service (v2) - automates the predecessor's manual mid-close
 * volume projection.
 *
 * <p>
 * <b>Algorithm</b> (decoded from {@code Midclose Prediction Calculation.xlsx}):
 * <ol>
 * <li>For an upcoming period_end Saturday {@code PE}, run three source
 * queries; each returns counts grouped by {@code TRUNC(date)}.</li>
 * <li>Each day's count is multiplied by a per-day weight indexed by
 * (segment, source, day_offset_from_PE). Day offsets range -3..+3.</li>
 * <li>Per-segment {@code weighted_sum = SUM(day_count * per_day_weight)}.</li>
 * <li>Final {@code low = weighted_sum * WD_LOW},
 * {@code high = weighted_sum * WD_HIGH}
 * where the WD-level multipliers depend on (WD, period_type). The
 * predecessor's table has QE multipliers exactly 2x the ME ones.</li>
 * </ol>
 *
 * <p>
 * Parallel to legacy {@code ARFINRO.MIDCLOSE_PRIDECTION}; that table is now
 * frozen — the wd0-historical-data dashboard reads from
 * {@code ARFINRO.JSR_WD0_PREDICTIONS} (filtered to formal WD-3/-2/-1 rows).
 */
@Service
public class Wd0PredictiveService {

    private static final Logger log = LoggerFactory.getLogger(Wd0PredictiveService.class);

    /** Identifies the predecessor's exact method. Bumped when weights change. */
    public static final String MODEL_VERSION = "v1-predecessor";

    public static final ZoneId PACIFIC = ZoneId.of("America/Los_Angeles");

    // ------------------------------------------------------------------------
    // SOURCE QUERIES (verbatim from "Midclose_Updated_Prediction_Queries May
    // Edition.sql" with literal date strings replaced by :window_start /
    // :window_end binds). All three return per-day rows: (count_date, line_count).
    // ------------------------------------------------------------------------

    /**
     * SERVICE / Flexible Invoice - window [PE, PE+1] (single TRUNC bound by IN).
     * Verbatim from May Edition lines 1-19.
     */
    static final String SERVICE_FLEXIBLE_INVOICE_SQL = "SELECT TRUNC(BILL_RELEASE_DATE) AS count_date, COUNT(*) AS line_count "
            +
            "  FROM apps.xxgco_oe_invoice_schedules b " +
            " WHERE BILL_STATUS_CODE NOT IN ('CANCELLED', 'INVOICED') " +
            "   AND TRUNC(BILL_RELEASE_DATE) BETWEEN :window_start AND :window_end " +
            "   AND NOT EXISTS ( " +
            "     SELECT 1 FROM ra_customer_trx_lines_all l " +
            "      WHERE l.interface_line_attribute4 = TO_CHAR(b.SO_LINE_ID) " +
            "        AND l.interface_line_attribute2 = TO_CHAR(b.bill_schedule_id)) " +
            "   AND NOT EXISTS ( " +
            "     SELECT 1 FROM apps.ra_interface_lines_all l " +
            "      WHERE l.interface_line_attribute4 = TO_CHAR(b.SO_LINE_ID) " +
            "        AND l.interface_line_attribute2 = TO_CHAR(b.bill_schedule_id)) " +
            " GROUP BY TRUNC(BILL_RELEASE_DATE) " +
            " ORDER BY TRUNC(BILL_RELEASE_DATE)";

    /**
     * SERVICE / Future Invoice Release Date - window [PE-3, PE+3].
     * Verbatim from May Edition lines 22-40.
     */
    static final String SERVICE_FUTURE_INVOICE_RELEASE_SQL = "SELECT TRUNC(future_invoice_release_date) AS count_date, COUNT(*) AS line_count "
            +
            "  FROM apps.xxgco_oe_order_lines_ext a, apps.oe_order_lines_all b " +
            " WHERE 1 = 1 " +
            "   AND a.line_id = b.line_id " +
            "   AND b.flow_status_code NOT IN ('CLOSED', 'CANCELLED') " +
            "   AND future_invoice_release_date BETWEEN :window_start AND :window_end " +
            "   AND NOT EXISTS ( " +
            "     SELECT 1 FROM ra_customer_trx_lines_all l " +
            "      WHERE l.interface_line_attribute6 = TO_CHAR(b.line_id)) " +
            "   AND NOT EXISTS ( " +
            "     SELECT 1 FROM apps.ra_interface_lines_all l " +
            "      WHERE l.interface_line_attribute6 = TO_CHAR(b.line_id)) " +
            " GROUP BY TRUNC(future_invoice_release_date) " +
            " ORDER BY TRUNC(future_invoice_release_date)";

    /**
     * PRODUCT / Promise Date - window [PE-1, PE+2] per the per-day weight table
     * (only days -1 and +2 have non-zero weight, but window covers both).
     *
     * <p>
     * Verbatim from predecessor's May Edition workbook. Reads from the remote
     * CG1 DB over the {@code @FINFBLBLO_LINK.CISCO.COM} DB link.
     * Verified output for PE=2026-05-23 (datagrip):
     * 2026-05-22 -> 9943; 2026-05-25 -> 1671.
     */
    static final String PRODUCT_PROMISE_DATE_SQL = "WITH TEMP_MIDCLOSE_PROMISE_DATE AS ( " +
            "  SELECT * " +
            "    FROM finfblrl.cg1_oe_order_lines_all@FINFBLBLO_LINK.CISCO.COM " +
            "   WHERE promise_date BETWEEN :window_start AND :window_end " +
            ") " +
            "SELECT TRUNC(b.promise_date) AS count_date, COUNT(*) AS line_count " +
            "  FROM TEMP_MIDCLOSE_PROMISE_DATE b " +
            " WHERE 1 = 1 " +
            "   AND NVL(b.accounting_rule_id, 1) = 1 " +
            "   AND b.flow_status_code NOT IN ('CLOSED', 'CANCELLED') " +
            "   AND b.unit_selling_price <> 0 " +
            "   AND NOT EXISTS ( " +
            "     SELECT 1 FROM ra_customer_trx_lines_all l " +
            "      WHERE l.interface_line_attribute6 = TO_CHAR(b.line_id)) " +
            "   AND NOT EXISTS ( " +
            "     SELECT 1 FROM apps.ra_interface_lines_all l " +
            "      WHERE l.interface_line_attribute6 = TO_CHAR(b.line_id)) " +
            " GROUP BY TRUNC(b.promise_date) " +
            " ORDER BY TRUNC(b.promise_date)";

    // ------------------------------------------------------------------------
    // PERSISTENCE SQL
    // ------------------------------------------------------------------------
    private static final String INSERT_PREDICTION_SQL = "INSERT INTO ARFINRO.JSR_WD0_PREDICTIONS " +
            " (PERIOD_NAME, PERIOD_END_DATE, PERIOD_TYPE, WD, LINE_TYPE, " +
            "  WEIGHTED_SUM, PREDICTION_LOW, PREDICTION_HIGH, MODEL_VERSION, GENERATED_AT) " +
            " VALUES (:period_name, :period_end_date, :period_type, :wd, :line_type, " +
            "         :weighted_sum, :prediction_low, :prediction_high, :model_version, :generated_at)";

    private static final String INSERT_SNAPSHOT_SQL = "INSERT INTO ARFINRO.JSR_WD0_RAW_SNAPSHOTS " +
            " (PREDICTION_ID, PERIOD_NAME, WD, LINE_TYPE, SOURCE_QUERY, " +
            "  COUNT_DATE, DAY_OFFSET, PER_DAY_WEIGHT, LINE_COUNT, GENERATED_AT) " +
            " VALUES (:prediction_id, :period_name, :wd, :line_type, :source_query, " +
            "         :count_date, :day_offset, :per_day_weight, :line_count, :generated_at)";

    private static final String SELECT_LATEST_PREDICTIONS_SQL = "SELECT p.* FROM ARFINRO.JSR_WD0_PREDICTIONS p " +
            " WHERE p.PERIOD_NAME = :period_name " +
            "   AND p.MODEL_VERSION = :model_version " +
            "   AND p.GENERATED_AT = ( " +
            "     SELECT MAX(p2.GENERATED_AT) FROM ARFINRO.JSR_WD0_PREDICTIONS p2 " +
            "      WHERE p2.PERIOD_NAME = p.PERIOD_NAME " +
            "        AND p2.WD = p.WD AND p2.LINE_TYPE = p.LINE_TYPE " +
            "        AND p2.MODEL_VERSION = p.MODEL_VERSION) " +
            " ORDER BY p.WD DESC, p.LINE_TYPE";

    private static final String SELECT_SNAPSHOTS_FOR_PERIOD_SQL = "SELECT * FROM ARFINRO.JSR_WD0_RAW_SNAPSHOTS " +
            " WHERE PERIOD_NAME = :period_name " +
            " ORDER BY GENERATED_AT DESC, WD DESC, LINE_TYPE, SOURCE_QUERY, COUNT_DATE";

    // ------------------------------------------------------------------------
    // WEIGHTS
    // ------------------------------------------------------------------------
    // Per-day weights from "Midclose Prediction Calculation.xlsx" WEIGHTAGE sheet
    // (column F, DATE_WEIGHTAGE). Stable across ME/QE; vary only by
    // (segment, source, day_offset). Days not listed -> weight 0 (excluded).
    private static final Map<DayKey, Double> DAY_WEIGHTS = buildDayWeights();

    private static Map<DayKey, Double> buildDayWeights() {
        Map<DayKey, Double> w = new HashMap<>();
        // PRODUCT / Promise Date
        w.put(new DayKey("PRODUCT", SourceQuery.PRODUCT_PROMISE_DATE, -1), 0.45);
        w.put(new DayKey("PRODUCT", SourceQuery.PRODUCT_PROMISE_DATE, +2), 0.65);
        // SERVICE / Flexible Invoice (Flexi)
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FLEXIBLE_INVOICE, 0), 0.65); // PE (Saturday)
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FLEXIBLE_INVOICE, +1), 1.00); // PE+1 (Sunday)
        // SERVICE / Future Invoice Release Date (FIRD)
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, -3), 0.45);
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, -2), 0.45);
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, -1), 0.45);
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, 0), 0.65);
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, +1), 1.00);
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, +2), 0.65);
        w.put(new DayKey("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, +3), 0.47);
        return w;
    }

    // WD-level multipliers (image 2 in chat). Applied to weighted_sum to derive
    // the (low, high) prediction band. ME vs QE differ exactly 2x per predecessor.
    private static final Map<WdKey, WdMult> WD_MULTIPLIERS = Map.of(
            new WdKey("WD-3", "ME"), new WdMult(0.27, 1.76),
            new WdKey("WD-3", "QE"), new WdMult(0.54, 3.52),
            new WdKey("WD-3", "YE"), new WdMult(0.54, 3.52),
            new WdKey("WD-2", "ME"), new WdMult(0.36, 1.73),
            new WdKey("WD-2", "QE"), new WdMult(0.72, 3.46),
            new WdKey("WD-2", "YE"), new WdMult(0.72, 3.46),
            new WdKey("WD-1", "ME"), new WdMult(0.63, 1.64),
            new WdKey("WD-1", "QE"), new WdMult(1.26, 3.28),
            new WdKey("WD-1", "YE"), new WdMult(1.26, 3.28));

    // ------------------------------------------------------------------------
    // DEPENDENCIES
    // ------------------------------------------------------------------------
    private final NamedParameterJdbcTemplate named;

    public Wd0PredictiveService(@Qualifier("primaryJdbcTemplate") JdbcTemplate primaryJdbcTemplate) {
        this.named = new NamedParameterJdbcTemplate(primaryJdbcTemplate);
    }

    // ------------------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------------------

    /**
     * Compute fiscal-calendar context for the next upcoming period_end relative
     * to {@code today} (Pacific time).
     */
    public PeriodContext computePeriodContext(LocalDate today) {
        int fy = fiscalYearFor(today);
        LocalDate nextEnd = findNextPeriodEnd(today, fy);
        if (nextEnd == null) {
            nextEnd = findNextPeriodEnd(today, fy + 1);
        }
        if (nextEnd == null) {
            throw new IllegalStateException("Could not locate upcoming period_end for " + today);
        }
        int periodIdx = indexOfPeriodEnd(nextEnd, fiscalYearFor(nextEnd));
        String periodName = periodNameForIndex(nextEnd);
        String periodType = classifyPeriod(periodIdx);
        String wd = workDayLabel(today, nextEnd);
        return new PeriodContext(periodName, nextEnd, periodType, wd);
    }

    /** Calendar-day window [start, end] for a source query, relative to PE. */
    public DateWindow windowFor(SourceQuery q, LocalDate periodEnd) {
        return switch (q) {
            // PRODUCT: PE-1..PE+3 matches predecessor's literal
            // '22-MAY-2026'..'26-MAY-2026' for
            // PE=2026-05-23. Day +3 has weight=0 so it doesn't affect the prediction; the
            // extra
            // day exists to absorb promise_date values with intraday time components that
            // an
            // exclusive 'BETWEEN ... AND PE+2' (midnight) would clip.
            case PRODUCT_PROMISE_DATE -> new DateWindow(periodEnd.minusDays(1), periodEnd.plusDays(3));
            case SERVICE_FUTURE_INVOICE_RELEASE -> new DateWindow(periodEnd.minusDays(3), periodEnd.plusDays(3));
            case SERVICE_FLEXIBLE_INVOICE -> new DateWindow(periodEnd, periodEnd.plusDays(1));
        };
    }

    /**
     * Run a single source query, return per-day count rows in chronological order.
     */
    public List<DayCount> runSourceQuery(SourceQuery q, DateWindow w) {
        String sql = switch (q) {
            case PRODUCT_PROMISE_DATE -> PRODUCT_PROMISE_DATE_SQL;
            case SERVICE_FUTURE_INVOICE_RELEASE -> SERVICE_FUTURE_INVOICE_RELEASE_SQL;
            case SERVICE_FLEXIBLE_INVOICE -> SERVICE_FLEXIBLE_INVOICE_SQL;
        };
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("window_start", Date.valueOf(w.start()))
                .addValue("window_end", Date.valueOf(w.end()));
        // ---- DEV LOGGING (scrub before deploy) ----
        log.info("[WD0-DEV] runSourceQuery START query={} window=[{}..{}]", q, w.start(), w.end());
        log.debug("[WD0-DEV] SQL for {}:\n{}", q, sql);
        long t0 = System.currentTimeMillis();
        List<DayCount> out = new ArrayList<>();
        named.query(sql, p, rs -> {
            LocalDate d = rs.getDate("count_date").toLocalDate();
            long c = rs.getLong("line_count");
            out.add(new DayCount(d, c));
        });
        long elapsed = System.currentTimeMillis() - t0;
        // ---- DEV LOGGING (scrub before deploy) ----
        log.info("[WD0-DEV] runSourceQuery DONE  query={} rows={} elapsed_ms={}", q, out.size(), elapsed);
        for (DayCount r : out) {
            log.info("[WD0-DEV]   {} | {} -> count={}", q, r.date(), r.count());
        }
        return out;
    }

    /**
     * STAGE 1+2 core: run all 3 source queries, compute per-segment
     * weighted_sum, apply WD-level multipliers, persist predictions AND
     * per-day snapshots.
     */
    @Transactional
    public List<Map<String, Object>> generatePredictions(LocalDate runDate, String wd) {
        PeriodContext ctx = computePeriodContext(runDate);
        if (wd == null) {
            wd = ctx.wd();
        }
        if (wd == null) {
            throw new IllegalStateException(
                    "runDate " + runDate + " has no WD label for period " + ctx.periodName()
                            + " (weekend or post-PE)");
        }

        log.info("Generating WD0 predictions for period={} ({}), wd={}, runDate={}",
                ctx.periodName(), ctx.periodType(), wd, runDate);

        // 1. Run 3 source queries
        DateWindow wProd = windowFor(SourceQuery.PRODUCT_PROMISE_DATE, ctx.periodEndDate());
        DateWindow wFuture = windowFor(SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, ctx.periodEndDate());
        DateWindow wFlexible = windowFor(SourceQuery.SERVICE_FLEXIBLE_INVOICE, ctx.periodEndDate());

        List<DayCount> productRows = safeRun(SourceQuery.PRODUCT_PROMISE_DATE, wProd);
        List<DayCount> futureRows = safeRun(SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, wFuture);
        List<DayCount> flexibleRows = safeRun(SourceQuery.SERVICE_FLEXIBLE_INVOICE, wFlexible);

        // 2. Per-segment weighted sums
        SegmentAgg productAgg = aggregate("PRODUCT", SourceQuery.PRODUCT_PROMISE_DATE,
                productRows, ctx.periodEndDate());
        SegmentAgg serviceFuture = aggregate("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE,
                futureRows, ctx.periodEndDate());
        SegmentAgg serviceFlexible = aggregate("SERVICE", SourceQuery.SERVICE_FLEXIBLE_INVOICE,
                flexibleRows, ctx.periodEndDate());
        double serviceWeightedSum = serviceFuture.weightedSum() + serviceFlexible.weightedSum();

        // 3. WD-level multipliers (ME vs QE swap happens here). Null for WDs
        //    outside the predecessor's calibrated range (WD-3/-2/-1) - in that
        //    case we still persist weighted_sum + snapshots, but bounds are NULL.
        WdMult prodMult = lookupWdMult(wd, ctx.periodType());
        WdMult serviceMult = prodMult; // same multiplier table for both segments

        if (prodMult == null) {
            log.info("[WD0-DEV] FINAL wd={} type={} no calibrated bounds (training-only snapshot)",
                    wd, ctx.periodType());
            log.info("[WD0-DEV] FINAL PRODUCT weighted_sum={} (bounds NULL)",
                    String.format("%.2f", productAgg.weightedSum()));
            log.info("[WD0-DEV] FINAL SERVICE weighted_sum={} (FIRD={} + Flexi={}) (bounds NULL)",
                    String.format("%.2f", serviceWeightedSum),
                    String.format("%.2f", serviceFuture.weightedSum()),
                    String.format("%.2f", serviceFlexible.weightedSum()));
        } else {
            log.info("[WD0-DEV] FINAL wd={} type={} multiplier low={} high={}",
                    wd, ctx.periodType(), prodMult.low(), prodMult.high());
            log.info("[WD0-DEV] FINAL PRODUCT weighted_sum={} -> low={} high={}",
                    String.format("%.2f", productAgg.weightedSum()),
                    Math.round(productAgg.weightedSum() * prodMult.low()),
                    Math.round(productAgg.weightedSum() * prodMult.high()));
            log.info("[WD0-DEV] FINAL SERVICE weighted_sum={} (FIRD={} + Flexi={}) -> low={} high={}",
                    String.format("%.2f", serviceWeightedSum),
                    String.format("%.2f", serviceFuture.weightedSum()),
                    String.format("%.2f", serviceFlexible.weightedSum()),
                    Math.round(serviceWeightedSum * serviceMult.low()),
                    Math.round(serviceWeightedSum * serviceMult.high()));
        }

        // Store as UTC instant - DB convention is UTC across the platform.
        Timestamp generatedAt = Timestamp.from(Instant.now());

        // 4. Persist PRODUCT
        long productPredId = insertPrediction(ctx, wd, "PRODUCT",
                productAgg.weightedSum(), prodMult, generatedAt);
        insertSnapshots(productPredId, ctx.periodName(), wd, "PRODUCT",
                SourceQuery.PRODUCT_PROMISE_DATE, productAgg.weightedRows(), generatedAt);

        // 5. Persist SERVICE (sum of FIRD + Flexi)
        long servicePredId = insertPrediction(ctx, wd, "SERVICE",
                serviceWeightedSum, serviceMult, generatedAt);
        insertSnapshots(servicePredId, ctx.periodName(), wd, "SERVICE",
                SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, serviceFuture.weightedRows(), generatedAt);
        insertSnapshots(servicePredId, ctx.periodName(), wd, "SERVICE",
                SourceQuery.SERVICE_FLEXIBLE_INVOICE, serviceFlexible.weightedRows(), generatedAt);

        return getLatestPredictions(ctx.periodName());
    }

    /**
     * Dry-run version of {@link #generatePredictions} - computes but does NOT
     * persist.
     */
    public Map<String, Object> dryRun(LocalDate runDate, String wd) {
        PeriodContext ctx = computePeriodContext(runDate);
        if (wd == null) {
            wd = ctx.wd();
        }
        if (wd == null) {
            throw new IllegalStateException(
                    "runDate " + runDate + " is not WD-3/-2/-1 of " + ctx.periodName());
        }

        DateWindow wProd = windowFor(SourceQuery.PRODUCT_PROMISE_DATE, ctx.periodEndDate());
        DateWindow wFuture = windowFor(SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, ctx.periodEndDate());
        DateWindow wFlexible = windowFor(SourceQuery.SERVICE_FLEXIBLE_INVOICE, ctx.periodEndDate());

        List<DayCount> productRows = safeRun(SourceQuery.PRODUCT_PROMISE_DATE, wProd);
        List<DayCount> futureRows = safeRun(SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, wFuture);
        List<DayCount> flexibleRows = safeRun(SourceQuery.SERVICE_FLEXIBLE_INVOICE, wFlexible);

        SegmentAgg productAgg = aggregate("PRODUCT", SourceQuery.PRODUCT_PROMISE_DATE,
                productRows, ctx.periodEndDate());
        SegmentAgg serviceFuture = aggregate("SERVICE", SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE,
                futureRows, ctx.periodEndDate());
        SegmentAgg serviceFlexible = aggregate("SERVICE", SourceQuery.SERVICE_FLEXIBLE_INVOICE,
                flexibleRows, ctx.periodEndDate());
        double serviceWeightedSum = serviceFuture.weightedSum() + serviceFlexible.weightedSum();

        WdMult mult = lookupWdMult(wd, ctx.periodType());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", ctx.toMap());
        result.put("wd", wd);
        result.put("wd_multipliers", mult == null ? null : Map.of("low", mult.low(), "high", mult.high()));
        result.put("PRODUCT", segmentReport(productAgg, mult));
        Map<String, Object> service = new LinkedHashMap<>();
        service.put("weighted_sum", round1(serviceWeightedSum));
        service.put("prediction_low", mult == null ? null : Math.round(serviceWeightedSum * mult.low()));
        service.put("prediction_high", mult == null ? null : Math.round(serviceWeightedSum * mult.high()));
        service.put("FUTURE_INVOICE_RELEASE", serviceFuture.toMap());
        service.put("FLEXIBLE_INVOICE", serviceFlexible.toMap());
        result.put("SERVICE", service);
        return result;
    }

    public List<Map<String, Object>> getLatestPredictions(String periodName) {
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("period_name", periodName)
                .addValue("model_version", MODEL_VERSION);
        return named.queryForList(SELECT_LATEST_PREDICTIONS_SQL, p);
    }

    public List<Map<String, Object>> getSnapshotsForPeriod(String periodName) {
        MapSqlParameterSource p = new MapSqlParameterSource().addValue("period_name", periodName);
        return named.queryForList(SELECT_SNAPSHOTS_FOR_PERIOD_SQL, p);
    }

    // ------------------------------------------------------------------------
    // INTERNALS
    // ------------------------------------------------------------------------

    private List<DayCount> safeRun(SourceQuery q, DateWindow w) {
        try {
            return runSourceQuery(q, w);
        } catch (DataAccessException e) {
            log.error("Source query {} FAILED window=[{}..{}]: {}", q, w.start(), w.end(), e.getMessage());
            throw e;
        }
    }

    /**
     * Apply per-day weights to raw day-counts and aggregate.
     * Days whose offset is not in the weight table (weight = 0) are still
     * persisted as snapshots but contribute 0 to weighted_sum.
     */
    private SegmentAgg aggregate(String segment, SourceQuery source,
            List<DayCount> rows, LocalDate periodEnd) {
        double sum = 0.0;
        List<WeightedDay> weighted = new ArrayList<>(rows.size());
        // ---- DEV LOGGING (scrub before deploy) ----
        log.info("[WD0-DEV] aggregate segment={} source={} PE={} input_rows={}",
                segment, source, periodEnd, rows.size());
        for (DayCount r : rows) {
            int offset = (int) (r.date().toEpochDay() - periodEnd.toEpochDay());
            double w = DAY_WEIGHTS.getOrDefault(new DayKey(segment, source, offset), 0.0);
            double contrib = r.count() * w;
            sum += contrib;
            weighted.add(new WeightedDay(r.date(), offset, w, r.count(), contrib));
            // ---- DEV LOGGING (scrub before deploy) ----
            log.info("[WD0-DEV]   {} {} | date={} offset={} weight={} count={} contrib={}",
                    segment, source, r.date(), offset, w, r.count(), String.format("%.2f", contrib));
        }
        // ---- DEV LOGGING (scrub before deploy) ----
        log.info("[WD0-DEV] aggregate DONE segment={} source={} weighted_sum={}",
                segment, source, String.format("%.2f", sum));
        return new SegmentAgg(sum, weighted);
    }

    /**
     * Returns the WD multiplier for the given (wd, period_type), or {@code null}
     * when wd is outside the predecessor's calibrated range (WD-3/-2/-1). Non-formal
     * days still persist their weighted_sum + per-day snapshots, but bounds are NULL.
     */
    private WdMult lookupWdMult(String wd, String periodType) {
        return WD_MULTIPLIERS.get(new WdKey(wd, periodType));
    }

    private long insertPrediction(PeriodContext ctx, String wd, String lineType,
            double weightedSum, WdMult mult, Timestamp generatedAt) {
        Long low = mult == null ? null : Math.round(weightedSum * mult.low());
        Long high = mult == null ? null : Math.round(weightedSum * mult.high());
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("period_name", ctx.periodName())
                .addValue("period_end_date", Date.valueOf(ctx.periodEndDate()))
                .addValue("period_type", ctx.periodType())
                .addValue("wd", wd)
                .addValue("line_type", lineType)
                .addValue("weighted_sum", Math.round(weightedSum))
                .addValue("prediction_low", low)
                .addValue("prediction_high", high)
                .addValue("model_version", MODEL_VERSION)
                .addValue("generated_at", generatedAt);
        KeyHolder kh = new GeneratedKeyHolder();
        named.update(INSERT_PREDICTION_SQL, p, kh, new String[] { "PREDICTION_ID" });
        Number key = kh.getKey();
        if (key == null) {
            throw new IllegalStateException("INSERT returned no PREDICTION_ID");
        }
        return key.longValue();
    }

    private void insertSnapshots(long predictionId, String periodName, String wd,
            String lineType, SourceQuery source,
            List<WeightedDay> rows, Timestamp generatedAt) {
        for (WeightedDay wdRow : rows) {
            MapSqlParameterSource p = new MapSqlParameterSource()
                    .addValue("prediction_id", predictionId)
                    .addValue("period_name", periodName)
                    .addValue("wd", wd)
                    .addValue("line_type", lineType)
                    .addValue("source_query", source.name())
                    .addValue("count_date", Date.valueOf(wdRow.date()))
                    .addValue("day_offset", wdRow.offset())
                    .addValue("per_day_weight", wdRow.weight())
                    .addValue("line_count", wdRow.count())
                    .addValue("generated_at", generatedAt);
            named.update(INSERT_SNAPSHOT_SQL, p);
        }
    }

    private static Map<String, Object> segmentReport(SegmentAgg agg, WdMult mult) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("weighted_sum", round1(agg.weightedSum()));
        m.put("prediction_low", mult == null ? null : Math.round(agg.weightedSum() * mult.low()));
        m.put("prediction_high", mult == null ? null : Math.round(agg.weightedSum() * mult.high()));
        m.put("days", agg.toMap().get("days"));
        return m;
    }

    private static double round1(double d) {
        return Math.round(d * 10.0) / 10.0;
    }

    // --- Calendar helpers ---------------------------------------------------

    static int fiscalYearFor(LocalDate date) {
        LocalDate fyEndThisYear = CiscoFiscalCalendar.fyEnd(date.getYear());
        return date.isAfter(fyEndThisYear) ? date.getYear() + 1 : date.getYear();
    }

    private static LocalDate findNextPeriodEnd(LocalDate today, int fy) {
        LocalDate[] ends = CiscoFiscalCalendar.periodEndDates(fy);
        for (LocalDate end : ends) {
            if (!end.isBefore(today)) {
                return end;
            }
        }
        return null;
    }

    private static int indexOfPeriodEnd(LocalDate end, int fy) {
        LocalDate[] ends = CiscoFiscalCalendar.periodEndDates(fy);
        for (int i = 0; i < ends.length; i++) {
            if (ends[i].equals(end)) {
                return i;
            }
        }
        throw new IllegalStateException("Period end " + end + " not found in FY" + fy);
    }

    private static String periodNameForIndex(LocalDate periodEnd) {
        String mon = periodEnd.getMonth().name().substring(0, 3);
        String yy = String.format("%02d", periodEnd.getYear() % 100);
        return mon + "-" + yy;
    }

    /** Index 2,5,8 = QE; 11 = YE; others = ME. */
    private static String classifyPeriod(int periodIdx) {
        if (periodIdx == 11)
            return "YE";
        if (periodIdx == 2 || periodIdx == 5 || periodIdx == 8)
            return "QE";
        return "ME";
    }

    /**
     * Return the WD-N label for {@code today} relative to {@code periodEnd}.
     * Counts business days in {@code [today, periodEnd-1]}; weekend days inherit
     * the label of the next upcoming business day (e.g. a Sunday three days
     * before PE shares its label with the following Monday).
     *
     * <p>Returns {@code null} only when today is on or after PE (those days
     * belong to the next close cycle, picked up by {@link #computePeriodContext}
     * on the next run), or when no business-day path of length <= 60 exists.
     *
     * <p>Originally limited to WD-3/-2/-1 (predecessor's formal prediction days);
     * generalised so we can persist daily snapshots throughout the close window
     * — including weekends — as training data. Bounds are only meaningful at
     * WD-3/-2/-1 (see {@link #lookupWdMult}); other days persist with NULL bounds.
     */
    static String workDayLabel(LocalDate today, LocalDate periodEnd) {
        if (!today.isBefore(periodEnd)) {
            return null;
        }
        LocalDate cursor = periodEnd.minusDays(1);
        int bizDays = 0;
        while (!cursor.isBefore(today)) {
            if (cursor.getDayOfWeek() != DayOfWeek.SATURDAY
                    && cursor.getDayOfWeek() != DayOfWeek.SUNDAY) {
                bizDays++;
            }
            if (cursor.equals(today)) {
                return bizDays > 0 ? "WD-" + bizDays : null;
            }
            cursor = cursor.minusDays(1);
            if (bizDays > 60) {
                return null;
            }
        }
        return null;
    }

    private static LocalDate previousBusinessDay(LocalDate d) {
        LocalDate p = d.minusDays(1);
        while (p.getDayOfWeek() == DayOfWeek.SATURDAY || p.getDayOfWeek() == DayOfWeek.SUNDAY) {
            p = p.minusDays(1);
        }
        return p;
    }

    // ------------------------------------------------------------------------
    // VALUE TYPES
    // ------------------------------------------------------------------------

    public enum SourceQuery {
        PRODUCT_PROMISE_DATE,
        SERVICE_FUTURE_INVOICE_RELEASE,
        SERVICE_FLEXIBLE_INVOICE
    }

    public record DateWindow(LocalDate start, LocalDate end) {
    }

    public record DayCount(LocalDate date, long count) {
    }

    public record WdMult(double low, double high) {
    }

    private record DayKey(String segment, SourceQuery source, int offset) {
    }

    private record WdKey(String wd, String periodType) {
    }

    private record WeightedDay(LocalDate date, int offset, double weight,
            long count, double contribution) {
    }

    private record SegmentAgg(double weightedSum, List<WeightedDay> weightedRows) {
        Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("weighted_sum", round1(weightedSum));
            List<Map<String, Object>> days = new ArrayList<>(weightedRows.size());
            for (WeightedDay w : weightedRows) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("date", w.date().toString());
                r.put("offset", w.offset());
                r.put("weight", w.weight());
                r.put("count", w.count());
                r.put("contribution", round1(w.contribution()));
                days.add(r);
            }
            m.put("days", days);
            return m;
        }
    }

    public record PeriodContext(String periodName, LocalDate periodEndDate,
            String periodType, String wd) {
        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("period_name", periodName);
            m.put("period_end_date", periodEndDate.toString());
            m.put("period_type", periodType);
            m.put("wd", wd);
            return m;
        }
    }
}
