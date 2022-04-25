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

    @Autowired
    public DailyMonitoringService(JdbcManager jdbcManager, String dailyQuery) {
        this.jdbcManager = jdbcManager;
        this.dailyQuery = dailyQuery;
    }

    public List<Map<String, Object>> getDailyMonitoringSummary() {
        return jdbcManager.queryForList(dailyQuery);
    }

}
