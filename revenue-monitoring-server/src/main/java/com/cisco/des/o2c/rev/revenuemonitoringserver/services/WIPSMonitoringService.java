package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.MongoDBManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class WIPSMonitoringService {
    private MongoDBManager mongoDBManager;

    @Autowired
    private Common common;

    public WIPSMonitoringService(MongoDBManager mongoDBManager) {
        this.mongoDBManager = mongoDBManager;
    }


    public List<Map<String, Object>> getWIPSDetailsData(String collection) {
        String[] dateColumns = { "assigned_date"};
        List<Map<String, Object>> result = mongoDBManager.getWIPSData(collection);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            data.remove("assigned_date");
        });
        return result;
    }

    public List<Map<String, Object>> getWIPSSummaryData(String collection) {
        String[] dateColumns = { "assigned_date", "closed_date", "created_date"};
        List<Map<String, Object>> result = mongoDBManager.getWIPSData(collection);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            data.remove("_id");
        });
        return result;
    }
}
