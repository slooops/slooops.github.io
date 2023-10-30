package com.cisco.des.o2c.rev.revenuemonitoringserver.packages;

import java.util.List;
import java.util.Map;

public class OrderLifecycleModel {
    private List<Map<String, Object>> orderLifecycleResult;
    private List<String> columns;

    public List<Map<String, Object>> getOrderLifecycleResult() {
        return orderLifecycleResult;
    }

    public void setOrderLifecycleResult(List<Map<String, Object>> orderLifecycleResult) {
        this.orderLifecycleResult = orderLifecycleResult;
    }

    public List<String> getColumns() {
        return columns;
    }

    public void setColumns(List<String> columns) {
        this.columns = columns;
    }
}
