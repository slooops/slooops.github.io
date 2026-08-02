package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration for the Control-M → ARFINRO.CTM_AI_ALERTS sync poller.
 *
 * <p>
 * Mirrors the Python {@code controlm-sync/config.py} settings. All values
 * are read from environment variables (or application.properties); secrets
 * (the two CTM API keys) must NOT be committed.
 *
 * <p>
 * The poller is gated behind {@code controlm.sync.enabled=true} so local
 * IntelliJ runs without the env vars set will not attempt to call CTM or fail.
 */
@ConfigurationProperties(prefix = "controlm.sync")
public class ControlMSyncProperties {

    /** Master on/off switch. Default false so it stays dormant in local dev. */
    private boolean enabled = false;

    /** Base URL for the CTM Automation API (no trailing slash). */
    private String apiBase = "https://ctm-p.cisco.com:8443/automation-api";

    /**
     * Disable SSL cert validation (Cisco internal CTM hosts use self-signed certs).
     */
    private boolean verifySsl = false;

    /** Seconds between fetch cycles. */
    private long pollIntervalSeconds = 60L;

    /** Max rows returned per (scope × status) request. */
    private int fetchLimit = 100;

    /** CTM statuses to poll each cycle. */
    private List<String> pollStatuses = new ArrayList<>(List.of("Ended Not OK", "Late"));

    /** Per-application scopes (server + application + API key). */
    private List<Scope> scopes = new ArrayList<>();

    public static class Scope {
        /** CTM server name, e.g. ctmpsrv1 / ctmpsrv2. */
        private String server;
        /** CTM application, e.g. FIN_O2C / FIN_I2C. */
        private String application;
        /** Static "x-api-key" header value for this scope. */
        private String apiKey;

        public String getServer() {
            return server;
        }

        public void setServer(String server) {
            this.server = server;
        }

        public String getApplication() {
            return application;
        }

        public void setApplication(String application) {
            this.application = application;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getApiBase() {
        return apiBase;
    }

    public void setApiBase(String apiBase) {
        this.apiBase = apiBase;
    }

    public boolean isVerifySsl() {
        return verifySsl;
    }

    public void setVerifySsl(boolean verifySsl) {
        this.verifySsl = verifySsl;
    }

    public long getPollIntervalSeconds() {
        return pollIntervalSeconds;
    }

    public void setPollIntervalSeconds(long pollIntervalSeconds) {
        this.pollIntervalSeconds = pollIntervalSeconds;
    }

    public int getFetchLimit() {
        return fetchLimit;
    }

    public void setFetchLimit(int fetchLimit) {
        this.fetchLimit = fetchLimit;
    }

    public List<String> getPollStatuses() {
        return pollStatuses;
    }

    public void setPollStatuses(List<String> pollStatuses) {
        this.pollStatuses = pollStatuses;
    }

    public List<Scope> getScopes() {
        return scopes;
    }

    public void setScopes(List<Scope> scopes) {
        this.scopes = scopes;
    }
}
