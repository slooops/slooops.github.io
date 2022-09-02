package com.cisco.des.o2c.rev.accrualsmonitoringserver.controllers;

import com.cisco.des.o2c.rev.accrualsmonitoringserver.services.ExceptionReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class ExceptionReportController {

    private ExceptionReportService service;

    @Autowired
    public ExceptionReportController(ExceptionReportService service) { this.service = service; }

    @GetMapping("/exception-report")
    public ResponseEntity<List<Map<String, Object>>> getExceptionReport() {
        System.out.println("exception report");
        return new ResponseEntity<>(service.getExceptionReport(), HttpStatus.OK);
    }


}
