package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveExecSummaryRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.ExecSummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api/exec-summary")
public class ExecSummaryController {

    @Autowired
    ExecSummaryService service;

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrent() {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> versions = service.getCurrentVersion();
        if (versions.isEmpty()) {
            response.put("version", null);
            response.put("rows", List.of());
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
        Map<String, Object> version = versions.get(0);
        Number versionId = (Number) version.get("VERSION_ID");
        List<Map<String, Object>> rows = service.getVersionData(versionId.intValue());
        response.put("version", version);
        response.put("rows", rows);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/version/{versionId}")
    public ResponseEntity<Map<String, Object>> getVersion(@PathVariable int versionId) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> versionResult = service.getVersionById(versionId);
        Map<String, Object> version = versionResult.isEmpty() ? null : versionResult.get(0);
        List<Map<String, Object>> rows = service.getVersionData(versionId);
        response.put("version", version);
        response.put("rows", rows);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/versions")
    public ResponseEntity<Map<String, Object>> getVersions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> response = new HashMap<>();
        int offset = page * size;
        List<Map<String, Object>> versions = service.getVersionsPage(offset, size);
        List<Map<String, Object>> countResult = service.getVersionsCount();
        Number totalCount = (Number) countResult.get(0).get("TOTAL");
        response.put("versions", versions);
        response.put("totalCount", totalCount);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> save(@RequestBody SaveExecSummaryRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = service.saveSnapshot(request);
            response.putAll(result);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error saving executive summary: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
