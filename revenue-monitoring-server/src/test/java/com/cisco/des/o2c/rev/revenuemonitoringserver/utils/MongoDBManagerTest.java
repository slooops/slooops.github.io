package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.mongodb.client.result.UpdateResult;
import org.bson.BsonValue;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MongoDBManagerTest {

    @Mock MongoTemplate mongoTemplate;
    MongoDBManager manager;

    @BeforeEach
    void setUp() {
        manager = new MongoDBManager(mongoTemplate);
    }

    // ── getAllData ─────────────────────────────────────────────

    @Test
    void getAllDataReturnsConvertedDocs() {
        Document doc = new Document("name", "Alice").append("age", 30);
        when(mongoTemplate.find(any(Query.class), eq(Document.class), eq("coll")))
                .thenReturn(List.of(doc));

        List<Map<String, Object>> result = manager.getAllData("coll");
        assertEquals(1, result.size());
        assertEquals("Alice", result.get(0).get("name"));
        assertEquals(30, result.get(0).get("age"));
    }

    @Test
    void getAllDataEmptyCollection() {
        when(mongoTemplate.find(any(Query.class), eq(Document.class), eq("coll")))
                .thenReturn(List.of());
        assertTrue(manager.getAllData("coll").isEmpty());
    }

    // ── getWIPSData ───────────────────────────────────────────

    @Test
    void getWIPSDataDelegatesToFind() {
        when(mongoTemplate.find(any(Query.class), eq(Document.class), eq("wips")))
                .thenReturn(List.of());
        assertNotNull(manager.getWIPSData("wips"));
    }

    // ── getFilteredData ───────────────────────────────────────

    @Test
    void getFilteredDataWithCriteria() {
        Document doc = new Document("scenario", "S1");
        when(mongoTemplate.find(any(Query.class), eq(Document.class), eq("coll")))
                .thenReturn(List.of(doc));

        var result = manager.getFilteredData("coll", "2024-01", "S1");
        assertEquals(1, result.size());
    }

    // ── getWipsFilteredData ───────────────────────────────────

    @Test
    void getWipsFilteredData() {
        when(mongoTemplate.find(any(Query.class), eq(Document.class), eq("wips")))
                .thenReturn(List.of());
        assertTrue(manager.getWipsFilteredData("wips", "ts", "sc").isEmpty());
    }

    // ── updateSummaryData ─────────────────────────────────────

    @Test
    void updateSummaryDataInProgress() {
        UpdateResult ur = mock(UpdateResult.class);
        when(ur.getModifiedCount()).thenReturn(2L);
        when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq("coll")))
                .thenReturn(ur);

        long count = manager.updateSummaryData("coll", "ts", "sc", "user", "cmt", "In Progress");
        assertEquals(2L, count);
    }

    @Test
    void updateSummaryDataClosed() {
        UpdateResult ur = mock(UpdateResult.class);
        when(ur.getModifiedCount()).thenReturn(1L);
        when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq("coll")))
                .thenReturn(ur);

        long count = manager.updateSummaryData("coll", "ts", "sc", "user", "cmt", "Closed");
        assertEquals(1L, count);
    }

    @Test
    void updateSummaryDataOtherStatus() {
        UpdateResult ur = mock(UpdateResult.class);
        when(ur.getModifiedCount()).thenReturn(0L);
        when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq("coll")))
                .thenReturn(ur);

        long count = manager.updateSummaryData("coll", "ts", "sc", "user", "cmt", "New");
        assertEquals(0L, count);
    }

    // ── updateWipsSummaryData ─────────────────────────────────

    @Test
    void updateWipsSummaryData() {
        UpdateResult ur = mock(UpdateResult.class);
        when(ur.getModifiedCount()).thenReturn(3L);
        when(mongoTemplate.updateMulti(any(Query.class), any(Update.class), eq("wips")))
                .thenReturn(ur);

        assertEquals(3L, manager.updateWipsSummaryData("wips", "ts", "sc", "u", "c", "In Progress"));
    }

    // ── convertDocumentsToMaps (static) ───────────────────────

    @Test
    void convertNullReturnsEmptyList() {
        assertTrue(MongoDBManager.convertDocumentsToMaps(null).isEmpty());
    }

    @Test
    void convertEmptyListReturnsEmptyList() {
        assertTrue(MongoDBManager.convertDocumentsToMaps(List.of()).isEmpty());
    }

    @Test
    void convertHandlesNullDocInList() {
        List<Document> docs = new ArrayList<>();
        docs.add(null);
        List<Map<String, Object>> result = MongoDBManager.convertDocumentsToMaps(docs);
        assertEquals(1, result.size());
        assertTrue(result.get(0).isEmpty());
    }

    @Test
    void convertPreservesKeyOrder() {
        Document doc = new Document();
        doc.append("z", 1);
        doc.append("a", 2);
        List<Map<String, Object>> result = MongoDBManager.convertDocumentsToMaps(List.of(doc));
        List<String> keys = new ArrayList<>(result.get(0).keySet());
        assertEquals("z", keys.get(0));
        assertEquals("a", keys.get(1));
    }
}
