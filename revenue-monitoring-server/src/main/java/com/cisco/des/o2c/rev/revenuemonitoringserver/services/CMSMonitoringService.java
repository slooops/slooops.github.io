package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.cisco.des.o2c.rev.revenuemonitoringserver.repository.RedisRepositoryImpl;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;

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

    public Boolean unpostedSummaryRefresh = false;
    public Boolean unappliedErrorSummaryRefresh = false;
    public Boolean ctmStatusRefresh = false;
    public Boolean ctmDetailsRefresh = false;
    public Boolean boomiStatusRefresh = false;
    public Boolean boomiDetailsRefresh = false;
    public Boolean extractCountRefresh = false;
    public Boolean extractDetailsRefresh = false;
    public Boolean latestRequestStatusRefresh = false;
    public Boolean collectionsErrorSummaryRefresh = false;
    public Boolean invoicePdfExtractErrRefresh = false;
    public Boolean invoiceExtractErrRefresh = false;
    public Boolean customerMasterErrRefresh = false;
    public Boolean alternatePayerErrRefresh = false;
    public Boolean salesInvoiceHeaderExtractErrRefresh = false;
    public Boolean customerContactsErrRefresh = false;
    public Boolean salesInvoiceItemExtractErrRefresh = false;
    public Boolean interfaceErrorsRefresh = false;
    public Boolean interfaceErrorCountInXHrsRefresh = false;
    public Boolean unpostedTotalAmountRefresh = false;
    public Boolean totalReconciliationErrorRefresh = false;
    public Boolean boomiStatusHrToCg1Refresh = false;
    public Boolean boomiDetailsHrToCg1Refresh = false;
    public Boolean totalUnappliedAmountRefresh = false;
    public Boolean coreAppLayerErrorCountRefresh = false;
    public Boolean reconErrCountExtractRefresh = false;

//    private String URL = "";
//    private String USER = "";
//    private String PASSWORD = "";
//    private static final String STAGE_DB = "TS1CG1";
//    private static final String PROD_DB = "CG1PRD";
//    private static final String CTM_PROD = "CTM_PROD";

    //    @Value("${database.url.cg1}")
//    public String databaseURLCG1;
//    @Value("${database.username.cg1}")
//    public String databaseUsernameCG1;
//    @Value("${database.password.cg1}")
//    public String databasePasswordCG1;
    private Logger logger = LoggerFactory.getLogger(CMSMonitoringService.class);

    @Autowired
    private RedisRepositoryImpl redisRepository;

    @Autowired
    public CMSMonitoringService(JdbcManager jdbcManager, String cmsUnpostedSummaryQuery,
                                String cmsReceiptErrorSummaryQuery, String cmsCtmStatusQuery, String cmsCtmDetailsQuery,
                                String cmsBoomiStatusQuery, String cmsBoomiDetailsQuery, String cmsExtractCountQuery,
                                String cmsExtractDetailsQuery, String cmsLatestRequestStatusQuery, String cmsCollectionsErrorSummaryQuery,
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

    // @Cacheable("unpostedSummary")
    public List<Map<String, Object>> getUnpostedSummaryData() {
        try {
            if (redisRepository.findData("UnpostedSummary") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("UnpostedSummary");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(unpostedSummaryQuery);
                redisRepository.add("UnpostedSummary", retObject);
                return retObject;
//            return executeQuery(unpostedSummaryQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getUnpostedSummaryData():: " + e);
        }
        return null;
    }

    // @Cacheable("unappliedErrorSummary")
    public List<Map<String, Object>> getUnappliedErrorSummaryData() {
        try {
            if (redisRepository.findData("UnappliedErrorSummary") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("UnappliedErrorSummary");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(unappliedErrorSummaryQuery);
                redisRepository.add("UnappliedErrorSummary", retObject);
                return retObject;
//            return executeQuery(unappliedErrorSummaryQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getUnappliedErrorSummaryData():: " + e);
        }
        return null;
    }

    // @CachePut(value="CtmStatus")
    public List<Map<String, Object>> getCtmStatus() {
        try {
            if (redisRepository.findData("CtmStatus") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("CtmStatus");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(ctmStatusQuery);
                redisRepository.add("CtmStatus", retObject);
                return retObject;
            }
//            return executeQuery(ctmStatusQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getCtmStatus():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCtmDetails() {
        try {
            if (redisRepository.findData("CtmDetails") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("CtmDetails");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(ctmDetailsQuery);
                redisRepository.add("CtmDetails", retObject);
                return retObject;
//            return executeQuery(ctmDetailsQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getCtmDetails():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiStatus() {
        try {
            if (redisRepository.findData("BoomiStatus") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("BoomiStatus");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(boomiStatusQuery);
                redisRepository.add("BoomiStatus", retObject);
                return retObject;
//            return executeQuery(boomiStatusQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getBoomiStatus():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiDetails() {
        try {
            if (redisRepository.findData("BoomiDetails") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("BoomiDetails");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(boomiDetailsQuery);
                redisRepository.add("BoomiDetails", retObject);
                return retObject;
//            return executeQuery(boomiDetailsQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getBoomiDetails():: " + e);
        }
        return null;
    }

    // @Cacheable("extractCount")
    public List<Map<String, Object>> getExtractCount() {
        try {
            if (redisRepository.findData("ExtractCount") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("ExtractCount");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(extractCountQuery);
                redisRepository.add("ExtractCount", retObject);
                return retObject;
//            return executeQuery(extractCountQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getExtractCount():: " + e);
        }
        return null;
    }

    // @Cacheable("extractDetails")
    public List<Map<String, Object>> getExtractDetails() {
        try {
            if (redisRepository.findData("ExtractDetails") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("ExtractDetails");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(extractDetailsQuery);
                redisRepository.add("ExtractDetails", retObject);
                return retObject;
            }
//            return executeQuery(extractDetailsQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getExtractDetails():: " + e);
        }
        return null;
    }

    // @Cacheable("latestRequestStatus")
    public List<Map<String, Object>> getLatestRequestStatus() {
        try {
            if (redisRepository.findData("LatestRequestStatus") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("LatestRequestStatus");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(latestRequestStatusQuery);
                redisRepository.add("LatestRequestStatus", retObject);
                return retObject;
//            return executeQuery(latestRequestStatusQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getLatestRequestStatus():: " + e);
        }
        return null;
    }

    // @Cacheable("extractStatus")
    public List<Map<String, Object>> getCollectionsErrorSummary() {
        try {
            if (redisRepository.findData("CollectionsErrorSummary") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("CollectionsErrorSummary");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(collectionsErrorSummaryQuery);
                redisRepository.add("CollectionsErrorSummary", retObject);
                return retObject;
            }
            // return jdbcManager.queryForList(collectionsErrorSummaryQuery);
        } catch (Exception e) {
            logger.error("Exception in getCollectionsErrorSummary():: " + e);
        }
        return null;
    }

    // @Cacheable("alternatePayerErr")
    public List<Map<String, Object>> getAlternatePayerErr() {
        try {
            if (redisRepository.findData("AlternatePayerErr") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("AlternatePayerErr");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(alternatePayerErrQuery);
                redisRepository.add("AlternatePayerErr", retObject);
                return retObject;
//            return executeQuery(alternatePayerErrQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getAlternatePayerErr():: " + e);
        }
        return null;
    }

    // @Cacheable("salesInvoiceHeaderExtractErr")
    public List<Map<String, Object>> getSalesInvoiceHeaderExtractErr() {
        try {
            if (redisRepository.findData("SalesInvoiceHeaderExtractErr") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("SalesInvoiceHeaderExtractErr");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(salesInvoiceHeaderExtractErrQuery);
                redisRepository.add("SalesInvoiceHeaderExtractErr", retObject);
                return retObject;
//            return executeQuery(salesInvoiceHeaderExtractErrQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getSalesInvoiceHeaderExtractErr():: " + e);
        }
        return null;
    }

    // @Cacheable("customerContactsErr")
    public List<Map<String, Object>> getCustomerContactsErr() {
        try {
            if (redisRepository.findData("CustomerContactsErr") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("CustomerContactsErr");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(customerContactsErrQuery);
                redisRepository.add("CustomerContactsErr", retObject);
                return retObject;
//            return executeQuery(customerContactsErrQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getCustomerContactsErr():: " + e);
        }
        return null;
    }

    // @Cacheable("salesInvoiceItemExtractErr")
    public List<Map<String, Object>> getSalesInvoiceItemExtractErr() {
        try {
            if (redisRepository.findData("SalesInvoiceItemExtractErr") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("SalesInvoiceItemExtractErr");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(salesInvoiceItemExtractErrQuery);
                redisRepository.add("SalesInvoiceItemExtractErr", retObject);
                return retObject;
//            return executeQuery(salesInvoiceItemExtractErrQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getSalesInvoiceItemExtractErr():: " + e);
        }
        return null;
    }

    // @Cacheable("invoicePdfExtractErr")
    public List<Map<String, Object>> getInvoicePdfExtractErr() {
        try {
            if (redisRepository.findData("InvoicePdfExtractErr") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("InvoicePdfExtractErr");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(invoicePdfExtractErrQuery);
                redisRepository.add("InvoicePdfExtractErr", retObject);
                return retObject;
//            return executeQuery(invoicePdfExtractErrQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getInvoicePdfExtractErr():: " + e);
        }
        return null;
    }

    //    @Cacheable("invoiceExtractErr")
    public List<Map<String, Object>> getInvoiceExtractErr() {
        try {
            if (redisRepository.findData("InvoiceExtractErr") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("InvoiceExtractErr");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(invoiceExtractErrQuery);
                redisRepository.add("InvoiceExtractErr", retObject);
                return retObject;
//            return executeQuery(invoiceExtractErrQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getInvoiceExtractErr():: " + e);
        }
        return null;
    }

    // @Cacheable("customerMasterErr")
    public List<Map<String, Object>> getCustomerMasterErr() {
        try {
            if (redisRepository.findData("CustomerMasterErr") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("CustomerMasterErr");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(customerMasterErrQuery);
                redisRepository.add("CustomerMasterErr", retObject);
                return retObject;
//            return executeQuery(customerMasterErrQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getCustomerMasterErr():: " + e);
        }
        return null;
    }

    // @Cacheable("interfaceErrors")
    public List<Map<String, Object>> getInterfaceErrors() {
        try {
            if (redisRepository.findData("InterfaceErrors") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("InterfaceErrors");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(interfaceErrorsQuery);
                redisRepository.add("InterfaceErrors", retObject);
                return retObject;
//            return executeQuery(interfaceErrorsQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getInterfaceErrors():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getApiStatus() {
        HashMap<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> response = new ArrayList<>();

        try {
            // String uri =
            // "https://cms-flask-stage-ext-rtp2.cisco.com/api/v1/public/healthCheck";
            // String uri =
            // "https://cms-flask-dev-ext-rtp2.cisco.com/api/v1/public/healthCheck";
            String uri = "https://cms-flask-prod-ext-alln.cisco.com/api/v1/public/healthCheck";

            apiResponse.put("API Name", "CAE Service");
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> result = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);

            if (result.getStatusCode().is2xxSuccessful()) {
                apiResponse.put("API Status", "GREEN");
            } else if (result.getStatusCode().is4xxClientError() || result.getStatusCode().is5xxServerError()) {
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
        try {
            // String uri =
            // "https://cms-flask-stage-ext-rtp2.cisco.com/api/v1/public/CiscoSFTPMonitor";
            String uri = "https://cms-flask-prod-ext-alln.cisco.com/api/v1/public/CiscoSFTPMonitor";

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Object> result = restTemplate.exchange(uri, HttpMethod.GET, null, Object.class);
            apiResponse.put("SFTP Status", result.getBody());
        } catch (Exception e) {
            logger.error("Exception in getSftpStatus():: " + e);
            apiResponse.put("SFTP Status", "Error");
        }
        response.add(apiResponse);
        return response;
    }

    // @Cacheable("interfaceErrorCountInXHrs")
    public List<Map<String, Object>> getInterfaceErrorCountInXHrs() {
        try {
            if (redisRepository.findData("InterfaceErrorCountInXHrs") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("InterfaceErrorCountInXHrs");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(interfaceErrorCountInXHrsQuery);
                redisRepository.add("InterfaceErrorCountInXHrs", retObject);
                return retObject;
//            return executeQuery(interfaceErrorCountInXHrsQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getInterfaceErrorCountInXHrs():: " + e);
        }
        return null;
    }

    // @Cacheable("unpostedTotalAmount")
    public List<Map<String, Object>> getUnpostedTotalAmount() {
        try {
            if (redisRepository.findData("UnpostedTotalAmount") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("UnpostedTotalAmount");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(unpostedTotalAmountQuery);
                redisRepository.add("UnpostedTotalAmount", retObject);
                return retObject;
//            return executeQuery(unpostedTotalAmountQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getUnpostedTotalAmount():: " + e);
        }
        return null;
    }

    // @Cacheable("totalUnappliedAmount")
    public List<Map<String, Object>> getTotalUnappliedAmount() {
        try {
            if (redisRepository.findData("TotalUnappliedAmount") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("TotalUnappliedAmount");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(totalUnappliedAmountQuery);
                redisRepository.add("TotalUnappliedAmount", retObject);
                return retObject;
            }
            // return jdbcManager.queryForList(totalUnappliedAmountQuery);
// OLD            return executeQuery(totalUnappliedAmountQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getTotalUnappliedAmount():: " + e);
        }
        return null;
    }

    // @Cacheable("totalReconciliationError")
    public List<Map<String, Object>> getTotalReconciliationError() {
        try {
            if (redisRepository.findData("TotalReconciliationError") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("TotalReconciliationError");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(totalReconciliationErrorQuery);
                redisRepository.add("TotalReconciliationError", retObject);
                return retObject;
                // return jdbcManager.queryForList(totalReconciliationErrorQuery);
//            return executeQuery(totalReconciliationErrorQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getTotalReconciliationError():: " + e);
        }
        return null;
    }

    // @Cacheable("reconErrCountExtract")
    public List<Map<String, Object>> getReconErrCountExtract() {
        try {
            if (redisRepository.findData("ReconErrCountExtract") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("ReconErrCountExtract");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(reconErrCountExtractQuery);
                redisRepository.add("ReconErrCountExtract", retObject);
                return retObject;
//            return executeQuery(reconErrCountExtractQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getReconErrCountExtract():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiStatusHrToCg1() {
        try {
            if (redisRepository.findData("BoomiStatusHrToCg1") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("BoomiStatusHrToCg1");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(boomiStatusHrToCg1Query);
                redisRepository.add("BoomiStatusHrToCg1", retObject);
                return retObject;
//            return executeQuery(boomiStatusHrToCg1Query, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getBoomiStatusHrToCG1():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiDetailsHrToCg1() {
        try {
            if (redisRepository.findData("BoomiDetailsHrToCg1") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("BoomiDetailsHrToCg1");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(boomiDetailsHrToCg1Query);
                redisRepository.add("BoomiDetailsHrToCg1", retObject);
                return retObject;
//            return executeQuery(boomiDetailsHrToCg1Query, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getBoomiDetailsHrToCG1():: " + e);
        }
        return null;
    }

    // @Cacheable("coreAppLayerErrorCount")
    public List<Map<String, Object>> getCoreAppLayerErrorCount() {
        try {
            if (redisRepository.findData("CoreAppLayerErrorCount") != null) {
                return (List<Map<String, Object>>) redisRepository.findData("CoreAppLayerErrorCount");
            } else {
                List<Map<String, Object>> retObject = jdbcManager.queryForList(coreAppLayerErrorCountQuery);
                redisRepository.add("CoreAppLayerErrorCount", retObject);
                return retObject;
//            return executeQuery(coreAppLayerErrorCountQuery, "CG1PRD");
            }
        } catch (Exception e) {
            logger.error("Exception in getCoreAppLayerErrorCount():: " + e);
        }
        return null;
    }

    public void refreshCMSCache() {
        try {
            logger.info("Starting CMS Refresh");

            // UnpostedSummary
            redisRepository.add("UnpostedSummary", jdbcManager.queryForList(unpostedSummaryQuery));
            // UnappliedErrorSummary
            redisRepository.add("UnappliedErrorSummary", jdbcManager.queryForList(unappliedErrorSummaryQuery));
            // CtmStatus
            redisRepository.add("CtmStatus", jdbcManager.queryForList(ctmStatusQuery));
            // CtmDetails
            redisRepository.add("CtmDetails", jdbcManager.queryForList(ctmDetailsQuery));
            // BoomiStatus
            redisRepository.add("BoomiStatus", jdbcManager.queryForList(boomiStatusQuery));
            // BoomiDetails
            redisRepository.add("BoomiDetails", jdbcManager.queryForList(boomiDetailsQuery));
            // ExtractCount
            redisRepository.add("ExtractCount", jdbcManager.queryForList(extractCountQuery));
            // ExtractDetails
            redisRepository.add("ExtractDetails", jdbcManager.queryForList(extractDetailsQuery));
            // LatestRequestStatus
            redisRepository.add("LatestRequestStatus", jdbcManager.queryForList(latestRequestStatusQuery));
            // CollectionsErrorSummary
            redisRepository.add("CollectionsErrorSummary", jdbcManager.queryForList(collectionsErrorSummaryQuery));
            // AlternatePayerErr
            redisRepository.add("AlternatePayerErr", jdbcManager.queryForList(alternatePayerErrQuery));
            // SalesInvoiceHeaderExtractErr
            redisRepository.add("SalesInvoiceHeaderExtractErr", jdbcManager.queryForList(salesInvoiceHeaderExtractErrQuery));
            // CustomerContactsErr
            redisRepository.add("CustomerContactsErr", jdbcManager.queryForList(customerContactsErrQuery));
            // SalesInvoiceItemExtractErr
            redisRepository.add("SalesInvoiceItemExtractErr", jdbcManager.queryForList(salesInvoiceItemExtractErrQuery));
            // InvoicePdfExtractErr
            redisRepository.add("InvoicePdfExtractErr", jdbcManager.queryForList(invoicePdfExtractErrQuery));
            // InvoiceExtractErr
            redisRepository.add("InvoiceExtractErr", jdbcManager.queryForList(invoiceExtractErrQuery));
            // CustomerMasterErr
            redisRepository.add("CustomerMasterErr", jdbcManager.queryForList(customerMasterErrQuery));
            // InterfaceErrors
            redisRepository.add("InterfaceErrors", jdbcManager.queryForList(interfaceErrorsQuery));
            // InterfaceErrorCountInXHrs
            redisRepository.add("InterfaceErrorCountInXHrs", jdbcManager.queryForList(interfaceErrorCountInXHrsQuery));
            // UnpostedTotalAmount
            redisRepository.add("UnpostedTotalAmount", jdbcManager.queryForList(unpostedTotalAmountQuery));
            // TotalUnappliedAmount
            redisRepository.add("TotalUnappliedAmount", jdbcManager.queryForList(totalUnappliedAmountQuery));
            // TotalReconciliationError
            redisRepository.add("TotalReconciliationError", jdbcManager.queryForList(totalReconciliationErrorQuery));
            // ReconErrCountExtract
            redisRepository.add("ReconErrCountExtract", jdbcManager.queryForList(reconErrCountExtractQuery));
            // BoomiStatusHrToCg1
            redisRepository.add("BoomiStatusHrToCg1", jdbcManager.queryForList(boomiStatusHrToCg1Query));
            // BoomiDetailsHrToCg1
            redisRepository.add("BoomiDetailsHrToCg1", jdbcManager.queryForList(boomiDetailsHrToCg1Query));
            // CoreAppLayerErrorCount
            redisRepository.add("CoreAppLayerErrorCount", jdbcManager.queryForList(coreAppLayerErrorCountQuery));

            logger.info("CMS Refresh Complete");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /*
     * The cache is cleared at every 15 minutes
     */
    /*
     * @Scheduled(fixedRate = 15*60000) public void evictAllCachesAtIntervals() {
     * evictAllCaches(); }
     *
     * private void evictAllCaches() { cacheManager.getCacheNames().stream()
     * .forEach(cacheName -> cacheManager.getCache(cacheName).clear()); }
     */
//    private List<Map<String, Object>> executeQuery(String query, String dbName){
//        Connection connection = null;
//        List<Map<String, Object>> rows = null;
//        readDBProperties(dbName);
//
//        try {
//            connection = DriverManager.getConnection(URL, USER, PASSWORD);
//            logger.info("In executeQuery():: connection created for  " + dbName);
//        } catch(SQLException e) {
//            logger.error("Exception in executeQuery():: while creating connection:: " + e);
//        }
//
//        try {
//            if (connection != null) {
//                Statement statement = connection.createStatement();
//                ResultSet rs = statement.executeQuery(query);
//                logger.info("In executeQuery():: query executed successfully!");
//                rows = resultSetToList(rs);
//                connection.close();
//                logger.info("In executeQuery():: DB connection closed!");
//            }
//        } catch(SQLException e) {
//            logger.error("Exception in executeQuery():: while executing query:: " + e);
//        }
//
//        return rows;
//    }
//
//    private void readDBProperties(String dbName){
//        //TODO:: read the DB details from the property file
//        if (dbName.equalsIgnoreCase(STAGE_DB)){
//            URL = "jdbc:oracle:thin:@ldap://ldap-ldstg3:5000/TS1CG1,cn=OracleContext,dc=cisco,dc=com";
//            USER = "ARFINRO";
//            PASSWORD = "Wf0Q9q5W";
//        }else if(dbName.equalsIgnoreCase(PROD_DB)){
////            URL = "jdbc:oracle:thin:@ldap://ldap-ldstg3:5000/CG1PRD,cn=OracleContext,dc=cisco,dc=com";
////            USER = "ARFINRO";
////            PASSWORD = "Sp0nge8ob";
//            URL = databaseURLCG1;
//            USER = databaseUsernameCG1;
//            PASSWORD = databasePasswordCG1;
////            logger.info("DB url " + URL);
////            logger.info("DB user " + USER);
////            logger.info("DB pwd " + PASSWORD);
//        }else if(dbName.equalsIgnoreCase(CTM_PROD)){
//            URL = "jdbc:oracle:thin:@ldap://ldap-ldstg3:5000/CTMRPRD,cn=OracleContext,dc=cisco,dc=com";
//            USER = "CTMO2C";
//            PASSWORD = "Cisco123$";
//        }
//    }
//
//    private List<Map<String, Object>> resultSetToList(ResultSet rs)  {
//        logger.info("In resultSetToList():: converting resultset to list");
//
//        try {
//            ResultSetMetaData md = rs.getMetaData();
//            int columns = md.getColumnCount();
//            List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
//            while (rs.next()) {
//                Map<String, Object> row = new HashMap<String, Object>(columns);
//                for (int i = 1; i <= columns; ++i) {
//                    row.put(md.getColumnName(i), rs.getObject(i));
//                }
//                rows.add(row);
//            }
//            return rows;
//        } catch(SQLException e) {
//            logger.error("Exception in resultSetToList():: while converting resultset to list:: " + e);
//        }
//        return null;
//    }

}
