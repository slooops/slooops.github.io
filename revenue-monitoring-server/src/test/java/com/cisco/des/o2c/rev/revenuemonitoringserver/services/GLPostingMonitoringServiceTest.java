package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.CacheCommon;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GLPostingMonitoringServiceTest {

    @Mock
    JdbcManager jdbcManager;
    @Mock
    Common common;
    @Mock
    CacheCommon cacheCommon;

    @InjectMocks
    GLPostingMonitoringService service = new GLPostingMonitoringService(null,
            "sum","det","filter","update",
            "intSum","intDet","intFilter","intUpdate");

    @BeforeEach
    void setup(){
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("getGlErrorSummary reorders and injects AGING")
    void glErrorSummary() {
        List<Map<String,Object>> rows = new ArrayList<>();
        Map<String,Object> row = new LinkedHashMap<>();
        row.put("TRANSACTION_DATE", new Date());
        row.put("ASSIGNED_DATE", new Date());
        row.put("OTHER", 1);
        rows.add(row);
        when(cacheCommon.checkRedisForCachedData(eq("GlErrorSummary"), anyString(), anyBoolean())).thenReturn(rows);
    // calculateAging returns a String, so stub with a String value not an int
    when(common.calculateAging(any())).thenReturn("5 days");

        var result = service.getGlErrorSummary();
        assertEquals(1, result.size());
        assertTrue(result.get(0).containsKey("AGING"));
    }
}
