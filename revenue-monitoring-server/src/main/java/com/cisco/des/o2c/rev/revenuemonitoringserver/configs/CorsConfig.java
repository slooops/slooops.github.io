package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@PropertySource("classpath:server.properties")
public class CorsConfig {

    @Value("${cors.url}")
    public String corsUrl;

    @Value("${agent.api.url}")
    public String agentApiUrl;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(corsUrl, agentApiUrl)
                        .allowedMethods("GET", "OPTIONS", "POST", "PUT", "DELETE")
                        .allowedHeaders("*");
            }
        };
    }
}
