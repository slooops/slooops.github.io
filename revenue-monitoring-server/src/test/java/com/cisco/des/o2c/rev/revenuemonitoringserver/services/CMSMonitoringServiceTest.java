package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.repository.RedisRepositoryImpl;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CMSMonitoringServiceTest {

    @Mock
    JdbcManager jdbcManager;
    @Mock
    RedisRepositoryImpl redisRepository;

    @InjectMocks
    CMSMonitoringService service = new CMSMonitoringService(null,
            "q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12","q13","q14","q15","q16","q17","q18","q19","q20","q21","q22","q23","q24","q25","q26");

    @BeforeEach
    void init(){
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Cache miss then stored")
    void unpostedSummary_cacheMiss() {
        when(redisRepository.findData("UnpostedSummary")).thenReturn(null);
        when(jdbcManager.queryForList("q1")).thenReturn(List.of(Map.of("k","v")));
        var result = service.getUnpostedSummaryData();
        assertEquals(1, result.size());
        verify(redisRepository).add(eq("UnpostedSummary"), anyList());
    }

    @Test
    @DisplayName("Cache hit returns without JDBC")
    void unpostedSummary_cacheHit() {
        when(redisRepository.findData("UnpostedSummary")).thenReturn(List.of(Map.of("k","v")));
        var result = service.getUnpostedSummaryData();
        assertEquals("v", result.get(0).get("k"));
        verify(jdbcManager, never()).queryForList(anyString());
    }
}
