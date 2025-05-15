package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:cacheStrategy.properties")
public class CacheConfig {

	@Value("${spring.cache.cms.refresh}")
	public long cmsRefresh;
	 
	@Bean(name = "cmsRefresh")
    public long getCmsRefresh() {
        return this.cmsRefresh;
    }
}
