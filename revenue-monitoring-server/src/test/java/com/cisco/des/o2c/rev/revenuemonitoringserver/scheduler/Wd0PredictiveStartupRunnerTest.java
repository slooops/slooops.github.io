package com.cisco.des.o2c.rev.revenuemonitoringserver.scheduler;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Wd0PredictiveStartupRunnerTest {

    @Mock
    private Wd0PredictiveService service;

    private Wd0PredictiveStartupRunner runner;

    @BeforeEach
    void setUp() throws Exception {
        runner = new Wd0PredictiveStartupRunner(service);
    }

    private void setField(String name, Object value) throws Exception {
        Field f = Wd0PredictiveStartupRunner.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(runner, value);
    }

    @Test
    void run_defaultDate_callsDryRun() throws Exception {
        setField("wd", "");
        setField("runDateStr", "");
        when(service.dryRun(any(), isNull())).thenReturn(Map.of("status", "ok"));

        runner.run();

        verify(service).dryRun(any(), isNull());
    }

    @Test
    void run_withExplicitWdAndDate_callsDryRun() throws Exception {
        setField("wd", "WD-3");
        setField("runDateStr", "2026-05-20");
        when(service.dryRun(any(), eq("WD-3"))).thenReturn(Map.of("status", "ok"));

        runner.run();

        verify(service).dryRun(any(), eq("WD-3"));
    }

    @Test
    void run_handlesException_gracefully() throws Exception {
        setField("wd", "WD-3");
        setField("runDateStr", "2026-05-20");
        when(service.dryRun(any(), eq("WD-3")))
                .thenThrow(new RuntimeException("DB not available"));

        // Should not throw
        runner.run();

        verify(service).dryRun(any(), eq("WD-3"));
    }

    @Test
    void run_withNullWd_passesNullToService() throws Exception {
        setField("wd", null);
        setField("runDateStr", "2026-05-20");
        when(service.dryRun(any(), isNull())).thenReturn(Map.of());

        runner.run();

        verify(service).dryRun(any(), isNull());
    }
}
