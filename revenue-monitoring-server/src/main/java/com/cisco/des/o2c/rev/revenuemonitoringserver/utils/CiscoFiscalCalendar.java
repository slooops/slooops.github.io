package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cisco fiscal calendar calculator.
 *
 * Rules:
 * - FY ends on the last Saturday in July of that calendar year
 * - Each quarter follows a 4-4-5 week pattern (13 weeks)
 * - 53-week years: Q3 period 7 becomes 5 weeks (5-4-5)
 * - All period-end dates fall on Saturdays
 *
 * Validated against known monthEndDates through FY2030 (66/66 match).
 */
public final class CiscoFiscalCalendar {

    private static final Pattern QTR_PATTERN = Pattern.compile(
            "Q(\\d)FY(\\d{2,4})", Pattern.CASE_INSENSITIVE);

    private CiscoFiscalCalendar() {
    }

    /** Last Saturday in July for a given calendar year. */
    public static LocalDate lastSaturdayInJuly(int year) {
        return LocalDate.of(year, 7, 31)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.SATURDAY));
    }

    /** FY end date (= last Saturday in July of that FY's calendar year). */
    public static LocalDate fyEnd(int fy) {
        return lastSaturdayInJuly(fy);
    }

    /** FY start date (= day after previous FY's end). */
    public static LocalDate fyStart(int fy) {
        return fyEnd(fy - 1).plusDays(1);
    }

    /** Whether this FY has 53 weeks. */
    public static boolean is53WeekYear(int fy) {
        LocalDate anchor = fyEnd(fy - 1);
        LocalDate end = fyEnd(fy);
        return end.toEpochDay() - anchor.toEpochDay() == 371; // 53 * 7
    }

    /**
     * Compute the 12 period-end dates for a fiscal year.
     * Index 0 = P1 end, index 11 = P12 end (= FY end).
     */
    public static LocalDate[] periodEndDates(int fy) {
        LocalDate anchor = fyEnd(fy - 1);
        boolean is53 = is53WeekYear(fy);

        int[] pattern = new int[12];
        for (int q = 0; q < 4; q++) {
            if (is53 && q == 2) {
                // Q3 in a 53-week year: 5-4-5
                pattern[q * 3] = 5;
                pattern[q * 3 + 1] = 4;
                pattern[q * 3 + 2] = 5;
            } else {
                pattern[q * 3] = 4;
                pattern[q * 3 + 1] = 4;
                pattern[q * 3 + 2] = 5;
            }
        }

        LocalDate[] periods = new LocalDate[12];
        LocalDate cursor = anchor;
        for (int i = 0; i < 12; i++) {
            cursor = cursor.plusWeeks(pattern[i]);
            periods[i] = cursor;
        }
        return periods;
    }

    /** Quarter start date (inclusive). Q is 1-based. */
    public static LocalDate quarterStart(int fy, int quarter) {
        if (quarter < 1 || quarter > 4) {
            throw new IllegalArgumentException("Quarter must be 1-4, got: " + quarter);
        }
        if (quarter == 1) {
            return fyStart(fy);
        }
        LocalDate[] periods = periodEndDates(fy);
        return periods[(quarter - 1) * 3 - 1].plusDays(1);
    }

    /** Quarter end date (inclusive). Q is 1-based. */
    public static LocalDate quarterEnd(int fy, int quarter) {
        if (quarter < 1 || quarter > 4) {
            throw new IllegalArgumentException("Quarter must be 1-4, got: " + quarter);
        }
        LocalDate[] periods = periodEndDates(fy);
        return periods[quarter * 3 - 1];
    }

    /**
     * Parse a quarter string like "Q4FY26" or "Q1FY2026".
     * Returns int[]{quarter, fy} where fy is 4-digit.
     */
    public static int[] parseQuarter(String qtr) {
        Matcher m = QTR_PATTERN.matcher(qtr.trim());
        if (!m.matches()) {
            throw new IllegalArgumentException("Invalid quarter format: " + qtr + " (expected Q1FY26)");
        }
        int q = Integer.parseInt(m.group(1));
        int fy = Integer.parseInt(m.group(2));
        if (fy < 100)
            fy += 2000;
        return new int[] { q, fy };
    }

    /**
     * Get the quarter start date from a quarter string like "Q4FY26".
     */
    public static LocalDate quarterStartFromString(String qtr) {
        int[] parsed = parseQuarter(qtr);
        return quarterStart(parsed[1], parsed[0]);
    }

    /**
     * Get the quarter end date from a quarter string like "Q4FY26".
     */
    public static LocalDate quarterEndFromString(String qtr) {
        int[] parsed = parseQuarter(qtr);
        return quarterEnd(parsed[1], parsed[0]);
    }
}
