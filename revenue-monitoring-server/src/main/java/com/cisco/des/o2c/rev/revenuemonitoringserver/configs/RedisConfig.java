package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.GenericToStringSerializer;

import com.cisco.des.o2c.rev.revenuemonitoringserver.queue.MessagePublisher;
import com.cisco.des.o2c.rev.revenuemonitoringserver.queue.MessagePublisherImpl;
import com.cisco.des.o2c.rev.revenuemonitoringserver.queue.MessageSubscriber;

@Configuration
@ComponentScan("com.cisco.des.o2c.rev.revenuemonitoringserver")
public class RedisConfig {

	@Value("${spring.redis.host}")
	private String redisHost;

	@Value("${spring.redis.port}")
	private int redisPort;

	@Value("${spring.redis.password}")
	private String redisPassword;
	@Bean
	public JedisConnectionFactory jedisConnectionFactory() {
		RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
		redisConfig.setHostName(redisHost);
		redisConfig.setPort(redisPort);
		redisConfig.setPassword(RedisPassword.of(redisPassword));

		return new JedisConnectionFactory(redisConfig);
	}

	@Bean
	public RedisTemplate<String, Object> redisTemplate() {
		final RedisTemplate<String, Object> template = new RedisTemplate<String, Object>();
		template.setConnectionFactory(jedisConnectionFactory());
		template.setValueSerializer(new GenericToStringSerializer<Object>(Object.class));
		return template;
	}
/*
	@Bean
	MessageListenerAdapter messageListener() {
		return new MessageListenerAdapter(new MessageSubscriber());
	}

	@Bean
	RedisMessageListenerContainer redisContainer() {
		final RedisMessageListenerContainer container = new RedisMessageListenerContainer();
		container.setConnectionFactory(jedisConnectionFactory());
		container.addMessageListener(messageListener(), topic());
		return container;
	} 

	@Bean
    MessagePublisher redisPublisher() {
        return (MessagePublisher) new MessagePublisherImpl(redisTemplate(), topic());
    }
*/
	@Bean
	ChannelTopic topic() {
		return new ChannelTopic("pubsub:queue");
	}
}
