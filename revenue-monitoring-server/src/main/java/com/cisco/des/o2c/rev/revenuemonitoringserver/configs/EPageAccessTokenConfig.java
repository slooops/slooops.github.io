package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:server.properties")
public class EPageAccessTokenConfig {
    private static String tokenUrl;
    private static String clientId;
    private static String clientSecret;

    @Value("${epage.access.token.url}")
    public void setApiUrl(String url) {
        EPageAccessTokenConfig.tokenUrl = url;
    }

    @Value("${epage.access.token.client.id}")
    public void setClientId(String clientId) {
        EPageAccessTokenConfig.clientId = clientId;
    }

    @Value("${epage.access.token.client.secret}")
    public void setClientSecret(String clientSecret) {
        EPageAccessTokenConfig.clientSecret = clientSecret;
    }

    public static String getApiUrl() {
        return tokenUrl;
    }

    public static String getClientId() {
        return clientId;
    }

    public static String getClientSecret() {
        return clientSecret;
    }
}
