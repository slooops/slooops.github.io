package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.Optional;

public class LargeDealSummaryByAccountModel {
    public String ACCOUNT;
    public int ORDER_COUNT;
    public String STATUS;
    public Optional<Integer> COMPLETION;


    public LargeDealSummaryByAccountModel(String ACCOUNT, int ORDER_COUNT, String STATUS, Optional<Integer> COMPLETION) {
        this.ACCOUNT = ACCOUNT;
        this.ORDER_COUNT = ORDER_COUNT;
        this.STATUS = STATUS;
        this.COMPLETION = COMPLETION;
    }
}
