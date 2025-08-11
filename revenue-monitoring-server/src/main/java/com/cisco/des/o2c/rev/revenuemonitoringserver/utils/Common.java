package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import com.cisco.des.o2c.rev.revenuemonitoringserver.repository.RedisRepositoryImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class Common {

    private JdbcManager jdbcManager;
    private String invoiceToCashSummary;
    private String summaryAssignmentUsers;
    private String rolErrorsSummaryPeriodStatus;

    private Logger logger = LoggerFactory.getLogger(Common.class);

    public Common(JdbcManager jdbcManager, String invoiceToCashSummary, String summaryAssignmentUsers, String rolErrorsSummaryPeriodStatus) {
        this.jdbcManager = jdbcManager;
        this.rolErrorsSummaryPeriodStatus = rolErrorsSummaryPeriodStatus;
        this.summaryAssignmentUsers = summaryAssignmentUsers;
        this.invoiceToCashSummary = invoiceToCashSummary;
    }

    public void renameKey(Map<String, Object> data, String oldKey, String newKey) {
        List<Map.Entry<String, Object>> entries = new ArrayList<>(data.entrySet());
        data.clear();
        for (Map.Entry<String, Object> entry : entries) {
            if (entry.getKey().equals(oldKey)) {
                data.put(newKey, entry.getValue() != null ? entry.getValue().toString() : "");
            } else {
                data.put(entry.getKey(), entry.getValue());
            }
        }
    }

     public void formatDateColumns(Map<String, Object> data, String[] dateColumns) {
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");
        List<DateTimeFormatter> inputFormatters = Arrays.asList(
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("MM-dd-yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.S"),
                DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
        );

        for (String column : dateColumns) {
            Object value = data.get(column);
            if (value != null) {
                String rawDate = value.toString().split(" ")[0].length() > 10 ? value.toString() : value.toString().split(" ")[0];
                boolean parsed = false;

                // Special handling for 14-digit timestamps (yyyyMMddHHmmss)
                if (rawDate.matches("\\d{14}")) {
                    try {
                        LocalDateTime dateTime = LocalDateTime.parse(rawDate,
                            DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                        data.put(column, outputFormatter.format(dateTime.toLocalDate()));
                        parsed = true;
                    } catch (Exception e) {
                        logger.error("Error parsing yyyyMMddHHmmss date: " + rawDate + " - " + e.getMessage());
                    }
                } 
                // Handle ISO-8601 format yyyy-MM-dd explicitly
                else if (rawDate.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    LocalDate localDate = parseIsoDate(rawDate);
                    if (localDate != null) {
                        data.put(column, outputFormatter.format(localDate));
                        parsed = true;
                    }
                }
                else {
                    for (DateTimeFormatter formatter : inputFormatters) {
                        try {
                            LocalDate localDate = LocalDate.parse(rawDate, formatter);
                            data.put(column, outputFormatter.format(localDate));
                            parsed = true;
                            break;
                        } catch (Exception ignored) {}
                    }
                }

                if (!parsed) {
                    try {
                        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("EEE MMM dd HH:mm:ss zzz yyyy", Locale.ENGLISH);
                        Date utilDate = sdf.parse(value.toString());
                        LocalDate date = utilDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                        data.put(column, outputFormatter.format(date));
                        parsed = true;
                    } catch (Exception ignored) {}
                }

                if (!parsed) {
                    data.put(column, rawDate);
                }
            } else {
                data.put(column, "");
            }
        }
    }

     public void formatEmptyAmounts(Map<String, Object> data, String[] emptyAmountColumns) {
        for (String column : emptyAmountColumns) {
            Object value = data.get(column);
            if (value == null) {
                data.put(column, "-");
            }
        }
    }

     public String calculateAging(Object transactionDate) {
        if (transactionDate == null || !(transactionDate instanceof String)) {
            return "0 days";
        }

        String dateString = (String) transactionDate;
        
        // Handle ISO-8601 format (yyyy-MM-dd) directly
        if (dateString.matches("\\d{4}-\\d{2}-\\d{2}")) {
            LocalDate creationDate = parseIsoDate(dateString);
            if (creationDate != null) {
                ZonedDateTime today = ZonedDateTime.now(ZoneId.of("America/Los_Angeles"));
                long agingInDays = ChronoUnit.DAYS.between(creationDate, today.toLocalDate());
                return agingInDays + " days";
            }
        }
        
        // Handle other formats
        List<DateTimeFormatter> formatters = Arrays.asList(
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("MM-dd-yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.S")
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                LocalDate creationDate = LocalDate.parse(dateString, formatter);
                ZonedDateTime today = ZonedDateTime.now(ZoneId.of("America/Los_Angeles"));
                long agingInDays = ChronoUnit.DAYS.between(creationDate, today.toLocalDate());
                return agingInDays + " days";
            } catch (Exception e) {
                logger.info(e.toString());
            }
        }

        // If none of the formats matched
        return "0 days";
    }

    // Utility method to directly parse ISO-8601 dates 
    public LocalDate parseIsoDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        
        try {
            // For "2025-07-03" format
            if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            }
            
            // For timestamps like "20250703085719"
            if (dateStr.matches("\\d{14}")) {
                LocalDateTime dateTime = LocalDateTime.parse(dateStr, 
                    DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                return dateTime.toLocalDate();
            }
            
            // Try with explicit formatters
            List<DateTimeFormatter> formatters = Arrays.asList(
                    DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                    DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                    DateTimeFormatter.ofPattern("MM-dd-yyyy"),
                    DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                    DateTimeFormatter.ofPattern("yyyy/MM/dd")
            );
            
            for (DateTimeFormatter formatter : formatters) {
                try {
                    return LocalDate.parse(dateStr, formatter);
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            logger.error("Failed to parse date: " + dateStr, e);
        }
        
        return null;
    }

    public List<Map<String, Object>> transformForActiveIncidentsSummary(List<Map<String, Object>> data) {
        List<Map<String, Object>> result = new ArrayList<>();
        int grandTotal = 0;

        Map<String, List<Map<String, Object>>> grouped = data.stream()
                .collect(Collectors.groupingBy(row -> String.valueOf(row.get("TRACK"))));

        for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
            String track = entry.getKey();
            List<Map<String, Object>> rows = entry.getValue();

            // Add subtotal before the rows
            Map<String, Object> subtotalRow = new LinkedHashMap<>();
            subtotalRow.put("Track", "Sub Total (" + track + ")");
            subtotalRow.put("Count", rows.size());
            result.add(subtotalRow);

            // Add the detailed rows
            for (Map<String, Object> row : rows) {
                Map<String, Object> newRow = new LinkedHashMap<>();
                newRow.put("Track", track);
                newRow.put("Count", 1);
                newRow.put("Issue Status", row.get("ISSUE_STATUS"));
                newRow.put("IT Approval", row.get("IT_APPROVAL"));
                newRow.put("Approved On", formatDate(String.valueOf(row.get("APPROVED_ON"))));
                newRow.put("Issue Description", row.get("ISSUE_DESCRIPTION"));
                result.add(newRow);
            }

            grandTotal += rows.size();
        }

        // Add grand total at the top
        Map<String, Object> totalRow = new LinkedHashMap<>();
        totalRow.put("Track", "Total");
        totalRow.put("Count", grandTotal);
        result.add(totalRow); // insert at the beginning

        return result;
    }

    private static String formatDate(String isoDate) {
        if (isoDate == null || isoDate.isBlank() || isoDate.equalsIgnoreCase("null")) {
            return "";
        }

        // If it contains '=', split and take the last part
        if (isoDate.contains("=")) {
            isoDate = isoDate.split("=")[1].trim();
        }

        // If still "null" after splitting, return empty
        if (isoDate.equalsIgnoreCase("null")) {
            return "";
        }

        // Take only the date portion (before the space)
        String datePart = isoDate.split(" ")[0];

        // Validate date pattern
        try {
            return LocalDate.parse(datePart, DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                    .format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        } catch (Exception e) {
            return ""; // or return isoDate if you want the original string
        }
    }
}
