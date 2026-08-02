package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.DateWindow;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.PeriodContext;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.SourceQuery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * WD0 Predictions v2 - parallel to legacy {@code /api/wd0-*} endpoints.
 *
 * <p>
 * Mounted at {@code /api/wd0/v2/*} so the existing dashboard endpoints
 * stay untouched. The new {@code wd0-predictions} Angular component will
 * consume only these endpoints.
 */
@RestController
@RequestMapping("/api/wd0/v2")
public class Wd0PredictiveController {

    private static final Logger log = LoggerFactory.getLogger(Wd0PredictiveController.class);

    private final Wd0PredictiveService service;

    public Wd0PredictiveController(Wd0PredictiveService service) {
        this.service = service;
    }

    /**
     * Fiscal-calendar context for today (Pacific): next upcoming period_end,
     * period type (ME/QE/YE), and which WD today is (if in close window).
     */
    @GetMapping("/calendar")
    public ResponseEntity<Map<String, Object>> calendar() {
        LocalDate today = LocalDate.now(Wd0PredictiveService.PACIFIC);
        PeriodContext ctx = service.computePeriodContext(today);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("today_pacific", today.toString());
        body.put("period", ctx.toMap());

        // Also include the three windows for transparency in the UI.
        Map<String, Object> windows = new LinkedHashMap<>();
        for (SourceQuery q : SourceQuery.values()) {
            DateWindow w = service.windowFor(q, ctx.periodEndDate());
            windows.put(q.name(), Map.of(
                    "window_start", w.start().toString(),
                    "window_end", w.end().toString()));
        }
        body.put("source_windows", windows);
        body.put("model_version", Wd0PredictiveService.MODEL_VERSION);
        return ResponseEntity.ok(body);
    }

    /**
     * Latest persisted predictions for a given period (defaults to next upcoming).
     */
    @GetMapping("/projection")
    public ResponseEntity<List<Map<String, Object>>> projection(
            @RequestParam(value = "period_name", required = false) String periodName) {
        if (periodName == null || periodName.isBlank()) {
            LocalDate today = LocalDate.now(Wd0PredictiveService.PACIFIC);
            periodName = service.computePeriodContext(today).periodName();
        }
        return ResponseEntity.ok(service.getLatestPredictions(periodName));
    }

    /**
     * All raw per-query snapshots for a period (audit trail + training data).
     */
    @GetMapping("/raw-snapshots")
    public ResponseEntity<List<Map<String, Object>>> rawSnapshots(
            @RequestParam(value = "period_name", required = false) String periodName) {
        if (periodName == null || periodName.isBlank()) {
            LocalDate today = LocalDate.now(Wd0PredictiveService.PACIFIC);
            periodName = service.computePeriodContext(today).periodName();
        }
        return ResponseEntity.ok(service.getSnapshotsForPeriod(periodName));
    }

    /**
     * Manually trigger a prediction run. Useful during the sanity-check phase
     * where we run our system in parallel with the predecessor's manual process.
     *
     * <p>
     * If {@code wd} is omitted, the service auto-detects from today's date
     * (must be WD-3/-2/-1 Pacific, else returns 409).
     *
     * <p>
     * If {@code run_date} is omitted, defaults to today (Pacific).
     */
    @PostMapping("/projection/run")
    public ResponseEntity<List<Map<String, Object>>> runProjection(
            @RequestParam(value = "wd", required = false) String wd,
            @RequestParam(value = "run_date", required = false) String runDateStr) {
        LocalDate runDate = (runDateStr == null || runDateStr.isBlank())
                ? LocalDate.now(Wd0PredictiveService.PACIFIC)
                : LocalDate.parse(runDateStr);
        log.info("Manual WD0 prediction run requested: runDate={}, wd={}", runDate, wd);
        try {
            return ResponseEntity.ok(service.generatePredictions(runDate, wd));
        } catch (IllegalStateException e) {
            log.warn("Manual prediction run rejected: {}", e.getMessage());
            return ResponseEntity.status(409).body(List.of(Map.of("error", e.getMessage())));
        }
    }

    /**
     * Dry-run: runs the 3 source queries and computes the prediction WITHOUT
     * persisting. Returns the full per-day breakdown so you can compare line-
     * by-line with the manual Excel workbook. Useful for validating algorithm
     * changes and during the parallel-run sanity-check phase.
     */
    @GetMapping("/projection/dry-run")
    public ResponseEntity<Map<String, Object>> dryRun(
            @RequestParam(value = "wd", required = false) String wd,
            @RequestParam(value = "run_date", required = false) String runDateStr) {
        LocalDate runDate = (runDateStr == null || runDateStr.isBlank())
                ? LocalDate.now(Wd0PredictiveService.PACIFIC)
                : LocalDate.parse(runDateStr);
        log.info("WD0 dry-run requested: runDate={}, wd={}", runDate, wd);
        try {
            return ResponseEntity.ok(service.dryRun(runDate, wd));
        } catch (IllegalStateException e) {
            log.warn("Dry-run rejected: {}", e.getMessage());
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }
}
