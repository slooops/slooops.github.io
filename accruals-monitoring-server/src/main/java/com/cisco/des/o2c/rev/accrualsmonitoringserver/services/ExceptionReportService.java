package com.cisco.des.o2c.rev.accrualsmonitoringserver.services;


import com.cisco.des.o2c.rev.accrualsmonitoringserver.controllers.ExceptionReportController;
import com.cisco.des.o2c.rev.accrualsmonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ExceptionReportService {

    private JdbcManager jdbcManager;
    private String exceptionReportQuery;

    @Autowired
    public ExceptionReportService(JdbcManager jdbcManager, String exceptionReportQuery) {
        this.jdbcManager = jdbcManager;
        this.exceptionReportQuery = exceptionReportQuery;
    }

    public List<Map<String, Object>> getExceptionReport() {
        return jdbcManager.queryForList(exceptionReportQuery);
    }

}
