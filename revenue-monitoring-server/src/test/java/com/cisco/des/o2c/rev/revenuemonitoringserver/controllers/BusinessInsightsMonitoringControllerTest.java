package com.cisco.des.o2c.rev.revenuemonitoringserver.controllers;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.BusinessInsightsMonitoringService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BusinessInsightsMonitoringController.class)
class BusinessInsightsMonitoringControllerTest {
    @Autowired MockMvc mvc;
    @MockBean BusinessInsightsMonitoringService service;

    @Test void issueReporting() throws Exception {
        when(service.getIssueReportingData()).thenReturn(List.of(Map.of("k","v")));
        mvc.perform(get("/api/issue-reporting")).andExpect(status().isOk());
    }

    @Test void issueReportingSummary() throws Exception {
        when(service.getIssueReportingDataSummary()).thenReturn(List.of(Map.of("s","1")));
        mvc.perform(get("/api/issue-reporting-summary")).andExpect(status().isOk());
    }

    @Test void uploadIssueReport() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file","test.csv","text/csv","a,b".getBytes());
        mvc.perform(multipart("/api/issue-reporting-upload").file(file).param("username","bob"))
                .andExpect(status().isOk());
        verify(service).insertIssueReportingData(any(), eq("bob"));
    }

    @Test void approveRejectIssueReport() throws Exception {
        mvc.perform(post("/api/issue-reporting-approval")
                .contentType(MediaType.APPLICATION_JSON).content("{\"approval\":\"APPROVED\",\"approvedBy\":\"admin\",\"incidentNum\":\"INC001\"}"))
                .andExpect(status().isOk());
        verify(service).approveRejectIssueReporting(any(), any(), any());
    }

    @Test void bulkApproveRejectIssueReport() throws Exception {
        mvc.perform(post("/api/issue-reporting-approval-bulk")
                .contentType(MediaType.APPLICATION_JSON).content("[{\"id\":\"1\"}]"))
                .andExpect(status().isOk());
        verify(service).bulkApproveRejectIssueReporting(anyList());
    }

    @Test void updateCommentsIssueReport() throws Exception {
        mvc.perform(post("/api/issue-reporting-comments-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"comments\":\"ok\",\"approvedBy\":\"admin\",\"incidentNum\":\"INC001\"}"))
                .andExpect(status().isOk());
        verify(service).updateCommentsIssueReporting(any(), any(), any());
    }

    @Test void updateFixDetailsIssueReport() throws Exception {
        mvc.perform(post("/api/issue-reporting-fix-details-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"fixDetails\":\"fixed\",\"approvedBy\":\"admin\",\"incidentNum\":\"INC001\"}"))
                .andExpect(status().isOk());
        verify(service).updateFixDetailsIssueReporting(any(), any(), any());
    }

    @Test void updateStatusIssueReport() throws Exception {
        mvc.perform(post("/api/issue-reporting-status-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"closed\",\"approvedBy\":\"admin\",\"incidentNum\":\"INC001\"}"))
                .andExpect(status().isOk());
        verify(service).updateStatusIssueReporting(any(), any(), any());
    }

    @Test void updateIssueDescIssueReport() throws Exception {
        mvc.perform(post("/api/issue-reporting-issue-desc-update")
                .contentType(MediaType.APPLICATION_JSON).content("{\"issue\":\"desc\",\"rootCause\":\"rc\",\"businessImpact\":\"bi\",\"approvedBy\":\"admin\",\"incidentNum\":\"INC001\"}"))
                .andExpect(status().isOk());
        verify(service).updateIssueDescIssueReporting(any(), any(), any(), any(), any());
    }

    @Test void wd0ArMidCloseHeaderData() throws Exception {
        when(service.getWd0ArMidCloseHeaderData()).thenReturn(List.of(Map.of("h","1")));
        mvc.perform(get("/api/wd0-ar-midclose-header-data")).andExpect(status().isOk());
    }

    @Test void wd0ArMidCloseStatus() throws Exception {
        when(service.getWd0ArMidCloseStatus()).thenReturn(List.of(Map.of("s","ok")));
        mvc.perform(get("/api/wd0-ar-midclose-status")).andExpect(status().isOk());
    }

    @Test void wd0HistoricalData() throws Exception {
        when(service.getWd0HistoricalData()).thenReturn(List.of(Map.of("d","1")));
        mvc.perform(get("/api/wd0-historical-data")).andExpect(status().isOk());
    }

    @Test void wd0Regression() throws Exception {
        when(service.getWd0Regression()).thenReturn(List.of(Map.of("r","1")));
        mvc.perform(get("/api/wd0-regression")).andExpect(status().isOk());
    }

    @Test void wd0CurrentMonth() throws Exception {
        when(service.getWd0CurrentMonth()).thenReturn(List.of(Map.of("m","1")));
        mvc.perform(get("/api/wd0-current-month")).andExpect(status().isOk());
    }

    @Test void wd0Volumes() throws Exception {
        when(service.getWd0Volumes()).thenReturn(List.of(Map.of("v","1")));
        mvc.perform(get("/api/wd0-volumes")).andExpect(status().isOk());
    }

    @Test void wd0MidcloseActualsProduct() throws Exception {
        when(service.getWd0MidcloseActualsProduct()).thenReturn(List.of(Map.of("p","1")));
        mvc.perform(get("/api/wd0-midclose-actuals-product")).andExpect(status().isOk());
    }

    @Test void wd0MidcloseActualsService() throws Exception {
        when(service.getWd0MidcloseActualsService()).thenReturn(List.of(Map.of("s","1")));
        mvc.perform(get("/api/wd0-midclose-actuals-service")).andExpect(status().isOk());
    }

    @Test void largeDealSummaryByAccount() throws Exception {
        when(service.getLargeDealSummaryByAccount()).thenReturn(List.of());
        mvc.perform(get("/api/large-deal-summary-account")).andExpect(status().isOk());
    }

    @Test void cloSampleDownloadData() throws Exception {
        when(service.getCloSampleDownloadData()).thenReturn(List.of(Map.of("d","1")));
        mvc.perform(get("/api/clo-sample-download-data")).andExpect(status().isOk());
    }

    @Test void orderStatusSummary() throws Exception {
        when(service.getOrderStatusSummary()).thenReturn(List.of());
        mvc.perform(get("/api/order-status-summary")).andExpect(status().isOk());
    }

    @Test void orderStatusRevSummary() throws Exception {
        when(service.getOrderStatusRevSummary()).thenReturn(List.of(Map.of("r","1")));
        mvc.perform(get("/api/order-status-rev-summary")).andExpect(status().isOk());
    }

    @Test void orderLifecycleUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file","orders.csv","text/csv","data".getBytes());
        mvc.perform(multipart("/api/order-lifecycle-upload").file(file).param("username","alice"))
                .andExpect(status().isOk());
        verify(service).setUpdateOrderStatusFromFile(any(), eq("alice"));
    }

    @Test void orderLifecycleUploadManual() throws Exception {
        mvc.perform(post("/api/order-lifecycle-upload-manual")
                .contentType(MediaType.APPLICATION_JSON).content("{\"orders\":[]}"))
                .andExpect(status().isOk());
    }

    @Test void cloBulkUpload() throws Exception {
        mvc.perform(post("/api/clo-bulk-upload")
                .contentType(MediaType.APPLICATION_JSON).content("{\"data\":[]}"))
                .andExpect(status().isOk());
    }

    @Test void cloBulkUploadFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file","clo.csv","text/csv","data".getBytes());
        mvc.perform(multipart("/api/clo-bulk-upload-file").file(file).param("username","alice"))
                .andExpect(status().isOk());
    }

    @Test void orderStatusDownload() throws Exception {
        when(service.getOrderStatusDownload()).thenReturn(List.of(Map.of("o","1")));
        mvc.perform(get("/api/order-status-download")).andExpect(status().isOk());
    }

    @Test void orderStatus() throws Exception {
        when(service.getOrderStatus()).thenReturn(null);
        mvc.perform(get("/api/order-status")).andExpect(status().isOk());
    }

    @Test void deleteSelectedDeals() throws Exception {
        mvc.perform(post("/api/delete-selected-deals")
                .contentType(MediaType.APPLICATION_JSON).content("{\"selectedDeals\":[],\"username\":\"alice\"}"))
                .andExpect(status().isOk());
        verify(service).deleteSelectedDeals(any(), any());
    }

    @Test void updateInvoiceEligibleDate() throws Exception {
        doNothing().when(service).setUpdateInvoiceEligibleDate(anyMap(), anyString());
        mvc.perform(post("/api/update-invoice-eligible-date")
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\",\"date\":\"2024-01-01\"}"))
                .andExpect(status().isOk());
    }

    @Test void updateCLOComments() throws Exception {
        doNothing().when(service).setCloCommentUpdate(anyMap(), anyString());
        mvc.perform(post("/api/update-clo-comments")
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"1\",\"comment\":\"done\"}"))
                .andExpect(status().isOk());
    }
}
