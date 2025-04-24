package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.configs.PageOutConfig;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.EPageEscalationModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.EPageAccessTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class EPageEscalationService {

    @Autowired
    private WebClient.Builder webClientBuilder;

    private static final String pageoutApiUrl = "https://entcalendarapi.cisco.com/calendar/pageout/";

    private String authToken = PageOutConfig.getToken();

    public String sendEpageEscalation() {
        String message = "Error Amount $ on app appname. Escalated to Sai Sreepathi";

        Map<String, Object> messageBody = new HashMap<>();
        messageBody.put("alias", "rev-i2c-ops-monitoring");
        messageBody.put("subject", "Escalation 1");
        messageBody.put("message", message);
        messageBody.put("priority", "P3");
        messageBody.put("sender", "rev-i2c-ops-monitoring");

        return webClientBuilder.build()
                .post()
                .uri(pageoutApiUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer "+authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messageBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}
