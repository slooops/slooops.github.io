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

    @Value(("${cms.unposted.details.query}"))
    public String cmsUnpostedDetailsQuery;

    @Value(("${cms.receipt.error.summary}"))
    public String cmsReceiptErrorSummaryQuery;

    @Value(("${cms.receipt.error.details.query}"))
    public String cmsReceiptErrorDetailsQuery;

    @Value(("${cms.job.run.status.query}"))
    public String cmsJobRunStatusQuery;

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

    @Bean( name = "stdArExcQuery" )
    public String getStdArExcQuery() { return this.stdArExcQuery; }

    @Bean( name = "tsvTopSkuExcQuery" )
    public String getTsvTopSkuExcQuery() { return this.tsvTopSkuExcQuery; }

    @Bean( name = "tsvSubSkuExcQuery" )
    public String getTsvSubSkuExcQuery() { return this.tsvSubSkuExcQuery; }

    @Bean( name = "revenueControlsQuery")
    public String getRevenueControls() { return this.revenueControlsQuery; }

    // @Bean( name = "periodCloseInvoiceStats")
    // public String getPeriodCloseInvoiceStats() { return this.periodCloseInvoiceStats; }

    // @Bean( name = "periodCloseInterfaceLoadPreclose")
    // public String getPeriodCloseInterfaceLoad() { return this.periodCloseInterfaceLoadPreclose; }
    
    @Bean( name = "closeStartEndTime")
    public String getCloseStartEndTime() { return this.closeStartEndTime; }

    @Bean( name = "closeVolume")
    public String getCloseVolume() { return this.closeVolume; }

    @Bean( name = "closeMEStatus")
    public String getCloseMEStatus() { return this.closeMEStatus; }

    @Bean( name = "closeInvStats")
    public String getCloseInvStats() { return this.closeInvStats; }

    @Bean( name = "closeInterfaceLoad")
    public String getCloseInterfaceLoad() { return this.closeInterfaceLoad; }

    @Bean( name = "closeQECashCollected")
    public String getCloseQECashCollected() { return this.closeQECashCollected; }

    @Bean( name = "dashboardComments" )
    public String getDashboardComments() { return this.dashboardComments; }

    @Bean( name = "updateComments" )
    public String getUpdateComments() { return this.updateComments; }

    @Bean( name = "errorSummary" )
    public String getErrorSummary() { return this.errorSummary; }

    @Bean( name = "allErrorDetails" )
    public String getAllErrorDetails() { return this.allErrorDetails; }

    @Bean( name = "errorDetails" )
    public String getErrorDetails() { return this.errorDetails; }

    @Bean( name = "orderStatus" )
    public String getOrderStatus() {return this.orderStatus; }


    @Bean( name = "invoiceTrackerHeader" )
    public String getInvoiceTrackerHeader() {return this.invoiceTrackerHeader; }


    @Bean( name = "invoiceTrackerLine" )
    public String getInvoiceTrackerline() {return this.invoiceTrackerLine; }

    @Bean( name = "wd0ArMidCloseStatusQuery")
    public String getWd0ArMidCloseStatusQuery() { return this.wd0ArMidCloseStatusQuery; }

    @Bean( name = "wd0ArMidCloseHeaderDataQuery")
    public String getWd0ArMidCloseHeaderDataQuery() { return this.wd0ArMidCloseHeaderDataQuery; }

    @Bean(name = "wd0HistoricalDataQuery")
    public String getWd0HistoricalDataQuery(){ return this.wd0HistoricalDataQuery; }
    @Bean( name = "orderStatusSummary" )
    public String getOrderStatusSummary() {return this.orderStatusSummary; }
    @Bean( name = "orderStatusDownload" )
    public String getOrderStatusDownload() {return this.orderStatusDownload; }
    @Bean( name= "updateOrderStatus" )
    public String getUpdateOrderStatus() { return this.updateOrderStatus; }

    @Bean( name = "kafkaError" )
    public String getKafkaError() {
        return this.kafkaError;
    }

    @Bean( name = "kafkaInbound" )
    public String getKafkaInbound() {
        return this.kafkaInbound;
    }

    @Bean( name = "arTrxnMissing" )
    public String getArTrxnMissing() {
        return this.arTrxnMissing;
    }

    @Bean( name = "accrualsProcessingErrors" )
    public String getAccrualsProcessingErrors() {
        return this.accrualsProcessingErrors;
    }

    @Bean( name = "accrualsDistributionErrors" )
    public String getAccrualsDistributionErrors() {
        return this.accrualsDistributionErrors;
    }

    @Bean( name = "accrualsSummarizationErrors" )
    public String getAccrualsSummarizationErrors() {
        return this.accrualsSummarizationErrors;
    }

    @Bean( name = "kafkaPublishToDownstream" )
    public String getKafkaPublishToDownstream() {
        return this.kafkaPublishToDownstream;
    }

    @Bean( name = "errorDistributionSummarization" )
    public String getErrorDistributionSummarization() {
        return this.errorDistributionSummarization;
    }

    @Bean( name = "orderStatusRevSummary" )
    public String getOrderStatusRevSummary() {return this.orderStatusRevSummary; }

    @Bean( name = "personaAccessRoles")
    public String getPersonaAccessRoles() {return this.personaAccessRoles;}
    @Bean( name = "wd0Regression" )
    public String getWd0Regression() {return this.wd0Regression; }

    @Bean( name = "wd0CurrentMonth" )
    public String getWd0CurrentMonth() {return this.wd0CurrentMonth; }
    @Bean( name = "deleteSelectedDeals" )
    public String getDeleteSelectedDeals() {return this.deleteSelectedDeals; }
    @Bean( name = "cloBulkUpdate" )
    public String getCloBulkUpdate() {return this.cloBulkUpdate; }
    @Bean( name = "invoiceEligibleUpdate" )
    public String getInvoiceEligibleUpdate() {return this.invoiceEligibleUpdate; }
    @Bean( name = "cloCommentUpdate" )
    public String getCloCommentUpdate() {return this.cloCommentUpdate; }

    @Bean( name = "cmsUnpostedSummaryQuery")
    public String getCmsUnpostedSummaryQuery(){ return this.cmsUnpostedSummaryQuery; }

    @Bean( name = "cmsUnpostedDetailsQuery")
    public String getCmsUnpostedDetailsQuery(){ return this.cmsUnpostedDetailsQuery; }

    @Bean( name = "cmsReceiptErrorSummaryQuery")
    public String getCmsReceiptErrorSummaryQuery(){ return this.cmsReceiptErrorSummaryQuery; }

    @Bean( name = "cmsReceiptErrorDetailsQuery")
    public String getCmsReceiptErrorDetailsQuery(){ return this.cmsReceiptErrorDetailsQuery; }

    @Bean( name = "cmsJobRunStatusQuery")
    public String getCmsJobRunStatusQuery(){ return this.cmsJobRunStatusQuery; }

    @Bean( name = "cmsCtmStatusQuery")
    public String getCmsCtmStatusQuery(){ return this.cmsCtmStatusQuery; }

    @Bean( name = "cmsCtmDetailsQuery")
    public String getCmsCtmDetailsQuery(){ return this.cmsCtmDetailsQuery; }

    @Bean( name = "cmsBoomiStatusQuery")
    public String getCmsBoomiStatusQuery(){ return this.cmsBoomiStatusQuery; }

    @Bean( name = "cmsBoomiDetailsQuery")
    public String getCmsBoomiDetailsQuery(){ return this.cmsBoomiDetailsQuery; }

    @Bean( name = "cmsExtractCountQuery")
    public String getCmsExtractCountQuery(){ return this.cmsExtractCountQuery; }

    @Bean( name = "cmsExtractDetailsQuery")
    public String getCmsExtractDetailsQuery(){ return this.cmsExtractDetailsQuery; }

    @Bean( name = "cmsLatestRequestStatusQuery")
    public String getCmsLatestRequestStatusQuery(){ return this.cmsLatestRequestStatusQuery; }

    @Bean( name = "cmsCollectionsErrorSummaryQuery")
    public String getCmsCollectionsErrorSummaryQuery(){ return this.cmsCollectionsErrorSummaryQuery; }

    @Bean ( name = "cmsInvoicePdfExtractErrorQuery")
    public String getCmsInvoicePdfExtractErrorQuery(){ return this.cmsInvoicePdfExtractErrorQuery; }

    @Bean( name = "cmsInvoiceExtractErrorQuery")
    public String getCmsInvoiceExtractErrorQuery(){ return this.cmsInvoiceExtractErrorQuery; }

    @Bean( name = "cmsCustomerExtractErrorQuery")
    public String getCmsCustomerExtractErrorQuery(){ return this.cmsCustomerExtractErrorQuery; }

    @Bean( name = "cmsAlternatePayerErrorQuery")
    public String getCmsAlternatePayerErrorQuery(){ return this.cmsAlternatePayerErrorQuery; }

    @Bean( name = "cmsSalesInvoiceHeaderExtractErrorQuery")
    public String getCmsSalesInvoiceHeaderExtractErrorQuery(){ return this.cmsSalesInvoiceHeaderExtractErrorQuery; }

    @Bean( name = "cmsCustomerContactsErrorQuery")
    public String getCmsCustomerContactsErrorQuery(){ return this.cmsCustomerContactsErrorQuery; }

    @Bean( name = "cmsSalesInvoiceItemExtractErrorQuery")
    public String getCmsSalesInvoiceItemExtractErrorQuery(){ return this.cmsSalesInvoiceItemExtractErrorQuery; }

}
