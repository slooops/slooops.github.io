package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.PropertySource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

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
    private String receiptErrorSummaryQuery;
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
                                String cmsSalesInvoiceItemExtractErrorQuery, String cmsInterfaceErrorsQuery) {
        this.unpostedSummaryQuery = cmsUnpostedSummaryQuery;
        this.unpostedDetailsQuery = cmsUnpostedDetailsQuery;
        this.receiptErrorSummaryQuery = cmsReceiptErrorSummaryQuery;
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

    @Cacheable("receiptErrorSummary")
    public List<Map<String, Object>> getReceiptErrorSummaryData() {
        try {
            logger.info("In getReceiptErrorSummaryData():: retrieving data");
            return executeQuery(receiptErrorSummaryQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getReceiptErrorSummaryData():: " + e);
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
            return executeQuery(extractCountQuery, "CG1PRD");
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

    public List<Map<String, Object>> getLatestRequestStatus() {
        try {
            logger.info("In getLatestRequestStatus():: retrieving data");
            return executeQuery(latestRequestStatusQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getLatestRequestStatus():: " + e);
        }
        return null;
    }

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

    public List<Map<String, Object>> getInterfaceErrors() {
        try {
            logger.info("In getInterfaceErrors():: retrieving data");
            return executeQuery(interfaceErrorsQuery, "TS1CG1");
        } catch (Exception e) {
            logger.error("Exception in getInterfaceErrors():: " + e);
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
