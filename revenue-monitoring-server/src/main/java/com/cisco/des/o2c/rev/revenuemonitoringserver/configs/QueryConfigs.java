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

    @Bean( name = "stdArExcQuery" )
    public String getStdArExcQuery() { return this.stdArExcQuery; }

    @Bean( name = "tsvTopSkuExcQuery" )
    public String getTsvTopSkuExcQuery() { return this.tsvTopSkuExcQuery; }

    @Bean( name = "tsvSubSkuExcQuery" )
    public String getTsvSubSkuExcQuery() { return this.tsvSubSkuExcQuery; }

}
