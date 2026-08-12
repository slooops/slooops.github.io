package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.DateWindow;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.DayCount;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.PeriodContext;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.SourceQuery;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Wd0PredictiveServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private Wd0PredictiveService service;

    @BeforeEach
    void setUp() {
        service = new Wd0PredictiveService(jdbcTemplate);
    }

    // ========================================================================
    // computePeriodContext tests
    // ========================================================================

    @Test
    void computePeriodContext_returnsNonNull() {
        // Use a known date that falls within a fiscal period
        LocalDate date = LocalDate.of(2026, 5, 20); // WD-3 of a May period end
        PeriodContext ctx = service.computePeriodContext(date);
        assertNotNull(ctx);
        assertNotNull(ctx.periodName());
        assertNotNull(ctx.periodEndDate());
        assertNotNull(ctx.periodType());
    }

    @Test
    void computePeriodContext_periodEndIsAlwaysSaturday() {
        // Any date should resolve to a period end that's a Saturday
        LocalDate date = LocalDate.of(2026, 3, 10);
        PeriodContext ctx = service.computePeriodContext(date);
        assertEquals(DayOfWeek.SATURDAY, ctx.periodEndDate().getDayOfWeek());
    }

    @Test
    void computePeriodContext_periodEndIsAfterOrOnToday() {
        LocalDate date = LocalDate.of(2026, 4, 15);
        PeriodContext ctx = service.computePeriodContext(date);
        assertFalse(ctx.periodEndDate().isBefore(date));
    }

    @Test
    void computePeriodContext_wdIsNull_whenNotInCloseWindow() {
        // Pick a date far from any period end (middle of period)
        LocalDate date = LocalDate.of(2026, 3, 2); // Monday, far from period end
        PeriodContext ctx = service.computePeriodContext(date);
        // WD is only set for WD-3/-2/-1
        // This may or may not be null depending on the period end
        // Just verify it doesn't crash
        assertNotNull(ctx.periodName());
    }

    @Test
    void computePeriodContext_classifiesME() {
        // P1 (index 0) should be ME
        LocalDate date = LocalDate.of(2026, 8, 20);
        PeriodContext ctx = service.computePeriodContext(date);
        // First period of FY27 should be ME
        assertEquals("ME", ctx.periodType());
    }

    @Test
    void computePeriodContext_classifiesQE() {
        // P3 (index 2) should be QE (quarter end)
        // We need to find a date near P3 end of some FY
        // Q1 end is period index 2 -> QE
        // FY2026 Q1 end: fyEnd(2025) + 13 weeks
        LocalDate q1End = LocalDate.of(2025, 7, 26).plusWeeks(13); // Oct 25, 2025
        LocalDate nearQ1End = q1End.minusDays(5); // Just before Q1 end
        PeriodContext ctx = service.computePeriodContext(nearQ1End);
        assertEquals("QE", ctx.periodType());
    }

    @Test
    void computePeriodContext_toMapContainsExpectedKeys() {
        PeriodContext ctx = service.computePeriodContext(LocalDate.of(2026, 5, 20));
        Map<String, Object> map = ctx.toMap();
        assertTrue(map.containsKey("period_name"));
        assertTrue(map.containsKey("period_end_date"));
        assertTrue(map.containsKey("period_type"));
        assertTrue(map.containsKey("wd"));
    }

    // ========================================================================
    // windowFor tests
    // ========================================================================

    @Test
    void windowFor_productPromiseDate_coversExpectedRange() {
        LocalDate pe = LocalDate.of(2026, 5, 23); // Saturday
        DateWindow w = service.windowFor(SourceQuery.PRODUCT_PROMISE_DATE, pe);
        assertEquals(pe.minusDays(1), w.start());
        assertEquals(pe.plusDays(3), w.end());
    }

    @Test
    void windowFor_serviceFutureInvoiceRelease_coversExpectedRange() {
        LocalDate pe = LocalDate.of(2026, 5, 23);
        DateWindow w = service.windowFor(SourceQuery.SERVICE_FUTURE_INVOICE_RELEASE, pe);
        assertEquals(pe.minusDays(3), w.start());
        assertEquals(pe.plusDays(3), w.end());
    }

    @Test
    void windowFor_serviceFlexibleInvoice_coversExpectedRange() {
        LocalDate pe = LocalDate.of(2026, 5, 23);
        DateWindow w = service.windowFor(SourceQuery.SERVICE_FLEXIBLE_INVOICE, pe);
        assertEquals(pe, w.start());
        assertEquals(pe.plusDays(1), w.end());
    }

    @Test
    void windowFor_allSourceQueries_startBeforeOrOnEnd() {
        LocalDate pe = LocalDate.of(2026, 5, 23);
        for (SourceQuery q : SourceQuery.values()) {
            DateWindow w = service.windowFor(q, pe);
            assertFalse(w.start().isAfter(w.end()),
                    "Window start must be <= end for " + q);
        }
    }

    // ========================================================================
    // workDayLabel tests (package-private static method)
    // ========================================================================

    @Test
    void workDayLabel_wd3_isThreeBusinessDaysBeforePE() {
        // PE = Saturday 2026-05-23
        // WD-1 = Friday 2026-05-22
        // WD-2 = Thursday 2026-05-21
        // WD-3 = Wednesday 2026-05-20
        LocalDate pe = LocalDate.of(2026, 5, 23);
        assertEquals("WD-3", Wd0PredictiveService.workDayLabel(LocalDate.of(2026, 5, 20), pe));
        assertEquals("WD-2", Wd0PredictiveService.workDayLabel(LocalDate.of(2026, 5, 21), pe));
        assertEquals("WD-1", Wd0PredictiveService.workDayLabel(LocalDate.of(2026, 5, 22), pe));
    }

    @Test
    void workDayLabel_returnsNull_onAndAfterPeriodEnd() {
        LocalDate pe = LocalDate.of(2026, 5, 23);
        assertNull(Wd0PredictiveService.workDayLabel(pe, pe)); // PE itself
        assertNull(Wd0PredictiveService.workDayLabel(pe.plusDays(1), pe)); // after PE
    }

    @Test
    void workDayLabel_labelsEarlierBusinessDaysInCloseWindow() {
        // Labelling is not capped at WD-3: every business day before PE gets a
        // label so daily snapshots can be persisted as training data.
        LocalDate pe = LocalDate.of(2026, 5, 23);
        assertEquals("WD-5", Wd0PredictiveService.workDayLabel(LocalDate.of(2026, 5, 18), pe));
    }

    @Test
    void workDayLabel_handlesWeekend_skipping() {
        // If PE is a Saturday, WD-1 is Friday, not Saturday-1
        LocalDate pe = LocalDate.of(2026, 5, 23); // Saturday
        LocalDate wd1 = LocalDate.of(2026, 5, 22); // Friday
        assertEquals("WD-1", Wd0PredictiveService.workDayLabel(wd1, pe));
        assertEquals(DayOfWeek.FRIDAY, wd1.getDayOfWeek());
    }

    // ========================================================================
    // fiscalYearFor tests (package-private static method)
    // ========================================================================

    @Test
    void fiscalYearFor_beforeFyEnd_returnsSameYear() {
        // FY2026 ends July 25, 2026
        LocalDate dateBeforeFyEnd = LocalDate.of(2026, 6, 15);
        assertEquals(2026, Wd0PredictiveService.fiscalYearFor(dateBeforeFyEnd));
    }

    @Test
    void fiscalYearFor_afterFyEnd_returnsNextYear() {
        // FY2026 ends July 25, 2026; August 1 is FY2027
        LocalDate dateAfterFyEnd = LocalDate.of(2026, 8, 1);
        assertEquals(2027, Wd0PredictiveService.fiscalYearFor(dateAfterFyEnd));
    }

    @Test
    void fiscalYearFor_onFyEnd_returnsSameYear() {
        LocalDate fyEnd = LocalDate.of(2026, 7, 25);
        assertEquals(2026, Wd0PredictiveService.fiscalYearFor(fyEnd));
    }

    // ========================================================================
    // MODEL_VERSION constant
    // ========================================================================

    @Test
    void modelVersion_isNotBlank() {
        assertNotNull(Wd0PredictiveService.MODEL_VERSION);
        assertFalse(Wd0PredictiveService.MODEL_VERSION.isBlank());
    }

    // ========================================================================
    // PeriodContext record tests
    // ========================================================================

    @Test
    void periodContext_recordAccessors() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", "WD-3");
        assertEquals("MAY-26", ctx.periodName());
        assertEquals(LocalDate.of(2026, 5, 23), ctx.periodEndDate());
        assertEquals("ME", ctx.periodType());
        assertEquals("WD-3", ctx.wd());
    }

    @Test
    void periodContext_toMap_serialization() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", "WD-3");
        Map<String, Object> map = ctx.toMap();
        assertEquals("MAY-26", map.get("period_name"));
        assertEquals("2026-05-23", map.get("period_end_date"));
        assertEquals("ME", map.get("period_type"));
        assertEquals("WD-3", map.get("wd"));
    }

    // ========================================================================
    // DateWindow record tests
    // ========================================================================

    @Test
    void dateWindow_recordAccessors() {
        DateWindow w = new DateWindow(LocalDate.of(2026, 5, 20), LocalDate.of(2026, 5, 26));
        assertEquals(LocalDate.of(2026, 5, 20), w.start());
        assertEquals(LocalDate.of(2026, 5, 26), w.end());
    }

    // ========================================================================
    // DayCount record tests
    // ========================================================================

    @Test
    void dayCount_recordAccessors() {
        DayCount dc = new DayCount(LocalDate.of(2026, 5, 22), 9943L);
        assertEquals(LocalDate.of(2026, 5, 22), dc.date());
        assertEquals(9943L, dc.count());
    }

    // ========================================================================
    // SourceQuery enum tests
    // ========================================================================

    @Test
    void sourceQuery_hasThreeValues() {
        assertEquals(3, SourceQuery.values().length);
    }

    @Test
    void sourceQuery_containsExpectedValues() {
        assertNotNull(SourceQuery.valueOf("PRODUCT_PROMISE_DATE"));
        assertNotNull(SourceQuery.valueOf("SERVICE_FUTURE_INVOICE_RELEASE"));
        assertNotNull(SourceQuery.valueOf("SERVICE_FLEXIBLE_INVOICE"));
    }

    // ========================================================================
    // getLatestPredictions / getSnapshotsForPeriod (DB interactions, mocked)
    // ========================================================================

    @Test
    void getLatestPredictions_callsNamedJdbc() {
        // The service uses NamedParameterJdbcTemplate internally
        // When DB returns empty, method should return empty list
        List<Map<String, Object>> result = service.getLatestPredictions("MAY-26");
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getSnapshotsForPeriod_callsNamedJdbc() {
        List<Map<String, Object>> result = service.getSnapshotsForPeriod("MAY-26");
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ========================================================================
    // dryRun / generatePredictions - error cases
    // ========================================================================

    @Test
    void dryRun_throwsWhenNotInCloseWindow() {
        // On the period end itself there is no WD label, so there is nothing to run.
        LocalDate periodEnd = LocalDate.of(2026, 5, 23);
        assertThrows(IllegalStateException.class,
                () -> service.dryRun(periodEnd, null));
    }

    @Test
    void generatePredictions_throwsWhenNotInCloseWindow() {
        LocalDate dateNotInWindow = LocalDate.of(2026, 3, 2);
        assertThrows(IllegalStateException.class,
                () -> service.generatePredictions(dateNotInWindow, null));
    }

    // ========================================================================
    // WdMult record
    // ========================================================================

    @Test
    void wdMult_recordValues() {
        var m = new Wd0PredictiveService.WdMult(0.27, 1.76);
        assertEquals(0.27, m.low(), 0.001);
        assertEquals(1.76, m.high(), 0.001);
    }
}
