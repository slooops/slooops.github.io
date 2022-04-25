package com.cisco.des.o2c.rev.accrualsmonitoringserver.services;

import com.cisco.des.o2c.rev.accrualsmonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DailyMonitoringService {
    private JdbcManager jdbcManager;
    private String dailyQuery;
    private String detailsQuery;

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String dailyQuery, String monitoringDetailsQuery) {
        this.jdbcManager = jdbcManager;
        this.dailyQuery = dailyQuery;
        this.detailsQuery = monitoringDetailsQuery;
    }

    public List<Map<String, Object>> getDailyMonitoringSummary() {
        return jdbcManager.queryForList(dailyQuery);
    }

    public List<Map<String, Object>> getMonitoringDetails() {
        return jdbcManager.queryForList(detailsQuery);
    }

}
