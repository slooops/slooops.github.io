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

    //Collections Table Data - Extract Status
    private static final String COLLECTIONS_ERROR_SUMMARY = "collectionsErrorSummary";
    private static final String INVOICE_PDF_EXTRACT_ERR = "invoicePdfExtractErr";
    private static final String INVOICE_EXTRACT_ERR = "invoiceExtractErr";
    private static final String CUSTOMER_MASTER_ERR = "customerMasterErr";
    private static final String ALTERNATE_PAYER_ERR = "alternatePayerErr";
    private static final String SALES_INVOICE_HEADER_EXTRACT_ERR = "salesInvoiceHeaderExtractErr";
    private static final String CUSTOMER_CONTACTS_ERR = "customerContactsErr";
    private static final String SALES_INVOICE_ITEM_EXTRACT_ERR = "salesInvoiceItemExtractErr";

    //Collections Table Data - Reconciliation Error Extract
    private static final String RECON_ERR_COUNT_EXTRACT = "reconErrCountExtract";

    //Collections Table Data - Latest request status
    private static final String LATEST_REQUEST_STATUS = "latestRequestStatus";

    //CashApps Table Data - Interface error in last X hours
    private static final String INTERFACE_ERRORS = "interfaceErrors";

    //CashApps Table Data - Unposted Amount
    private static final String UNPOSTED_SUMMARY = "unpostedSummary";
    private static final String UNPOSTED_DETAILS = "unpostedDetails";

    //CashApps Table Data - Unapplied errors
    private static final String UNAPPLIED_ERROR_SUMMARY = "unappliedErrorSummary";
    private static final String UNAPPLIED_ERROR_DETAILS = "unappliedErrorDetails";

    //Collections Widgets Data - Extract Errors in last X days
    private static final String EXTRACT_COUNT = "extractCount";
    private static final String EXTRACT_DETAILS = "extractDetails";

    //Collections Widgets Data - Reconcilliation Errors
    private static final String TOTAL_RECONCILIATION_ERROR = "totalReconciliationError";

    //Collections Widgets Data - HRC App vs Core Error/mismatch
    private static final String CORE_APP_LAYER_ERROR_COUNT = "coreAppLayerErrorCount";

    //Cash App Widgets Data - Interface Errors in last X hours
    private static final String INTERFACE_ERROR_COUNT_IN_XHRS = "interfaceErrorCountInXHrs";

    //Cash App Widgets Data - Unapplied Amount
    private static final String TOTAL_UNAPPLIED_AMOUNT = "totalUnappliedAmount";

    //Cash App Widgets Data - Unposted Amount
    private static final String UNPOSTED_TOTAL_AMOUNT = "unpostedTotalAmount";

    //Application Status - Top Section
    private static final String CTM_STATUS = "ctmStatus";
    private static final String CTM_DETAILS = "ctmDetails";
    private static final String BOOMI_STATUS = "boomiStatus";
    private static final String BOOMI_DETAILS = "boomiDetails";

    //Application Status - Bottom Section
    private static final String BOOMI_STATUS_HR_TO_CG1 = "boomiStatusFromHr";
    private static final String BOOMI_DETAILS_HR_TO_CG1 = "boomiDetailsFromHr";

    //TODO
    //ctm details  for bottom section
    //ctm status  for bottom section

    //API Status
    private static final String API_STATUS = "apiStatus";

    //SFTP Status
    private static final String SFTP_STATUS = "sftpStatus";

    //ToCheck
    private static final String JOB_RUN_STATUS = "jobRunStatus";

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
            case UNAPPLIED_ERROR_SUMMARY:
                return new ResponseEntity<>(cmsMonitoringService.getUnappliedErrorSummaryData(), HttpStatus.OK);
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
            case API_STATUS:
                return new ResponseEntity<>(cmsMonitoringService.getApiStatus(), HttpStatus.OK);
            case INTERFACE_ERROR_COUNT_IN_XHRS:
                return new ResponseEntity<>(cmsMonitoringService.getInterfaceErrorCountInXHrs(), HttpStatus.OK);
            case UNPOSTED_TOTAL_AMOUNT:
                return new ResponseEntity<>(cmsMonitoringService.getUnpostedTotalAmount(), HttpStatus.OK);
            case TOTAL_RECONCILIATION_ERROR:
                return new ResponseEntity<>(cmsMonitoringService.getTotalReconciliationError(), HttpStatus.OK);
            case BOOMI_STATUS_HR_TO_CG1:
                return new ResponseEntity<>(cmsMonitoringService.getBoomiStatusHrToCg1(), HttpStatus.OK);
            case BOOMI_DETAILS_HR_TO_CG1:
                return new ResponseEntity<>(cmsMonitoringService.getBoomiDetailsHrToCg1(), HttpStatus.OK);
            case TOTAL_UNAPPLIED_AMOUNT:
                return new ResponseEntity<>(cmsMonitoringService.getTotalUnappliedAmount(), HttpStatus.OK);
            case SFTP_STATUS:
                return new ResponseEntity<>(cmsMonitoringService.getSftpStatus(), HttpStatus.OK);
            case CORE_APP_LAYER_ERROR_COUNT:
                return new ResponseEntity<>(cmsMonitoringService.getCoreAppLayerErrorCount(), HttpStatus.OK);
            case RECON_ERR_COUNT_EXTRACT:
                return new ResponseEntity<>(cmsMonitoringService.getReconErrCountExtract(), HttpStatus.OK);
            default:
                logger.error("Request parameter does not match with defined values!");
                return null;
        }
    }

}
