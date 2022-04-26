package com.cisco.des.o2c.rev.accrualsmonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:queries.properties")
public class QueryConfigs { // TODO

    @Value("${schema}")
    public String schema;

    @Value("${catalog.name}")
    public String catalogName;

    @Value("${cab.query}")
    public String cabQuery;

    @Value("${cab.query.page}")
    public String cabQueryPage;

    @Value("${cab.details.query}")
    public String cabDetailsQuery;

    @Value("${daily.monitoring.query}")
    public String dailyQuery;

    @Value("${monitoring.details.query}")
    public String monitoringDetailsQuery;

    @Value("${last.run.query}")
    public String lastRunQuery;

    @Bean( name = "schema" )
    public String getSchema() { return this.schema; }

    @Bean( name = "catalogName" )
    public String getCatalogName() { return this.catalogName; }

    @Bean( name = "cabQuery" )
    public String getCabQuery() {
        return this.cabQuery;
    }

    @Bean( name = "cabQueryPage" )
    public String getCabQueryPage() { return this.cabQueryPage; }

    @Bean ( name = "cabDetailsQuery" )
    public String getCabDetailsQuery() {
        return this.cabDetailsQuery;
    }

    @Bean( name = "dailyQuery" )
    public String getDailyQuery() { return this.dailyQuery; }

    @Bean( name = "monitoringDetailsQuery" )
    public String getMonitoringDetailsQuery() { return this.monitoringDetailsQuery; }

    @Bean( name = "lastRunQuery" )
    public String getLastRunQuery() { return this.lastRunQuery; }

}
