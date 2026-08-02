package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ControlMAlertUpserterTest {

    @Mock
    private NamedParameterJdbcTemplate mockNamedTemplate;
    @Mock
    private JdbcTemplate jdbcTemplate;

    private ControlMAlertUpserter upserter;

    @BeforeEach
    void setUp() {
        upserter = new ControlMAlertUpserter(jdbcTemplate);
        // Replace the internal NamedParameterJdbcTemplate with our mock
        try {
            var field = ControlMAlertUpserter.class.getDeclaredField("named");
            field.setAccessible(true);
            field.set(upserter, mockNamedTemplate);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void upsert_returnsZero_whenNullList() {
        assertEquals(0, upserter.upsert(null));
    }

    @Test
    void upsert_returnsZero_whenEmptyList() {
        assertEquals(0, upserter.upsert(Collections.emptyList()));
    }

    @Test
    void upsert_callsBatchUpdate_withCorrectSize() {
        Timestamp now = Timestamp.from(Instant.now());
        ControlMAlertRow row = new ControlMAlertRow(
                "ctmpsrv1:abc123", "DAILY_JOB", "FIN_O2C", "REV_CLOSE",
                1, "FAILED", "ctmpsrv1", now, now, now, 300L);

        when(mockNamedTemplate.batchUpdate(anyString(), any(SqlParameterSource[].class)))
                .thenReturn(new int[] { 1 });

        int result = upserter.upsert(List.of(row));
        assertEquals(1, result);

        verify(mockNamedTemplate).batchUpdate(anyString(), any(SqlParameterSource[].class));
    }

    @Test
    void upsert_handlesSuccessNoInfoReturnCode() {
        ControlMAlertRow row = new ControlMAlertRow(
                "ctmpsrv1:x1", "JOB1", "APP", "SUB", 0, "FAILED", "srv", null, null, null, null);

        // Statement.SUCCESS_NO_INFO == -2
        when(mockNamedTemplate.batchUpdate(anyString(), any(SqlParameterSource[].class)))
                .thenReturn(new int[] { Statement.SUCCESS_NO_INFO });

        int result = upserter.upsert(List.of(row));
        assertEquals(1, result); // SUCCESS_NO_INFO counts as 1
    }

    @Test
    void upsert_handlesMultipleRows() {
        List<ControlMAlertRow> rows = List.of(
                new ControlMAlertRow("id1", "j1", "A", "S", 1, "FAILED", "s", null, null, null, null),
                new ControlMAlertRow("id2", "j2", "A", "S", 0, "DELAYED", "s", null, null, null, null),
                new ControlMAlertRow("id3", "j3", "A", "S", 2, "FAILED", "s", null, null, null, null));

        when(mockNamedTemplate.batchUpdate(anyString(), any(SqlParameterSource[].class)))
                .thenReturn(new int[] { 1, 1, 0 }); // Third row was duplicate

        int result = upserter.upsert(rows);
        assertEquals(2, result);
    }

    @Test
    void upsert_returnsZero_onException() {
        ControlMAlertRow row = new ControlMAlertRow(
                "ctmpsrv1:err", "fail_job", "APP", "SUB", 0, "FAILED", "srv", null, null, null, null);

        when(mockNamedTemplate.batchUpdate(anyString(), any(SqlParameterSource[].class)))
                .thenThrow(new RuntimeException("DB connection refused"));

        int result = upserter.upsert(List.of(row));
        assertEquals(0, result);
    }

    @Test
    void upsert_handlesNullFieldsInRow() {
        // Row with many nulls — should not throw NPE
        ControlMAlertRow row = new ControlMAlertRow(
                "id:nulls", null, null, null, null, "FAILED", null, null, null, null, null);

        when(mockNamedTemplate.batchUpdate(anyString(), any(SqlParameterSource[].class)))
                .thenReturn(new int[] { 1 });

        int result = upserter.upsert(List.of(row));
        assertEquals(1, result);
    }

    @Test
    void upsert_sqlContainsMergeKeyword() throws Exception {
        // Verify the SQL uses MERGE (not INSERT) for dedup
        var sqlField = ControlMAlertUpserter.class.getDeclaredField("MERGE_SQL");
        sqlField.setAccessible(true);
        String sql = (String) sqlField.get(null);
        assertTrue(sql.startsWith("MERGE INTO"));
        assertTrue(sql.contains("CTM_JOB_ID"));
        assertTrue(sql.contains("WHEN NOT MATCHED THEN"));
    }
}
