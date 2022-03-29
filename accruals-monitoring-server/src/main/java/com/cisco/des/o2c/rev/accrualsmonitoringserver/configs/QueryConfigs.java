package com.cisco.des.o2c.rev.accrualsmonitoringserver.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:queries.properties")
public class QueryConfigs { // TODO

    @Value("${cab.query}")
    public String cabQuery;

    @Value("${cab.query.page}")
    public String cabQueryPage;

    @Value("${cab.details.query}")
    public String cabDetailsQuery;

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

}
