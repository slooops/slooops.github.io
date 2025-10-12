package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class CommonTest {
    Common common = new Common();

    @Test
    void renameKeyReplaces() {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("Old", "val");
        common.renameKey(m, "Old", "New");
        assertEquals("val", m.get("New"));
        assertFalse(m.containsKey("Old"));
    }

    @Test
    void calculateAgingIso() {
        String today = LocalDate.now().minusDays(2).toString();
        String aging = common.calculateAging(today);
        assertTrue(aging.contains("2"));
    }
}
