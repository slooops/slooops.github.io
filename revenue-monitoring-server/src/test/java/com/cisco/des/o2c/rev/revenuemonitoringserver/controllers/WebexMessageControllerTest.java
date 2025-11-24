package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.WebexMessagingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WebexMessageController.class)
class WebexMessageControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    WebexMessagingService service;

    @Test
    @DisplayName("POST /api/send-message-revenue-accounting delegates to service")
    void sendMessageRevenueAccounting() throws Exception {
    when(service.sendWebexMessageRevenueAccounting(org.mockito.ArgumentMatchers.any())).thenReturn("ok");
        mvc.perform(post("/api/send-message-revenue-accounting")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"msg\":\"hello\"}"))
                .andExpect(status().isOk());
    }
}
