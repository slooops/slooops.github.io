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

    @Value("${spring.cache.gl.refresh}")
    public long glRefresh;

    @Bean(name = "glRefresh")
    public long getGlRefresh() {
        return this.glRefresh;
    }

    @Value("${spring.cache.i2c.refresh}")
    public long i2cRefresh;

    @Bean(name = "i2cRefresh")
    public long getI2cRefresh() {
        return this.i2cRefresh;
    }

    @Value("${spring.cache.post.invoicing.refresh}")
    public long postInvoicingRefresh;

    @Bean(name = "postInvoicingRefresh")
    public long getPostInvoicingRefresh() {
        return this.postInvoicingRefresh;
    }

    @Value("${spring.cache.revenue.refresh}")
    public long revenueRefresh;

    @Bean(name = "revenueRefresh")
    public long getRevenueRefresh() {
        return this.revenueRefresh;
    }
}
