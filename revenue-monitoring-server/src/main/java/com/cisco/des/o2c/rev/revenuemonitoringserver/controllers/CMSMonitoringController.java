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
    private static final String LATEST_REQUEST_STATUS = "latestRequestStatus";
    private static final String COLLECTIONS_ERROR_SUMMARY = "collectionsErrorSummary";
    private static final String INVOICE_PDF_EXTRACT_ERR = "invoicePdfExtractErr";
    private static final String INVOICE_EXTRACT_ERR = "invoiceExtractErr";
    private static final String CUSTOMER_MASTER_ERR = "customerMasterErr";
    private static final String ALTERNATE_PAYER_ERR = "alternatePayerErr";
    private static final String SALES_INVOICE_HEADER_EXTRACT_ERR = "salesInvoiceHeaderExtractErr";
    private static final String CUSTOMER_CONTACTS_ERR = "customerContactsErr";
    private static final String SALES_INVOICE_ITEM_EXTRACT_ERR = "salesInvoiceItemExtractErr";
    private static final String INTERFACE_ERRORS = "interfaceErrors";




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
                return new ResponseEntity<>(cmsMonitoringService.getUnpostedSummaryData(), HttpStatus.OK);
//            case UNPOSTED_DETAILS:
//                return getUnpostedDetails();
//            case RECEIPT_ERROR_SUMMARY: //??
//                return getReceiptErrorSummary();
//            case RECEIPT_ERROR_DETAILS:
//                return getReceiptErrorDetails();
//            case JOB_RUN_STATUS: //??
//                return new ResponseEntity<>(cmsMonitoringService.getJobRunStatus(), HttpStatus.OK);
            case CTM_STATUS:
                return new ResponseEntity<>(cmsMonitoringService.getCtmStatus(), HttpStatus.OK);
            case CTM_DETAILS:
                return new ResponseEntity<>(cmsMonitoringService.getCtmDetails(), HttpStatus.OK);
            case BOOMI_STATUS:
                return new ResponseEntity<>(cmsMonitoringService.getBoomiStatus(), HttpStatus.OK);
            case BOOMI_DETAILS:
                return new ResponseEntity<>(cmsMonitoringService.getBoomiDetails(), HttpStatus.OK);
            case EXTRACT_COUNT:
                return new ResponseEntity<>(cmsMonitoringService.getExtractCount(), HttpStatus.OK);
            case EXTRACT_DETAILS:
                return new ResponseEntity<>(cmsMonitoringService.getExtractDetails(), HttpStatus.OK);
            case LATEST_REQUEST_STATUS:
                return new ResponseEntity<>(cmsMonitoringService.getLatestRequestStatus(), HttpStatus.OK);
            case COLLECTIONS_ERROR_SUMMARY:
                return new ResponseEntity<>(cmsMonitoringService.getCollectionsErrorSummary(), HttpStatus.OK);
            case INVOICE_PDF_EXTRACT_ERR:
                return new ResponseEntity<>(cmsMonitoringService.getInvoicePdfExtractErr(), HttpStatus.OK);
            case INVOICE_EXTRACT_ERR:
                return new ResponseEntity<>(cmsMonitoringService.getInvoiceExtractErr(), HttpStatus.OK);
            case CUSTOMER_MASTER_ERR:
                return new ResponseEntity<>(cmsMonitoringService.getCustomerMasterErr(), HttpStatus.OK);
            case ALTERNATE_PAYER_ERR:
                return new ResponseEntity<>(cmsMonitoringService.getAlternatePayerErr(), HttpStatus.OK);
            case SALES_INVOICE_HEADER_EXTRACT_ERR:
                return new ResponseEntity<>(cmsMonitoringService.getSalesInvoiceHeaderExtractErr(), HttpStatus.OK);
            case CUSTOMER_CONTACTS_ERR:
                return new ResponseEntity<>(cmsMonitoringService.getCustomerContactsErr(), HttpStatus.OK);
            case SALES_INVOICE_ITEM_EXTRACT_ERR:
                return new ResponseEntity<>(cmsMonitoringService.getSalesInvoiceItemExtractErr(), HttpStatus.OK);
            case INTERFACE_ERRORS:
                return new ResponseEntity<>(cmsMonitoringService.getInterfaceErrors(), HttpStatus.OK);
            default:
                logger.error("Request parameter does not match with defined values!");
                return null;
        }
    }

//    @GetMapping("/cms/getdatawithdate")
//    public ResponseEntity<List<Map<String, Object>>> getDataWithDate(@RequestParam("query") String query,
//                                                                     @RequestParam("date") String date) {
//        if(query.isEmpty() || query.isBlank() || date.isEmpty() || date.isBlank()){
//            logger.error("Request parameter is null or empty!");
//            return null;
//        }
//        System.out.println("Query: " + query + " Date: " + date );
//
////        switch(query){
////
////            case SALES_INVOICE_ITEM_EXTRACT_ERR:
////                return new ResponseEntity<>(cmsMonitoringService.getSalesInvoiceItemExtractErr(), HttpStatus.OK);
////            default:
////                logger.error("Request parameter does not match with defined values!");
////                return null;
////        }
//
//        return null;
//    }

//    private ResponseEntity<List<Map<String, Object>>> getUnpostedDetails() {
//        return new ResponseEntity<>(cmsMonitoringService.getUnpostedDetailsData(), HttpStatus.OK);
//    }

//    private ResponseEntity<List<Map<String, Object>>> getReceiptErrorSummary() {
//        return new ResponseEntity<>(cmsMonitoringService.getReceiptErrorSummaryData(), HttpStatus.OK);
//    }

//    private ResponseEntity<List<Map<String, Object>>> getReceiptErrorDetails() {
//        return new ResponseEntity<>(cmsMonitoringService.getReceiptErrorDetailsData(), HttpStatus.OK);
//    }

}
