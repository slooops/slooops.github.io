package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.cisco.des.o2c.rev.revenuemonitoringserver.repository.RedisRepositoryImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class CacheCommon {
    @Autowired
    private RedisRepositoryImpl redisRepository;
    private Logger logger = LoggerFactory.getLogger(CacheCommon.class);
    private JdbcManager jdbcManager;
    @Value("${app.use-redis:false}")
    private boolean useRedis;

    public CacheCommon(JdbcManager jdbcManager) {
        this.jdbcManager = jdbcManager;
    }

    @Async
    public void refreshExceptionMonitoringCache(Map<String, String> cacheKeyToQueryMap) {
        try {
            logger.info("Starting Exception Monitoring Refresh (dynamic)");
            List<CompletableFuture<Void>> futures = new ArrayList<>();

            for (Map.Entry<String, String> entry : cacheKeyToQueryMap.entrySet()) {
                String cacheKey = entry.getKey();
                String query = entry.getValue();

                CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                    try {
                        redisRepository.add(cacheKey, jdbcManager.queryForList(query));
                        logger.debug("Successfully refreshed cache for: " + cacheKey);
                    } catch (Exception e) {
                        logger.error("Failed to refresh " + cacheKey, e);
                    }
                });
                futures.add(future);
            }

            // Wait for all futures to complete - this blocks until all are done
            CompletableFuture<Void> allFutures = CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
            allFutures.join(); // This ensures we wait for completion

            logger.info("Dynamic Exception Monitoring Refresh completed");

        } catch (Exception e) {
            logger.error("Exception in dynamic refreshExceptionMonitoringCache", e);
        }
    }

    // public List<Map<String, Object>> checkRedisForCachedData(String cacheId,
    // String sql){
    // try {
    // if (redisRepository.findData(cacheId) != null) {
    // System.out.println("Fetching data from Redis cache for " + cacheId);
    // List<Map<String, Object>> result = redisRepository.findData(cacheId);
    // return result;
    // } else {
    // System.out.println("Fetching data from database for " + cacheId);
    // List<Map<String, Object>> retObject = jdbcManager.queryForList(sql);
    // redisRepository.add(cacheId, retObject);
    // return retObject;
    // }
    // } catch (Exception e) {
    // logger.error("Exception in get"+cacheId+"():: " + e);
    // }
    // return null;
    // }

    public List<Map<String, Object>> checkRedisForCachedData(String cacheId, String sql) {
        try {
            if (useRedis && redisRepository.findData(cacheId) != null) {
                System.out.println("Fetching data from Redis cache for " + cacheId);
                return redisRepository.findData(cacheId);
            } else {
                System.out.println("Fetching data from database for " + cacheId);
                List<Map<String, Object>> retObject = jdbcManager.queryForList(sql);
                if (useRedis) {
                    redisRepository.add(cacheId, retObject);
                }
                return retObject;
            }
        } catch (Exception e) {
            logger.error("Exception in get" + cacheId + "():: " + e);
        }
        return null;
    }
}
