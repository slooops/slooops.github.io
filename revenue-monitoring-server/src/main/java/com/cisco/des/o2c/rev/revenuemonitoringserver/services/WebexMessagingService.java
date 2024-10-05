package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.MessageRequestModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class WebexMessagingService {

    @Autowired
    private WebClient.Builder webClientBuilder;

    private String webexUrl;
    private String authToken;
    private String roomId;

    @Autowired
    public WebexMessagingService(String webexUrl, String authToken, String roomId){
        this.webexUrl = webexUrl;
        this.authToken = authToken;
        this.roomId = roomId;
    }

    public String sendWebexMessageRol(Map<String, String> updateData) {
        String message = "Hi <@personEmail:"+ updateData.get("assignee")+"@cisco.com>, an ROL error has been assigned to you by <@personEmail:"+ updateData.get("assigner")+"@cisco.com>. Following are the details of the error:\n" +
                "Period Name: "+updateData.get("periodName")+"\nApplication Name: "+updateData.get("appName")+"\nSub Application: "+updateData.get("subApp")+"\nOrg Name: "+updateData.get("orgName")+"\nAmount: "+updateData.get("amount")+"\n Comments: "+updateData.get("comments");

        MessageRequestModel messageRequestModel = new MessageRequestModel();
        messageRequestModel.setRoomId(roomId);
        messageRequestModel.setMarkdown(message);

        return webClientBuilder.build()
                .post()
                .uri(webexUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messageRequestModel)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}
