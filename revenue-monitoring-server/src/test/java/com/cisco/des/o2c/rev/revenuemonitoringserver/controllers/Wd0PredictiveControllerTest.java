package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.Wd0PredictiveService.PeriodContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Wd0PredictiveControllerTest {

    @Mock
    private Wd0PredictiveService service;

    private Wd0PredictiveController controller;

    @BeforeEach
    void setUp() {
        controller = new Wd0PredictiveController(service);
    }

    // ========================================================================
    // GET /api/wd0/v2/calendar
    // ========================================================================

    @Test
    void calendar_returnsOk() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", "WD-3");
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.windowFor(any(), any())).thenReturn(
                new Wd0PredictiveService.DateWindow(LocalDate.of(2026, 5, 20), LocalDate.of(2026, 5, 26)));

        ResponseEntity<Map<String, Object>> response = controller.calendar();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void calendar_bodyContainsExpectedKeys() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", "WD-3");
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.windowFor(any(), any())).thenReturn(
                new Wd0PredictiveService.DateWindow(LocalDate.of(2026, 5, 20), LocalDate.of(2026, 5, 26)));

        Map<String, Object> body = controller.calendar().getBody();
        assertTrue(body.containsKey("today_pacific"));
        assertTrue(body.containsKey("period"));
        assertTrue(body.containsKey("source_windows"));
        assertTrue(body.containsKey("model_version"));
    }

    @Test
    void calendar_modelVersionMatchesService() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", null);
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.windowFor(any(), any())).thenReturn(
                new Wd0PredictiveService.DateWindow(LocalDate.of(2026, 5, 20), LocalDate.of(2026, 5, 26)));

        Map<String, Object> body = controller.calendar().getBody();
        assertEquals(Wd0PredictiveService.MODEL_VERSION, body.get("model_version"));
    }

    // ========================================================================
    // GET /api/wd0/v2/projection
    // ========================================================================

    @Test
    void projection_withPeriodName_returnsServiceResult() {
        List<Map<String, Object>> predictions = List.of(Map.of("wd", "WD-3", "line_type", "PRODUCT"));
        when(service.getLatestPredictions("MAY-26")).thenReturn(predictions);

        ResponseEntity<List<Map<String, Object>>> response = controller.projection("MAY-26");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void projection_withoutPeriodName_defaultsToToday() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", null);
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.getLatestPredictions("MAY-26")).thenReturn(List.of());

        ResponseEntity<List<Map<String, Object>>> response = controller.projection(null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(service).computePeriodContext(any(LocalDate.class));
    }

    @Test
    void projection_withBlankPeriodName_defaultsToToday() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", null);
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.getLatestPredictions("MAY-26")).thenReturn(List.of());

        ResponseEntity<List<Map<String, Object>>> response = controller.projection("  ");
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    // ========================================================================
    // GET /api/wd0/v2/raw-snapshots
    // ========================================================================

    @Test
    void rawSnapshots_withPeriodName_returnsServiceResult() {
        List<Map<String, Object>> snapshots = List.of(Map.of("source_query", "PRODUCT_PROMISE_DATE"));
        when(service.getSnapshotsForPeriod("MAY-26")).thenReturn(snapshots);

        ResponseEntity<List<Map<String, Object>>> response = controller.rawSnapshots("MAY-26");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void rawSnapshots_withoutPeriodName_defaultsToToday() {
        PeriodContext ctx = new PeriodContext("MAY-26", LocalDate.of(2026, 5, 23), "ME", null);
        when(service.computePeriodContext(any(LocalDate.class))).thenReturn(ctx);
        when(service.getSnapshotsForPeriod("MAY-26")).thenReturn(List.of());

        ResponseEntity<List<Map<String, Object>>> response = controller.rawSnapshots(null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    // ========================================================================
    // POST /api/wd0/v2/projection/run
    // ========================================================================

    @Test
    void runProjection_success() {
        List<Map<String, Object>> predictions = List.of(Map.of("wd", "WD-3"));
        when(service.generatePredictions(any(LocalDate.class), eq("WD-3"))).thenReturn(predictions);

        ResponseEntity<List<Map<String, Object>>> response = controller.runProjection("WD-3", "2026-05-20");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void runProjection_withoutRunDate_defaultsToToday() {
        List<Map<String, Object>> predictions = List.of(Map.of("wd", "WD-3"));
        when(service.generatePredictions(any(LocalDate.class), eq("WD-3"))).thenReturn(predictions);

        ResponseEntity<List<Map<String, Object>>> response = controller.runProjection("WD-3", null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void runProjection_illegalState_returns409() {
        when(service.generatePredictions(any(LocalDate.class), isNull()))
                .thenThrow(new IllegalStateException("Not in close window"));

        ResponseEntity<List<Map<String, Object>>> response = controller.runProjection(null, "2026-03-02");
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().get(0).containsKey("error"));
    }

    // ========================================================================
    // GET /api/wd0/v2/projection/dry-run
    // ========================================================================

    @Test
    void dryRun_success() {
        Map<String, Object> result = Map.of("period", Map.of("period_name", "MAY-26"));
        when(service.dryRun(any(LocalDate.class), eq("WD-3"))).thenReturn(result);

        ResponseEntity<Map<String, Object>> response = controller.dryRun("WD-3", "2026-05-20");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void dryRun_withoutRunDate_defaultsToToday() {
        Map<String, Object> result = Map.of("wd", "WD-2");
        when(service.dryRun(any(LocalDate.class), eq("WD-2"))).thenReturn(result);

        ResponseEntity<Map<String, Object>> response = controller.dryRun("WD-2", null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void dryRun_illegalState_returns409() {
        when(service.dryRun(any(LocalDate.class), isNull()))
                .thenThrow(new IllegalStateException("Not WD-3/-2/-1"));

        ResponseEntity<Map<String, Object>> response = controller.dryRun(null, "2026-03-02");
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().containsKey("error"));
    }
}
