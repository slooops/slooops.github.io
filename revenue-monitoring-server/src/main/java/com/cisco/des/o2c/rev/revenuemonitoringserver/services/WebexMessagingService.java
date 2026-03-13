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
        public WebexMessagingService(String webexUrl, String authToken, String roomIdRevenueAccounting,
                        String authTokenInvoicing, String roomIdInvoicing) {
                this.webexUrl = webexUrl;
                this.authToken = authToken;
                this.roomIdRevenueAccounting = roomIdRevenueAccounting;
                this.roomIdInvoicing = roomIdInvoicing;
                this.authTokenInvoicing = authTokenInvoicing;
        }

        public String sendWebexMessageRevenueAccounting(Map<String, String> updateData) {
                String message = "Hi <@personEmail:" + updateData.get("assignedTo") + ">, "
                                + updateData.get("componentName") + " error has been assigned to you by <@personEmail:"
                                + updateData.get("username") + "@cisco.com>. Following are the details of the error:\n"
                                +
                                "Period Name: " + updateData.get("periodName") + "\nApplication Name: "
                                + updateData.get("applicationName") + "\nSub Application: "
                                + updateData.get("processFlow") + "\nOrg Name: " + updateData.get("orgName")
                                + "\nAmount: " + updateData.get("amount") + "\nTransaction Date: "
                                + updateData.get("transactionDate") + "\n Comments: " + updateData.get("comments");

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
                String message = "Hi <@personEmail:" + updateData.get("assignedTo") + ">, "
                                + updateData.get("componentName") + " error has been assigned to you by <@personEmail:"
                                + updateData.get("username") + "@cisco.com>. Following are the details of the error:\n"
                                +
                                "Period Name: " + updateData.get("periodName") + "\nApplication Name: "
                                + updateData.get("applicationName") + "\nSub Application: "
                                + updateData.get("processFlow") + "\nOrg Name: " + updateData.get("orgName")
                                + "\nAmount: " + updateData.get("amount") + "\nTransaction Date: "
                                + updateData.get("transactionDate") + "\n Comments: " + updateData.get("comments");

                MessageRequestModel messageRequestModel = new MessageRequestModel();
                messageRequestModel.setRoomId(roomIdInvoicing);
                messageRequestModel.setMarkdown(message);

                return webClientBuilder.build()
                                .post()
                                .uri(webexUrl)
                                .header(HttpHeaders.AUTHORIZATION,
                                                "Bearer YmExMmIwMzYtNTE2NS00NGMxLTk2MWItNDY3MDc5MzQ1NDM2ZDcwYTI4NDMtZmFm_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f")
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(messageRequestModel)
                                .retrieve()
                                .bodyToMono(String.class)
                                .block();
        }

        public String sendWebexMessageGlPosting(Map<String, String> updateData) {
                String message = "Hi <@personEmail:" + updateData.get("assignedTo") + ">, "
                                + updateData.get("componentName") + " error has been assigned to you by <@personEmail:"
                                + updateData.get("username") + "@cisco.com>. Following are the details of the error:\n"
                                +
                                "Journal Source Name: " + updateData.get("journalSource") + "\nApplication Name: "
                                + updateData.get("applicationName") + "\nSub Application: "
                                + updateData.get("processFlow") + "\nLedger Name: " + updateData.get("ledgerName")
                                + "\nAccount Seg: " + updateData.get("accountSeg") + "\nTransaction Date: "
                                + updateData.get("transactionDate") + "\n Comments: " + updateData.get("comments");

                MessageRequestModel messageRequestModel = new MessageRequestModel();
                messageRequestModel.setRoomId(
                                "Y2lzY29zcGFyazovL3VzL1JPT00vZGMxNzFjNDAtYTJlNC0xMWVmLTg4YjEtZmJhODc1YmQ2ZWQ3");
                messageRequestModel.setMarkdown(message);

                return webClientBuilder.build()
                                .post()
                                .uri(webexUrl)
                                .header(HttpHeaders.AUTHORIZATION,
                                                "Bearer ZTA3NTJiNzQtYzY4NS00NGMxLWE5MWYtMmE0MTdmODJlYTU5NTI4YzJiODctMDQz_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f")
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(messageRequestModel)
                                .retrieve()
                                .bodyToMono(String.class)
                                .block();
        }

        public String sendWebexMessageWIPSNprd(Map<String, String> updateData) {
                String message = "Hi <@personEmail:" + updateData.get("assignedTo") + ">, "
                        + updateData.get("componentName") + " error has been assigned to you by <@personEmail:"
                        + updateData.get("username") + "@cisco.com>. Following are the details of the error:\n"
                        +
                        "Scenario: " + updateData.get("scenario") + "\nData Source: "
                        + updateData.get("dataSource") + "\nStatus: "
                        + updateData.get("status") + "\n Comments: " + updateData.get("comments");

                MessageRequestModel messageRequestModel = new MessageRequestModel();
                messageRequestModel.setRoomId(
                        "Y2lzY29zcGFyazovL3VzL1JPT00vYjU0NDY3ZTAtZDVjOC0xMWYwLTllMTQtNzc1NGQ2ZmMwN2M0");
                messageRequestModel.setMarkdown(message);

                return webClientBuilder.build()
                        .post()
                        .uri(webexUrl)
                        .header(HttpHeaders.AUTHORIZATION,
                                "Bearer MDFhNzE2M2EtZGQ5Ni00MDQ1LWJlMmUtZjJiZTE4YmYzOTU2ZmM5NDQzMGMtNjM2_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f")
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(messageRequestModel)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
        }
}
