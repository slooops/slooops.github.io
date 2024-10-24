package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.RolTransactionData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Component;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
public class JdbcManager {

    private JdbcTemplate jdbcTemplate;
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    public JdbcManager(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    public List<Map<String, Object>> queryForList(String sql) {
        return jdbcTemplate.queryForList(sql);
    }

    public Map<String, Object> simpleJdbcCall(String schema, String catalogName, String proc,
                                              Map<String, Integer> inParamTypes, Map<String, Integer> outParamTypes,
                                              Map<String, Object> params) {
        SqlParameterSource paramSource = new MapSqlParameterSource(params);

        List<SqlParameter> types = new ArrayList<>();
        for (Map.Entry<String, Integer> type : inParamTypes.entrySet()) {
            SqlParameter param = new SqlParameter(type.getKey(), type.getValue());
            types.add(param);
        }
        for (Map.Entry<String, Integer> type : outParamTypes.entrySet()) {
            SqlParameter param = new SqlOutParameter(type.getKey(), type.getValue());
            types.add(param);
        }

        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withSchemaName(schema)
                .withCatalogName(catalogName)
                .withProcedureName(proc)
                .declareParameters(types.toArray(new SqlParameter[types.size()]))
                .withoutProcedureColumnMetaDataAccess();
        Map<String, Object> result = call.execute(paramSource);
        return result;
    }

    public int updateComments(String sql, String closeType, String comments) {
        return jdbcTemplate.update(sql, closeType, comments);
    }

    public int updateOrderStatus(String sql, String progName, String account, int dealId, String username){
        return jdbcTemplate.update(sql, progName, account, dealId, username);
    }

    public int updateInvoiceEligibleDate(String sql, Date invoiceElgibileDate, int dealId, String salesOrder){
        return jdbcTemplate.update(sql, invoiceElgibileDate, dealId, salesOrder);
    }

    public List<Map<String, Object>> queryForListWithParams(String sql, String appName, String batchSource, String entity, String type){
        return jdbcTemplate.queryForList(sql, appName, batchSource, entity, type);
    }

    public List<Map<String, Object>> queryForListWithParamsAutoInvoice(String sql, String appName, String operatingUnit, String periodName, String transactionDate){
        return jdbcTemplate.queryForList(sql, appName, operatingUnit, periodName, transactionDate);
    }

    public int deleteSelectedDeals(String sql, String username, int dealId, String salesOrder, String salesOrder2){
        return jdbcTemplate.update(sql, username, dealId, salesOrder, salesOrder2);
    }

    public int updateCLoData(String sql, String progName, String account, int dealId, String salesOrder, Timestamp invoiceDate, String cloComments, String updatedBy){
        return jdbcTemplate.update(sql, cloComments, updatedBy, invoiceDate, dealId, salesOrder, salesOrder, progName, account);
    }

    public int updateCloComments(String sql, String progName, String account, int dealId, String salesOrder, String cloComments, String updatedBy){
        return jdbcTemplate.update(sql, cloComments, updatedBy, dealId, salesOrder, salesOrder, progName, account);
    }

    public int updateInvoiceDate(String sql, String progName, String account, int dealId, String salesOrder, Timestamp invoiceDate, String updatedBy){
        return jdbcTemplate.update(sql, invoiceDate, updatedBy, dealId, salesOrder, salesOrder, progName, account);
    }

    public int updateRolErrorsSummaryData(String sql, String assignedTo, String comments, String assignedBy, String periodName, String appName, String subApp, String orgName){
        return jdbcTemplate.update(sql, assignedTo, comments, assignedBy, periodName, appName, subApp, orgName);
    }
    public int getTotalRecords(String sql) {
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }

    public int getTotalRecordsFiltered(String sql, String periodName, String ouName, String appName, String sequenceNum) {
        return jdbcTemplate.queryForObject(sql, new Object[]{periodName, ouName, appName, sequenceNum}, Integer.class);
    }

    public List<RolTransactionData> getRolTransactionData(String sql, int page, int size) {
        int startRow = (page * size) + 1;
        int endRow = (page + 1) * size;

        return jdbcTemplate.query(sql, new Object[]{startRow, endRow}, new RecordRowMapper());
    }

    public List<RolTransactionData> getRolTransactionDataFilter(String sql, int page, int size, String periodName, String ouName, String applicationName, int sequenceNum) {
        int startRow = (page * size) + 1;
        int endRow = (page + 1) * size;

        return jdbcTemplate.query(sql, new Object[]{periodName, ouName, applicationName, sequenceNum, startRow, endRow }, new RecordRowMapper());
    }

    public List<RolTransactionData> getRecordsFiltered(String sql, String periodName, String ouName, String appName, String sequenceNum) {
        return jdbcTemplate.query(sql, new Object[]{periodName, ouName, appName, sequenceNum}, new RecordRowMapper());
    }
}
