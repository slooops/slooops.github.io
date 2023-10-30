package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

public class UpdateOrderModel {
    String programName;
    String account;
    String dealIds;

    public String getProgramName() {
        return programName;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getDealIds() {
        return dealIds;
    }

    public void setDealIds(String dealIds) {
        this.dealIds = dealIds;
    }
}
