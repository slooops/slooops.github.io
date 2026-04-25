package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class CommonTest {
    Common common = new Common();

    // ── renameKey ──────────────────────────────────────────────

    @Test
    void renameKeyReplaces() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("Old", "val");
        common.renameKey(m, "Old", "New");
        assertEquals("val", m.get("New"));
        assertFalse(m.containsKey("Old"));
    }

    @Test
    void renameKeyPreservesOrder() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("A", 1);
        m.put("B", 2);
        m.put("C", 3);
        common.renameKey(m, "B", "B2");
        assertEquals(List.of("A", "B2", "C"), new ArrayList<>(m.keySet()));
    }

    @Test
    void renameKeyNullValueBecomesEmptyString() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("K", null);
        common.renameKey(m, "K", "K2");
        assertEquals("", m.get("K2"));
    }

    @Test
    void renameKeyNoMatchLeavesMapIntact() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("A", 1);
        common.renameKey(m, "Missing", "X");
        assertEquals(1, m.size());
        assertTrue(m.containsKey("A"));
    }

    // ── formatDateColumns ─────────────────────────────────────

    @Test
    void formatDateColumnsIso() {
        Map<String, Object> data = new HashMap<>();
        data.put("dt", "2024-03-15");
        common.formatDateColumns(data, new String[]{"dt"});
        assertEquals("03/15/2024", data.get("dt"));
    }

    @Test
    void formatDateColumnsSlashFormat() {
        Map<String, Object> data = new HashMap<>();
        data.put("dt", "03/15/2024");
        common.formatDateColumns(data, new String[]{"dt"});
        assertEquals("03/15/2024", data.get("dt"));
    }

    @Test
    void formatDateColumns14DigitTimestamp() {
        Map<String, Object> data = new HashMap<>();
        data.put("dt", "20240315120000");
        common.formatDateColumns(data, new String[]{"dt"});
        assertEquals("03/15/2024", data.get("dt"));
    }

    @Test
    void formatDateColumnsNullValueBecomesEmpty() {
        Map<String, Object> data = new HashMap<>();
        data.put("dt", null);
        common.formatDateColumns(data, new String[]{"dt"});
        assertEquals("", data.get("dt"));
    }

    @Test
    void formatDateColumnsJavaUtilDateString() {
        Map<String, Object> data = new HashMap<>();
        data.put("dt", "Fri Mar 15 00:00:00 PST 2024");
        common.formatDateColumns(data, new String[]{"dt"});
        assertEquals("03/15/2024", data.get("dt"));
    }

    @Test
    void formatDateColumnsIsoWithTimeSuffix() {
        Map<String, Object> data = new HashMap<>();
        data.put("dt", "2024-03-15 10:30:00.0");
        common.formatDateColumns(data, new String[]{"dt"});
        assertEquals("03/15/2024", data.get("dt"));
    }

    // ── formatEmptyAmounts ────────────────────────────────────

    @Test
    void formatEmptyAmountsReplaceNull() {
        Map<String, Object> data = new HashMap<>();
        data.put("AMT", null);
        data.put("TOTAL", 100);
        common.formatEmptyAmounts(data, new String[]{"AMT", "TOTAL"});
        assertEquals("-", data.get("AMT"));
        assertEquals(100, data.get("TOTAL"));
    }

    // ── calculateAging ────────────────────────────────────────

    @Test
    void calculateAgingIso() {
        String twoDaysAgo = LocalDate.now().minusDays(2).toString();
        assertEquals("2 days", common.calculateAging(twoDaysAgo));
    }

    @Test
    void calculateAgingSlashFormat() {
        String fiveDaysAgo = LocalDate.now().minusDays(5)
                .format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        assertEquals("5 days", common.calculateAging(fiveDaysAgo));
    }

    @Test
    void calculateAgingNullReturnsZero() {
        assertEquals("0 days", common.calculateAging(null));
    }

    @Test
    void calculateAgingNonStringReturnsZero() {
        assertEquals("0 days", common.calculateAging(12345));
    }

    @Test
    void calculateAgingUnparsableReturnsZero() {
        assertEquals("0 days", common.calculateAging("not-a-date"));
    }

    // ── parseIsoDate ──────────────────────────────────────────

    @Test
    void parseIsoDateStandard() {
        assertEquals(LocalDate.of(2024, 7, 3), common.parseIsoDate("2024-07-03"));
    }

    @Test
    void parseIsoDate14Digit() {
        assertEquals(LocalDate.of(2025, 7, 3), common.parseIsoDate("20250703085719"));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {""})
    void parseIsoDateNullOrEmptyReturnsNull(String input) {
        assertNull(common.parseIsoDate(input));
    }

    @Test
    void parseIsoDateSlashFormat() {
        assertEquals(LocalDate.of(2025, 7, 3), common.parseIsoDate("07/03/2025"));
    }

    // ── transformForActiveIncidentsSummary ─────────────────────

    @Test
    void transformGroupsByTrackAndAddsSubtotals() {
        List<Map<String, Object>> data = new ArrayList<>();
        data.add(Map.of("TRACK", "Rev", "ISSUE_STATUS", "Open", "IT_APPROVAL", "Y",
                "APPROVED_ON", "2024-01-15", "ISSUE_DESCRIPTION", "Desc1"));
        data.add(Map.of("TRACK", "Rev", "ISSUE_STATUS", "Closed", "IT_APPROVAL", "N",
                "APPROVED_ON", "null", "ISSUE_DESCRIPTION", "Desc2"));
        data.add(Map.of("TRACK", "GTC", "ISSUE_STATUS", "Open", "IT_APPROVAL", "Y",
                "APPROVED_ON", "2024-02-10", "ISSUE_DESCRIPTION", "Desc3"));

        List<Map<String, Object>> result = common.transformForActiveIncidentsSummary(data);

        assertFalse(result.isEmpty());
        Map<String, Object> total = result.get(result.size() - 1);
        assertEquals("Total", total.get("Track"));
        assertEquals(3, total.get("Count"));
    }

    @Test
    void transformEmptyListReturnsOnlyTotal() {
        List<Map<String, Object>> result = common.transformForActiveIncidentsSummary(new ArrayList<>());
        assertEquals(1, result.size());
        assertEquals("Total", result.get(0).get("Track"));
        assertEquals(0, result.get(0).get("Count"));
    }
}
