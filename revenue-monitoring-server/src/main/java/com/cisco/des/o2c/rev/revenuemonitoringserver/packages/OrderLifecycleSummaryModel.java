package com.cisco.des.o2c.rev.revenuemonitoringserver.packages;

import java.util.Optional;

public class OrderLifecycleSummaryModel {
    public String PROGRAM_NAME;
    public int ORDER_COUNT;
    public String STATUS;
    public Optional<Integer> COMPLETION;

    public String getPROGRAM_NAME() {
        return PROGRAM_NAME;
    }

    public int getORDER_COUNT() {
        return ORDER_COUNT;
    }

    public String getSTATUS() {
        return STATUS;
    }

    public Optional<Integer> getCOMPLETION() {
        return COMPLETION;
    }

    public OrderLifecycleSummaryModel(String PROGRAM_NAME, int ORDER_COUNT, String STATUS, Optional<Integer> COMPLETION) {
        this.PROGRAM_NAME = PROGRAM_NAME;
        this.ORDER_COUNT = ORDER_COUNT;
        this.STATUS = STATUS;
        this.COMPLETION = COMPLETION;
    }
}
