package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.List;

public class SaveScorecardRequest {

    private String sprintName;
    private String username;
    private String notes;
    private List<ScorecardRowData> rows;

    public SaveScorecardRequest() {
    }

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<ScorecardRowData> getRows() {
        return rows;
    }

    public void setRows(List<ScorecardRowData> rows) {
        this.rows = rows;
    }

    public static class ScorecardRowData {
        private String workstream;
        private String successCriteria;
        private String baseline;
        private String owners;
        private String eocy26Target;
        private String howWeMeasure;
        private String metric;
        private int sortOrder;

        public ScorecardRowData() {
        }

        public String getWorkstream() {
            return workstream;
        }

        public void setWorkstream(String workstream) {
            this.workstream = workstream;
        }

        public String getSuccessCriteria() {
            return successCriteria;
        }

        public void setSuccessCriteria(String successCriteria) {
            this.successCriteria = successCriteria;
        }

        public String getBaseline() {
            return baseline;
        }

        public void setBaseline(String baseline) {
            this.baseline = baseline;
        }

        public String getOwners() {
            return owners;
        }

        public void setOwners(String owners) {
            this.owners = owners;
        }

        public String getEocy26Target() {
            return eocy26Target;
        }

        public void setEocy26Target(String eocy26Target) {
            this.eocy26Target = eocy26Target;
        }

        public String getHowWeMeasure() {
            return howWeMeasure;
        }

        public void setHowWeMeasure(String howWeMeasure) {
            this.howWeMeasure = howWeMeasure;
        }

        public String getMetric() {
            return metric;
        }

        public void setMetric(String metric) {
            this.metric = metric;
        }

        public int getSortOrder() {
            return sortOrder;
        }

        public void setSortOrder(int sortOrder) {
            this.sortOrder = sortOrder;
        }
    }
}
