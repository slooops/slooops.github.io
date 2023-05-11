package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class DailyMonitoringService {
    private JdbcManager jdbcManager;
    private String stdArExcQuery;
    private String tsvTopSkuExcQuery;
    private String tsvSubSkuExcQuery;
    private String revenueControlsQuery;
    private String pcloseInvStats;
    private String pcloseInterfaceLoad;
    private String periodAndQuarter;
    private String pcloseStartEndTime;
    private String pcloseVolume;
    private String pcloseMEStatus;
    private String pcloseQECashCollected;

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String stdArExcQuery, String tsvTopSkuExcQuery, String tsvSubSkuExcQuery,
                                 String revenueControlsQuery, String pcloseInvStats, String pcloseInterfaceLoad,
                                 String periodAndQuarter, String pcloseStartEndTime, String pcloseVolume,
                                 String pcloseMEStatus, String pcloseQECashCollected) {
        this.jdbcManager = jdbcManager;
        this.stdArExcQuery = stdArExcQuery;
        this.tsvTopSkuExcQuery = tsvTopSkuExcQuery;
        this.tsvSubSkuExcQuery = tsvSubSkuExcQuery;
        this.revenueControlsQuery = revenueControlsQuery;
        this.pcloseInvStats = pcloseInvStats;
        this.pcloseInterfaceLoad = pcloseInterfaceLoad;
        this.periodAndQuarter = periodAndQuarter;
        this.pcloseStartEndTime = pcloseStartEndTime;
        this.pcloseVolume = pcloseVolume;
        this.pcloseMEStatus = pcloseMEStatus;
        this.pcloseQECashCollected = pcloseQECashCollected;
    }

    public List<Map<String, Object>> getStdArExceptions() {
        System.out.println(stdArExcQuery);
        return jdbcManager.queryForList(stdArExcQuery);
    }

    public List<Map<String, Object>> getTsvTopSkuExceptions() {
        return jdbcManager.queryForList(tsvTopSkuExcQuery);
    }

    public List<Map<String, Object>> getTsvSubSkuExceptions() {
        return jdbcManager.queryForList(tsvSubSkuExcQuery);
    }

    public List<Map<String,Object>> getRevenueControls() { return jdbcManager.queryForList(revenueControlsQuery); }

    public List<Map<String,Object>> getPcloseInvStats() { return jdbcManager.queryForList(pcloseInvStats); }

    public List<Map<String,Object>> getPeriodCloseInterfaceLoad() {
        List<Map<String,Object>> product = new ArrayList<>();
        List<Map<String,Object>> service = new ArrayList<>();
        for(Map<String,Object> row: jdbcManager.queryForList(pcloseInterfaceLoad)){
            if(row.get("LINE_TYPE").equals("PRODUCT")){
                product.add(row);
            } else {
                service.add(row);
            }
        }
        product = product.subList(product.size()-5,product.size());
        service = service.subList(service.size()-5,service.size());

        List<Map<String,Object>> interfaceLoad = new ArrayList<>();
        Stream.of(product, service).forEach(interfaceLoad::addAll);

        return interfaceLoad;
    }

    public List<Map<String,Object>> getPeriodQuarter() { 
        return jdbcManager.queryForList(periodAndQuarter); 
    }

    public List<Map<String,Object>> getPcloseStartEndTime() { 
        return jdbcManager.queryForList(pcloseStartEndTime); 
    }

    public List<Map<String,Object>> getPcloseVolume() { 
        return jdbcManager.queryForList(pcloseVolume); 
    }

    public List<Map<String,Object>> getPcloseMEStatus() { 
        return jdbcManager.queryForList(pcloseMEStatus); 
    }

    public List<Map<String,Object>> getPcloseQECashCollected() { 
        return jdbcManager.queryForList(pcloseQECashCollected); 
    }

}
