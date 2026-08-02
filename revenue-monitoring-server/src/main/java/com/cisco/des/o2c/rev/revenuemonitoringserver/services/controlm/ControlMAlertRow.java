package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import java.sql.Timestamp;

/**
 * Plain row carried from {@link ControlMApiClient} to
 * {@link ControlMAlertUpserter}.
 * Mirrors the Python row-dict produced in
 * {@code controlm_client.fetch_all_scopes}.
 */
public record ControlMAlertRow(String ctmJobId,String jobName,String application,String subApplication,Integer returnCode,String alertType,String server,Timestamp orderDate,Timestamp startTime,Timestamp endTime,Long runTimeSec){}
