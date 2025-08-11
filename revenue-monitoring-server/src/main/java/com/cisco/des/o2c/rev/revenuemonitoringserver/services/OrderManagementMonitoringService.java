package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.Common;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.MongoDBManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Service
public class OrderManagementMonitoringService {
    private MongoDBManager mongoDBManager;

    @Autowired
    private Common common;

    public OrderManagementMonitoringService(MongoDBManager mongoDBManager) {
        this.mongoDBManager = mongoDBManager;
    }

    public long updateOmSummary(String collection, Map<String, String> updateData) {
        String assignedTo = updateData.get("assignedTo");
        String comments = updateData.get("comments");
        String timestamp = updateData.get("timestamp");
        String scenario = updateData.get("scenario");
        String status = updateData.get("status");
        long test = mongoDBManager.updateSummaryData(collection, timestamp, scenario, assignedTo, comments, status);
        return 1;
    }
    public List<Map<String, Object>> getOMDetailsDataFiltered(String collection, String timestamp, String scenario) {
        String[] dateColumns = { "assigned_date"};
        List<Map<String, Object>> result = mongoDBManager.getFilteredData(collection, timestamp, scenario);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            data.remove("assigned_data");
        });
        return result;
    }


    public List<Map<String, Object>> getOMDetailsData(String collection) {
        String[] dateColumns = { "assigned_date"};
        List<Map<String, Object>> result = mongoDBManager.getAllData(collection);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            data.remove("assigned_date");
        });
        return result;
    }

    public List<Map<String, Object>> getOMSummaryData(String collection) {
        String[] dateColumns = { "assigned_date", "closed_date", "created_date"};
        List<Map<String, Object>> result = mongoDBManager.getAllData(collection);
        result.forEach(data -> {
            common.formatDateColumns(data, dateColumns);
            Map<String, Object> reorderedData = new LinkedHashMap<>();
            int index = 0;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (index == 6) {
                    reorderedData.put("aging", common.calculateAging(data.get("created_date")));
                }
                reorderedData.put(entry.getKey(), entry.getValue());
                index++;
            }
            if (!reorderedData.containsKey("aging")) {
                reorderedData.put("aging", common.calculateAging(data.get("created_date")));
            }
            data.clear();
            data.putAll(reorderedData);
            data.remove("closed_date");
        });
        return result;
    }


}

