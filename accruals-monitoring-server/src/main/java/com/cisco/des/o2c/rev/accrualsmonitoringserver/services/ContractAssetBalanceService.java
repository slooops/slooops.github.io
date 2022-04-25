package com.cisco.des.o2c.rev.accrualsmonitoringserver.services;

import com.cisco.des.o2c.rev.accrualsmonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ContractAssetBalanceService {

    private JdbcManager jdbcManager;

    private String schema;

    private String catalogName;
    private String cabQuery;
    private String cabQueryPage;
    private String cabDetailsQuery;

    @Autowired
    ContractAssetBalanceService(JdbcManager jdbcManager, String schema, String catalogName, String cabQuery,
                                String cabQueryPage, String cabDetailsQuery) {
        this.jdbcManager = jdbcManager;
        this.schema = schema;
        this.catalogName = catalogName;
        this.cabQuery = cabQuery;
        this.cabQueryPage = cabQueryPage;
        this.cabDetailsQuery = cabDetailsQuery;
    }

    public List<Map<String, Object>> getContractAssetBalanceAll(String orderBy) {
        Map<String, String> params = new HashMap<>();
        params.put("orderby", orderBy);
        return jdbcManager.queryForListWithParams(cabQuery, params);
    }

    public List<Map<String, Object>> getContractAssetBalancePaginated(int page, int size, String orderBy) {
        /*
        PAGING =============
        SELECT fieldA,fieldB
        FROM table
        ORDER BY fieldA
        OFFSET 5 ROWS FETCH NEXT 14 ROWS ONLY;
         */
        int offsetInt = (page - 1) * size; // paging starts at 1 in the UI, and at 0 in the backend
        int fetchInt = size + 1; //checking to see if there will be a next page

        String offset = Integer.toString(offsetInt);
        String fetch = Integer.toString(fetchInt);

        Map<String, String> defaultPagingParams = new HashMap<>();
        defaultPagingParams.put("orderby", orderBy);
        defaultPagingParams.put("offset", offset);
        defaultPagingParams.put("fetch", fetch);
        return jdbcManager.queryForListWithParams(cabQueryPage, defaultPagingParams);
    }

    public int getCabSize() {
        Map<String, String> params = new HashMap<>();
        params.put("orderby", "rownum");
        return jdbcManager.queryForListWithParams(cabQuery, params).size();
    }

    public List<Map<String, Object>> getCabDetails(int orgId, String subRefId, String itemName) {
        Map<String, Object> cabDetailsParams = new HashMap<>();
        cabDetailsParams.put("p_i_org_id", orgId);
        cabDetailsParams.put("p_i_sub_ref_id", subRefId);
        cabDetailsParams.put("p_i_item_name", itemName);
        List<Map<String, Object>> result = (List<Map<String, Object>>) jdbcManager.simpleJdbcCall(schema, catalogName, cabDetailsQuery, cabDetailsParams)
                .get("P_O_CONTRA_DET_CURSOR");

        return result;
    }
}
