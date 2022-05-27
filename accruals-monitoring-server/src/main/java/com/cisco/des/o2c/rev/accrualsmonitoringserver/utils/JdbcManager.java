package com.cisco.des.o2c.rev.accrualsmonitoringserver.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Component;

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

    public List<Map<String, Object>> queryForListWithParams(String sql, Map<String, String> paramMap) {
        return namedParameterJdbcTemplate.queryForList(sql, paramMap);
    }

    public Map<String, Object> simpleJdbcCall(String schema, String catalogName, String proc, Map<String, Object> params) {
        SqlParameterSource paramSource = new MapSqlParameterSource(params);
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withSchemaName(schema)
                .withCatalogName(catalogName)
                .withProcedureName(proc);
        Map<String, Object> result = call.execute(paramSource);
        System.out.println(result);
        return result;
    }

    public int update(String sql, Map<String, Object> params) {
        return namedParameterJdbcTemplate.update(sql, params);
    }


}
