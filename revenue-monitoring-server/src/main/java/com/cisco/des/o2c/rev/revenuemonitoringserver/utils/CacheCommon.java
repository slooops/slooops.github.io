package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.cisco.des.o2c.rev.revenuemonitoringserver.repository.RedisRepositoryImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
@Component
public class CacheCommon {
    @Autowired
    private RedisRepositoryImpl redisRepository;
    private Logger logger = LoggerFactory.getLogger(CacheCommon.class);
    private JdbcManager jdbcManager;

    public CacheCommon(JdbcManager jdbcManager) {
        this.jdbcManager = jdbcManager;
    }

    @Async
    public void refreshExceptionMonitoringCache(Map<String, String> cacheKeyToQueryMap) {
        try {
            logger.info("Starting Exception Monitoring Refresh (dynamic)");
            for (Map.Entry<String, String> entry : cacheKeyToQueryMap.entrySet()) {
                String cacheKey = entry.getKey();
                String query = entry.getValue();
                CompletableFuture.runAsync(() -> {
                    try {
                        redisRepository.add(cacheKey, jdbcManager.queryForList(query));
                    } catch (Exception e) {
                        logger.error("Failed to refresh " + cacheKey, e);
                    }
                });
            }
            logger.info("Dynamic Exception Monitoring Refresh triggered asynchronously");
        } catch (Exception e) {
            logger.error("Exception in dynamic refreshExceptionMonitoringCache", e);
        }
    }
}
