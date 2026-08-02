package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

/**
 * MERGE batch of Control-M rows into {@code ARFINRO.CTM_AI_ALERTS}.
 *
 * <p>
 * Dedup key is {@code CTM_JOB_ID} — every CTM job run has a unique id
 * like {@code ctmpsrv2:1qi2e}, so re-running the same poll cycle is safe.
 *
 * <p>
 * {@code ALERT_TIME} defaults to {@code SYSDATE} on insert. The dashboard
 * queries filter by {@code ALERT_TIME >= ADD_MONTHS(SYSDATE, -1)}, so newly
 * inserted rows show up immediately.
 */
@Component
@ConditionalOnProperty(prefix = "controlm.sync", name = "enabled", havingValue = "true")
public class ControlMAlertUpserter {

    private static final Logger log = LoggerFactory.getLogger(ControlMAlertUpserter.class);

    private static final String MERGE_SQL = "MERGE INTO ARFINRO.CTM_AI_ALERTS tgt " +
            "USING ( " +
            "  SELECT :ctm_job_id      AS ctm_job_id, " +
            "         :job_name        AS job_name, " +
            "         :application     AS application, " +
            "         :sub_application AS sub_application, " +
            "         :return_code     AS return_code, " +
            "         :alert_type      AS alert_type, " +
            "         :server          AS server, " +
            "         :order_date      AS order_date, " +
            "         :start_time      AS start_time, " +
            "         :end_time        AS end_time, " +
            "         :run_time_sec    AS run_time_sec " +
            "    FROM DUAL " +
            ") src " +
            "ON (tgt.CTM_JOB_ID = src.ctm_job_id) " +
            "WHEN NOT MATCHED THEN " +
            "  INSERT (CTM_JOB_ID, JOB_NAME, APPLICATION, SUB_APPLICATION, " +
            "          RETURN_CODE, ALERT_TYPE, STATUS, SERVER, " +
            "          ORDER_DATE, START_TIME, END_TIME, RUN_TIME_SEC, ALERT_TIME) " +
            "  VALUES (src.ctm_job_id, src.job_name, src.application, src.sub_application, " +
            "          src.return_code, src.alert_type, 'PENDING', src.server, " +
            "          src.order_date, src.start_time, src.end_time, src.run_time_sec, SYSDATE)";

    private final NamedParameterJdbcTemplate named;

    public ControlMAlertUpserter(@Qualifier("primaryJdbcTemplate") JdbcTemplate primaryJdbcTemplate) {
        this.named = new NamedParameterJdbcTemplate(primaryJdbcTemplate);
    }

    /**
     * MERGE all rows in one batch. Returns the number of rows accepted by the
     * driver.
     */
    public int upsert(List<ControlMAlertRow> rows) {
        if (rows == null || rows.isEmpty()) {
            return 0;
        }

        SqlParameterSource[] batch = new SqlParameterSource[rows.size()];
        for (int i = 0; i < rows.size(); i++) {
            ControlMAlertRow r = rows.get(i);
            MapSqlParameterSource p = new MapSqlParameterSource();
            p.addValue("ctm_job_id", r.ctmJobId());
            p.addValue("job_name", nullToEmpty(r.jobName()));
            p.addValue("application", nullToEmpty(r.application()));
            p.addValue("sub_application", nullToEmpty(r.subApplication()));
            p.addValue("return_code", r.returnCode(), Types.INTEGER);
            p.addValue("alert_type", r.alertType());
            p.addValue("server", nullToEmpty(r.server()));
            p.addValue("order_date", r.orderDate(), Types.TIMESTAMP);
            p.addValue("start_time", r.startTime(), Types.TIMESTAMP);
            p.addValue("end_time", r.endTime(), Types.TIMESTAMP);
            p.addValue("run_time_sec", r.runTimeSec(), Types.NUMERIC);
            batch[i] = p;
        }

        try {
            int[] counts = named.batchUpdate(MERGE_SQL, batch);
            int total = 0;
            for (int c : counts) {
                if (c > 0)
                    total += c;
                else if (c == java.sql.Statement.SUCCESS_NO_INFO)
                    total += 1;
            }
            return total;
        } catch (Exception ex) {
            log.error("[CTM] upsert failed: {}", ex.toString(), ex);
            return 0;
        }
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
