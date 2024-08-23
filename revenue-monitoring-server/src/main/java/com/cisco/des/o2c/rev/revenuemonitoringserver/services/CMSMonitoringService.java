package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

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
@PropertySource("classpath:server.properties")
public class CMSMonitoringService {

    private String unpostedSummaryQuery;
    private String unpostedDetailsQuery;
    private String unappliedErrorSummaryQuery;
    private String receiptErrorDetailsQuery;
    private String jobRunStatusQuery;
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

    private String URL = "";
    private String USER = "";
    private String PASSWORD = "";
    private static final String STAGE_DB = "TS1CG1";
    private static final String PROD_DB = "CG1PRD";
    private static final String CTM_PROD = "CTM_PROD";

    @Value("${database.url.cg1}")
    public String databaseURLCG1;
    @Value("${database.username.cg1}")
    public String databaseUsernameCG1;
    @Value("${database.password.cg1}")
    public String databasePasswordCG1;
    private Logger logger = LoggerFactory.getLogger(CMSMonitoringService.class);

    @Autowired
    CacheManager cacheManager;

    @Autowired
    public CMSMonitoringService(String cmsUnpostedSummaryQuery,
                                String cmsUnpostedDetailsQuery, String cmsReceiptErrorSummaryQuery,
                                String cmsReceiptErrorDetailsQuery, String cmsJobRunStatusQuery,
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
        this.unpostedSummaryQuery = cmsUnpostedSummaryQuery;
        this.unpostedDetailsQuery = cmsUnpostedDetailsQuery;
        this.unappliedErrorSummaryQuery = cmsReceiptErrorSummaryQuery;
        this.receiptErrorDetailsQuery = cmsReceiptErrorDetailsQuery;
        this.jobRunStatusQuery = cmsJobRunStatusQuery;
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
            logger.info("In getUnpostedSummaryData():: retrieving data");
            return executeQuery(unpostedSummaryQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getUnpostedSummaryData():: " + e);
        }
        return null;
    }

    @Cacheable("unpostedDetails")
    public List<Map<String, Object>> getUnpostedDetailsData() {
        try {
            logger.info("In getUnpostedDetailsData():: retrieving data");
            return executeQuery(unpostedDetailsQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getUnpostedDetailsData():: " + e);
        }
        return null;
    }

    @Cacheable("unappliedErrorSummary")
    public List<Map<String, Object>> getUnappliedErrorSummaryData() {
        try {
            logger.info("In getUnappliedErrorSummaryData():: retrieving data");
            return executeQuery(unappliedErrorSummaryQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getUnappliedErrorSummaryData():: " + e);
        }
        return null;
    }

    @Cacheable("receiptErrorDetails")
    public List<Map<String, Object>> getReceiptErrorDetailsData() {
        try {
            logger.info("In getReceiptErrorDetailsData():: retrieving data");
            return executeQuery(receiptErrorDetailsQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getReceiptErrorDetailsData():: " + e);
        }
        return null;
    }

    @Cacheable("jobRunStatus")
    public List<Map<String, Object>> getJobRunStatus()  {
        try {
            logger.info("In getJobRunStatus():: retrieving data");
            return executeQuery(jobRunStatusQuery, "CTM_PROD");
        } catch (Exception e) {
            logger.error("Exception in getJobRunStatus():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCtmStatus()  {
        try {
            logger.info("In getCtmStatus():: retrieving data");
            return executeQuery(ctmStatusQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getCtmStatus():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCtmDetails()  {
        try {
            logger.info("In getCtmDetails():: retrieving data");
            return executeQuery(ctmDetailsQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getCtmDetails():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiStatus()  {
        try {
            logger.info("In getBoomiStatus():: retrieving data");
            return executeQuery(boomiStatusQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getBoomiStatus():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiDetails()  {
        try {
            logger.info("In getBoomiDetails():: retrieving data");
            return executeQuery(boomiDetailsQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getBoomiDetails():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getExtractCount()  {
        try {
            logger.info("In getExtractCount():: retrieving data");
            return executeQuery(extractCountQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getExtractCount():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getExtractDetails()  {
        try {
            logger.info("In getExtractDetails():: retrieving data");
            return executeQuery(extractDetailsQuery, "CG1PRD");
        } catch (Exception e) {
            logger.error("Exception in getExtractDetails():: " + e);
        }
        return null;
    }

    @Cacheable("latestRequestStatus")
    public List<Map<String, Object>> getLatestRequestStatus() {
        try {
            logger.info("In getLatestRequestStatus():: retrieving data");
            return executeQuery(latestRequestStatusQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getLatestRequestStatus():: " + e);
        }
        return null;
    }

    @Cacheable("extractStatus")
    public List<Map<String, Object>> getCollectionsErrorSummary() {
        try {
            logger.info("In getCollectionsErrorSummary():: retrieving data");
            return executeQuery(collectionsErrorSummaryQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getCollectionsErrorSummary():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getAlternatePayerErr() {
        try {
            logger.info("In getAlternatePayerErr():: retrieving data");
            return executeQuery(alternatePayerErrQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getAlternatePayerErr():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getSalesInvoiceHeaderExtractErr() {
        try {
            logger.info("In getSalesInvoiceHeaderExtractErr():: retrieving data");
            return executeQuery(salesInvoiceHeaderExtractErrQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getSalesInvoiceHeaderExtractErr():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCustomerContactsErr() {
        try {
            logger.info("In getCustomerContactsErr():: retrieving data");
            return executeQuery(customerContactsErrQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getCustomerContactsErr():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getSalesInvoiceItemExtractErr() {
        try {
            logger.info("In getSalesInvoiceItemExtractErr():: retrieving data");
            return executeQuery(salesInvoiceItemExtractErrQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getSalesInvoiceItemExtractErr():: " + e);
        }
        return null;
    }


    public List<Map<String, Object>> getInvoicePdfExtractErr() {
        try {
            logger.info("In getInvoicePdfExtractErr():: retrieving data");
            return executeQuery(invoicePdfExtractErrQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getInvoicePdfExtractErr():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getInvoiceExtractErr() {
        try {
            logger.info("In getInvoiceExtractErr():: retrieving data");
            return executeQuery(invoiceExtractErrQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getInvoiceExtractErr():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCustomerMasterErr() {
        try {
            logger.info("In getCustomerMasterErr():: retrieving data");
            return executeQuery(customerMasterErrQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getCustomerMasterErr():: " + e);
        }
        return null;
    }

    @Cacheable("interfaceErrors")
    public List<Map<String, Object>> getInterfaceErrors() {
        try {
            logger.info("In getInterfaceErrors():: retrieving data");
            return executeQuery(interfaceErrorsQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getInterfaceErrors():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getApiStatus() {
        HashMap<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> response = new ArrayList<>();
//        HashMap<String, Object> apiResponse1 = new HashMap<>(); //temp code
//        HashMap<String, Object> apiResponse2 = new HashMap<>(); //temp code

        try {
            logger.info("In getApiStatus():: retrieving data");
            String uri = "https://cms-flask-stage-ext-rtp2.cisco.com/api/v1/public/healthCheck";
            //String uri = "https://cms-flask-dev-ext-rtp2.cisco.com/api/v1/public/healthCheck";
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

            //adding temp code, later can be replaced with actual new APIs --start
//            apiResponse1.put("API Name", "CMS TestAPI-1");
//            apiResponse1.put("API Status", "GREEN");
//            apiResponse2.put("API Name", "CMS TestAPI-2");
//            apiResponse2.put("API Status", "GREEN");
            //adding temp code, later can be replaced with actual new APIs --end

        } catch (Exception e) {
            logger.error("Exception in getApiStatus():: " + e);
            apiResponse.put("API Status", "RED");

        }
        response.add(apiResponse);
//        response.add(apiResponse1); //temp code
//        response.add(apiResponse2); //temp code

        return response;
    }

    public List<Map<String, Object>> getSftpStatus() {
        HashMap<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> response = new ArrayList<>();
        try{
            logger.info("In getSftpStatus():: retrieving data");
            String uri = "https://cms-flask-stage-ext-rtp2.cisco.com/api/v1/public/CiscoSFTPMonitor";

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

    public List<Map<String, Object>> getInterfaceErrorCountInXHrs() {
        try {
            logger.info("In getInterfaceErrorCountInXHrs():: retrieving data");
            return executeQuery(interfaceErrorCountInXHrsQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getInterfaceErrorCountInXHrs():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getUnpostedTotalAmount() {
        try {
            logger.info("In getUnpostedTotalAmount():: retrieving data");
            return executeQuery(unpostedTotalAmountQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getUnpostedTotalAmount():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getTotalUnappliedAmount() {
        try {
            logger.info("In getTotalUnappliedAmount():: retrieving data");
            return executeQuery(totalUnappliedAmountQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getTotalUnappliedAmount():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getTotalReconciliationError() {
        try {
            logger.info("In getTotalReconciliationError():: retrieving data");
            return executeQuery(totalReconciliationErrorQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getTotalReconciliationError():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getReconErrCountExtract() {
        try {
            logger.info("In getReconErrCountExtract():: retrieving data");
            return executeQuery(reconErrCountExtractQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getReconErrCountExtract():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiStatusHrToCg1() {
        try {
            logger.info("In getBoomiStatusHrToCG1():: retrieving data");
            return executeQuery(boomiStatusHrToCg1Query, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getBoomiStatusHrToCG1():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getBoomiDetailsHrToCg1() {
        try {
            logger.info("In getBoomiDetailsHrToCG1():: retrieving data");
            return executeQuery(boomiDetailsHrToCg1Query, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getBoomiDetailsHrToCG1():: " + e);
        }
        return null;
    }

    public List<Map<String, Object>> getCoreAppLayerErrorCount() {
        try {
            logger.info("In getCoreAppLayerErrorCount():: retrieving data");
            return executeQuery(coreAppLayerErrorCountQuery, "TS1CG1");
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
        logger.info("In evictAllCachesAtIntervals():: cache clearing initiated");
        evictAllCaches();
    }

    private void evictAllCaches() {
        cacheManager.getCacheNames().stream()
                .forEach(cacheName -> cacheManager.getCache(cacheName).clear());
        logger.info("In evictAllCaches():: cache cleared at " + LocalDateTime.now());
    }

    private List<Map<String, Object>> executeQuery(String query, String dbName){
        Connection connection = null;
        List<Map<String, Object>> rows = null;
        readDBProperties(dbName);

        try {
            connection = DriverManager.getConnection(URL, USER, PASSWORD);
            logger.info("In executeQuery():: connection created for  " + dbName);
        } catch(SQLException e) {
            logger.error("Exception in executeQuery():: while creating connection:: " + e);
        }

        try {
            if (connection != null) {
                Statement statement = connection.createStatement();
                ResultSet rs = statement.executeQuery(query);
                logger.info("In executeQuery():: query executed successfully!");
                rows = resultSetToList(rs);
                connection.close();
                logger.info("In executeQuery():: DB connection closed!");
            }
        } catch(SQLException e) {
            logger.error("Exception in executeQuery():: while executing query:: " + e);
        }

        return rows;
    }

    private void readDBProperties(String dbName){
        //TODO:: read the DB details from the property file
        if (dbName.equalsIgnoreCase(STAGE_DB)){
            URL = "jdbc:oracle:thin:@ldap://ldap-ldstg3:5000/TS1CG1,cn=OracleContext,dc=cisco,dc=com";
            USER = "ARFINRO";
            PASSWORD = "Wf0Q9q5W";
        }else if(dbName.equalsIgnoreCase(PROD_DB)){
//            URL = "jdbc:oracle:thin:@ldap://ldap-ldstg3:5000/CG1PRD,cn=OracleContext,dc=cisco,dc=com";
//            USER = "ARFINRO";
//            PASSWORD = "Sp0nge8ob";
            URL = databaseURLCG1;
            USER = databaseUsernameCG1;
            PASSWORD = databasePasswordCG1;
            logger.info("DB url " + URL);
            logger.info("DB user " + USER);
            logger.info("DB pwd " + PASSWORD);
        }else if(dbName.equalsIgnoreCase(CTM_PROD)){
            URL = "jdbc:oracle:thin:@ldap://ldap-ldstg3:5000/CTMRPRD,cn=OracleContext,dc=cisco,dc=com";
            USER = "CTMO2C";
            PASSWORD = "Cisco123$";
        }
    }

    private List<Map<String, Object>> resultSetToList(ResultSet rs)  {
        logger.info("In resultSetToList():: converting resultset to list");

        try {
            ResultSetMetaData md = rs.getMetaData();
            int columns = md.getColumnCount();
            List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
            while (rs.next()) {
                Map<String, Object> row = new HashMap<String, Object>(columns);
                for (int i = 1; i <= columns; ++i) {
                    row.put(md.getColumnName(i), rs.getObject(i));
                }
                rows.add(row);
            }
            return rows;
        } catch(SQLException e) {
            logger.error("Exception in resultSetToList():: while converting resultset to list:: " + e);
        }
        return null;
    }

}
