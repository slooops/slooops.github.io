package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.List;

public class SaveSdlcAdoptRequest {

    private String sprintName;
    private String username;
    private String notes;
    private List<SdlcAdoptRowData> rows;

    public SaveSdlcAdoptRequest() {}

    public String getSprintName() { return sprintName; }
    public void setSprintName(String sprintName) { this.sprintName = sprintName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<SdlcAdoptRowData> getRows() { return rows; }
    public void setRows(List<SdlcAdoptRowData> rows) { this.rows = rows; }

    public static class SdlcAdoptRowData {
        private String workstream;
        private String component;
        private String pmStatus;
        private String pmPct;
        private String omStatus;
        private String omPct;
        private String smStatus;
        private String smPct;
        private String i2cStatus;
        private String i2cPct;
        private String p2pStatus;
        private String p2pPct;
        private String fppStatus;
        private String fppPct;
        private String aitStatus;
        private String aitPct;
        private String capitalStatus;
        private String capitalPct;
        private int sortOrder;

        public SdlcAdoptRowData() {}

        public String getWorkstream() { return workstream; }
        public void setWorkstream(String workstream) { this.workstream = workstream; }

        public String getComponent() { return component; }
        public void setComponent(String component) { this.component = component; }

        public String getPmStatus() { return pmStatus; }
        public void setPmStatus(String pmStatus) { this.pmStatus = pmStatus; }

        public String getPmPct() { return pmPct; }
        public void setPmPct(String pmPct) { this.pmPct = pmPct; }

        public String getOmStatus() { return omStatus; }
        public void setOmStatus(String omStatus) { this.omStatus = omStatus; }

        public String getOmPct() { return omPct; }
        public void setOmPct(String omPct) { this.omPct = omPct; }

        public String getSmStatus() { return smStatus; }
        public void setSmStatus(String smStatus) { this.smStatus = smStatus; }

        public String getSmPct() { return smPct; }
        public void setSmPct(String smPct) { this.smPct = smPct; }

        public String getI2cStatus() { return i2cStatus; }
        public void setI2cStatus(String i2cStatus) { this.i2cStatus = i2cStatus; }

        public String getI2cPct() { return i2cPct; }
        public void setI2cPct(String i2cPct) { this.i2cPct = i2cPct; }

        public String getP2pStatus() { return p2pStatus; }
        public void setP2pStatus(String p2pStatus) { this.p2pStatus = p2pStatus; }

        public String getP2pPct() { return p2pPct; }
        public void setP2pPct(String p2pPct) { this.p2pPct = p2pPct; }

        public String getFppStatus() { return fppStatus; }
        public void setFppStatus(String fppStatus) { this.fppStatus = fppStatus; }

        public String getFppPct() { return fppPct; }
        public void setFppPct(String fppPct) { this.fppPct = fppPct; }

        public String getAitStatus() { return aitStatus; }
        public void setAitStatus(String aitStatus) { this.aitStatus = aitStatus; }

        public String getAitPct() { return aitPct; }
        public void setAitPct(String aitPct) { this.aitPct = aitPct; }

        public String getCapitalStatus() { return capitalStatus; }
        public void setCapitalStatus(String capitalStatus) { this.capitalStatus = capitalStatus; }

        public String getCapitalPct() { return capitalPct; }
        public void setCapitalPct(String capitalPct) { this.capitalPct = capitalPct; }

        public int getSortOrder() { return sortOrder; }
        public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    }
}
