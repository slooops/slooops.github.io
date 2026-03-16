package com.cisco.des.o2c.rev.revenuemonitoringserver.services;

import com.cisco.des.o2c.rev.revenuemonitoringserver.models.SaveSdlcAdoptRequest;
import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.JdbcManager;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class SdlcAdoptService {

    private final JdbcManager jdbcManager;
    private final String saGetCurrentVersion;
    private final String saGetVersionData;
    private final String saGetVersionsPage;
    private final String saGetVersionsCount;
    private final String saInsertVersion;
    private final String saGetLastVersionId;
    private final String saInsertDataRow;
    private final String saGetVersionById;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    public SdlcAdoptService(
            JdbcManager jdbcManager,
            @Qualifier("saGetCurrentVersion") String saGetCurrentVersion,
            @Qualifier("saGetVersionData") String saGetVersionData,
            @Qualifier("saGetVersionsPage") String saGetVersionsPage,
            @Qualifier("saGetVersionsCount") String saGetVersionsCount,
            @Qualifier("saInsertVersion") String saInsertVersion,
            @Qualifier("saGetLastVersionId") String saGetLastVersionId,
            @Qualifier("saInsertDataRow") String saInsertDataRow,
            @Qualifier("saGetVersionById") String saGetVersionById) {
        this.jdbcManager = jdbcManager;
        this.saGetCurrentVersion = saGetCurrentVersion;
        this.saGetVersionData = saGetVersionData;
        this.saGetVersionsPage = saGetVersionsPage;
        this.saGetVersionsCount = saGetVersionsCount;
        this.saInsertVersion = saInsertVersion;
        this.saGetLastVersionId = saGetLastVersionId;
        this.saInsertDataRow = saInsertDataRow;
        this.saGetVersionById = saGetVersionById;
    }

    public List<Map<String, Object>> getCurrentVersion() {
        return jdbcManager.queryForList(saGetCurrentVersion);
    }

    public List<Map<String, Object>> getVersionData(int versionId) {
        return jdbcManager.queryForListWithParams(saGetVersionData, versionId);
    }

    public List<Map<String, Object>> getVersionsPage(int offset, int limit) {
        return jdbcManager.queryForListWithParams(saGetVersionsPage, offset, limit);
    }

    public List<Map<String, Object>> getVersionsCount() {
        return jdbcManager.queryForList(saGetVersionsCount);
    }

    public List<Map<String, Object>> getVersionById(int versionId) {
        return jdbcManager.queryForListWithParams(saGetVersionById, versionId);
    }

    public Map<String, Object> saveSnapshot(SaveSdlcAdoptRequest request) {
        validateUsername(request.getUsername());
        validateStringField(request.getSprintName(), "Sprint name", 200);

        String sanitizedNotes = request.getNotes() != null
                ? sanitize(request.getNotes(), 500)
                : null;

        jdbcManager.executeUpdate(saInsertVersion,
                sanitize(request.getSprintName(), 200),
                sanitize(request.getUsername(), 100),
                sanitizedNotes);

        List<Map<String, Object>> idResult = jdbcManager.queryForList(saGetLastVersionId);
        Number versionId = (Number) idResult.get(0).get("VERSION_ID");

        for (SaveSdlcAdoptRequest.SdlcAdoptRowData row : request.getRows()) {
            jdbcManager.executeUpdate(saInsertDataRow,
                    versionId,
                    sanitize(row.getWorkstream(), 200),
                    sanitize(row.getComponent(), 500),
                    sanitize(row.getPmStatus(), 50),
                    sanitize(row.getPmPct(), 20),
                    sanitize(row.getOmStatus(), 50),
                    sanitize(row.getOmPct(), 20),
                    sanitize(row.getSmStatus(), 50),
                    sanitize(row.getSmPct(), 20),
                    sanitize(row.getI2cStatus(), 50),
                    sanitize(row.getI2cPct(), 20),
                    sanitize(row.getP2pStatus(), 50),
                    sanitize(row.getP2pPct(), 20),
                    sanitize(row.getFppStatus(), 50),
                    sanitize(row.getFppPct(), 20),
                    sanitize(row.getAitStatus(), 50),
                    sanitize(row.getAitPct(), 20),
                    sanitize(row.getCapitalStatus(), 50),
                    sanitize(row.getCapitalPct(), 20),
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
