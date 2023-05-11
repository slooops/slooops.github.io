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
    @Value("${period-quarter.q}")
    public String periodAndQuarter;
    
    @Value("${p_start-end.time.q}")
    public String pcloseStartEndTime;
    
    @Value("${p_volume.q}")
    public String pcloseVolume;

    @Value("${p_me.status.q}")
    public String pcloseMEStatus;

    @Value("${p_inv.stats.q}")
    public String pcloseInvStats;

    @Value("${p_interface.load.q}")
    public String pcloseInterfaceLoad;

    @Value("${p.qe.cash.collected.q}")
    public String pcloseQECashCollected;

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

    @Bean( name = "periodAndQuarter")
    public String getPeriodAndQuarter() { return this.periodAndQuarter; }
    
    @Bean( name = "pcloseStartEndTime")
    public String getPcloseStartEndTime() { return this.pcloseStartEndTime; }

    @Bean( name = "pcloseVolume")
    public String getPcloseVolume() { return this.pcloseVolume; }

    @Bean( name = "pcloseMEStatus")
    public String getPcloseMEStatus() { return this.pcloseMEStatus; }

    @Bean( name = "pcloseInvStats")
    public String getPcloseInvStats() { return this.pcloseInvStats; }

    @Bean( name = "pcloseInterfaceLoad")
    public String getPcloseInterfaceLoad() { return this.pcloseInterfaceLoad; }

    @Bean( name = "pcloseQECashCollected")
    public String getPcloseQECashCollected() { return this.pcloseQECashCollected; }
}
