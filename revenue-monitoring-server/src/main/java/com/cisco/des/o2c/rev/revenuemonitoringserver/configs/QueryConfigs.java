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
}
