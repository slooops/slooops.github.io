package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Background poller that runs the Control-M → Oracle sync cycle.
 *
 * <p>
 * Replaces the standalone {@code controlm-sync} Python container — instead
 * of an OpenShift sidecar pod, the work runs as a {@link Scheduled} task inside
 * the existing revenue-monitoring-server JVM (the application already enables
 * scheduling via {@code @EnableScheduling}).
 *
 * <p>
 * The cycle runs every {@code controlm.sync.poll-interval-seconds} (default
 * 60s). Cycles are mutually exclusive — the {@code @Scheduled} thread pool
 * runs one bean method at a time per bean instance.
 */
@Component
@ConditionalOnProperty(prefix = "controlm.sync", name = "enabled", havingValue = "true")
public class ControlMSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(ControlMSyncScheduler.class);

    private final ControlMApiClient apiClient;
    private final ControlMAlertUpserter upserter;

    public ControlMSyncScheduler(ControlMApiClient apiClient, ControlMAlertUpserter upserter) {
        this.apiClient = apiClient;
        this.upserter = upserter;
    }

    /**
     * Fixed-delay loop: waits {@code poll-interval-seconds} AFTER each cycle
     * finishes before starting the next one. This matches the Python container's
     * "sleep N seconds between cycles" behavior and avoids overlapping calls when
     * a single cycle slows down.
     *
     * <p>
     * Spring resolves {@code ${...}} placeholders at startup, so the property
     * must be a parseable long-of-milliseconds expression.
     */
    @Scheduled(fixedDelayString = "#{ ${controlm.sync.poll-interval-seconds:60} * 1000 }", initialDelay = 30_000L)
    public void runCycle() {
        long started = System.currentTimeMillis();
        try {
            List<ControlMAlertRow> rows = apiClient.fetchAllScopes();
            if (rows.isEmpty()) {
                log.debug("[CTM] No new rows this cycle.");
                return;
            }
            int written = upserter.upsert(rows);
            if (written > 0) {
                log.debug("[CTM] Upserted {} new row(s) (fetched={}, elapsed={}ms)",
                        written, rows.size(), System.currentTimeMillis() - started);
            }
        } catch (Exception ex) {
            // Never propagate — the scheduler must keep running.
            log.error("[CTM] Cycle failed: {}", ex.toString(), ex);
        }
    }
}
