package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.RolTransactionData;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class RecordRowMapper implements RowMapper<RolTransactionData> {

    @Override
    public RolTransactionData mapRow(ResultSet rs, int rowNum) throws SQLException {
        RolTransactionData transactionDetails = new RolTransactionData();

        transactionDetails.setPERIOD_NAME(rs.getString("PERIOD_NAME"));
        transactionDetails.setORG_NAME(rs.getString("OU_NAME"));
        transactionDetails.setAPPLICATION_NAME(rs.getString("APPLICATION_NAME"));
        transactionDetails.setERROR_APPLICATION(rs.getString("ERROR_APPLICATION"));
        transactionDetails.setPROCESS_FLOW(rs.getString("SUB_APPLICATION"));
        transactionDetails.setSOURCE(rs.getString("SOURCE"));
        transactionDetails.setAMOUNT(rs.getString("AMOUNT"));
        transactionDetails.setCURRENCY_CODE(rs.getString("CURRENCY_CODE"));
        transactionDetails.setINTID_TRXNID_CUSTTRXLINE_GROUPID(rs.getString("INTID_TRXNID_CUSTTRXLINE_GROUPID"));
        transactionDetails.setORDERNUMBER_CUSTTRXID(rs.getString("ORDERNUMBER_CUSTTRXID"));
        transactionDetails.setCUSTTRXLINEID(rs.getString("CUSTTRXLINEID"));
        transactionDetails.setORDERLINEID(rs.getString("ORDERLINEID"));
        transactionDetails.setERROR_MESSAGE(rs.getString("ERROR_MESSAGE"));
        transactionDetails.setPROCESS_STATUS(rs.getString("PROCESS_STATUS"));

        return transactionDetails;
    }
}
