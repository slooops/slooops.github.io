package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class LandingPageService {

    private JdbcManager jdbcManager;
    private String landingPagePeriodData;
    @Autowired
    private Common common;

    public LandingPageService(JdbcManager jdbcManager, String landingPagePeriodData){
        this.jdbcManager = jdbcManager;
        this.landingPagePeriodData = landingPagePeriodData;
    }

    public List<Map<String, Object>> getLandingPagePeriodData() {
        String[] dateColumns = { "PERIOD_END_DATE" };
        List<Map<String, Object>> result = jdbcManager.queryForList(landingPagePeriodData);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
        });
        return result;
    }
}
