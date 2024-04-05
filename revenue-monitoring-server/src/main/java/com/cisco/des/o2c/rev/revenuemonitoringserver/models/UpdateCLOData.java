package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

public class UpdateCLOData {
    String programName;
    String account;
    String dealIds;
    String orderNum;
    String invoiceDate;

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

    public String getOrderNum() {
        return orderNum;
    }

    public void setOrderNum(String orderNum) {
        this.orderNum = orderNum;
    }

    public String getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(String invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public String getCloComments() {
        return cloComments;
    }

    public void setCloComments(String cloComments) {
        this.cloComments = cloComments;
    }

    String cloComments;
}
