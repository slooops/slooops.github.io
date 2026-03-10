package com.cisco.des.o2c.rev.revenuemonitoringserver.models;

import java.util.List;

public class SaveExecSummaryRequest {

    private String sprintName;
    private String username;
    private String notes;
    private List<ExecSummaryRowData> rows;

    public SaveExecSummaryRequest() {
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

    public List<ExecSummaryRowData> getRows() {
        return rows;
    }

    public void setRows(List<ExecSummaryRowData> rows) {
        this.rows = rows;
    }

    public static class ExecSummaryRowData {
        private String sdlcTrack;
        private String highlights;
        private String watchAreas;
        private int sortOrder;

        public ExecSummaryRowData() {
        }

        public String getSdlcTrack() {
            return sdlcTrack;
        }

        public void setSdlcTrack(String sdlcTrack) {
            this.sdlcTrack = sdlcTrack;
        }

        public String getHighlights() {
            return highlights;
        }

        public void setHighlights(String highlights) {
            this.highlights = highlights;
        }

        public String getWatchAreas() {
            return watchAreas;
        }

        public void setWatchAreas(String watchAreas) {
            this.watchAreas = watchAreas;
        }

        public int getSortOrder() {
            return sortOrder;
        }

        public void setSortOrder(int sortOrder) {
            this.sortOrder = sortOrder;
        }
    }
}
