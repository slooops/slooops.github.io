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
    private String roomIdRevenueAccounting;
    private String roomIdInvoicing;
    private String authTokenInvoicing;

    @Autowired
    public WebexMessagingService(String webexUrl, String authToken, String roomIdRevenueAccounting, String authTokenInvoicing, String roomIdInvoicing){
        this.webexUrl = webexUrl;
        this.authToken = authToken;
        this.roomIdRevenueAccounting = roomIdRevenueAccounting;
        this.roomIdInvoicing = roomIdInvoicing;
        this.authTokenInvoicing = authTokenInvoicing;
    }

    public String sendWebexMessageRol(Map<String, String> updateData) {
        String message = "Hi <@personEmail:"+ updateData.get("assignee")+">, an ROL error has been assigned to you by <@personEmail:"+ updateData.get("assigner")+"@cisco.com>. Following are the details of the error:\n" +
                "Period Name: "+updateData.get("periodName")+"\nApplication Name: "+updateData.get("appName")+"\nSub Application: "+updateData.get("subApp")+"\nOrg Name: "+updateData.get("orgName")+"\nAmount: "+updateData.get("amount")+"\n Comments: "+updateData.get("comments");

        MessageRequestModel messageRequestModel = new MessageRequestModel();
        messageRequestModel.setRoomId(roomIdRevenueAccounting);
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

    public String sendWebexMessageInvoicing(Map<String, String> updateData) {
        String message = "Hi <@personEmail:"+ updateData.get("assignee")+">, "+updateData.get("componentName")+" error has been assigned to you by <@personEmail:"+ updateData.get("assigner")+"@cisco.com>. Following are the details of the error:\n" +
                "Period Name: "+updateData.get("periodName")+"\nApplication Name: "+updateData.get("appName")+"\nSub Application: "+updateData.get("subApp")+"\nOrg Name: "+updateData.get("orgName")+"\nAmount: "+updateData.get("amount")+"\nTransaction Date: "+updateData.get("date")+"\n Comments: "+updateData.get("comments");

        System.out.println(roomIdInvoicing);
        MessageRequestModel messageRequestModel = new MessageRequestModel();
        messageRequestModel.setRoomId(roomIdInvoicing);
        messageRequestModel.setMarkdown(message);
        System.out.println(authTokenInvoicing);

        return webClientBuilder.build()
                .post()
                .uri(webexUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer YmExMmIwMzYtNTE2NS00NGMxLTk2MWItNDY3MDc5MzQ1NDM2ZDcwYTI4NDMtZmFm_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messageRequestModel)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}
