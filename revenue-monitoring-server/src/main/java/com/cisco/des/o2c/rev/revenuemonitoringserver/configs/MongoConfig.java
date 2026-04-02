package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;

import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

@Configuration
public class MongoConfig {

    @Value("${spring.data.mongodb.primary.uri}")
    private String primaryUri;

    @Value("${spring.data.mongodb.primary.database}")
    private String primaryDatabase;

//   @Value("${spring.data.mongodb.secondary.uri}")
//   private String secondaryUri;
//
//   @Value("${spring.data.mongodb.secondary.database}")
//   private String secondaryDatabase;

    @Primary
    @Bean(name = "primaryMongoDatabaseFactory")
    public MongoDatabaseFactory primaryMongoDatabaseFactory() {
        return new SimpleMongoClientDatabaseFactory(
            MongoClients.create(primaryUri),
            primaryDatabase
        );
    }

//   @Bean(name = "secondaryMongoDatabaseFactory")
//   public MongoDatabaseFactory secondaryMongoDatabaseFactory() {
//       return new SimpleMongoClientDatabaseFactory(
//           MongoClients.create(secondaryUri),
//           secondaryDatabase
//       );
//   }

    @Primary
    @Bean(name = "primaryMongoTemplate")
    public MongoTemplate primaryMongoTemplate(@Qualifier("primaryMongoDatabaseFactory") MongoDatabaseFactory primaryMongoDatabaseFactory) {
        return new MongoTemplate(primaryMongoDatabaseFactory);
    }

//   @Bean(name = "secondaryMongoTemplate")
//   public MongoTemplate secondaryMongoTemplate(@Qualifier("secondaryMongoDatabaseFactory") MongoDatabaseFactory secondaryMongoDatabaseFactory) {
//       return new MongoTemplate(secondaryMongoDatabaseFactory);
//   }
}
