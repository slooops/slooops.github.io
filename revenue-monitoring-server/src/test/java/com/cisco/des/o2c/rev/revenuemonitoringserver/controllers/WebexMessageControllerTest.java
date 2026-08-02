package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.WebexMessagingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WebexMessageController.class)
class WebexMessageControllerTest {
    @Autowired MockMvc mvc;
    @MockBean WebexMessagingService service;

    @Test void sendMessageRevenueAccounting() throws Exception {
        mvc.perform(post("/api/send-message-revenue-accounting")
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"test\"}"))
                .andExpect(status().isOk());
        verify(service).sendWebexMessageRevenueAccounting(anyMap());
    }

    @Test void sendMessageInvoicing() throws Exception {
        mvc.perform(post("/api/send-message-invoicing")
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"test\"}"))
                .andExpect(status().isOk());
        verify(service).sendWebexMessageInvoicing(anyMap());
    }

    @Test void sendMessageGl() throws Exception {
        mvc.perform(post("/api/send-message-gl")
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"test\"}"))
                .andExpect(status().isOk());
        verify(service).sendWebexMessageGlPosting(anyMap());
    }

    @Test void sendMessageWIPS() throws Exception {
        mvc.perform(post("/api/send-message-wips")
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"test\"}"))
                .andExpect(status().isOk());
        verify(service).sendWebexMessageWIPSNprd(anyMap());
    }
}
