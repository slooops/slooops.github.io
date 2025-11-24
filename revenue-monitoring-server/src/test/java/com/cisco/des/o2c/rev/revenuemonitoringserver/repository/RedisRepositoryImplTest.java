package com.cisco.des.o2c.rev.revenuemonitoringserver.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RedisRepositoryImplTest {
    RedisTemplate<String,Object> template = Mockito.mock(RedisTemplate.class);
    // Match generics of RedisTemplate<String,Object>.opsForHash(): HashOperations<String, Object, Object>
    @SuppressWarnings("unchecked")
    HashOperations<String,Object,Object> hashOps = Mockito.mock(HashOperations.class);
    RedisRepositoryImpl repo;

    @BeforeEach
    void setUp() throws Exception {
        when(template.opsForHash()).thenReturn(hashOps);
        repo = new RedisRepositoryImpl(template);
        var m = RedisRepositoryImpl.class.getDeclaredMethod("init");
        m.setAccessible(true);
        m.invoke(repo);
    }

    @Test
    void addAndFind() {
        repo.add("Key", List.of(Map.of("k","v")));
        verify(hashOps).put(eq("Key"), eq("Key"), eq(List.of(Map.of("k","v"))));
    }
}
