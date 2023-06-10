package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.DashboardComments;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
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
    private String closeInvStats;
    private String closeInterfaceLoad;
    private String periodAndQuarter;
    private String closeStartEndTime;
    private String closeVolume;
    private String closeMEStatus;
    private String closeQECashCollected;
    private String dashboardComments;

//    Connection conn;

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String stdArExcQuery, String tsvTopSkuExcQuery, String tsvSubSkuExcQuery,
                                 String revenueControlsQuery, String closeInvStats, String closeInterfaceLoad,
                                 String periodAndQuarter, String closeStartEndTime, String closeVolume,
                                 String closeMEStatus, String closeQECashCollected, String dashboardComments) {
        this.jdbcManager = jdbcManager;
        this.stdArExcQuery = stdArExcQuery;
        this.tsvTopSkuExcQuery = tsvTopSkuExcQuery;
        this.tsvSubSkuExcQuery = tsvSubSkuExcQuery;
        this.revenueControlsQuery = revenueControlsQuery;
        this.closeInvStats = closeInvStats;
        this.closeInterfaceLoad = closeInterfaceLoad;
        this.periodAndQuarter = periodAndQuarter;
        this.closeStartEndTime = closeStartEndTime;
        this.closeVolume = closeVolume;
        this.closeMEStatus = closeMEStatus;
        this.closeQECashCollected = closeQECashCollected;
        this.dashboardComments = dashboardComments;
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

    public List<Map<String,Object>> getCloseInvStats() { return jdbcManager.queryForList(closeInvStats); }

    public List<Map<String,Object>> getPeriodCloseInterfaceLoad() {
        List<Map<String,Object>> product = new ArrayList<>();
        List<Map<String,Object>> service = new ArrayList<>();
        for(Map<String,Object> row: jdbcManager.queryForList(closeInterfaceLoad)){
            if(row.get("LINE_TYPE").equals("PRODUCT")){
                product.add(row);
            } else {
                service.add(row);
            }
        }
        product = product.subList(product.size()-10,product.size());
        service = service.subList(service.size()-10,service.size());

        List<Map<String,Object>> interfaceLoad = new ArrayList<>();
        Stream.of(product, service).forEach(interfaceLoad::addAll);

        return interfaceLoad;
    }

    public List<Map<String,Object>> getPeriodQuarter() { 
        return jdbcManager.queryForList(periodAndQuarter); 
    }

    public List<Map<String,Object>> getCloseStartEndTime() { 
        return jdbcManager.queryForList(closeStartEndTime); 
    }

    public List<Map<String,Object>> getCloseVolume() { 
        return jdbcManager.queryForList(closeVolume); 
    }

    public List<Map<String,Object>> getCloseMEStatus() { 
        return jdbcManager.queryForList(closeMEStatus); 
    }

    public List<Map<String,Object>> getCloseQECashCollected() { return jdbcManager.queryForList(closeQECashCollected); }

    public List<Map<String,Object>> getDashboardComments() { return jdbcManager.queryForList(dashboardComments); }

    public String updateDashboardComments(String comments) throws SQLException {
        String updateComments = "INSERT INTO ARFINRO.ASK_QE_ME_DASH_BOARD_STATUS (QUARTER, PERIOD_NAME, PERIOD_YEAR, PERIOD_NUM, CLOSE_TYPE, COMMENTS, CREATION_DATE) VALUES ('Q4FY2023','MAY-23',2023,10,'PRECLOSE','Period Close Completed',SYSDATE)";
//        PreparedStatement ps = conn.prepareStatement(updateComments);
//        ps.setString(1,"Q4FY2023");
//        ps.setString(2,"MAY-23");
//        ps.setInt(3,2023);
//        ps.setInt(4,10);
//        ps.setString(5, "PRECLOSE");
//        ps.setString(6,comments);
//        ps.setTimestamp(7, new Timestamp(System.currentTimeMillis()));
//        ps.execute();
//        int x = jdbcManager.update(updateComments, ps);
        int x = jdbcManager.update(updateComments);
//        ps.close();
        System.out.println("here"+x);
        return new String("Completed");
    }

}
