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

    @Value("${update.order.status.q}")
    public String updateOrderStatus;

    @Value("${order.status.summary.q}")
    public String orderStatusSummary;

    @Value("${order.status.download.q}")
    public String orderStatusDownload;

    @Value(("${order.status.rev.summary.q}"))
    public String orderStatusRevSummary;


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

    @Bean( name = "orderStatusSummary" )
    public String getOrderStatusSummary() {return this.orderStatusSummary; }
    @Bean( name = "orderStatusDownload" )
    public String getOrderStatusDownload() {return this.orderStatusDownload; }
    @Bean( name= "updateOrderStatus" )
    public String getUpdateOrderStatus() { return this.updateOrderStatus; }
    @Bean( name = "orderStatusRevSummary" )
    public String getOrderStatusRevSummary() {return this.orderStatusRevSummary; }
}
