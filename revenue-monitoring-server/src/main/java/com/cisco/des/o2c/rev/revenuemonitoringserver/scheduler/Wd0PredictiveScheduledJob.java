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
 * on WD-3, WD-2, and WD-1 of each fiscal-period close window.
 *
 * <p>
 * Total 3 runs per close cycle (matches predecessor's manual cadence).
 *
 * <p>
 * Disabled by default until {@code wd0.predictions.scheduled.enabled=true}
 * is set, so this code can be deployed but stay dormant during the
 * sanity-check phase (manual triggers via POST /api/wd0/v2/projection/run).
 */
@Component
@ConditionalOnProperty(prefix = "wd0.predictions.scheduled", name = "enabled", havingValue = "true", matchIfMissing = false)
public class Wd0PredictiveScheduledJob {

    private static final Logger log = LoggerFactory.getLogger(Wd0PredictiveScheduledJob.class);

    private final Wd0PredictiveService service;

    public Wd0PredictiveScheduledJob(Wd0PredictiveService service) {
        this.service = service;
    }

    /**
     * Fires at 3:00 PM Pacific Monday-Friday. The service only persists a
     * prediction if today is WD-3/-2/-1 of an upcoming period close; on all
     * other weekdays the job logs and exits cheaply.
     */
    @Scheduled(cron = "0 0 15 * * MON-FRI", zone = "America/Los_Angeles")
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
            log.debug("3pm Pacific job: {} is not WD-3/-2/-1 of {} - skipping",
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
