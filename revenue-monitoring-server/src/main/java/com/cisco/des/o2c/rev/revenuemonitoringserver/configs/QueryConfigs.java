package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:queries.properties")
public class QueryConfigs { // TODO

    @Value("${standard.ar.exc.query}")
    public String stdArExcQuery;

    @Value("${tsv.topsku.exc.query}")
    public String tsvTopSkuExcQuery;

    @Value("${tsv.subsku.exc.query}")
    public String tsvSubSkuExcQuery;

    @Value("${revenue.controls.q}")
    public String revenueControlsQuery;

    @Value("${error.summary.q}")
    public String errorSummary;

    @Value("${error.details.all.q}")
    public String allErrorDetails;

    @Value("${error.details.q}")
    public String errorDetails;

    // @Value("${period.close.invoice.stats}")
    // public String periodCloseInvoiceStats;

    // @Value("${period.close.interface.load.preclose}")
    // public String periodCloseInterfaceLoadPreclose;

    @Value("${start-end.time.q}")
    public String closeStartEndTime;

    @Value("${volume.q}")
    public String closeVolume;

    @Value("${me.status.q}")
    public String closeMEStatus;

    @Value("${inv.stats.q}")
    public String closeInvStats;

    @Value("${interface.load.q}")
    public String closeInterfaceLoad;

    @Value("${qe.cash.collected.q}")
    public String closeQECashCollected;

    @Value("${dashboard.comments.q}")
    public String dashboardComments;

    @Value("${update.comments.q}")
    public String updateComments;

    @Value("${order.status.q}")
    public String orderStatus;

    @Value("${invoice.tracker.header.q}")
    public String invoiceTrackerHeader;

    @Value("${invoice.tracker.line.q}")
    public String invoiceTrackerLine;

    @Value("${wd0.ar.midclose.status.query}")
    public String wd0ArMidCloseStatusQuery;

    @Value("${wd0.ar.midclose.header.data.query}")
    public String wd0ArMidCloseHeaderDataQuery;

    @Value("${wd0.historical.data.q}")
    public String wd0HistoricalDataQuery;
    @Value("${update.order.status.q}")
    public String updateOrderStatus;

    @Value("${order.status.summary.q}")
    public String orderStatusSummary;

    @Value("${order.status.download.q}")
    public String orderStatusDownload;

    @Value("${kafka.error.q}")
    public String kafkaError;

    @Value("${kafka.inbound.q}")
    public String kafkaInbound;

    @Value("${ar.trxn.missing.q}")
    public String arTrxnMissing;

    @Value("${accruals.processing.errors.q}")
    public String accrualsProcessingErrors;

    @Value("${accruals.distribution.errors.q}")
    public String accrualsDistributionErrors;

    @Value("${accruals.summarization.errors.q}")
    public String accrualsSummarizationErrors;

    @Value("${kafka.publish.to.downstream.q}")
    public String kafkaPublishToDownstream;

    @Value("${error.distribution.summarization.q}")
    public String errorDistributionSummarization;

    @Value(("${order.status.rev.summary.q}"))
    public String orderStatusRevSummary;

    @Value(("${persona.access.q}"))
    public String personaAccessRoles;
    @Value(("${wd0.regression.q}"))
    public String wd0Regression;

    @Value(("${wd0.current.month.q}"))
    public String wd0CurrentMonth;

    @Value("${delete.selected.deals.q}")
    public String deleteSelectedDeals;

    @Value("${clo.bulk.update.q}")
    public String cloBulkUpdate;
    @Value("${invoice.eligible.update.q}")
    public String invoiceEligibleUpdate;
    @Value("${clo.comment.update.q}")
    public String cloCommentUpdate;

    @Value(("${cms.unposted.summary.query}"))
    public String cmsUnpostedSummaryQuery;

    @Value(("${cms.receipt.error.summary}"))
    public String cmsReceiptErrorSummaryQuery;

    @Value(("${cms.ctm.status.query}"))
    public String cmsCtmStatusQuery;

    @Value(("${cms.ctm.details.query}"))
    public String cmsCtmDetailsQuery;

    @Value(("${cms.boomi.status.query}"))
    public String cmsBoomiStatusQuery;

    @Value(("${cms.boomi.details.query}"))
    public String cmsBoomiDetailsQuery;

    @Value(("${cms.extract.count.query}"))
    public String cmsExtractCountQuery;

    @Value(("${cms.extract.details.query}"))
    public String cmsExtractDetailsQuery;

    @Value(("${cms.latest.request.status.query}"))
    public String cmsLatestRequestStatusQuery;

    @Value(("${cms.collections.error.summary.query}"))
    public String cmsCollectionsErrorSummaryQuery;

    @Value(("${cms.invoice.pdf.extract.error.query}"))
    public String cmsInvoicePdfExtractErrorQuery;

    @Value(("${cms.invoice.extract.error.query}"))
    public String cmsInvoiceExtractErrorQuery;

    @Value(("${cms.customer.master.error.query}"))
    public String cmsCustomerExtractErrorQuery;

    @Value(("${cms.alternate.payer.error.query}"))
    public String cmsAlternatePayerErrorQuery;

    @Value(("${cms.sales.invoice.header.extract.error.query}"))
    public String cmsSalesInvoiceHeaderExtractErrorQuery;

    @Value(("${cms.customer.contacts.error.query}"))
    public String cmsCustomerContactsErrorQuery;

    @Value(("${cms.sales.invoice.item.extract.query}"))
    public String cmsSalesInvoiceItemExtractErrorQuery;

    @Value(("${cms.interface.errors.query}"))
    public String cmsInterfaceErrorsQuery;

    @Value(("${cms.interface.error.count.in.xhrs.query}"))
    public String cmsInterfaceErrorCountInXhrsQuery;

    @Value(("${cms.unposted.total.amount.query}"))
    public String cmsUnpostedTotalAmountQuery;

    @Value(("${cms.total.reconciliation.error.query}"))
    public String cmsTotalReconciliationErrorQuery;

    @Value(("${cms.boomi.status.hr.to.cg1.query}"))
    public String cmsBoomiStatusHrToCg1Query;

    @Value(("${cms.boomi.details.hr.to.cg1.query}"))
    public String cmsBoomiDetailsHrToCg1Query;

    @Value(("${cms.core.app.layer.error.count.query}"))
    public String cmsCoreAppLayerErrorCountQuery;

    @Value(("${cms.recon.err.count.extract.query}"))
    public String cmsReconErrCountExtractQuery;

    @Value(("${rol.transaction.data.query}"))
    public String rolTransactionData;

    @Value(("${rol.errors.summary.query}"))
    public String rolErrorsSummary;

    @Value(("${rol.chart.totals.q}"))
    public String rolChartTotals;

    @Value(("${rol.chart.details.q}"))
    public String rolChartDetails;

    @Value(("${sbp.summary.query}"))
    public String sbpSummary;

    @Value(("${sbp.details.q}"))
    public String sbpDetails;

    @Value(("${cms.total.unapplied.amount.query}"))
    public String cmsTotalUnappliedAmountQuery;

    @Value(("${estimated.completion.time.query}"))
    public String estimatedCompletionTime;

    @Value(("${large.deal.summary.by.account.query}"))
    public String largeDealSummaryByAccount;

    @Value(("${clo.sample.download.data.query}"))
    public String cloSampleDownloadData;

    @Value(("${rol.transaction.data.count.query}"))
    public String rolTransactionDataCount;

    @Value(("${case.service.metrics.summary}"))
    public String caseServiceMetricsSummary;

    @Value(("${rol.errors.summary.update.query}"))
    public String rolErrorsSummaryUpdate;

    @Value(("${rol.errors.summary.period.status.query}"))
    public String rolErrorsSummaryPeriodStatus;

    @Value(("${rol.transaction.data.filter.query}"))
    public String rolTransactionDataFilter;

    @Value(("${auto.invoice.error.summary.view.query}"))
    public String autoInvoiceErrorSummaryView;

    @Value(("${auto.invoice.error.details.query}"))
    public String autoInvoiceErrorDetails;

    @Value(("${auto.invoice.error.details.filtered.query}"))
    public String autoInvoiceErrorDetailsFiltered;
    @Value(("${pre.invoice.error.summary.view.query}"))
    public String preInvoiceErrorSummaryView;

    @Value(("${pre.invoice.error.details.query}"))
    public String preInvoiceErrorDetails;
    @Value(("${pre.invoice.error.details.filtered.query}"))
    public String preInvoiceErrorDetailsFiltered;

    @Value(("${rol.transaction.data.filter.count.query}"))
    public String rolTransactionDataFilterCount;

    @Value(("${rol.transaction.data.download.q}"))
    public String rolTransactionDataDownload;

    @Value(("${rol.transaction.filter.data.download.q}"))
    public String rolTransactionFilterDataDownload;

    @Value(("${auto.invoice.errors.summary.update.query}"))
    public String autoInvoiceErrorsSummaryUpdate;

    @Value(("${pre.invoice.errors.summary.update.query}"))
    public String preInvoiceErrorsSummaryUpdate;

    @Value(("${wd0.volumes.q}"))
    public String wd0Volumes;

    @Value(("${summary.assignment.users.query}"))
    public String summaryAssignmentUsers;

    @Value(("${accruals.summary.q}"))
    public String accrualsSummary;

    @Value(("${accruals.details.q}"))
    public String accrualsDetails;

    @Value(("${accruals.details.filtered}"))
    public String accrualsDetailsFiltered;

    @Value(("${accruals.summary.update.q}"))
    public String accrualsSummaryUpdate;

    @Value(("${invoice.to.cash.summary.q}"))
    public String invoiceToCashSummary;

    @Bean(name = "autoInvoiceErrorSummaryView")
    public String getAutoInvoiceErrorSummaryView() {
        return this.autoInvoiceErrorSummaryView;
    }

    @Bean(name = "autoInvoiceErrorDetails")
    public String getAutoInvoiceErrorDetails() {
        return this.autoInvoiceErrorDetails;
    }

    @Bean(name = "autoInvoiceErrorDetailsFiltered")
    public String getAutoInvoiceErrorDetailsFiltered() {
        return this.autoInvoiceErrorDetailsFiltered;
    }

    @Bean(name = "preInvoiceErrorSummaryView")
    public String getPreInvoiceErrorSummaryView() {
        return this.preInvoiceErrorSummaryView;
    }

    @Bean(name = "preInvoiceErrorDetails")
    public String getPreInvoiceErrorDetails() {
        return this.preInvoiceErrorDetails;
    }

    @Bean(name = "preInvoiceErrorDetailsFiltered")
    public String getPreInvoiceErrorDetailsFiltered() {
        return this.preInvoiceErrorDetailsFiltered;
    }

    @Bean(name = "stdArExcQuery")
    public String getStdArExcQuery() {
        return this.stdArExcQuery;
    }

    @Bean(name = "tsvTopSkuExcQuery")
    public String getTsvTopSkuExcQuery() {
        return this.tsvTopSkuExcQuery;
    }

    @Bean(name = "tsvSubSkuExcQuery")
    public String getTsvSubSkuExcQuery() {
        return this.tsvSubSkuExcQuery;
    }

    @Bean(name = "revenueControlsQuery")
    public String getRevenueControls() {
        return this.revenueControlsQuery;
    }

    // @Bean( name = "periodCloseInvoiceStats")
    // public String getPeriodCloseInvoiceStats() { return
    // this.periodCloseInvoiceStats; }

    // @Bean( name = "periodCloseInterfaceLoadPreclose")
    // public String getPeriodCloseInterfaceLoad() { return
    // this.periodCloseInterfaceLoadPreclose; }

    @Bean(name = "closeStartEndTime")
    public String getCloseStartEndTime() {
        return this.closeStartEndTime;
    }

    @Bean(name = "closeVolume")
    public String getCloseVolume() {
        return this.closeVolume;
    }

    @Bean(name = "closeMEStatus")
    public String getCloseMEStatus() {
        return this.closeMEStatus;
    }

    @Bean(name = "closeInvStats")
    public String getCloseInvStats() {
        return this.closeInvStats;
    }

    @Bean(name = "closeInterfaceLoad")
    public String getCloseInterfaceLoad() {
        return this.closeInterfaceLoad;
    }

    @Bean(name = "closeQECashCollected")
    public String getCloseQECashCollected() {
        return this.closeQECashCollected;
    }

    @Bean(name = "dashboardComments")
    public String getDashboardComments() {
        return this.dashboardComments;
    }

    @Bean(name = "updateComments")
    public String getUpdateComments() {
        return this.updateComments;
    }

    @Bean(name = "errorSummary")
    public String getErrorSummary() {
        return this.errorSummary;
    }

    @Bean(name = "allErrorDetails")
    public String getAllErrorDetails() {
        return this.allErrorDetails;
    }

    @Bean(name = "errorDetails")
    public String getErrorDetails() {
        return this.errorDetails;
    }

    @Bean(name = "orderStatus")
    public String getOrderStatus() {
        return this.orderStatus;
    }

    @Bean(name = "invoiceTrackerHeader")
    public String getInvoiceTrackerHeader() {
        return this.invoiceTrackerHeader;
    }

    @Bean(name = "invoiceTrackerLine")
    public String getInvoiceTrackerline() {
        return this.invoiceTrackerLine;
    }

    @Bean(name = "wd0ArMidCloseStatusQuery")
    public String getWd0ArMidCloseStatusQuery() {
        return this.wd0ArMidCloseStatusQuery;
    }

    @Bean(name = "wd0ArMidCloseHeaderDataQuery")
    public String getWd0ArMidCloseHeaderDataQuery() {
        return this.wd0ArMidCloseHeaderDataQuery;
    }

    @Bean(name = "wd0HistoricalDataQuery")
    public String getWd0HistoricalDataQuery() {
        return this.wd0HistoricalDataQuery;
    }

    @Bean(name = "orderStatusSummary")
    public String getOrderStatusSummary() {
        return this.orderStatusSummary;
    }

    @Bean(name = "orderStatusDownload")
    public String getOrderStatusDownload() {
        return this.orderStatusDownload;
    }

    @Bean(name = "updateOrderStatus")
    public String getUpdateOrderStatus() {
        return this.updateOrderStatus;
    }

    @Bean(name = "kafkaError")
    public String getKafkaError() {
        return this.kafkaError;
    }

    @Bean(name = "kafkaInbound")
    public String getKafkaInbound() {
        return this.kafkaInbound;
    }

    @Bean(name = "arTrxnMissing")
    public String getArTrxnMissing() {
        return this.arTrxnMissing;
    }

    @Bean(name = "accrualsProcessingErrors")
    public String getAccrualsProcessingErrors() {
        return this.accrualsProcessingErrors;
    }

    @Bean(name = "accrualsDistributionErrors")
    public String getAccrualsDistributionErrors() {
        return this.accrualsDistributionErrors;
    }

    @Bean(name = "accrualsSummarizationErrors")
    public String getAccrualsSummarizationErrors() {
        return this.accrualsSummarizationErrors;
    }

    @Bean(name = "kafkaPublishToDownstream")
    public String getKafkaPublishToDownstream() {
        return this.kafkaPublishToDownstream;
    }

    @Bean(name = "errorDistributionSummarization")
    public String getErrorDistributionSummarization() {
        return this.errorDistributionSummarization;
    }

    @Bean(name = "orderStatusRevSummary")
    public String getOrderStatusRevSummary() {
        return this.orderStatusRevSummary;
    }

    @Bean(name = "personaAccessRoles")
    public String getPersonaAccessRoles() {
        return this.personaAccessRoles;
    }

    @Bean(name = "wd0Regression")
    public String getWd0Regression() {
        return this.wd0Regression;
    }

    @Bean(name = "wd0CurrentMonth")
    public String getWd0CurrentMonth() {
        return this.wd0CurrentMonth;
    }

    @Bean(name = "deleteSelectedDeals")
    public String getDeleteSelectedDeals() {
        return this.deleteSelectedDeals;
    }

    @Bean(name = "cloBulkUpdate")
    public String getCloBulkUpdate() {
        return this.cloBulkUpdate;
    }

    @Bean(name = "invoiceEligibleUpdate")
    public String getInvoiceEligibleUpdate() {
        return this.invoiceEligibleUpdate;
    }

    @Bean(name = "cloCommentUpdate")
    public String getCloCommentUpdate() {
        return this.cloCommentUpdate;
    }

    @Bean(name = "cmsUnpostedSummaryQuery")
    public String getCmsUnpostedSummaryQuery() {
        return this.cmsUnpostedSummaryQuery;
    }

    @Bean(name = "cmsReceiptErrorSummaryQuery")
    public String getCmsReceiptErrorSummaryQuery() {
        return this.cmsReceiptErrorSummaryQuery;
    }

    @Bean(name = "cmsCtmStatusQuery")
    public String getCmsCtmStatusQuery() {
        return this.cmsCtmStatusQuery;
    }

    @Bean(name = "cmsCtmDetailsQuery")
    public String getCmsCtmDetailsQuery() {
        return this.cmsCtmDetailsQuery;
    }

    @Bean(name = "cmsBoomiStatusQuery")
    public String getCmsBoomiStatusQuery() {
        return this.cmsBoomiStatusQuery;
    }

    @Bean(name = "cmsBoomiDetailsQuery")
    public String getCmsBoomiDetailsQuery() {
        return this.cmsBoomiDetailsQuery;
    }

    @Bean(name = "cmsExtractCountQuery")
    public String getCmsExtractCountQuery() {
        return this.cmsExtractCountQuery;
    }

    @Bean(name = "cmsExtractDetailsQuery")
    public String getCmsExtractDetailsQuery() {
        return this.cmsExtractDetailsQuery;
    }

    @Bean(name = "cmsLatestRequestStatusQuery")
    public String getCmsLatestRequestStatusQuery() {
        return this.cmsLatestRequestStatusQuery;
    }

    @Bean(name = "cmsCollectionsErrorSummaryQuery")
    public String getCmsCollectionsErrorSummaryQuery() {
        return this.cmsCollectionsErrorSummaryQuery;
    }

    @Bean(name = "cmsInvoicePdfExtractErrorQuery")
    public String getCmsInvoicePdfExtractErrorQuery() {
        return this.cmsInvoicePdfExtractErrorQuery;
    }

    @Bean(name = "cmsInvoiceExtractErrorQuery")
    public String getCmsInvoiceExtractErrorQuery() {
        return this.cmsInvoiceExtractErrorQuery;
    }

    @Bean(name = "cmsCustomerExtractErrorQuery")
    public String getCmsCustomerExtractErrorQuery() {
        return this.cmsCustomerExtractErrorQuery;
    }

    @Bean(name = "cmsAlternatePayerErrorQuery")
    public String getCmsAlternatePayerErrorQuery() {
        return this.cmsAlternatePayerErrorQuery;
    }

    @Bean(name = "cmsSalesInvoiceHeaderExtractErrorQuery")
    public String getCmsSalesInvoiceHeaderExtractErrorQuery() {
        return this.cmsSalesInvoiceHeaderExtractErrorQuery;
    }

    @Bean(name = "cmsCustomerContactsErrorQuery")
    public String getCmsCustomerContactsErrorQuery() {
        return this.cmsCustomerContactsErrorQuery;
    }

    @Bean(name = "cmsSalesInvoiceItemExtractErrorQuery")
    public String getCmsSalesInvoiceItemExtractErrorQuery() {
        return this.cmsSalesInvoiceItemExtractErrorQuery;
    }

    @Bean(name = "cmsInterfaceErrorsQuery")
    public String getCmsInterfaceErrorsQuery() {
        return this.cmsInterfaceErrorsQuery;
    }

    @Bean(name = "cmsInterfaceErrorCountInXhrsQuery")
    public String getCmsInterfaceErrorCountInXhrsQuery() {
        return this.cmsInterfaceErrorCountInXhrsQuery;
    }

    @Bean(name = "cmsUnpostedTotalAmountQuery")
    public String getCmsUnpostedTotalAmountQuery() {
        return this.cmsUnpostedTotalAmountQuery;
    }

    @Bean(name = "cmsTotalReconciliationErrorQuery")
    public String getCmsTotalReconciliationErrorQuery() {
        return this.cmsTotalReconciliationErrorQuery;
    }

    @Bean(name = "cmsBoomiStatusHrToCg1Query")
    public String getCmsBoomiStatusHrToCg1Query() {
        return this.cmsBoomiStatusHrToCg1Query;
    }

    @Bean(name = "cmsBoomiDetailsHrToCg1Query")
    public String getCmsBoomiDetailsHrToCg1Query() {
        return this.cmsBoomiDetailsHrToCg1Query;
    }

    @Bean(name = "cmsCoreAppLayerErrorCountQuery")
    public String getCmsCoreAppLayerErrorCountQuery() {
        return this.cmsCoreAppLayerErrorCountQuery;
    }

    @Bean(name = "cmsReconErrCountExtractQuery")
    public String getCmsReconErrCountExtractQuery() {
        return this.cmsReconErrCountExtractQuery;
    }

    @Bean(name = "rolTransactionData")
    public String getRolTransactionData() {
        return this.rolTransactionData;
    }

    @Bean(name = "rolErrorsSummary")
    public String getRolErrorsSummary() {
        return this.rolErrorsSummary;
    }

    @Bean( name = "rolChartTotals" )
    public String getRolChartTotals() {return this.rolChartTotals; }

    @Bean( name = "rolChartDetails" )
    public String getRolChartDetails() {return this.rolChartDetails; }

    @Bean(name = "sbpSummary")
    public String getSbpSummary() {
        return this.sbpSummary;
    }

    @Bean( name = "sbpDetails" )
    public String getSbpDetails() {return this.sbpDetails; }

    @Bean(name = "cmsTotalUnappliedAmountQuery")
    public String getCmsTotalUnappliedAmountQuery() {
        return this.cmsTotalUnappliedAmountQuery;
    }

    @Bean(name = "estimatedCompletionTime")
    public String getEstimatedCompletionTime() {
        return this.estimatedCompletionTime;
    }

    @Bean(name = "largeDealSummaryByAccount")
    public String getLargeDealSummaryByAccount() {
        return this.largeDealSummaryByAccount;
    }

    @Bean(name = "cloSampleDownloadData")
    public String getCloSampleDownloadData(){
        return this.cloSampleDownloadData;
    }

    @Bean(name = "rolTransactionDataCount")
    public String getRolTransactionDataCount() { return this.rolTransactionDataCount; }

    @Bean(name = "caseServiceMetricsSummary")
    public String getCaseServiceMetricsSummary() { return this.caseServiceMetricsSummary; }

    @Bean(name = "rolErrorsSummaryUpdate")
    public String updateRolErrorSummaryUpdate() {
        return this.rolErrorsSummaryUpdate;
    }

    @Bean(name = "rolErrorsSummaryPeriodStatus")
    public String getRolErrorsSummaryPeriodStatus() {
        return this.rolErrorsSummaryPeriodStatus;
    }

    @Bean(name = "rolTransactionDataFilter")
    public String getRolTransactionDataFilter() {
        return this.rolTransactionDataFilter;
    }

    @Bean(name = "rolTransactionDataDownload")
    public String getRolTransactionDataDownload() {
        return this.rolTransactionDataDownload;
    }

    @Bean(name = "rolTransactionFilterDataDownload")
    public String getRolTransactionFilterDataDownload() {
        return this.rolTransactionFilterDataDownload;
    }

    @Bean(name = "rolTransactionDataFilterCount")
    public String getRolTransactionDataFilterCount(){
        return this.rolTransactionDataFilterCount;
    }

    @Bean( name = "wd0Volumes" )
    public String getWd0Volumes() {return this.wd0Volumes; }

    @Bean( name = "autoInvoiceErrorsSummaryUpdate" )
    public String getAutoInvoiceErrorsSummaryUpdate() {return this.autoInvoiceErrorsSummaryUpdate; }

    @Bean( name = "preInvoiceErrorsSummaryUpdate" )
    public String getPreInvoiceErrorsSummaryUpdate() {return this.preInvoiceErrorsSummaryUpdate; }

    @Bean( name = "summaryAssignmentUsers" )
    public String getSummaryAssignmentUsers() {return this.summaryAssignmentUsers; }

    @Bean( name = "accrualsSummary" )
    public String getAccrualsSummary() {return this.accrualsSummary; }

    @Bean( name = "accrualsDetails" )
    public String getAccrualsDetails() {return this.accrualsDetails; }

    @Bean( name = "accrualsDetailsFiltered" )
    public String getAccrualsDetailsFiltered() {return this.accrualsDetailsFiltered; }

    @Bean( name = "accrualsSummaryUpdate" )
    public String getAccrualsSummaryUpdate() {return this.accrualsSummaryUpdate; }

    @Bean( name = "invoiceToCashSummary" )
    public String getInvoiceToCashSummary() {return this.invoiceToCashSummary; }
}
