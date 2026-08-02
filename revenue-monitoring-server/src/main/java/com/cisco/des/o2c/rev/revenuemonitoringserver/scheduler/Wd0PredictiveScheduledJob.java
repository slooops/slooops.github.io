package com.cisco.des.o2c.rev.revenuemonitoringserver.scheduler;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.PeriodContext;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Runs Jae Won Yoon's (RIP) WD0 prediction method automatically at 3pm Pacific
 * every day of the close window (including weekends).
 *
 * <p>
 * Fires every day of the week. The service captures predictions + raw
 * per-day-bucket snapshots for every day up to ~WD-30 of the next upcoming
 * period_end. Weekend days inherit the WD label of the next upcoming business
 * day (so Sat/Sun between two business days share that business day's WD-N).
 * Bounds (PREDICTION_LOW/HIGH) are only populated at WD-3/-2/-1 (the
 * predecessor's calibrated days); other days persist {@code weighted_sum}
 * plus snapshots with NULL bounds, purely as training data for the FY27
 * retrain.
 *
 * <p>
 * <b>Enabled by default</b> (opt-out, not opt-in). The bean is created
 * unless {@code wd0.predictions.scheduled.enabled} is explicitly set to
 * {@code false}. This is deliberate: on 2026-06-17 a stash-commit wiped the
 * enable line from {@code application.properties} and the cron went dark
 * for ~25 days because the previous {@code matchIfMissing=false} semantics
 * meant "no property → no bean → no writes to JSR_WD0_PREDICTIONS /
 * JSR_WD0_RAW_SNAPSHOTS." Flipping to {@code matchIfMissing=true} makes
 * deployed environments resilient to future config-file mishaps.
 *
 * <p>
 * Local dev safety: {@code application-local.yml} explicitly sets
 * {@code wd0.predictions.scheduled.enabled: false}, so IntelliJ runs with
 * {@code -Dspring.profiles.active=local} still no-op and never write to
 * the DB. The {@code CONTROLM_SYNC_ENABLED} env-var pattern is the
 * belt-and-suspenders layer at the deployment level.
 *
 * <p>
 * Manual triggers remain available via {@code POST /api/wd0/v2/projection/run}
 * regardless of this flag.
 */
@Component
@ConditionalOnProperty(prefix = "wd0.predictions.scheduled", name = "enabled", havingValue = "true", matchIfMissing = true)
public class Wd0PredictiveScheduledJob {

    private static final Logger log = LoggerFactory.getLogger(Wd0PredictiveScheduledJob.class);

    private final Wd0PredictiveService service;

    public Wd0PredictiveScheduledJob(Wd0PredictiveService service) {
        this.service = service;
    }

    /**
     * Fires at 3:00 PM Pacific every day of the week. The service computes the
     * WD label for today relative to the next upcoming period_end (WD-1, WD-2,
     * ... up to ~WD-30, with weekend days inheriting the following business
     * day's label) and persists a snapshot. On the PE date itself (Saturday)
     * and PE+1 (Sunday), {@code workDayLabel} returns null — those belong to
     * the next close cycle, picked up by the Monday run.
     */
    @Scheduled(cron = "0 0 15 * * *", zone = "America/Los_Angeles")
    public void runAtThreePmPacific() {
        LocalDate today = LocalDate.now(Wd0PredictiveService.PACIFIC);
        PeriodContext ctx;
        try {
            ctx = service.computePeriodContext(today);
        } catch (Exception e) {
            log.error("Could not compute period context for {}: {}", today, e.getMessage());
            return;
        }

        if (ctx.wd() == null) {
            log.debug("3pm Pacific job: {} has no WD label for {} - skipping",
                    today, ctx.periodName());
            return;
        }

        log.info("3pm Pacific WD0 prediction run: period={} ({}), wd={}",
                ctx.periodName(), ctx.periodType(), ctx.wd());
        try {
            service.generatePredictions(today, ctx.wd());
        } catch (Exception e) {
            log.error("WD0 prediction run FAILED for period={} wd={}: {}",
                    ctx.periodName(), ctx.wd(), e.getMessage(), e);
        }
    }
}
