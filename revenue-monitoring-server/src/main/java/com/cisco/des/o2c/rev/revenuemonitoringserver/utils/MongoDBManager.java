package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class MongoDBManager {

    private final MongoTemplate mongoTemplate;

    @Autowired
    public MongoDBManager(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<Map<String, Object>> getAllData(int page, int size) {
        Query query = new Query();
        query.with(PageRequest.of(page, size));
        return convertDocumentsToMaps(mongoTemplate.find(query, Document.class, "oplExceptionNotificationLog"));
    }

    public static List<Map<String, Object>> convertDocumentsToMaps(List<Document> documents) {
        return documents.stream()
                .map(Document::entrySet) // Get entrySet
                .map(entries -> entries.stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)))
                .collect(Collectors.toList());
    }
}
