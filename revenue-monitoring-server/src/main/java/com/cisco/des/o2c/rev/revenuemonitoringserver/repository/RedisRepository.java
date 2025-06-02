package com.cisco.des.o2c.rev.revenuemonitoringserver.repository;

import java.util.List;
import java.util.Map;

public interface RedisRepository {
	/**
     * Return all movies
     */
    Map<Object, Object> findAllCacheItems();

    /**
     * Add key-value pair to Redis.
     */
    void add(String keyItem, List<Map<String,Object>> cachedItem);

    /**
     * Delete a key-value pair in Redis.
     */
    void delete(String id);
    
    /**
     * find a movie
     */
    Map<String,Object> findData(String id);
}
