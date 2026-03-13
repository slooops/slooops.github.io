package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveScorecardRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ScorecardService {

    private final JdbcManager jdbcManager;
    private final String scGetCurrentVersion;
    private final String scGetVersionData;
    private final String scGetVersionsPage;
    private final String scGetVersionsCount;
    private final String scInsertVersion;
    private final String scGetLastVersionId;
    private final String scInsertDataRow;
    private final String scGetVersionById;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    public ScorecardService(
            JdbcManager jdbcManager,
            @Qualifier("scGetCurrentVersion") String scGetCurrentVersion,
            @Qualifier("scGetVersionData") String scGetVersionData,
            @Qualifier("scGetVersionsPage") String scGetVersionsPage,
            @Qualifier("scGetVersionsCount") String scGetVersionsCount,
            @Qualifier("scInsertVersion") String scInsertVersion,
            @Qualifier("scGetLastVersionId") String scGetLastVersionId,
            @Qualifier("scInsertDataRow") String scInsertDataRow,
            @Qualifier("scGetVersionById") String scGetVersionById) {
        this.jdbcManager = jdbcManager;
        this.scGetCurrentVersion = scGetCurrentVersion;
        this.scGetVersionData = scGetVersionData;
        this.scGetVersionsPage = scGetVersionsPage;
        this.scGetVersionsCount = scGetVersionsCount;
        this.scInsertVersion = scInsertVersion;
        this.scGetLastVersionId = scGetLastVersionId;
        this.scInsertDataRow = scInsertDataRow;
        this.scGetVersionById = scGetVersionById;
    }

    public List<Map<String, Object>> getCurrentVersion() {
        return jdbcManager.queryForList(scGetCurrentVersion);
    }

    public List<Map<String, Object>> getVersionData(int versionId) {
        return jdbcManager.queryForListWithParams(scGetVersionData, versionId);
    }

    public List<Map<String, Object>> getVersionsPage(int offset, int limit) {
        return jdbcManager.queryForListWithParams(scGetVersionsPage, offset, limit);
    }

    public List<Map<String, Object>> getVersionsCount() {
        return jdbcManager.queryForList(scGetVersionsCount);
    }

    public List<Map<String, Object>> getVersionById(int versionId) {
        return jdbcManager.queryForListWithParams(scGetVersionById, versionId);
    }

    public Map<String, Object> saveSnapshot(SaveScorecardRequest request) {
        validateUsername(request.getUsername());
        validateStringField(request.getSprintName(), "Sprint name", 200);

        String sanitizedNotes = request.getNotes() != null
                ? sanitize(request.getNotes(), 500)
                : null;

        // Insert version row
        jdbcManager.executeUpdate(scInsertVersion,
                sanitize(request.getSprintName(), 200),
                sanitize(request.getUsername(), 100),
                sanitizedNotes);

        // Get the generated VERSION_ID
        List<Map<String, Object>> idResult = jdbcManager.queryForList(scGetLastVersionId);
        Number versionId = (Number) idResult.get(0).get("VERSION_ID");

        // Insert each data row
        for (SaveScorecardRequest.ScorecardRowData row : request.getRows()) {
            jdbcManager.executeUpdate(scInsertDataRow,
                    versionId,
                    sanitize(row.getWorkstream(), 200),
                    sanitize(row.getSuccessCriteria(), 500),
                    sanitize(row.getBaseline(), 200),
                    sanitize(row.getOwners(), 200),
                    sanitize(row.getEocy26Target(), 200),
                    sanitize(row.getHowWeMeasure(), 500),
                    sanitize(row.getMetric(), 500),
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
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }
}
