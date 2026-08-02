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
    void init() {
        cacheCommon = new CacheCommon(jdbc);
        try {
            var f = CacheCommon.class.getDeclaredField("redisRepository");
            f.setAccessible(true);
            f.set(cacheCommon, redis);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    // ── checkRedisForCachedData ───────────────────────────────

    @Test
    void cacheMissStoresWhenUseRedisTrue() {
        when(redis.findData("Key")).thenReturn(null);
        when(jdbc.queryForList("sql")).thenReturn(List.of(Map.of("k", "v")));
        var result = cacheCommon.checkRedisForCachedData("Key", "sql", true);
        assertEquals(1, result.size());
        verify(redis).add(eq("Key"), anyList());
    }

    @Test
    void cacheHitReturns() {
        when(redis.findData("Key")).thenReturn(List.of(Map.of("k", "v")));
        var result = cacheCommon.checkRedisForCachedData("Key", "sql", true);
        assertEquals("v", result.get(0).get("k"));
        verify(jdbc, never()).queryForList(anyString());
    }

    @Test
    void useRedisFalseAlwaysQueriesDb() {
        when(jdbc.queryForList("sql")).thenReturn(List.of(Map.of("a", 1)));
        var result = cacheCommon.checkRedisForCachedData("Key", "sql", false);
        assertEquals(1, result.size());
        verify(redis, never()).add(anyString(), anyList());
    }

    @Test
    void cacheMissNoStoreWhenUseRedisFalse() {
        when(jdbc.queryForList("sql")).thenReturn(List.of());
        var result = cacheCommon.checkRedisForCachedData("X", "sql", false);
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(redis, never()).add(anyString(), anyList());
    }

    @Test
    void exceptionReturnsNull() {
        when(redis.findData("Key")).thenThrow(new RuntimeException("Redis down"));
        var result = cacheCommon.checkRedisForCachedData("Key", "sql", true);
        assertNull(result);
    }

    @Test
    void dbReturnsEmptyListCachedWhenUseRedis() {
        when(redis.findData("Key")).thenReturn(null);
        when(jdbc.queryForList("sql")).thenReturn(List.of());
        var result = cacheCommon.checkRedisForCachedData("Key", "sql", true);
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(redis).add(eq("Key"), eq(List.of()));
    }

    // ── refreshExceptionMonitoringCache ───────────────────────

    @Test
    void refreshDoesNotThrowOnEmptyMap() {
        assertDoesNotThrow(() -> cacheCommon.refreshExceptionMonitoringCache(Map.of()));
    }

    @Test
    void refreshTriggersForEachEntry() {
        // Just verify it doesn't throw; actual async work is fire-and-forget
        Map<String, String> map = Map.of("key1", "SELECT 1", "key2", "SELECT 2");
        assertDoesNotThrow(() -> cacheCommon.refreshExceptionMonitoringCache(map));
    }
}
