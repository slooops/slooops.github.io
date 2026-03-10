package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveScorecardRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.ScorecardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api/scorecard")
public class ScorecardController {

    @Autowired
    ScorecardService service;

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

    @GetMapping("/editors")
    public ResponseEntity<Map<String, Object>> getEditorInfo(
            @RequestParam String username,
            @RequestParam(defaultValue = "SCORECARD") String scope) {
        List<Map<String, Object>> editors = service.getEditorInfo(username, scope);
        if (editors.isEmpty()) {
            return new ResponseEntity<>(new HashMap<>(), HttpStatus.OK);
        }
        Map<String, Object> editor = editors.get(0);
        Map<String, Object> response = new HashMap<>();
        response.put("cecUsername", editor.get("CEC_USERNAME"));
        response.put("displayName", editor.get("DISPLAY_NAME"));
        response.put("roleLevel", editor.get("ROLE_LEVEL"));
        response.put("tableScope", editor.get("TABLE_SCOPE"));
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> save(@RequestBody SaveScorecardRequest request) {
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
            response.put("message", "Error saving scorecard: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
