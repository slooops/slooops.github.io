package com.cisco.des.o2c.rev.accrualsmonitoringserver.controllers;

import com.cisco.des.o2c.rev.accrualsmonitoringserver.services.ContractAssetBalanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api")
public class ContractAssetBalanceController {

    private ContractAssetBalanceService cabService;

    @Autowired
    public ContractAssetBalanceController(ContractAssetBalanceService cabService) {
        this.cabService = cabService;
    }

    @GetMapping("/contract-asset-balance")
    public ResponseEntity<List<Map<String, Object>>> getContractAssetBalanceAll(
            @RequestParam(value="orderBy", defaultValue = "rownum", required = false) String orderBy
    ) {
        System.out.println("get CAB ALL");
        return new ResponseEntity<>(cabService.getContractAssetBalanceAll(orderBy), HttpStatus.OK);
    }

    @GetMapping("/contract-asset-balance/paged")
    public ResponseEntity<List<Map<String, Object>>> getContractAssetBalancePaginated(
            @RequestParam(value="page", defaultValue = "1", required = false) int page,
            @RequestParam(value="size", defaultValue = "10", required = false) int size,
            @RequestParam(value="orderBy", defaultValue = "rownum", required = false) String orderBy
    ) {
        System.out.println("get CAB paginated");
        return new ResponseEntity<>(cabService.getContractAssetBalancePaginated(page, size, orderBy), HttpStatus.OK);
    }

    @GetMapping("/contract-asset-balance/size")
    public ResponseEntity<Integer> getCabSize() {
        System.out.println("get CAB size");
        return new ResponseEntity<>(cabService.getCabSize(), HttpStatus.OK);
    }

    @GetMapping("/contract-asset-balance/details")
    public ResponseEntity<List<Map<String, Object>>> getDetails(@RequestParam int orgId,
                                                                @RequestParam String subRefId,
                                                                @RequestParam String itemName) {
        System.out.println("get CAB Details");
        return new ResponseEntity<>(cabService.getCabDetails(Integer.valueOf(orgId), subRefId, itemName), HttpStatus.OK);
    }

}
