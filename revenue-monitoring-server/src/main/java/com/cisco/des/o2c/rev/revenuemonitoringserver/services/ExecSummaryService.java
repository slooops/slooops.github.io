package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveExecSummaryRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ExecSummaryService {

    private final JdbcManager jdbcManager;
    private final String esGetCurrentVersion;
    private final String esGetVersionData;
    private final String esGetVersionsPage;
    private final String esGetVersionsCount;
    private final String esInsertVersion;
    private final String esGetLastVersionId;
    private final String esInsertDataRow;
    private final String esGetVersionById;

    // ─── Inline SQL Query Constants ────────────────────────────────────────────

    private static final String GET_ARCHIVE = "SELECT * FROM ( " +
            "SELECT v.*, ROW_NUMBER() OVER (PARTITION BY SPRINT_NAME ORDER BY CREATED_AT DESC) rn " +
            "FROM ARFINRO.EXEC_SUMMARY_VERSION v " +
            ") WHERE rn = 1 ORDER BY CREATED_AT DESC";

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    public ExecSummaryService(
            JdbcManager jdbcManager,
            @Qualifier("esGetCurrentVersion") String esGetCurrentVersion,
            @Qualifier("esGetVersionData") String esGetVersionData,
            @Qualifier("esGetVersionsPage") String esGetVersionsPage,
            @Qualifier("esGetVersionsCount") String esGetVersionsCount,
            @Qualifier("esInsertVersion") String esInsertVersion,
            @Qualifier("esGetLastVersionId") String esGetLastVersionId,
            @Qualifier("esInsertDataRow") String esInsertDataRow,
            @Qualifier("esGetVersionById") String esGetVersionById) {
        this.jdbcManager = jdbcManager;
        this.esGetCurrentVersion = esGetCurrentVersion;
        this.esGetVersionData = esGetVersionData;
        this.esGetVersionsPage = esGetVersionsPage;
        this.esGetVersionsCount = esGetVersionsCount;
        this.esInsertVersion = esInsertVersion;
        this.esGetLastVersionId = esGetLastVersionId;
        this.esInsertDataRow = esInsertDataRow;
        this.esGetVersionById = esGetVersionById;
    }

    public List<Map<String, Object>> getArchive() {
        return jdbcManager.queryForList(GET_ARCHIVE);
    }

    public List<Map<String, Object>> getCurrentVersion() {
        return jdbcManager.queryForList(esGetCurrentVersion);
    }

    public List<Map<String, Object>> getVersionData(int versionId) {
        return jdbcManager.queryForListWithParams(esGetVersionData, versionId);
    }

    public List<Map<String, Object>> getVersionsPage(int offset, int limit) {
        return jdbcManager.queryForListWithParams(esGetVersionsPage, offset, limit);
    }

    public List<Map<String, Object>> getVersionsCount() {
        return jdbcManager.queryForList(esGetVersionsCount);
    }

    public List<Map<String, Object>> getVersionById(int versionId) {
        return jdbcManager.queryForListWithParams(esGetVersionById, versionId);
    }

    public Map<String, Object> saveSnapshot(SaveExecSummaryRequest request) {
        validateUsername(request.getUsername());
        validateStringField(request.getSprintName(), "Sprint name", 200);

        String sanitizedNotes = request.getNotes() != null
                ? sanitize(request.getNotes(), 500)
                : null;

        // Insert version row
        jdbcManager.executeUpdate(esInsertVersion,
                sanitize(request.getSprintName(), 200),
                sanitize(request.getUsername(), 100),
                sanitizedNotes);

        // Get the generated VERSION_ID
        List<Map<String, Object>> idResult = jdbcManager.queryForList(esGetLastVersionId);
        Number versionId = (Number) idResult.get(0).get("VERSION_ID");

        // Insert each data row — highlights/watchAreas can be large (CLOB)
        for (SaveExecSummaryRequest.ExecSummaryRowData row : request.getRows()) {
            jdbcManager.executeUpdate(esInsertDataRow,
                    versionId,
                    sanitize(row.getSdlcTrack(), 200),
                    row.getHighlights(),
                    row.getWatchAreas(),
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
