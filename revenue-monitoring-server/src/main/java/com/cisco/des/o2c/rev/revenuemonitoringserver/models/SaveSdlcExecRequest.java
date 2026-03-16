package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.List;

public class SaveSdlcExecRequest {

    private String sprintName;
    private String username;
    private String notes;
    private List<SdlcExecRowData> rows;

    public SaveSdlcExecRequest() {}

    public String getSprintName() { return sprintName; }
    public void setSprintName(String sprintName) { this.sprintName = sprintName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<SdlcExecRowData> getRows() { return rows; }
    public void setRows(List<SdlcExecRowData> rows) { this.rows = rows; }

    public static class SdlcExecRowData {
        private String workstream;
        private String component;
        private String scope;
        private String sprintUpdate;
        private String status;
        private int sortOrder;

        public SdlcExecRowData() {}

        public String getWorkstream() { return workstream; }
        public void setWorkstream(String workstream) { this.workstream = workstream; }

        public String getComponent() { return component; }
        public void setComponent(String component) { this.component = component; }

        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }

        public String getSprintUpdate() { return sprintUpdate; }
        public void setSprintUpdate(String sprintUpdate) { this.sprintUpdate = sprintUpdate; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public int getSortOrder() { return sortOrder; }
        public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    }
}
