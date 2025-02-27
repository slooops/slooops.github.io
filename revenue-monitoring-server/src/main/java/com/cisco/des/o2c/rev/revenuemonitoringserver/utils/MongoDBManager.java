//package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;
//
//import org.bson.Document;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Qualifier;
//import org.springframework.data.mongodb.core.MongoTemplate;
//import org.springframework.jdbc.core.JdbcTemplate;
//import org.springframework.stereotype.Component;
//
//import java.util.List;
//import java.util.Map;
//import java.util.stream.Collectors;
//
//@Component
//public class MongoDBManager {
//
//    private final MongoTemplate mongoTemplate;
//
//    @Autowired
//    public MongoDBManager(MongoTemplate mongoTemplate) {
//        this.mongoTemplate = mongoTemplate;
//    }
//
//    public List<Map<String, Object>> getAllData() {
//        return convertDocumentsToMaps(mongoTemplate.findAll(Document.class, "users")); // Fetch all documents from "users" collection
//    }
//
//    public static List<Map<String, Object>> convertDocumentsToMaps(List<Document> documents) {
//        return documents.stream()
//                .map(Document::entrySet) // Get entrySet
//                .map(entries -> entries.stream()
//                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)))
//                .collect(Collectors.toList());
//    }
//}
