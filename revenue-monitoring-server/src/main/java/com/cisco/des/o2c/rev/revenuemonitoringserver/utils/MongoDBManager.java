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

    @Autowired
    public MongoDBManager(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<Map<String, Object>> getAllData(String collection) {
        Query query = new Query();
        return convertDocumentsToMaps(mongoTemplate.find(query, Document.class, collection));
    }

    public List<Map<String, Object>> getFilteredData(String collection, String timestamp, String scenario) {
        Query query = new Query();
        query.addCriteria(Criteria.where("timestamp").is(timestamp).and("scenario").is(scenario));
        return convertDocumentsToMaps(mongoTemplate.find(query, Document.class, collection));
    }

    public long updateSummaryData(String collection, String timestamp, String scenario, String assignedTo, String comments) {
        Query query = new Query();
        query.addCriteria(Criteria.where("timestamp").is(timestamp).and("scenario").is(scenario));
        Update update = new Update().set("assigned_to", assignedTo).set("comments", comments);
        UpdateResult result = mongoTemplate.updateFirst(query, update, collection);
        return result.getModifiedCount();
    }

    public List<Map<String, Object>> getOmControlTowerSummary() {
        Query query = new Query();

        query.with(PageRequest.of(0, 20));
        List<Document> documents = mongoTemplate.find(query, Document.class, "om_control_tower_attribution_summary_view");

        List<Map<String, Object>> result = new ArrayList<>();
        for (Document doc : documents) {
            result.add(doc);
        }
        return result;
    }

    public static List<Map<String, Object>> convertDocumentsToMaps(List<Document> documents) {
        return documents.stream()
                .map(Document::entrySet)
                .map(entries -> entries.stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (v1, v2) -> v1, // merge function (not used here)
                                LinkedHashMap::new // preserves order
                        )))
                .collect(Collectors.toList());
    }

}
