package com.cisco.des.o2c.rev.revenuemonitoringserver.packages;

public class OrderLifecycleSummaryModel {
    public String PROGRAM_NAME;
    public int ORDER_COUNT;
    public String STATUS;
    public String COMPLETION;

    public OrderLifecycleSummaryModel(String PROGRAM_NAME, int ORDER_COUNT, String STATUS, String COMPLETION) {
        this.PROGRAM_NAME = PROGRAM_NAME;
        this.ORDER_COUNT = ORDER_COUNT;
        this.STATUS = STATUS;
        this.COMPLETION = COMPLETION;
    }
}
