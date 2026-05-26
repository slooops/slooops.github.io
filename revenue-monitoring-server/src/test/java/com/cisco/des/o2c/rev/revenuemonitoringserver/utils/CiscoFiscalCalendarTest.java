package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.DayOfWeek;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class CiscoFiscalCalendarTest {

    @Test
    void lastSaturdayInJuly_2026() {
        LocalDate result = CiscoFiscalCalendar.lastSaturdayInJuly(2026);
        assertEquals(DayOfWeek.SATURDAY, result.getDayOfWeek());
        assertEquals(7, result.getMonthValue());
        assertEquals(2026, result.getYear());
        assertEquals(LocalDate.of(2026, 7, 25), result);
    }

    @Test
    void lastSaturdayInJuly_2025() {
        LocalDate result = CiscoFiscalCalendar.lastSaturdayInJuly(2025);
        assertEquals(DayOfWeek.SATURDAY, result.getDayOfWeek());
        assertEquals(7, result.getMonthValue());
        assertEquals(LocalDate.of(2025, 7, 26), result);
    }

    @Test
    void fyEnd_equalsLastSaturdayInJuly() {
        for (int fy = 2024; fy <= 2030; fy++) {
            assertEquals(CiscoFiscalCalendar.lastSaturdayInJuly(fy),
                    CiscoFiscalCalendar.fyEnd(fy));
        }
    }

    @Test
    void fyStart_isDayAfterPreviousFyEnd() {
        for (int fy = 2024; fy <= 2030; fy++) {
            LocalDate expectedStart = CiscoFiscalCalendar.fyEnd(fy - 1).plusDays(1);
            assertEquals(expectedStart, CiscoFiscalCalendar.fyStart(fy));
        }
    }

    @Test
    void fyStart_isSunday() {
        for (int fy = 2024; fy <= 2030; fy++) {
            assertEquals(DayOfWeek.SUNDAY, CiscoFiscalCalendar.fyStart(fy).getDayOfWeek());
        }
    }

    @Test
    void is53WeekYear_knownCases() {
        // FY2021 and FY2027 are 53-week years
        assertTrue(CiscoFiscalCalendar.is53WeekYear(2021));
        assertTrue(CiscoFiscalCalendar.is53WeekYear(2027));
        // FY2025, FY2026 should be 52 weeks
        assertFalse(CiscoFiscalCalendar.is53WeekYear(2025));
        assertFalse(CiscoFiscalCalendar.is53WeekYear(2026));
    }

    @Test
    void periodEndDates_returns12Entries() {
        LocalDate[] periods = CiscoFiscalCalendar.periodEndDates(2026);
        assertEquals(12, periods.length);
    }

    @Test
    void periodEndDates_allSaturdays() {
        LocalDate[] periods = CiscoFiscalCalendar.periodEndDates(2026);
        for (LocalDate p : periods) {
            assertEquals(DayOfWeek.SATURDAY, p.getDayOfWeek(),
                    "Period end " + p + " should be a Saturday");
        }
    }

    @Test
    void periodEndDates_lastEqualsFyEnd() {
        for (int fy = 2024; fy <= 2030; fy++) {
            LocalDate[] periods = CiscoFiscalCalendar.periodEndDates(fy);
            assertEquals(CiscoFiscalCalendar.fyEnd(fy), periods[11],
                    "P12 end must equal FY end for FY" + fy);
        }
    }

    @Test
    void periodEndDates_chronologicalOrder() {
        LocalDate[] periods = CiscoFiscalCalendar.periodEndDates(2026);
        for (int i = 1; i < periods.length; i++) {
            assertTrue(periods[i].isAfter(periods[i - 1]),
                    "Period " + (i + 1) + " must be after period " + i);
        }
    }

    @Test
    void periodEndDates_445Pattern_standard() {
        // Standard year: 4-4-5 for each quarter
        LocalDate[] periods = CiscoFiscalCalendar.periodEndDates(2026);
        LocalDate anchor = CiscoFiscalCalendar.fyEnd(2025);
        // Q1: 4-4-5
        assertEquals(anchor.plusWeeks(4), periods[0]);
        assertEquals(anchor.plusWeeks(8), periods[1]);
        assertEquals(anchor.plusWeeks(13), periods[2]);
    }

    @Test
    void quarterStart_q1_equalsFyStart() {
        for (int fy = 2024; fy <= 2028; fy++) {
            assertEquals(CiscoFiscalCalendar.fyStart(fy),
                    CiscoFiscalCalendar.quarterStart(fy, 1));
        }
    }

    @Test
    void quarterEnd_q4_equalsFyEnd() {
        for (int fy = 2024; fy <= 2028; fy++) {
            assertEquals(CiscoFiscalCalendar.fyEnd(fy),
                    CiscoFiscalCalendar.quarterEnd(fy, 4));
        }
    }

    @Test
    void quarterStart_invalidQuarter_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> CiscoFiscalCalendar.quarterStart(2026, 0));
        assertThrows(IllegalArgumentException.class,
                () -> CiscoFiscalCalendar.quarterStart(2026, 5));
    }

    @Test
    void quarterEnd_invalidQuarter_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> CiscoFiscalCalendar.quarterEnd(2026, 0));
        assertThrows(IllegalArgumentException.class,
                () -> CiscoFiscalCalendar.quarterEnd(2026, 5));
    }

    @ParameterizedTest
    @CsvSource({
            "Q1FY26, 1, 2026",
            "Q4FY2026, 4, 2026",
            "Q2FY25, 2, 2025",
            "q3fy27, 3, 2027"
    })
    void parseQuarter_validFormats(String input, int expectedQ, int expectedFy) {
        int[] result = CiscoFiscalCalendar.parseQuarter(input);
        assertEquals(expectedQ, result[0]);
        assertEquals(expectedFy, result[1]);
    }

    @ParameterizedTest
    @ValueSource(strings = { "invalid", "FY26Q1", "QXFY26", "abc" })
    void parseQuarter_invalidFormats_throws(String input) {
        assertThrows(IllegalArgumentException.class,
                () -> CiscoFiscalCalendar.parseQuarter(input));
    }

    @Test
    void quarterStartFromString_valid() {
        LocalDate result = CiscoFiscalCalendar.quarterStartFromString("Q1FY26");
        assertEquals(CiscoFiscalCalendar.quarterStart(2026, 1), result);
    }

    @Test
    void quarterEndFromString_valid() {
        LocalDate result = CiscoFiscalCalendar.quarterEndFromString("Q4FY26");
        assertEquals(CiscoFiscalCalendar.quarterEnd(2026, 4), result);
    }

    @Test
    void quarterStartAndEnd_contiguous() {
        // Q2 start should be day after Q1 end
        for (int fy = 2024; fy <= 2028; fy++) {
            for (int q = 2; q <= 4; q++) {
                LocalDate prevEnd = CiscoFiscalCalendar.quarterEnd(fy, q - 1);
                LocalDate thisStart = CiscoFiscalCalendar.quarterStart(fy, q);
                assertEquals(prevEnd.plusDays(1), thisStart,
                        "Q" + q + " start should be day after Q" + (q - 1) + " end in FY" + fy);
            }
        }
    }

    @Test
    void periodEndDates_53WeekYear_hasExtraWeek() {
        // In a 53-week FY, total weeks from anchor to FY end should be 53
        int fy = 2027;
        assertTrue(CiscoFiscalCalendar.is53WeekYear(fy));
        LocalDate anchor = CiscoFiscalCalendar.fyEnd(fy - 1);
        LocalDate fyEnd = CiscoFiscalCalendar.fyEnd(fy);
        long days = fyEnd.toEpochDay() - anchor.toEpochDay();
        assertEquals(371, days); // 53 * 7 = 371
    }
}
