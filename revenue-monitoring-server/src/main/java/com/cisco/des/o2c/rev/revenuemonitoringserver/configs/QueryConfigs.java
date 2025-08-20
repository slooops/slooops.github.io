package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:queries.properties")
public class QueryConfigs {

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

    @Value(("${gl.error.summary.q}"))
    public String glErrorSummary;

    @Value(("${gl.error.details.q}"))
    public String glErrorDetails;

    @Value(("${gl.posting.details.filtered.q}"))
    public String glPostingDetailsFiltered;

    @Value(("${gl.posting.summary.update.q}"))
    public String glPostingSummaryUpdate;

    @Value(("${einvoicing.summary.q}"))
    public String einvoicingSummary;

    @Value(("${einvoicing.details.q}"))
    public String einvoicingDetails;

    @Value(("${esp.aging.case.summary.q}"))
    public String espAgingCaseSummary;

    @Value(("${esp.case.service.metric.summary.q}"))
    public String espCaseServiceMetricSummary;

    @Value(("${esp.weekly.comparison.summary.q}"))
    public String espWeeklyComparisonSummary;

    @Value(("${sbp.esp.aging.case.summary.q}"))
    public String sbpEspAgingCaseSummary;

    @Value(("${sbp.esp.case.service.metric.summary.q}"))
    public String sbpEspCaseServiceMetricSummary;

    @Value(("${sbp.esp.weekly.comparison.summary.q}"))
    public String sbpEspWeeklyComparisonSummary;

    @Value(("${einvoicing.details.filtered.q}"))
    public String einvoicingDetailsFiltered;

    @Value(("${einvoicing.summary.update.q}"))
    public String eInvoicingSummaryUpdate;

    @Value(("${tsp.account.summary.view.q}"))
    public String tspAccountSummaryView;

    @Value(("${tsp.account.detail.view.q}"))
    public String tspAccountDetailView;

    @Value(("${tsp.account.detail.view.filtered.q}"))
    public String tspAccountDetailViewFiltered;

    @Value(("${tsp.account.summary.update.q}"))
    public String tspAccountSummaryUpdate;

    @Value(("${fusion.error.summary}"))
    public String fusionErrorSummary;

    @Value(("${fusion.error.details}"))
    public String fusionErrorDetails;
    @Value(("${transactions.processed.summary}"))
    public String transactionsProcessedSummary;

    @Value(("${transactions.processed.details}"))
    public String transactionsProcessedDetails;

    @Value(("${transactions.processed.details.filtered}"))
    public String transactionsProcessedDetailsFiltered;

    @Value(("${fusion.error.details.filtered}"))
    public String fusionErrorDetailsFiltered;

    @Value(("${fusion.error.summary.update.q}"))
    public String fusionErrorSummaryUpdate;

    @Value(("${standard.revenue.summary.query}"))
    public String standardRevenueSummary;

    @Value(("${standard.revenue.details.query}"))
    public String standardRevenueDetails;

    @Value(("${cm.amort.summary.query}"))
    public String cmAmortSummary;

    @Value(("${cm.amort.details.query}"))
    public String cmAmortDetails;

    @Value(("${cm.amort.details.filtered.query}"))
    public String cmAmortDetailsFiltered;

    @Value(("${cm.amort.summary.update.query}"))
    public String cmAmortSummaryUpdate;

    @Value(("${standard.revenue.details.filtered.query}"))
    public String standardRevenueDetailsFiltered;

    @Value(("${standard.revenue.summary.update.query}"))
    public String standardRevenueSummaryUpdate;

    @Value(("${period.name.query}"))
    public String periodName;
    @Value(("${print.summary.view}"))
    public String printSummary;
    @Value(("${print.detail.view}"))
    public String printDetail;
    @Value(("${print.detail.view.filtered}"))
    public String printDetailFiltered;
    @Value(("${print.summary.update}"))
    public String printSummaryUpdate;
    @Value(("${credit.card.summary}"))
    public String creditCardSummary;
    @Value(("${credit.card.details}"))
    public String creditCardDetails;
    @Value(("${credit.card.details.filtered}"))
    public String creditCardDetailsFiltered;
    @Value(("${credit.card.summary.update}"))
    public String creditCardSummaryUpdate;

    @Value(("${issue.reporting.dash}"))
    public String issueReportingDash;

    @Value(("${issue.reporting.dash.status.update}"))
    public String issueReportingDashStatusUpdate;

    @Value(("${wd0.midclose.actuals.product.q}"))
    public String wd0MidcloseActualsProduct;

    @Value(("${wd0.midclose.actuals.service.q}"))
    public String wd0MidcloseActualsService;

    @Bean(name = "issueReportingDashStatusUpdate")
    public String getIssueReportingDashStatusUpdate() {
        return this.issueReportingDashStatusUpdate;
    }

    @Value(("${issue.reporting.dash.issue.description.update}"))
    public String issueReportingDashIssueDescUpdate;

    @Bean(name = "issueReportingDashIssueDescUpdate")
    public String getIssueReportingDashIssueDescUpdate() {
        return this.issueReportingDashIssueDescUpdate;
    }

    @Bean(name = "issueReportingDash")
    public String getIssueReportingDash() {
        return this.issueReportingDash;
    }

    @Value(("${issue.reporting.dash.insert}"))
    public String issueReportingDashInsert;

    @Value(("${issue.reporting.dash.comments.update}"))
    public String issueReportingDashCommentsUpdate;

    @Bean(name = "issueReportingDashCommentsUpdate")
    public String getIssueReportingDashCommentsUpdate() {
        return this.issueReportingDashCommentsUpdate;
    }

    @Value(("${issue.reporting.dash.fix.details.update}"))
    public String issueReportingDashFixDetailsUpdate;

    @Bean(name = "issueReportingDashFixDetailsUpdate")
    public String getIssueReportingDashFixDetailsUpdate() {
        return this.issueReportingDashFixDetailsUpdate;
    }

    @Bean(name = "issueReportingDashApprove")
    public String getIssueReportingDashApprove() {
        return this.issueReportingDashApprove;
    }

    @Value(("${issue.reporting.dash.approve}"))
    public String issueReportingDashApprove;

    @Bean(name = "issueReportingDashInsert")
    public String getIssueReportingDashInsert() {
        return this.issueReportingDashInsert;
    }

    @Bean(name = "creditCardSummary")
    public String getCreditCardSummary() {
        return this.creditCardSummary;
    }

    @Bean(name = "creditCardDetails")
    public String getCreditCardDetails() {
        return this.creditCardDetails;
    }
    @Bean(name = "creditCardDetailsFiltered")
    public String getCreditCardDetailsFiltered() {
        return this.creditCardDetailsFiltered;
    }

    @Bean(name = "creditCardSummaryUpdate")
    public String getCreditCardSummaryUpdate() {
        return this.creditCardSummaryUpdate;
    }


    @Bean(name = "printSummary")
    public String getPrintSummary() {
        return this.printSummary;
    }

    @Bean(name = "printDetail")
    public String getPrintDetail() {
        return this.printDetail;
    }

    @Bean(name = "printDetailFiltered")
    public String getPrintDetailFiltered() {
        return this.printDetailFiltered;
    }

    @Bean(name = "printSummaryUpdate")
    public String getPrintSummaryUpdate() {
        return this.printSummaryUpdate;
    }

    @Bean(name = "periodName")
    public String getPeriodName() {
        return this.periodName;
    }

    @Bean(name = "standardRevenueSummary")
    public String getStandardRevenueSummary() {
        return this.standardRevenueSummary;
    }

    @Bean(name = "standardRevenueDetails")
    public String getStandardRevenueDetails() {
        return this.standardRevenueDetails;
    }

    @Bean(name = "cmAmortSummary")
    public String getcmAmortSummary() {
        return this.cmAmortSummary;
    }

    @Bean(name = "cmAmortDetails")
    public String getcmAmortDetails() {
        return this.cmAmortDetails;
    }

    @Bean(name = "standardRevenueDetailsFiltered")
    public String getStandardRevenueDetailsFiltered() {
        return this.standardRevenueDetailsFiltered;
    }

    @Bean(name = "standardRevenueSummaryUpdate")
    public String getStandardRevenueSummaryUpdate() {
        return this.standardRevenueSummaryUpdate;
    }

    @Bean(name = "cmAmortDetailsFiltered")
    public String getCmAmortDetailsFiltered() {
        return this.cmAmortDetailsFiltered;
    }

    @Bean(name = "cmAmortSummaryUpdate")
    public String getCmAmortSummaryUpdate() {
        return this.cmAmortSummaryUpdate;
    }

    @Bean(name = "fusionErrorSummaryUpdate")
    public String getFusionErrorSummaryUpdate() {
        return this.fusionErrorSummaryUpdate;
    }

    @Bean(name = "fusionErrorDetailsFiltered")
    public String getFusionErrorDetailsFiltered() {
        return this.fusionErrorDetailsFiltered;
    }

    @Bean(name = "transactionsProcessedSummary")
    public String getTransactionsProcessedSummary() {
        return this.transactionsProcessedSummary;
    }

    @Bean(name = "transactionsProcessedDetails")
    public String getTransactionsProcessedDetails() {
        return this.transactionsProcessedDetails;
    }

    @Bean(name = "transactionsProcessedDetailsFiltered")
    public String getTransactionsProcessedDetailsFiltered() {
        return this.transactionsProcessedDetailsFiltered;
    }

    @Bean(name = "fusionErrorSummary")
    public String getFusionErrorSummary() {
        return this.fusionErrorSummary;
    }

    @Bean(name = "fusionErrorDetails")
    public String getFusionErrorDetails() {
        return this.fusionErrorDetails;
    }

    @Bean(name = "eInvoicingSummaryUpdate")
    public String geteInvoicingSummaryUpdate() {
        return this.eInvoicingSummaryUpdate;
    }

    @Bean(name = "einvoicingDetailsFiltered")
    public String getEinvoicingDetailsFiltered() {
        return this.einvoicingDetailsFiltered;
    }

    @Bean(name = "glErrorDetails")
    public String getGlErrorDetails() {
        return this.glErrorDetails;
    }

    @Bean(name = "glErrorSummary")
    public String getGlErrorSummary() {
        return this.glErrorSummary;
    }

    @Bean(name = "einvoicingDetails")
    public String getEinvoicingDetails() {
        return this.einvoicingDetails;
    }

    @Bean(name = "einvoicingSummary")
    public String getEinvoicingSummary() {
        return this.einvoicingSummary;
    }

    @Bean(name = "glPostingDetailsFiltered")
    public String getGlPostingDetailsFiltered() {
        return this.glPostingDetailsFiltered;
    }

    @Bean(name = "glPostingSummaryUpdate")
    public String getGlPostingSummaryUpdate() {
        return this.glPostingSummaryUpdate;
    }

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

    @Bean(name = "orderStatus")
    public String getOrderStatus() {
        return this.orderStatus;
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

    @Bean(name = "rolChartTotals")
    public String getRolChartTotals() {
        return this.rolChartTotals;
    }

    @Bean(name = "rolChartDetails")
    public String getRolChartDetails() {
        return this.rolChartDetails;
    }

    @Bean(name = "sbpSummary")
    public String getSbpSummary() {
        return this.sbpSummary;
    }

    @Bean(name = "sbpDetails")
    public String getSbpDetails() {
        return this.sbpDetails;
    }

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
    public String getCloSampleDownloadData() {
        return this.cloSampleDownloadData;
    }

    @Bean(name = "rolTransactionDataCount")
    public String getRolTransactionDataCount() {
        return this.rolTransactionDataCount;
    }

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
    public String getRolTransactionDataFilterCount() {
        return this.rolTransactionDataFilterCount;
    }

    @Bean(name = "wd0Volumes")
    public String getWd0Volumes() {
        return this.wd0Volumes;
    }

    @Bean(name = "autoInvoiceErrorsSummaryUpdate")
    public String getAutoInvoiceErrorsSummaryUpdate() {
        return this.autoInvoiceErrorsSummaryUpdate;
    }

    @Bean(name = "preInvoiceErrorsSummaryUpdate")
    public String getPreInvoiceErrorsSummaryUpdate() {
        return this.preInvoiceErrorsSummaryUpdate;
    }

    @Bean(name = "summaryAssignmentUsers")
    public String getSummaryAssignmentUsers() {
        return this.summaryAssignmentUsers;
    }

    @Bean(name = "accrualsSummary")
    public String getAccrualsSummary() {
        return this.accrualsSummary;
    }

    @Bean(name = "accrualsDetails")
    public String getAccrualsDetails() {
        return this.accrualsDetails;
    }

    @Bean(name = "accrualsDetailsFiltered")
    public String getAccrualsDetailsFiltered() {
        return this.accrualsDetailsFiltered;
    }

    @Bean(name = "accrualsSummaryUpdate")
    public String getAccrualsSummaryUpdate() {
        return this.accrualsSummaryUpdate;
    }

    @Bean(name = "invoiceToCashSummary")
    public String getInvoiceToCashSummary() {
        return this.invoiceToCashSummary;
    }

    @Bean(name = "espAgingCaseSummary")
    public String getEspAgingCaseSummary() {
        return this.espAgingCaseSummary;
    }

    @Bean(name = "espCaseServiceMetricSummary")
    public String getEspCaseServiceMetricSummary() {
        return this.espCaseServiceMetricSummary;
    }

    @Bean(name = "espWeeklyComparisonSummary")
    public String getEspWeeklyComparisonSummary() {
        return this.espWeeklyComparisonSummary;
    }

    @Bean(name = "sbpEspAgingCaseSummary")
    public String getSbpEspAgingCaseSummary() {
        return this.sbpEspAgingCaseSummary;
    }

    @Bean(name = "sbpEspCaseServiceMetricSummary")
    public String getSbpEspCaseServiceMetricSummary() {
        return this.sbpEspCaseServiceMetricSummary;
    }

    @Bean(name = "sbpEspWeeklyComparisonSummary")
    public String getSbpEspWeeklyComparisonSummary() {
        return this.sbpEspWeeklyComparisonSummary;
    }

    @Bean( name = "tspAccountSummaryView" )
    public String getTspAccountSummaryView() {return this.tspAccountSummaryView; }

    @Bean(name = "tspAccountDetailView")
    public String getTspAccountDetailView() {
        return this.tspAccountDetailView;
    }

    @Bean(name = "tspAccountDetailViewFiltered")
    public String getTspAccountDetailViewFiltered() {
        return this.tspAccountDetailViewFiltered;
    }

    @Bean(name = "tspAccountSummaryUpdate")
    public String getTspAccountSummaryUpdate() {
        return this.tspAccountSummaryUpdate;
    }

    @Bean(name = "wd0MidcloseActualsProduct")
    public String getWd0MidcloseActualsProduct() {
        return this.wd0MidcloseActualsProduct;
    }

    @Bean(name = "wd0MidcloseActualsService")
    public String getWd0MidcloseActualsService() {
        return this.wd0MidcloseActualsService;
    }

    @Value(("${rpo.extract.summary}"))
    public String rpoExtractSummary;

    @Value(("${rpo.extract.details}"))
    public String rpoExtractDetails;

    @Value(("${rpo.extract.details.filter}"))
    public String rpoExtractDetailsFilter;

    @Value(("${rpo.extract.summary.update}"))
    public String rpoExtractSummaryUpdate;

    @Value(("${srt.process.summary}"))
    public String srtProcessSummary;

    @Value(("${srt.process.details}"))
    public String srtProcessDetails;

    @Value(("${srt.process.details.filter}"))
    public String srtProcessDetailsFilter;

    @Value(("${srt.process.summary.update}"))
    public String srtProcessSummaryUpdate;

    @Value(("${issue.reporting.dash.summary}"))
    public String issueReportingDashSummary;

    @Bean(name = "issueReportingDashSummary")
    public String getIssueReportingDashSummary() {
        return this.issueReportingDashSummary;
    }

    @Bean(name = "rpoExtractSummary")
    public String getRpoExtractSummary() {
        return this.rpoExtractSummary;
    }

    @Bean(name = "rpoExtractDetails")
    public String getRpoExtractDetails() {
        return this.rpoExtractDetails;
    }

    @Bean(name = "rpoExtractDetailsFilter")
    public String getRpoExtractDetailsFilter() {
        return this.rpoExtractDetailsFilter;
    }

    @Bean(name = "rpoExtractSummaryUpdate")
    public String getRpoExtractSummaryUpdate() {
        return this.rpoExtractSummaryUpdate;
    }

    @Bean(name = "srtProcessSummary")
    public String getSrtProcessSummary() {
        return this.srtProcessSummary;
    }

    @Bean(name = "srtProcessDetails")
    public String getSrtProcessDetails() {
        return this.srtProcessDetails;
    }

    @Bean(name = "srtProcessDetailsFilter")
    public String getSrtProcessDetailsFilter() {
        return this.srtProcessDetailsFilter;
    }

    @Bean(name = "srtProcessSummaryUpdate")
    public String getSrtProcessSummaryUpdate() {
        return this.srtProcessSummaryUpdate;
    }

    @Value(("${credit.card.check.summary.view.q}"))
    public String creditCardCheckSummaryView;

    @Bean(name = "creditCardCheckSummaryView")
    public String getCreditCardCheckSummaryView() {
        return this.creditCardCheckSummaryView;
    }

    @Value(("${credit.card.check.detail.view.q}"))
    public String creditCardCheckDetailView;

    @Bean(name = "creditCardCheckDetailView")
    public String getCreditCardCheckDetailView() {
        return this.creditCardCheckDetailView;
    }

    @Value(("${credit.card.check.detail.filtered.view.q}"))
    public String creditCardCheckDetailFilteredView;

    @Bean(name = "creditCardCheckDetailFilteredView")
    public String getCreditCardCheckDetailFilteredView() {
        return this.creditCardCheckDetailFilteredView;
    }

    @Value(("${update.credit.card.check.summary.q}"))
    public String updateCreditCardCheckSummary;

    @Bean(name = "updateCreditCardCheckSummary")
    public String getUpdateCreditCardCheckSummary() {
        return this.updateCreditCardCheckSummary;
    }

    @Value(("${order.summary}"))
    public String orderSummary;

    @Bean(name = "orderSummary")
    public String getOrderSummary() {
        return this.orderSummary;
    }

    @Value(("${invoice.summary}"))
    public String invoiceSummary;

    @Bean(name = "invoiceSummary")
    public String getInvoiceSummary() {
        return this.invoiceSummary;
    }

    @Value(("${invoice.line.summary}"))
    public String invoiceLineSummary;

    @Bean(name = "invoiceLineSummary")
    public String getInvoiceLineSummary() {
        return this.invoiceLineSummary;
    }

    @Value(("${subscription.summary}"))
    public String subscriptionSummary;

    @Bean(name = "subscriptionSummary")
    public String getSubscriptionSummary() {
        return this.subscriptionSummary;
    }

    @Value(("${subscription.line.summary}"))
    public String subscriptionLineSummary;

    @Bean(name = "subscriptionLineSummary")
    public String getSubscriptionLineSummary() {
        return this.subscriptionLineSummary;
    }

    @Value(("${o2c.connector.q}"))
    public String o2cConnector;

    @Bean(name = "o2cConnector")
    public String getO2cConnector() {
        return this.o2cConnector;
    }

    @Value(("${sbp.bill.schedule.header.q}"))
    public String sbpBillScheduleHeader;

    @Bean( name = "sbpBillScheduleHeader" )
    public String getSbpBillScheduleHeader() {return this.sbpBillScheduleHeader; }

    @Value(("${sbp.bill.schedules.q}"))
    public String sbpBillSchedules;

    @Bean( name = "sbpBillSchedules" )
    public String getSbpBillSchedules() {return this.sbpBillSchedules; }

    @Value(("${sbp.bill.schedule.lines.q}"))
    public String sbpBillScheduleLines;

    @Bean( name = "sbpBillScheduleLines" )
    public String getSbpBillScheduleLines() {return this.sbpBillScheduleLines; }

    @Value(("${financial.summary.pkg.proc}"))
    public String financialSummaryPgkProc;

    @Bean( name = "financialSummaryPgkProc" )
    public String getFinancialSummaryPgkProc() {return this.financialSummaryPgkProc; }

    @Value(("${tsv.pkg.proc}"))
    public String tsvPkgProc;

    @Bean( name = "tsvPkgProc" )
    public String getTsvPkgProc() {return this.tsvPkgProc; }

    @Value(("${tsv.top.sku.view}"))
    public String tsvTopSku;

    @Bean( name = "tsvTopSku" )
    public String getTsvTopSku() {return this.tsvTopSku; }

    @Value(("${tsv.sub.sku.view}"))
    public String tsvSubSku;

    @Bean( name = "tsvSubSku" )
    public String getTsvSubSku() {return this.tsvSubSku; }

    @Value(("${tsv.accounts.view}"))
    public String tsvAccounts;

    @Bean( name = "tsvAccounts" )
    public String getTsvAccounts() {return this.tsvAccounts; }

    @Value(("${financial.summary.view}"))
    public String financialSummaryView;

    @Bean( name = "financialSummaryView" )
    public String getFinancialSummaryView() {return this.financialSummaryView; }

    @Value(("${o2c.order.bie.exception.v.q}"))
    public String o2cOrderBieExceptionV;

    @Bean( name = "o2cOrderBieExceptionV" )
    public String getO2cOrderBieExceptionV() {return this.o2cOrderBieExceptionV; }

    @Value(("${o2c.order.ch.exception.v.q}"))
    public String o2cOrderChExceptionV;

    @Bean( name = "o2cOrderChExceptionV" )
    public String getO2cOrderChExceptionV() {return this.o2cOrderChExceptionV; }

    @Value(("${o2c.order.pe.exception.v.q}"))
    public String o2cOrderPeExceptionV;

    @Bean( name = "o2cOrderPeExceptionV" )
    public String getO2cOrderPeExceptionV() {return this.o2cOrderPeExceptionV; }

    @Value(("${o2c.order.ot.exception.v.q}"))
    public String o2cOrderOtExceptionV;

    @Bean( name = "o2cOrderOtExceptionV" )
    public String getO2cOrderOtExceptionV() {return this.o2cOrderOtExceptionV; }

    @Value(("${o2c.order.bh.exception.v.q}"))
    public String o2cOrderBhExceptionV;

    @Bean( name = "o2cOrderBhExceptionV" )
    public String getO2cOrderBhExceptionV() {return this.o2cOrderBhExceptionV; }

    @Value(("${o2c.order.ec.exception.v.q}"))
    public String o2cOrderEcExceptionV;

    @Bean( name = "o2cOrderEcExceptionV" )
    public String getO2cOrderEcExceptionV() {return this.o2cOrderEcExceptionV; }

    @Value(("${o2c.order.sab.exception.v.q}"))
    public String o2cOrderSabExceptionV;

    @Bean( name = "o2cOrderSabExceptionV" )
    public String getO2cOrderSabExceptionV() {return this.o2cOrderSabExceptionV; }

    @Value(("${o2c.order.subot.exception.v.q}"))
    public String o2cOrderSubotExceptionV;

    @Bean( name = "o2cOrderSubotExceptionV" )
    public String getO2cOrderSubotExceptionV() {return this.o2cOrderSubotExceptionV; }

    @Value(("${o2c.order.preinv.exception.v.q}"))
    public String o2cOrderPreinvExceptionV;

    @Bean( name = "o2cOrderPreinvExceptionV" )
    public String getO2cOrderPreinvExceptionV() {return this.o2cOrderPreinvExceptionV; }

    @Value(("${o2c.order.inv.exception.v.q}"))
    public String o2cOrderInvExceptionV;

    @Bean( name = "o2cOrderInvExceptionV" )
    public String getO2cOrderInvExceptionV() {return this.o2cOrderInvExceptionV; }

    @Value(("${o2c.order.invpid.exception.v.q}"))
    public String o2cOrderInvpidExceptionV;

    @Bean( name = "o2cOrderInvpidExceptionV" )
    public String getO2cOrderInvpidExceptionV() {return this.o2cOrderInvpidExceptionV; }

    @Value(("${o2c.order.invoth.exception.v.q}"))
    public String o2cOrderInvothExceptionV;

    @Bean( name = "o2cOrderInvothExceptionV" )
    public String getO2cOrderInvothExceptionV() {return this.o2cOrderInvothExceptionV; }

    @Value(("${o2c.order.ca.exception.v.q}"))
    public String o2cOrderCaExceptionV;

    @Bean( name = "o2cOrderCaExceptionV" )
    public String getO2cOrderCaExceptionV() {return this.o2cOrderCaExceptionV; }

    @Value(("${o2c.order.sla.exception.v.q}"))
    public String o2cOrderSlaExceptionV;

    @Bean( name = "o2cOrderSlaExceptionV" )
    public String getO2cOrderSlaExceptionV() {return this.o2cOrderSlaExceptionV; }

    @Value(("${o2c.order.gl.exception.v.q}"))
    public String o2cOrderGlExceptionV;

    @Bean( name = "o2cOrderGlExceptionV" )
    public String getO2cOrderGlExceptionV() {return this.o2cOrderGlExceptionV; }

    @Value(("${o2c.order.accot.exception.v.q}"))
    public String o2cOrderAccotExceptionV;

    @Bean( name = "o2cOrderAccotExceptionV" )
    public String getO2cOrderAccotExceptionV() {return this.o2cOrderAccotExceptionV; }

    @Value(("${o2c.order.pastdue.exception.v.q}"))
    public String o2cOrderPastdueExceptionV;

    @Bean( name = "o2cOrderPastdueExceptionV" )
    public String getO2cOrderPastdueExceptionV() {return this.o2cOrderPastdueExceptionV; }

    @Value(("${o2c.order.partialpay.exception.v.q}"))
    public String o2cOrderPartialpayExceptionV;

    @Bean( name = "o2cOrderPartialpayExceptionV" )
    public String getO2cOrderPartialpayExceptionV() {return this.o2cOrderPartialpayExceptionV; }

    @Value(("${o2c.order.unidentified.exception.v.q}"))
    public String o2cOrderUnidentifiedExceptionV;

    @Bean( name = "o2cOrderUnidentifiedExceptionV" )
    public String getO2cOrderUnidentifiedExceptionV() {return this.o2cOrderUnidentifiedExceptionV; }

    @Value(("${o2c.order.cashoth.exception.v.q}"))
    public String o2cOrderCashothExceptionV;

    @Bean( name = "o2cOrderCashothExceptionV" )
    public String getO2cOrderCashothExceptionV() {return this.o2cOrderCashothExceptionV; }

    @Value(("${o2c.subscription.donut.totals.q}"))
    public String o2cSubscriptionDonutTotals;

    @Bean( name = "o2cSubscriptionDonutTotals" )
    public String getO2cSubscriptionDonutTotals() {return this.o2cSubscriptionDonutTotals; }

    @Value(("${o2c.subscription.cards.q}"))
    public String o2cSubscriptionCards;

    @Bean( name = "o2cSubscriptionCards" )
    public String getO2cSubscriptionCards() {return this.o2cSubscriptionCards; }
}
