package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.cisco.des.o2c.rev.revenuemonitoringserver.repository.RedisRepositoryImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CacheCommonTest {
    RedisRepositoryImpl redis = Mockito.mock(RedisRepositoryImpl.class);
    JdbcManager jdbc = Mockito.mock(JdbcManager.class);
    CacheCommon cacheCommon;

    @BeforeEach
    void init(){
        cacheCommon = new CacheCommon(jdbc);
        // inject redisRepository via reflection since field is package-private autowired
        try {
            var f = CacheCommon.class.getDeclaredField("redisRepository");
            f.setAccessible(true);
            f.set(cacheCommon, redis);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    @Test
    void cacheMissStoresWhenUseRedisTrue() {
        when(redis.findData("Key")).thenReturn(null);
        when(jdbc.queryForList("sql")).thenReturn(List.of(Map.of("k","v")));
        var result = cacheCommon.checkRedisForCachedData("Key","sql", true);
        assertEquals(1, result.size());
        verify(redis).add(eq("Key"), anyList());
    }

    @Test
    void cacheHitReturns() {
        when(redis.findData("Key")).thenReturn(List.of(Map.of("k","v")));
        var result = cacheCommon.checkRedisForCachedData("Key","sql", true);
        assertEquals("v", result.get(0).get("k"));
        verify(jdbc, never()).queryForList(anyString());
    }
}
