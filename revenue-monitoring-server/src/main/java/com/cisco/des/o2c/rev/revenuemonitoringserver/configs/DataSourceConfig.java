package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.primary.url}")
    private String primaryUrl;

    @Value("${spring.datasource.primary.username}")
    private String primaryUsername;

    @Value("${spring.datasource.primary.password}")
    private String primaryPassword;

    @Value("${spring.datasource.primary.driver-class-name}")
    private String primaryDriverClassName;

    @Value("${spring.datasource.secondary.url}")
    private String secondaryUrl;

    @Value("${spring.datasource.secondary.username}")
    private String secondaryUsername;

    @Value("${spring.datasource.secondary.password}")
    private String secondaryPassword;

    @Value("${spring.datasource.secondary.driver-class-name}")
    private String secondaryDriverClassName;

    @Value("${spring.datasource.postgres.url}")
    private String postgresUrl;

    @Value("${spring.datasource.postgres.username}")
    private String postgresUsername;

    @Value("${spring.datasource.postgres.password}")
    private String postgresPassword;

    @Value("${spring.datasource.postgres.driver-class-name}")
    private String postgresDriverClassName;

    @Bean(name = "primaryDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public DataSource primaryDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(primaryUrl);
        dataSource.setUsername(primaryUsername);
        dataSource.setPassword(primaryPassword);
        dataSource.setDriverClassName(primaryDriverClassName);
        return dataSource;

    }

    @Bean(name = "secondaryDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.secondary")
    public DataSource secondaryDataSource() {
                HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(secondaryUrl);
        dataSource.setUsername(secondaryUsername);
        dataSource.setPassword(secondaryPassword);
        dataSource.setDriverClassName(secondaryDriverClassName);
        return dataSource;
    }

    @Bean(name = "primaryJdbcTemplate")
    public JdbcTemplate primaryJdbcTemplate(DataSource primaryDataSource) {
        return new JdbcTemplate(primaryDataSource);
    }

    @Bean(name = "secondaryJdbcTemplate")
    public JdbcTemplate secondaryJdbcTemplate(DataSource secondaryDataSource) {
        return new JdbcTemplate(secondaryDataSource);
    }

    @Bean(name = "postgresDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.postgres")
    public DataSource postgresDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(postgresUrl);
        dataSource.setUsername(postgresUsername);
        dataSource.setPassword(postgresPassword);
        dataSource.setDriverClassName(postgresDriverClassName);
        return dataSource;
    }

    @Bean(name = "postgresJdbcTemplate")
    public JdbcTemplate postgresJdbcTemplate(DataSource postgresDataSource) {
        return new JdbcTemplate(postgresDataSource);
    }
}
