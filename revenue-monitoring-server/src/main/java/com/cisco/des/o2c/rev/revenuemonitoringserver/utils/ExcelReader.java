package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.*;

public class ExcelReader {
    public static List<Map<String, String>> readExcel(InputStream inputStream) {
        List<Map<String, String>> dataList = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0); // Get the first sheet

            Iterator<Row> rowIterator = sheet.iterator();

            // Read the first row as headers (keys)
            if (!rowIterator.hasNext()) return dataList; // Return empty if no rows

            Row headerRow = rowIterator.next();
            List<String> headers = new ArrayList<>();

            for (Cell cell : headerRow) {
                headers.add(cell.getStringCellValue().trim()); // Store header names
            }

            // Read the remaining rows as values
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                Map<String, String> rowData = new HashMap<>();

                for (int i = 0; i < headers.size(); i++) {
                    Cell cell = row.getCell(i);
                    String cellValue = getCellValueAsString(cell);
                    rowData.put(headers.get(i), cellValue); // Map key-value pair
                }

                dataList.add(rowData);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return dataList;
    }

    private static String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    // Format the date as desired
                    Date date = cell.getDateCellValue();
                    return new SimpleDateFormat("yyyy-MM-dd").format(date);
                } else {
                    // Remove .0 from integer-looking values
                    double val = cell.getNumericCellValue();
                    if (val == Math.floor(val)) {
                        return String.valueOf((long) val);  // e.g., 45658 → "45658"
                    }
                    return String.valueOf(val);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue(); // try string value first
                } catch (IllegalStateException e) {
                    return String.valueOf(cell.getNumericCellValue()); // fallback to numeric
                }
            case BLANK:
                return "";
            default:
                return "";
        }
    }
}