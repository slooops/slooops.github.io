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
    @Value("${webex.room.id}")
    public String roomId;

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
    @Bean(name = "webexUrl")
    public String getWebexUrl() {
        return this.webexUrl;
    }

    @Bean(name = "authToken")
    public String getAuthToken() {
        byte[] decodedBytesAuthToken = Base64.getDecoder().decode(this.authToken);
        String authToken = new String(decodedBytesAuthToken);
        return authToken;
    }

    @Bean(name = "roomId")
    public String getRoomId() {
        byte[] decodedBytesRoomId = Base64.getDecoder().decode(this.roomId);
        String roomId = new String(decodedBytesRoomId);
        return roomId;
    }

}
