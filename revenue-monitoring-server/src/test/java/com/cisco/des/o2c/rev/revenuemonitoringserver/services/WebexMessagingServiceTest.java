package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.when;

class WebexMessagingServiceTest {
    private WebClient.Builder builder;
    private WebClient client;
    private WebClient.RequestBodyUriSpec request;
    private WebClient.ResponseSpec responseSpec;

    private WebexMessagingService service;

    @BeforeEach
    void setUp(){
        builder = Mockito.mock(WebClient.Builder.class);
        client = Mockito.mock(WebClient.class);
        request = Mockito.mock(WebClient.RequestBodyUriSpec.class, RETURNS_SELF);
        responseSpec = Mockito.mock(WebClient.ResponseSpec.class);

        when(builder.build()).thenReturn(client);
        when(client.post()).thenReturn(request);
        when(request.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just("ok"));

        // Current constructor: (webexUrl, authToken, roomIdRevenueAccounting, authTokenInvoicing, roomIdInvoicing)
        service = new WebexMessagingService("https://webex", "authRev", "roomRev", "authInv", "roomInv");
        // Inject mocked builder into private field
        ReflectionTestUtils.setField(service, "webClientBuilder", builder);
    }

    @Test
    void sendRevenueMessageReturnsOk() {
        var result = service.sendWebexMessageRevenueAccounting(Map.of(
                "assignedTo","user","componentName","Comp","username","owner",
                "periodName","P1","applicationName","App","processFlow","Flow","orgName","Org",
                "amount","100","transactionDate","2025-01-01","comments","Test"));
        assertEquals("ok", result);
    }
}
