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
}
