package com.cisco.des.o2c.rev.revenuemonitoringserver.repository;

import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RedisRepositoryImpl {

    private RedisTemplate<String, Object> redisTemplate;
    private HashOperations hashOperations;
    
    @Autowired
    public RedisRepositoryImpl(RedisTemplate<String, Object> redisTemplate){
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    private void init(){
        hashOperations = redisTemplate.opsForHash();
    }
    
    public void add(final String keyItem, final List<Map<String,Object>>  data) {
    	hashOperations.put(keyItem, keyItem, data);
    }

    public void delete(final String id) {
        hashOperations.delete(id, id);
    }
    
    public List<Map<String,Object>>  findData(final String id){
        return  (List<Map<String, Object>>) hashOperations.get(id, id);
    }
    
}
