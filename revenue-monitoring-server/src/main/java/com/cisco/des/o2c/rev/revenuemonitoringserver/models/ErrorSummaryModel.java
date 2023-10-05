package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

public class ErrorSummaryModel {
    private int PERIOD_YEAR;
    private String PERIOD_NAME;
    private String APPLICATION_NAME;
    private String BATCH_SOURCE;
    private String ENTITY;
    private String TRANSACTION_TYPE;
    private double AMOUNT_USD;
    private int NO_OF_RECORDS;

    public ErrorSummaryModel(int PERIOD_YEAR, String PERIOD_NAME, String APPLICATION_NAME, String BATCH_SOURCE, String ENTITY, String TRANSACTION_TYPE, double AMOUNT_USD, int NO_OF_RECORDS) {
        this.PERIOD_YEAR = PERIOD_YEAR;
        this.PERIOD_NAME = PERIOD_NAME;
        this.APPLICATION_NAME = APPLICATION_NAME;
        this.BATCH_SOURCE = BATCH_SOURCE;
        this.ENTITY = ENTITY;
        this.TRANSACTION_TYPE = TRANSACTION_TYPE;
        this.AMOUNT_USD = AMOUNT_USD;
        this.NO_OF_RECORDS = NO_OF_RECORDS;
    }

    public int getPERIOD_YEAR() {
        return PERIOD_YEAR;
    }

    public String getPERIOD_NAME() {
        return PERIOD_NAME;
    }

    public String getAPPLICATION_NAME() {
        return APPLICATION_NAME;
    }

    public String getBATCH_SOURCE() {
        return BATCH_SOURCE;
    }

    public String getENTITY() {
        return ENTITY;
    }

    public String getTRANSACTION_TYPE() {
        return TRANSACTION_TYPE;
    }

    public double getAMOUNT_USD() {
        return AMOUNT_USD;
    }

    public int getNO_OF_RECORDS() {
        return NO_OF_RECORDS;
    }
}
