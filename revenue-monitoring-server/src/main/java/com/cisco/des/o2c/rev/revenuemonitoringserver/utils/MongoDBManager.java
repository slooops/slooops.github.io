package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class MongoDBManager {

    private final MongoTemplate mongoTemplate;
    private final MongoTemplate secondaryMongoTemplate;

    @Autowired
    public MongoDBManager(@Qualifier("primaryMongoTemplate") MongoTemplate mongoTemplate, @Qualifier("secondaryMongoTemplate") MongoTemplate secondaryMongoTemplate) {
        this.mongoTemplate = mongoTemplate;
        this.secondaryMongoTemplate = secondaryMongoTemplate;
    }

    public List<Map<String, Object>> getAllData(String collection) {
        Query query = new Query();
        return convertDocumentsToMaps(mongoTemplate.find(query, Document.class, collection));
    }

    public List<Map<String, Object>> getWIPSData(String collection) {
        Query query = new Query();
        return convertDocumentsToMaps(secondaryMongoTemplate.find(query, Document.class, collection));
    }

    public List<Map<String, Object>> getFilteredData(String collection, String timestamp, String scenario) {
        Query query = new Query();
        query.addCriteria(Criteria.where("timestamp").is(timestamp).and("scenario").is(scenario));
        return convertDocumentsToMaps(mongoTemplate.find(query, Document.class, collection));
    }

    public List<Map<String, Object>> getWipsFilteredData(String collection, String timestamp, String scenario) {
        Query query = new Query();
        query.addCriteria(Criteria.where("timestamp").is(timestamp).and("scenario").is(scenario));
        return convertDocumentsToMaps(secondaryMongoTemplate.find(query, Document.class, collection));
    }

    public long updateWipsSummaryData(String collection, String timestamp, String scenario, String assignedTo, String comments, String status) {
        Query query = new Query();
        query.addCriteria(Criteria.where("timestamp").is(timestamp).and("scenario").is(scenario));
        Update update = new Update()
                .set("assigned_to", assignedTo)
                .set("comments", comments)
                .set("status", status);

        if ("In Progress".equals(status)) {
            update.set("assigned_date", new Date());
        } else if ("Closed".equals(status)) {
            update.set("closed_date", new Date());
        }
        UpdateResult result = secondaryMongoTemplate.updateMulti(query, update, collection);
        return result.getModifiedCount();
    }

    public long updateSummaryData(String collection, String timestamp, String scenario, String assignedTo, String comments, String status) {
        Query query = new Query();
        query.addCriteria(Criteria.where("timestamp").is(timestamp).and("scenario").is(scenario));
        Update update = new Update()
                .set("assigned_to", assignedTo)
                .set("comments", comments)
                .set("status", status);

        if ("In Progress".equals(status)) {
            update.set("assigned_date", new Date());
        } else if ("Closed".equals(status)) {
            update.set("closed_date", new Date());
        }
        UpdateResult result = mongoTemplate.updateMulti(query, update, collection);
        return result.getModifiedCount();
    }

    public static List<Map<String, Object>> convertDocumentsToMaps(List<Document> documents) {
        if (documents == null) {
            return new ArrayList<>();
        }

        return documents.stream()
                .map(doc -> {
                    if (doc == null) {
                        return new LinkedHashMap<String, Object>();
                    }

                    LinkedHashMap<String, Object> map = new LinkedHashMap<>();
                    for (Map.Entry<String, Object> entry : doc.entrySet()) {
                        map.put(entry.getKey(), entry.getValue());
                    }
                    return map;
                })
                .collect(Collectors.toList());
    }

}
