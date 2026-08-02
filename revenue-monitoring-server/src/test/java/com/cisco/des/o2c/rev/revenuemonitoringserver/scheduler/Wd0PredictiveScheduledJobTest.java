package com.cisco.des.o2c.rev.revenuemonitoringserver.scheduler;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.PeriodContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Wd0PredictiveScheduledJobTest {

    @Mock
    private Wd0PredictiveService service;

    private Wd0PredictiveScheduledJob job;

    @BeforeEach
    void setUp() {
        job = new Wd0PredictiveScheduledJob(service);
    }

    @Test
    void runAtThreePmPacific_skipsWhenNotInCloseWindow() {
        // When WD is null (not in close window), job should skip without calling
        // generatePredictions
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", null);
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);

        job.runAtThreePmPacific();

        verify(service, never()).generatePredictions(any(), any());
    }

    @Test
    void runAtThreePmPacific_runsWhenInCloseWindow() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", "WD-3");
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.generatePredictions(any(LocalDate.class), eq("WD-3")))
                .thenReturn(List.of(Map.of("wd", "WD-3")));

        job.runAtThreePmPacific();

        verify(service).generatePredictions(any(LocalDate.class), eq("WD-3"));
    }

    @Test
    void runAtThreePmPacific_handlesContextException() {
        when(service.computePeriodContext(any(LocalDate.class)))
                .thenThrow(new RuntimeException("DB connection failed"));

        // Should not throw - logs error and returns
        job.runAtThreePmPacific();

        verify(service, never()).generatePredictions(any(), any());
    }

    @Test
    void runAtThreePmPacific_handlesPredictionException() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", "WD-2");
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.generatePredictions(any(LocalDate.class), eq("WD-2")))
                .thenThrow(new RuntimeException("Oracle DB link down"));

        // Should not throw - logs error and returns
        job.runAtThreePmPacific();

        verify(service).generatePredictions(any(LocalDate.class), eq("WD-2"));
    }
}
