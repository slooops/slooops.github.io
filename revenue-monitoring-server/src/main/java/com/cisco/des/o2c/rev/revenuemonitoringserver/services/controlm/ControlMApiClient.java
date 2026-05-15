package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import javax.net.ssl.SSLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Control-M Automation API client.
 *
 * <p>
 * Auth: static {@code x-api-key} header (NOT a Bearer token).
 * Cisco CTM issues one key per application scope; this client loops over
 * every scope × status pair configured in {@link ControlMSyncProperties}.
 *
 * <p>
 * Endpoint: {@code GET /run/jobs/status}
 * 
 * <pre>
 *   server       — CTM server name (ctmpsrv1 / ctmpsrv2)
 *   application  — FIN_O2C / FIN_I2C
 *   status       — "Ended Not OK" | "Late"
 *   orderDate    — "ODAT" (today, per CTM convention)
 *   limit        — rows per call
 * </pre>
 */
@Component
@EnableConfigurationProperties(ControlMSyncProperties.class)
@ConditionalOnProperty(prefix = "controlm.sync", name = "enabled", havingValue = "true")
public class ControlMApiClient {

    private static final Logger log = LoggerFactory.getLogger(ControlMApiClient.class);

    private static final Map<String, String> STATUS_TO_ALERT_TYPE = Map.of(
            "Ended Not OK", "FAILED",
            "Late", "DELAYED",
            "Abended", "ABEND");

    // CTM sometimes returns "2026/04/24 09:31:45", sometimes ISO-8601, sometimes
    // "YYYYMMDDHHMMSS". Try them all.
    private static final String[] DATETIME_FORMATS = {
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss.SSS",
            "yyyy/MM/dd HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss",
            "yyyyMMddHHmmss",
            "yyyyMMdd HHmmss"
    };

    private final ControlMSyncProperties props;
    private final WebClient webClient;

    public ControlMApiClient(ControlMSyncProperties props) {
        this.props = props;
        this.webClient = buildWebClient(props);
    }

    private static WebClient buildWebClient(ControlMSyncProperties props) {
        HttpClient httpClient = HttpClient.create();
        if (!props.isVerifySsl()) {
            try {
                var sslCtx = SslContextBuilder.forClient()
                        .trustManager(InsecureTrustManagerFactory.INSTANCE)
                        .build();
                httpClient = httpClient.secure(spec -> spec.sslContext(sslCtx));
            } catch (SSLException e) {
                throw new IllegalStateException("Failed to build insecure SSL context for CTM client", e);
            }
        }
        return WebClient.builder()
                .baseUrl(stripTrailingSlash(props.getApiBase()))
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(c -> c.defaultCodecs().maxInMemorySize(8 * 1024 * 1024))
                .build();
    }

    private static String stripTrailingSlash(String url) {
        if (url == null)
            return "";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /**
     * Poll every configured scope × status combination.
     * A failure on any single (scope, status) pair is logged and skipped —
     * the rest are still attempted.
     */
    public List<ControlMAlertRow> fetchAllScopes() {
        List<ControlMAlertRow> results = new ArrayList<>();

        for (ControlMSyncProperties.Scope scope : props.getScopes()) {
            if (scope.getApiKey() == null || scope.getApiKey().isBlank()) {
                log.warn("[CTM] No API key configured for scope {}/{} — skipping.",
                        scope.getServer(), scope.getApplication());
                continue;
            }

            for (String ctmStatus : props.getPollStatuses()) {
                try {
                    results.addAll(fetchOne(scope, ctmStatus));
                } catch (Exception ex) {
                    log.error("[CTM] fetch failed [{}/{} status={}]: {}",
                            scope.getServer(), scope.getApplication(), ctmStatus, ex.toString());
                }
            }
        }
        return results;
    }

    @SuppressWarnings("unchecked")
    private List<ControlMAlertRow> fetchOne(ControlMSyncProperties.Scope scope, String ctmStatus) {
        Map<String, Object> body = webClient.get()
                .uri(uri -> uri.path("/run/jobs/status")
                        .queryParam("server", scope.getServer())
                        .queryParam("application", scope.getApplication())
                        .queryParam("status", ctmStatus)
                        .queryParam("orderDate", "ODAT")
                        .queryParam("limit", String.valueOf(props.getFetchLimit()))
                        .build())
                .header("x-api-key", scope.getApiKey())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        List<Map<String, Object>> statuses = body == null
                ? List.of()
                : (List<Map<String, Object>>) body.getOrDefault("statuses", List.of());

        String alertType = STATUS_TO_ALERT_TYPE.getOrDefault(ctmStatus, "FAILED");
        List<ControlMAlertRow> out = new ArrayList<>(statuses.size());

        for (Map<String, Object> item : statuses) {
            String jobId = firstNonBlank(item, "jobId", "jobid");
            if (jobId == null) {
                // CTM occasionally returns rows without a jobId; skip them.
                continue;
            }
            out.add(new ControlMAlertRow(
                    jobId,
                    firstNonBlank(item, "name", "jobName"),
                    strOr(item.get("application"), scope.getApplication()),
                    firstNonBlank(item, "subApplication", "subapplication"),
                    parseIntSafe(firstNonBlank(item, "returnCode", "returncode")),
                    alertType,
                    strOr(item.get("server"), scope.getServer()),
                    parseOrderDate(firstNonBlank(item, "orderDate", "orderdate")),
                    parseDateTime(firstNonBlank(item, "startTime", "starttime")),
                    parseDateTime(firstNonBlank(item, "endTime", "endtime")),
                    null));
        }

        log.info("[CTM] [{}/{} status={}]: {} row(s) fetched.",
                scope.getServer(), scope.getApplication(), ctmStatus, out.size());
        return out;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static String firstNonBlank(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v != null) {
                String s = v.toString().trim();
                if (!s.isEmpty())
                    return s;
            }
        }
        return null;
    }

    private static String strOr(Object v, String fallback) {
        return v == null || v.toString().isBlank() ? fallback : v.toString();
    }

    private static Integer parseIntSafe(String s) {
        if (s == null)
            return null;
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException nfe) {
            return null;
        }
    }

    private static Timestamp parseDateTime(String s) {
        if (s == null)
            return null;
        String cleaned = s.trim().replace("Z", "").replace("+00:00", "");
        for (String fmt : DATETIME_FORMATS) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(fmt);
                sdf.setLenient(false);
                Date d = sdf.parse(cleaned);
                return new Timestamp(d.getTime());
            } catch (Exception ignored) {
                // try next
            }
        }
        return null;
    }

    /**
     * CTM order dates come back as YYMMDD (e.g. "260424") or YYYYMMDD.
     */
    private static Timestamp parseOrderDate(String s) {
        if (s == null)
            return null;
        String cleaned = s.trim();
        for (String fmt : new String[] { "yyMMdd", "yyyyMMdd", "yyyy-MM-dd" }) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(fmt);
                sdf.setLenient(false);
                Date d = sdf.parse(cleaned);
                LocalDate ld = d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                return Timestamp.valueOf(ld.atStartOfDay());
            } catch (Exception ignored) {
                // try next
            }
        }
        return null;
    }

}
