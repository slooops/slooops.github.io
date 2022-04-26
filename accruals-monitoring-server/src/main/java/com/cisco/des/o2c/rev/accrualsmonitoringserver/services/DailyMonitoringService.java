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
    private String lastRunQuery;

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String dailyQuery, String monitoringDetailsQuery, String lastRunQuery) {
        this.jdbcManager = jdbcManager;
        this.dailyQuery = dailyQuery;
        this.detailsQuery = monitoringDetailsQuery;
        this.lastRunQuery = lastRunQuery;
    }

    public List<Map<String, Object>> getDailyMonitoringSummary() {
        return jdbcManager.queryForList(dailyQuery);
    }

    public List<Map<String, Object>> getMonitoringDetails() {
        return jdbcManager.queryForList(detailsQuery);
    }

    public List<Map<String, Object>> getProgramLastRun() {
        return jdbcManager.queryForList(lastRunQuery);
    }

}
