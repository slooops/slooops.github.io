package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ControlMSyncSchedulerTest {

    @Mock
    private ControlMApiClient apiClient;
    @Mock
    private ControlMAlertUpserter upserter;

    private ControlMSyncScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new ControlMSyncScheduler(apiClient, upserter);
    }

    @Test
    void runCycle_doesNotUpsert_whenNoRowsFetched() {
        when(apiClient.fetchAllScopes()).thenReturn(Collections.emptyList());

        scheduler.runCycle();

        verify(apiClient).fetchAllScopes();
        verifyNoInteractions(upserter);
    }

    @Test
    void runCycle_callsUpsert_whenRowsFetched() {
        Timestamp now = Timestamp.from(Instant.now());
        List<ControlMAlertRow> rows = List.of(
                new ControlMAlertRow("id1", "job1", "FIN_O2C", "SUB", 1, "FAILED", "srv1",
                        now, now, now, 120L));
        when(apiClient.fetchAllScopes()).thenReturn(rows);
        when(upserter.upsert(rows)).thenReturn(1);

        scheduler.runCycle();

        verify(apiClient).fetchAllScopes();
        verify(upserter).upsert(rows);
    }

    @Test
    void runCycle_doesNotPropagate_apiClientException() {
        when(apiClient.fetchAllScopes()).thenThrow(new RuntimeException("Connection timeout"));

        // Should NOT throw
        scheduler.runCycle();

        verify(apiClient).fetchAllScopes();
        verifyNoInteractions(upserter);
    }

    @Test
    void runCycle_doesNotPropagate_upserterException() {
        List<ControlMAlertRow> rows = List.of(
                new ControlMAlertRow("id:ex", "job", "APP", "S", 0, "DELAYED", "s",
                        null, null, null, null));
        when(apiClient.fetchAllScopes()).thenReturn(rows);
        when(upserter.upsert(rows)).thenThrow(new RuntimeException("ORA-00942"));

        // Should NOT throw
        scheduler.runCycle();

        verify(upserter).upsert(rows);
    }

    @Test
    void runCycle_handlesMultipleRows() {
        List<ControlMAlertRow> rows = List.of(
                new ControlMAlertRow("id1", "j1", "A", "S", 1, "FAILED", "s", null, null, null, null),
                new ControlMAlertRow("id2", "j2", "A", "S", 0, "DELAYED", "s", null, null, null, null),
                new ControlMAlertRow("id3", "j3", "A", "S", 3, "FAILED", "s", null, null, null, null));
        when(apiClient.fetchAllScopes()).thenReturn(rows);
        when(upserter.upsert(rows)).thenReturn(2); // 1 was dedup

        scheduler.runCycle();

        verify(upserter).upsert(rows);
    }
}
