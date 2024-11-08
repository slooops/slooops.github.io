package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.EPageEscalationService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.WebexMessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class WebexMessageController {

    @Autowired
    private WebexMessagingService service;

    @Autowired
    private EPageEscalationService ePageEscalationService;

    @PostMapping("/send-message-rol")
    public void sendMessage(@RequestBody Map<String, String> updateData) {
        service.sendWebexMessageRol(updateData);
    }

    @PostMapping("/send-message-invoicing")
    public void sendMessageInvoicing(@RequestBody Map<String, String> updateData) {
        service.sendWebexMessageInvoicing(updateData);
        ePageEscalationService.sendEpageEscalation();
    }
}
