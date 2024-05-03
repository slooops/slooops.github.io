package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CMSMonitoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class CMSMonitoringController {

    private static final String UNPOSTED_SUMMARY = "unpostedSummary";
    private static final String UNPOSTED_DETAILS = "unpostedDetails";
    private static final String RECEIPT_ERROR_SUMMARY = "receiptErrorSummary";
    private static final String RECEIPT_ERROR_DETAILS = "receiptErrorDetails";
    private static final String JOB_RUN_STATUS = "jobRunStatus";
    private static final String CTM_STATUS = "ctmStatus";
    private static final String CTM_DETAILS = "ctmDetails";
    private static final String BOOMI_STATUS = "boomiStatus";
    private static final String BOOMI_DETAILS = "boomiDetails";
    private static final String EXTRACT_COUNT = "extractCount";
    private static final String EXTRACT_DETAILS = "extractDetails";


    private Logger logger = LoggerFactory.getLogger(CMSMonitoringController.class);

    @Autowired
    private CMSMonitoringService cmsMonitoringService;

    @GetMapping("/cms/getdata")
    public ResponseEntity<List<Map<String, Object>>> getData(@RequestParam("query") String query) {
        if(query.isEmpty() || query.isBlank()){
            logger.error("Request parameter is null or empty!");
            return null;
        }

        switch(query){
            case UNPOSTED_SUMMARY:
                return getUnpostedSummary();
            case UNPOSTED_DETAILS:
                return getUnpostedDetails();
            case RECEIPT_ERROR_SUMMARY:
                return getReceiptErrorSummary();
            case RECEIPT_ERROR_DETAILS:
                return getReceiptErrorDetails();
            case JOB_RUN_STATUS:
                return getJobRunStatus();
            case CTM_STATUS:
                return getCtmStatus();
            case CTM_DETAILS:
                return getCtmDetails();
            case BOOMI_STATUS:
                return getBoomiStatus();
            case BOOMI_DETAILS:
                return getBoomiDetails();
            case EXTRACT_COUNT:
                return getExtractCount();
            case EXTRACT_DETAILS:
                return getExtractDetails();
            default:
                logger.error("Request parameter does not match with defined values!");
                return null;
        }
    }

    private ResponseEntity<List<Map<String, Object>>> getUnpostedSummary() {
        return new ResponseEntity<>(cmsMonitoringService.getUnpostedSummaryData(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getUnpostedDetails() {
        return new ResponseEntity<>(cmsMonitoringService.getUnpostedDetailsData(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getReceiptErrorSummary() {
        return new ResponseEntity<>(cmsMonitoringService.getReceiptErrorSummaryData(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getReceiptErrorDetails() {
        return new ResponseEntity<>(cmsMonitoringService.getReceiptErrorDetailsData(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getJobRunStatus() {
        return new ResponseEntity<>(cmsMonitoringService.getJobRunStatus(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getCtmStatus() {
        return new ResponseEntity<>(cmsMonitoringService.getCtmStatus(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getCtmDetails() {
        return new ResponseEntity<>(cmsMonitoringService.getCtmDetails(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getBoomiStatus() {
        return new ResponseEntity<>(cmsMonitoringService.getBoomiStatus(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getBoomiDetails() {
        return new ResponseEntity<>(cmsMonitoringService.getBoomiDetails(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getExtractCount() {
        return new ResponseEntity<>(cmsMonitoringService.getExtractCount(), HttpStatus.OK);
    }

    private ResponseEntity<List<Map<String, Object>>> getExtractDetails() {
        return new ResponseEntity<>(cmsMonitoringService.getExtractDetails(), HttpStatus.OK);
    }

}
