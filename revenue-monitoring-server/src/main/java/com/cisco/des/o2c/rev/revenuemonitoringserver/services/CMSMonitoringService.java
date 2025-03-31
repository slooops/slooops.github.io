package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
//@PropertySource("classpath:server.properties")
public class CMSMonitoringService {

    private JdbcManager jdbcManager;
    private String unpostedSummaryQuery;
    private String unappliedErrorSummaryQuery;
    private String ctmStatusQuery;
    private String ctmDetailsQuery;
    private String boomiStatusQuery;
    private String boomiDetailsQuery;
    private String extractCountQuery;
    private String extractDetailsQuery;
    private String latestRequestStatusQuery;
    private String collectionsErrorSummaryQuery;
    private String invoicePdfExtractErrQuery;
    private String invoiceExtractErrQuery;
    private String customerMasterErrQuery;
    private String alternatePayerErrQuery;
    private String salesInvoiceHeaderExtractErrQuery;
    private String customerContactsErrQuery;
    private String salesInvoiceItemExtractErrQuery;
    private String interfaceErrorsQuery;
    private String interfaceErrorCountInXHrsQuery;
    private String unpostedTotalAmountQuery;
    private String totalReconciliationErrorQuery;
    private String boomiStatusHrToCg1Query;
    private String boomiDetailsHrToCg1Query;
    private String totalUnappliedAmountQuery;
    private String coreAppLayerErrorCountQuery;
    private String reconErrCountExtractQuery;


    private Logger logger = LoggerFactory.getLogger(CMSMonitoringService.class);

    @Autowired
    CacheManager cacheManager;

    @Autowired
    public CMSMonitoringService(JdbcManager jdbcManager, String cmsUnpostedSummaryQuery,
                                String cmsReceiptErrorSummaryQuery,
                                String cmsCtmStatusQuery, String cmsCtmDetailsQuery,
                                String cmsBoomiStatusQuery, String cmsBoomiDetailsQuery,
                                String cmsExtractCountQuery, String cmsExtractDetailsQuery,
                                String cmsLatestRequestStatusQuery, String cmsCollectionsErrorSummaryQuery,
                                String cmsInvoicePdfExtractErrorQuery, String cmsInvoiceExtractErrorQuery,
                                String cmsCustomerExtractErrorQuery, String cmsAlternatePayerErrorQuery,
                                String cmsSalesInvoiceHeaderExtractErrorQuery, String cmsCustomerContactsErrorQuery,
                                String cmsSalesInvoiceItemExtractErrorQuery, String cmsInterfaceErrorsQuery,
                                String cmsInterfaceErrorCountInXhrsQuery, String cmsUnpostedTotalAmountQuery,
                                String cmsTotalReconciliationErrorQuery, String cmsBoomiStatusHrToCg1Query,
                                String cmsBoomiDetailsHrToCg1Query, String cmsTotalUnappliedAmountQuery,
                                String cmsCoreAppLayerErrorCountQuery, String cmsReconErrCountExtractQuery) {
        this.jdbcManager = jdbcManager;
        this.unpostedSummaryQuery = cmsUnpostedSummaryQuery;
        this.unappliedErrorSummaryQuery = cmsReceiptErrorSummaryQuery;
        this.ctmStatusQuery = cmsCtmStatusQuery;
        this.ctmDetailsQuery = cmsCtmDetailsQuery;
        this.boomiStatusQuery = cmsBoomiStatusQuery;
        this.boomiDetailsQuery = cmsBoomiDetailsQuery;
        this.extractCountQuery = cmsExtractCountQuery;
        this.extractDetailsQuery = cmsExtractDetailsQuery;
        this.latestRequestStatusQuery = cmsLatestRequestStatusQuery;
        this.collectionsErrorSummaryQuery = cmsCollectionsErrorSummaryQuery;
        this.invoicePdfExtractErrQuery = cmsInvoicePdfExtractErrorQuery;
        this.invoiceExtractErrQuery = cmsInvoiceExtractErrorQuery;
        this.customerMasterErrQuery = cmsCustomerExtractErrorQuery;
        this.alternatePayerErrQuery = cmsAlternatePayerErrorQuery;
        this.salesInvoiceHeaderExtractErrQuery = cmsSalesInvoiceHeaderExtractErrorQuery;
        this.customerContactsErrQuery = cmsCustomerContactsErrorQuery;
        this.salesInvoiceItemExtractErrQuery = cmsSalesInvoiceItemExtractErrorQuery;
        this.interfaceErrorsQuery = cmsInterfaceErrorsQuery;
        this.interfaceErrorCountInXHrsQuery = cmsInterfaceErrorCountInXhrsQuery;
        this.unpostedTotalAmountQuery = cmsUnpostedTotalAmountQuery;
        this.totalReconciliationErrorQuery = cmsTotalReconciliationErrorQuery;
        this.boomiStatusHrToCg1Query = cmsBoomiStatusHrToCg1Query;
        this.boomiDetailsHrToCg1Query = cmsBoomiDetailsHrToCg1Query;
        this.totalUnappliedAmountQuery = cmsTotalUnappliedAmountQuery;
        this.coreAppLayerErrorCountQuery = cmsCoreAppLayerErrorCountQuery;
        this.reconErrCountExtractQuery = cmsReconErrCountExtractQuery;
    }

    @Cacheable("unpostedSummary")
    public List<Map<String, Object>> getUnpostedSummaryData()  {
        try {
            return jdbcManager.queryForList(unpostedSummaryQuery);
        } catch (Exception e) {
            logger.error("Exception in getUnpostedSummaryData():: " + e);
        }
        return null;
    }

    @Cacheable("unappliedErrorSummary")
    public List<Map<String, Object>> getUnappliedErrorSummaryData() {
        try {
            return jdbcManager.queryForList(unappliedErrorSummaryQuery);
        } catch (Exception e) {
            logger.error("Exception in getUnappliedErrorSummaryData():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCtmStatus()  {
        try {
            return jdbcManager.queryForList(ctmStatusQuery);
        } catch (Exception e) {
            logger.error("Exception in getCtmStatus():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCtmDetails()  {
        try {
            return jdbcManager.queryForList(ctmDetailsQuery);
        } catch (Exception e) {
            logger.error("Exception in getCtmDetails():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiStatus()  {
        try {
            return jdbcManager.queryForList(boomiStatusQuery);
        } catch (Exception e) {
            logger.error("Exception in getBoomiStatus():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiDetails()  {
        try {
            return jdbcManager.queryForList(boomiDetailsQuery);
        } catch (Exception e) {
            logger.error("Exception in getBoomiDetails():: " + e);
        }
        return null;
    }

    @Cacheable("extractCount")
    public List<Map<String, Object>> getExtractCount()  {
        try {
            return jdbcManager.queryForList(extractCountQuery);
        } catch (Exception e) {
            logger.error("Exception in getExtractCount():: " + e);
        }
        return null;
    }

    @Cacheable("extractDetails")
    public List<Map<String, Object>> getExtractDetails()  {
        try {
            return jdbcManager.queryForList(extractDetailsQuery);
        } catch (Exception e) {
            logger.error("Exception in getExtractDetails():: " + e);
        }
        return null;
    }

    @Cacheable("latestRequestStatus")
    public List<Map<String, Object>> getLatestRequestStatus() {
        try {
            return jdbcManager.queryForList(latestRequestStatusQuery);
        } catch (Exception e) {
            logger.error("Exception in getLatestRequestStatus():: " + e);
        }
        return null;
    }

    @Cacheable("extractStatus")
    public List<Map<String, Object>> getCollectionsErrorSummary() {
        try {
            return jdbcManager.queryForList(collectionsErrorSummaryQuery);
        } catch (Exception e) {
            logger.error("Exception in getCollectionsErrorSummary():: " + e);
        }
        return null;
    }

    @Cacheable("alternatePayerErr")
    public List<Map<String, Object>> getAlternatePayerErr() {
        try {
            return jdbcManager.queryForList(alternatePayerErrQuery);
        } catch (Exception e) {
            logger.error("Exception in getAlternatePayerErr():: " + e);
        }
        return null;
    }

    @Cacheable("salesInvoiceHeaderExtractErr")
    public List<Map<String, Object>> getSalesInvoiceHeaderExtractErr() {
        try {
            return jdbcManager.queryForList(salesInvoiceHeaderExtractErrQuery);
        } catch (Exception e) {
            logger.error("Exception in getSalesInvoiceHeaderExtractErr():: " + e);
        }
        return null;
    }

    @Cacheable("customerContactsErr")
    public List<Map<String, Object>> getCustomerContactsErr() {
        try {
            return jdbcManager.queryForList(customerContactsErrQuery);
        } catch (Exception e) {
            logger.error("Exception in getCustomerContactsErr():: " + e);
        }
        return null;
    }

    @Cacheable("salesInvoiceItemExtractErr")
    public List<Map<String, Object>> getSalesInvoiceItemExtractErr() {
        try {
            return jdbcManager.queryForList(salesInvoiceItemExtractErrQuery);
        } catch (Exception e) {
            logger.error("Exception in getSalesInvoiceItemExtractErr():: " + e);
        }
        return null;
    }


    @Cacheable("invoicePdfExtractErr")
    public List<Map<String, Object>> getInvoicePdfExtractErr() {
        try {
            return jdbcManager.queryForList(invoicePdfExtractErrQuery);
        } catch (Exception e) {
            logger.error("Exception in getInvoicePdfExtractErr():: " + e);
        }
        return null;
    }

    @Cacheable("invoiceExtractErr")
    public List<Map<String, Object>> getInvoiceExtractErr() {
        try {
            return jdbcManager.queryForList(invoiceExtractErrQuery);
        } catch (Exception e) {
            logger.error("Exception in getInvoiceExtractErr():: " + e);
        }
        return null;
    }

    @Cacheable("customerMasterErr")
    public List<Map<String, Object>> getCustomerMasterErr() {
        try {
            return jdbcManager.queryForList(customerMasterErrQuery);
        } catch (Exception e) {
            logger.error("Exception in getCustomerMasterErr():: " + e);
        }
        return null;
    }

    @Cacheable("interfaceErrors")
    public List<Map<String, Object>> getInterfaceErrors() {
        try {
            return jdbcManager.queryForList(interfaceErrorsQuery);
        } catch (Exception e) {
            logger.error("Exception in getInterfaceErrors():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getApiStatus() {
        HashMap<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> response = new ArrayList<>();

        try {
            String uri = "https://cms-flask-prod-ext-alln.cisco.com/api/v1/public/healthCheck";

            apiResponse.put("API Name", "CAE Service");
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> result = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);

            if( result.getStatusCode().is2xxSuccessful() ) {
                apiResponse.put("API Status", "GREEN");
            } else if ( result.getStatusCode().is4xxClientError() || result.getStatusCode().is5xxServerError() ) {
                apiResponse.put("API Status", "RED");
            } else {
                apiResponse.put("API Status", "YELLOW");
            }
        } catch (Exception e) {
            logger.error("Exception in getApiStatus():: " + e);
            apiResponse.put("API Status", "RED");
        }

        response.add(apiResponse);
        return response;
    }

    public List<Map<String, Object>> getSftpStatus() {
        HashMap<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> response = new ArrayList<>();
        try{
            String uri = "https://cms-flask-prod-ext-alln.cisco.com/api/v1/public/CiscoSFTPMonitor";

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Object> result = restTemplate.exchange(uri, HttpMethod.GET, null, Object.class);
            apiResponse.put("SFTP Status", result.getBody());
        } catch (Exception e){
            logger.error("Exception in getSftpStatus():: " + e);
            apiResponse.put("SFTP Status", "Error");
        }
        response.add(apiResponse);
        return response;
    }

    @Cacheable("interfaceErrorCountInXHrs")
    public List<Map<String, Object>> getInterfaceErrorCountInXHrs() {
        try {
            return jdbcManager.queryForList(interfaceErrorCountInXHrsQuery);
        } catch (Exception e) {
            logger.error("Exception in getInterfaceErrorCountInXHrs():: " + e);
        }
        return null;
    }

    @Cacheable("unpostedTotalAmount")
    public List<Map<String, Object>> getUnpostedTotalAmount() {
        try {
            return jdbcManager.queryForList(unpostedTotalAmountQuery);
        } catch (Exception e) {
            logger.error("Exception in getUnpostedTotalAmount():: " + e);
        }
        return null;
    }

    @Cacheable("totalUnappliedAmount")
    public List<Map<String, Object>> getTotalUnappliedAmount() {
        try {
            return jdbcManager.queryForList(totalUnappliedAmountQuery);
        } catch (Exception e) {
            logger.error("Exception in getTotalUnappliedAmount():: " + e);
        }
        return null;
    }

    @Cacheable("totalReconciliationError")
    public List<Map<String, Object>> getTotalReconciliationError() {
        try {
            return jdbcManager.queryForList(totalReconciliationErrorQuery);
        } catch (Exception e) {
            logger.error("Exception in getTotalReconciliationError():: " + e);
        }
        return null;
    }

    @Cacheable("reconErrCountExtract")
    public List<Map<String, Object>> getReconErrCountExtract() {
        try {
            return jdbcManager.queryForList(reconErrCountExtractQuery);
        } catch (Exception e) {
            logger.error("Exception in getReconErrCountExtract():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiStatusHrToCg1() {
        try {
            return jdbcManager.queryForList(boomiStatusHrToCg1Query);
        } catch (Exception e) {
            logger.error("Exception in getBoomiStatusHrToCG1():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiDetailsHrToCg1() {
        try {
            return jdbcManager.queryForList(boomiDetailsHrToCg1Query);
        } catch (Exception e) {
            logger.error("Exception in getBoomiDetailsHrToCG1():: " + e);
        }
        return null;
    }

    @Cacheable("coreAppLayerErrorCount")
    public List<Map<String, Object>> getCoreAppLayerErrorCount() {
        try {
            return jdbcManager.queryForList(coreAppLayerErrorCountQuery);
        } catch (Exception e) {
            logger.error("Exception in getCoreAppLayerErrorCount():: " + e);
        }
        return null;
    }

    /*
     * The cache is cleared at every 15 minutes
     */
    @Scheduled(fixedRate = 15*60000)
    public void evictAllCachesAtIntervals() {
        evictAllCaches();
    }

    private void evictAllCaches() {
        cacheManager.getCacheNames().stream()
                .forEach(cacheName -> cacheManager.getCache(cacheName).clear());
    }


}
