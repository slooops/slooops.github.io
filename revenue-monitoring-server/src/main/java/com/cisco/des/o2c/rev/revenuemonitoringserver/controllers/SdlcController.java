package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveSdlcExecRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveSdlcAdoptRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.SdlcExecService;
import com.cisco.des.o2c.rev.revenuemonitoringserver.services.SdlcAdoptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${CORS_URL}")
@RequestMapping("/api/sdlc")
public class SdlcController {

    @Autowired
    SdlcExecService execService;

    @Autowired
    SdlcAdoptService adoptService;

    /* ── SDLC Execution Update ─────────────────────────────── */

    @GetMapping("/exec/archive")
    public ResponseEntity<List<Map<String, Object>>> getExecArchive() {
        return new ResponseEntity<>(execService.getArchive(), HttpStatus.OK);
    }

    @GetMapping("/exec/current")
    public ResponseEntity<Map<String, Object>> getExecCurrent() {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> versions = execService.getCurrentVersion();
        if (versions.isEmpty()) {
            response.put("version", null);
            response.put("rows", List.of());
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
        Map<String, Object> version = versions.get(0);
        Number versionId = (Number) version.get("VERSION_ID");
        List<Map<String, Object>> rows = execService.getVersionData(versionId.intValue());
        response.put("version", version);
        response.put("rows", rows);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/exec/version/{versionId}")
    public ResponseEntity<Map<String, Object>> getExecVersion(@PathVariable int versionId) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> versionResult = execService.getVersionById(versionId);
        Map<String, Object> version = versionResult.isEmpty() ? null : versionResult.get(0);
        List<Map<String, Object>> rows = execService.getVersionData(versionId);
        response.put("version", version);
        response.put("rows", rows);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/exec/versions")
    public ResponseEntity<Map<String, Object>> getExecVersions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> response = new HashMap<>();
        int offset = page * size;
        List<Map<String, Object>> versions = execService.getVersionsPage(offset, size);
        List<Map<String, Object>> countResult = execService.getVersionsCount();
        Number totalCount = (Number) countResult.get(0).get("TOTAL");
        response.put("versions", versions);
        response.put("totalCount", totalCount);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/exec/save")
    public ResponseEntity<Map<String, Object>> saveExec(@RequestBody SaveSdlcExecRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = execService.saveSnapshot(request);
            response.putAll(result);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error saving SDLC execution update: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /* ── SDLC Component Adoption ───────────────────────────── */

    @GetMapping("/adopt/archive")
    public ResponseEntity<List<Map<String, Object>>> getAdoptArchive() {
        return new ResponseEntity<>(adoptService.getArchive(), HttpStatus.OK);
    }

    @GetMapping("/adopt/current")
    public ResponseEntity<Map<String, Object>> getAdoptCurrent() {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> versions = adoptService.getCurrentVersion();
        if (versions.isEmpty()) {
            response.put("version", null);
            response.put("rows", List.of());
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
        Map<String, Object> version = versions.get(0);
        Number versionId = (Number) version.get("VERSION_ID");
        List<Map<String, Object>> rows = adoptService.getVersionData(versionId.intValue());
        response.put("version", version);
        response.put("rows", rows);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/adopt/version/{versionId}")
    public ResponseEntity<Map<String, Object>> getAdoptVersion(@PathVariable int versionId) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> versionResult = adoptService.getVersionById(versionId);
        Map<String, Object> version = versionResult.isEmpty() ? null : versionResult.get(0);
        List<Map<String, Object>> rows = adoptService.getVersionData(versionId);
        response.put("version", version);
        response.put("rows", rows);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/adopt/versions")
    public ResponseEntity<Map<String, Object>> getAdoptVersions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> response = new HashMap<>();
        int offset = page * size;
        List<Map<String, Object>> versions = adoptService.getVersionsPage(offset, size);
        List<Map<String, Object>> countResult = adoptService.getVersionsCount();
        Number totalCount = (Number) countResult.get(0).get("TOTAL");
        response.put("versions", versions);
        response.put("totalCount", totalCount);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/adopt/save")
    public ResponseEntity<Map<String, Object>> saveAdopt(@RequestBody SaveSdlcAdoptRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = adoptService.saveSnapshot(request);
            response.putAll(result);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error saving SDLC component adoption: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
