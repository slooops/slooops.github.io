package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;

@Configuration
@PropertySource("classpath:server.properties")
public class WebexConfig {

    @Value("${webex.url}")
    public String webexUrl;
    @Value("${webex.auth.token}")
    public String authToken;
    @Value("${webex.room.id.revenue.accounting}")
    public String roomIdRevenueAccounting;

    @Value("${webex.auth.token.invoicing}")
    public String authTokenInvoicing;
    @Value("${webex.room.id.invoicing}")
    public String roomIdInvoicing;

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
    @Bean(name = "webexUrl")
    public String getWebexUrl() {
        return this.webexUrl;
    }

    @Bean(name = "authTokenInvoicing")
    public String getAuthTokenInvoicing() {
        byte[] decodedBytesAuthToken = Base64.getDecoder().decode(this.authTokenInvoicing);
        String authTokenInvoicing = new String(decodedBytesAuthToken);
        return authTokenInvoicing;
    }

    @Bean(name = "authToken")
    public String getAuthToken() {
        byte[] decodedBytesAuthToken = Base64.getDecoder().decode(this.authToken);
        String authToken = new String(decodedBytesAuthToken);
        return authToken;
    }

    @Bean(name = "roomIdRevenueAccounting")
    public String getRoomIdRevenueAccounting() {
        byte[] decodedBytesRoomId = Base64.getDecoder().decode(this.roomIdRevenueAccounting);
        String roomIdRevenueAccounting = new String(decodedBytesRoomId);
        return roomIdRevenueAccounting;
    }

    @Bean(name = "roomIdInvoicing")
    public String getRoomIdInvoicing() {
        byte[] decodedBytesRoomId = Base64.getDecoder().decode(this.roomIdInvoicing);
        String roomIdInvoicing = new String(decodedBytesRoomId);
        return roomIdInvoicing;
    }

}
