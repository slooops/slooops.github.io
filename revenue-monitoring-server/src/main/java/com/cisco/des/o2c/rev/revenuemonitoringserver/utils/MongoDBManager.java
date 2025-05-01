package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

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

    public List<Map<String, Object>> getOMDetailsData() {
        Query query = new Query();
        query.with(PageRequest.of(0, 20));
        return convertDocumentsToMaps(mongoTemplate.find(query, Document.class, "oplAlertMonitorData"));
    }

    public static List<Map<String, Object>> convertDocumentsToMaps(List<Document> documents) {
        return documents.stream()
                .map(Document::entrySet) // Get entrySet
                .map(entries -> entries.stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)))
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getOMSUmmaryData() {
        Aggregation aggregation = newAggregation(
                group("created_date", "timestamp", "scenario", "data_source")
                        .sum("count").as("total_count"),
                project()
                        .and("_id.created_date").as("created_date")
                        .and("_id.timestamp").as("timestamp")
                        .and("_id.scenario").as("scenario")
                        .and("_id.data_source").as("data_source")
                        .and("total_count").as("total_count")
                        .andExclude("_id"),
                limit(20)
        );
        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, "oplAlertMonitorData", Document.class);
        return convertDocumentsToMaps(results.getMappedResults());
    }
}
