package com.cisco.des.o2c.rev.revenuemonitoringserver.scheduler;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;

/**
 * LOCAL DEV ONLY: fires one prediction pass at server boot so you can verify
 * the 3 source queries (especially PRODUCT/Promise Date with the
 * {@code @FINFBLBLO_LINK.CISCO.COM} DB link) actually execute from the Spring
 * server. Without this, nothing fires until the 3pm Pacific cron hits or
 * someone curls an endpoint.
 *
 * <p>
 * Disabled by default. Enable locally with:
 * 
 * <pre>
 *   wd0.predictions.startup.dry-run-on-boot=true
 *   wd0.predictions.startup.wd=WD-3            # optional, defaults to auto-detect
 *   wd0.predictions.startup.run-date=2026-05-20 # optional, defaults to today
 * </pre>
 *
 * <p>
 * <b>Do not enable in deployed environments.</b> This is a sanity-check
 * harness, not production behavior.
 */
@Component
@ConditionalOnProperty(prefix = "wd0.predictions.startup", name = "dry-run-on-boot", havingValue = "true", matchIfMissing = false)
public class Wd0PredictiveStartupRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(Wd0PredictiveStartupRunner.class);

    private final Wd0PredictiveService service;

    @Value("${wd0.predictions.startup.wd:}")
    private String wd;

    @Value("${wd0.predictions.startup.run-date:}")
    private String runDateStr;

    public Wd0PredictiveStartupRunner(Wd0PredictiveService service) {
        this.service = service;
    }

    @Override
    public void run(String... args) {
        LocalDate runDate = (runDateStr == null || runDateStr.isBlank())
                ? LocalDate.now(Wd0PredictiveService.PACIFIC)
                : LocalDate.parse(runDateStr);
        String effectiveWd = (wd == null || wd.isBlank()) ? null : wd;

        log.info("[WD0-DEV] ============================================================");
        log.info("[WD0-DEV] STARTUP DRY-RUN runDate={} wd={}", runDate, effectiveWd);
        log.info("[WD0-DEV] ============================================================");
        try {
            Map<String, Object> result = service.dryRun(runDate, effectiveWd);
            log.info("[WD0-DEV] STARTUP DRY-RUN RESULT: {}", result);
        } catch (Exception e) {
            log.error("[WD0-DEV] STARTUP DRY-RUN FAILED: {}", e.getMessage(), e);
        }
        log.info("[WD0-DEV] ============================================================");
    }
}
