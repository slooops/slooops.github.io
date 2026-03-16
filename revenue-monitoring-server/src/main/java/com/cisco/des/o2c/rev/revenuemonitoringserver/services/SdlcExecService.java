package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveSdlcExecRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class SdlcExecService {

    private final JdbcManager jdbcManager;
    private final String seGetCurrentVersion;
    private final String seGetVersionData;
    private final String seGetVersionsPage;
    private final String seGetVersionsCount;
    private final String seInsertVersion;
    private final String seGetLastVersionId;
    private final String seInsertDataRow;
    private final String seGetVersionById;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    public SdlcExecService(
            JdbcManager jdbcManager,
            @Qualifier("seGetCurrentVersion") String seGetCurrentVersion,
            @Qualifier("seGetVersionData") String seGetVersionData,
            @Qualifier("seGetVersionsPage") String seGetVersionsPage,
            @Qualifier("seGetVersionsCount") String seGetVersionsCount,
            @Qualifier("seInsertVersion") String seInsertVersion,
            @Qualifier("seGetLastVersionId") String seGetLastVersionId,
            @Qualifier("seInsertDataRow") String seInsertDataRow,
            @Qualifier("seGetVersionById") String seGetVersionById) {
        this.jdbcManager = jdbcManager;
        this.seGetCurrentVersion = seGetCurrentVersion;
        this.seGetVersionData = seGetVersionData;
        this.seGetVersionsPage = seGetVersionsPage;
        this.seGetVersionsCount = seGetVersionsCount;
        this.seInsertVersion = seInsertVersion;
        this.seGetLastVersionId = seGetLastVersionId;
        this.seInsertDataRow = seInsertDataRow;
        this.seGetVersionById = seGetVersionById;
    }

    public List<Map<String, Object>> getCurrentVersion() {
        return jdbcManager.queryForList(seGetCurrentVersion);
    }

    public List<Map<String, Object>> getVersionData(int versionId) {
        return jdbcManager.queryForListWithParams(seGetVersionData, versionId);
    }

    public List<Map<String, Object>> getVersionsPage(int offset, int limit) {
        return jdbcManager.queryForListWithParams(seGetVersionsPage, offset, limit);
    }

    public List<Map<String, Object>> getVersionsCount() {
        return jdbcManager.queryForList(seGetVersionsCount);
    }

    public List<Map<String, Object>> getVersionById(int versionId) {
        return jdbcManager.queryForListWithParams(seGetVersionById, versionId);
    }

    public Map<String, Object> saveSnapshot(SaveSdlcExecRequest request) {
        validateUsername(request.getUsername());
        validateStringField(request.getSprintName(), "Sprint name", 200);

        String sanitizedNotes = request.getNotes() != null
                ? sanitize(request.getNotes(), 500)
                : null;

        jdbcManager.executeUpdate(seInsertVersion,
                sanitize(request.getSprintName(), 200),
                sanitize(request.getUsername(), 100),
                sanitizedNotes);

        List<Map<String, Object>> idResult = jdbcManager.queryForList(seGetLastVersionId);
        Number versionId = (Number) idResult.get(0).get("VERSION_ID");

        for (SaveSdlcExecRequest.SdlcExecRowData row : request.getRows()) {
            jdbcManager.executeUpdate(seInsertDataRow,
                    versionId,
                    sanitize(row.getWorkstream(), 200),
                    sanitize(row.getComponent(), 500),
                    sanitize(row.getScope(), 2000),
                    sanitize(row.getSprintUpdate(), 2000),
                    sanitize(row.getStatus(), 50),
                    row.getSortOrder());
        }

        return Map.of(
                "success", true,
                "versionId", versionId,
                "rowCount", request.getRows().size());
    }

    private void validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (username.length() > 100) {
            throw new IllegalArgumentException("Username exceeds maximum length");
        }
        if (!USERNAME_PATTERN.matcher(username.trim()).matches()) {
            throw new IllegalArgumentException("Invalid username format");
        }
    }

    private void validateStringField(String value, String fieldName, int maxLength) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " exceeds maximum length of " + maxLength);
        }
    }

    private String sanitize(String input, int maxLength) {
        if (input == null) return null;
        String trimmed = input.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }
}
