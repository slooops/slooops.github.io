package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.EPageEscalationModel;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.EPageAccessTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class EPageEscalationService {

//    @Autowired
//    private WebClient.Builder webClientBuilder;
//
//    private EPageAccessTokenUtil ePageAccessTokenUtil = new EPageAccessTokenUtil();
//
//    private static final String pageoutApiUrl = "https://entcalendarapi.cisco.com/calendar/pageout/";
//
//    private String authToken = ePageAccessTokenUtil.getAccessToken();
//
//    public String sendWebexMessageRol() {
//        String message = "This is a test pageout from spring boot app";
//
//        EPageEscalationModel epageModel = new EPageEscalationModel();
//        epageModel.setMessage(message);
//        epageModel.setSubject("Test Subject");
//
//        return webClientBuilder.build()
//                .post()
//                .uri(pageoutApiUrl)
//                .header(HttpHeaders.AUTHORIZATION, "Bearer "+authToken)
//                .contentType(MediaType.APPLICATION_JSON)
//                .bodyValue(epageModel)
//                .retrieve()
//                .bodyToMono(String.class)
//                .block();
//    }
}
