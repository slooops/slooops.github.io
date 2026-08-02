package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OperationsControlsServiceTest {
    JdbcManager jdbc = Mockito.mock(JdbcManager.class);
    Common common = Mockito.mock(Common.class);
    OperationsControlsService service;

    @BeforeEach
    void init(){
        service = new OperationsControlsService(jdbc, "i2cSum","i2cDet","i2cFilt","revSum","revDet","revDetFilt","gtcSum","gtcDet","gtcDetFilt");
        try { var f = OperationsControlsService.class.getDeclaredField("common"); f.setAccessible(true); f.set(service, common);} catch (Exception e){throw new RuntimeException(e);}        
    }

    @Test
    void revControlsSummaryAgingInjected() {
        Map<String,Object> row = new LinkedHashMap<>();
        row.put("Transaction Date","2024-01-01");
        row.put("COMMENTS","c");
        row.put("PERIOD_NAME","P1");
        row.put("AMOUNT",10);
        row.put("ORG_NAME","OU");
        row.put("APPLICATION","APP");
        row.put("RULE_NAME","R");
        when(jdbc.queryForList("revSum")).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("5 days");
        var result = service.getRevControlsSummary();
        assertEquals(1, result.size());
        assertTrue(result.get(0).containsKey("Aging"));
    }

    @Test void getRevControlsDetails() {
        when(jdbc.queryForList("revDet")).thenReturn(List.of(new HashMap<>(Map.of("k","v"))));
        assertEquals(1, service.getRevControlsDetails().size());
    }

    @Test void getRevControlsDetailsFiltered() {
        when(jdbc.filterRevControls(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(new HashMap<>(Map.of("k","v"))));
        assertEquals(1, service.getRevControlsDetailsFiltered("p","a","o","d","r").size());
    }

    @Test void geti2cControlsSummary() {
        Map<String,Object> row = new LinkedHashMap<>();
        row.put("Transaction Date","2024-01-01");
        row.put("AMOUNT",10); row.put("PERIOD_NAME","P1"); row.put("ORG_NAME","OU"); row.put("APPLICATION","APP"); row.put("RULE_NAME","R");
        when(jdbc.queryForList("i2cSum")).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("3 days");
        assertEquals(1, service.geti2cControlsSummary().size());
    }

    @Test void getI2CControlsDetails() {
        when(jdbc.queryForList("i2cDet")).thenReturn(List.of(new HashMap<>(Map.of("k","v"))));
        assertEquals(1, service.getI2CControlsDetails().size());
    }

    @Test void getI2CControlsDetailsFiltered() {
        when(jdbc.filterI2cControls(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(new HashMap<>(Map.of("k","v"))));
        assertEquals(1, service.getI2CControlsDetailsFiltered("p","a","o","d","r").size());
    }

    @Test void getGtcControlsSummary() {
        Map<String,Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE","2024-01-01");
        row.put("A",1); row.put("B",2); row.put("C",3); row.put("D",4); row.put("E",5); row.put("F",6);
        when(jdbc.queryForList("gtcSum")).thenReturn(List.of(row));
        when(common.calculateAging(any())).thenReturn("2 days");
        assertEquals(1, service.getGtcControlsSummary().size());
    }

    @Test void getGtcControlsDetails() {
        when(jdbc.queryForList("gtcDet")).thenReturn(List.of(new HashMap<>(Map.of("k","v"))));
        assertEquals(1, service.getGtcControlsDetails().size());
    }

    @Test void getGtcControlsDetailsFiltered() {
        when(jdbc.filterGtcControls(anyString(), anyString(), anyString(), anyString())).thenReturn(List.of(new HashMap<>(Map.of("k","v"))));
        assertEquals(1, service.getGtcControlsDetailsFiltered("pf","en","td").size());
    }
}
