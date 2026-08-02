package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ExcelReaderTest {

    private InputStream createExcel(WorkbookPopulator populator) throws Exception {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Sheet1");
            populator.populate(wb, sheet);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    @FunctionalInterface
    interface WorkbookPopulator {
        void populate(Workbook wb, Sheet sheet);
    }

    @Test
    void readExcelStringColumns() throws Exception {
        InputStream is = createExcel((wb, sheet) -> {
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Name");
            header.createCell(1).setCellValue("City");
            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue("Alice");
            r1.createCell(1).setCellValue("SF");
            Row r2 = sheet.createRow(2);
            r2.createCell(0).setCellValue("Bob");
            r2.createCell(1).setCellValue("NYC");
        });

        List<Map<String, String>> result = ExcelReader.readExcel(is);
        assertEquals(2, result.size());
        assertEquals("Alice", result.get(0).get("Name"));
        assertEquals("NYC", result.get(1).get("City"));
    }

    @Test
    void readExcelNumericColumns() throws Exception {
        InputStream is = createExcel((wb, sheet) -> {
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("ID");
            header.createCell(1).setCellValue("Amount");
            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue(42);       // integer-like
            r1.createCell(1).setCellValue(99.5);      // decimal
        });

        List<Map<String, String>> result = ExcelReader.readExcel(is);
        assertEquals(1, result.size());
        assertEquals("42", result.get(0).get("ID"));
        assertEquals("99.5", result.get(0).get("Amount"));
    }

    @Test
    void readExcelBooleanColumn() throws Exception {
        InputStream is = createExcel((wb, sheet) -> {
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Flag");
            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue(true);
        });

        List<Map<String, String>> result = ExcelReader.readExcel(is);
        assertEquals("true", result.get(0).get("Flag"));
    }

    @Test
    void readExcelDateColumn() throws Exception {
        InputStream is = createExcel((wb, sheet) -> {
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Date");
            Row r1 = sheet.createRow(1);
            Cell cell = r1.createCell(0);
            cell.setCellValue(new Date(1710460800000L)); // 2024-03-15 approx
            CellStyle style = wb.createCellStyle();
            style.setDataFormat(wb.getCreationHelper().createDataFormat().getFormat("yyyy-MM-dd"));
            cell.setCellStyle(style);
        });

        List<Map<String, String>> result = ExcelReader.readExcel(is);
        assertEquals(1, result.size());
        assertTrue(result.get(0).get("Date").matches("\\d{4}-\\d{2}-\\d{2}"));
    }

    @Test
    void readExcelBlankCells() throws Exception {
        InputStream is = createExcel((wb, sheet) -> {
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("A");
            header.createCell(1).setCellValue("B");
            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue("val");
            // cell 1 is missing (null)
        });

        List<Map<String, String>> result = ExcelReader.readExcel(is);
        assertEquals("val", result.get(0).get("A"));
        assertEquals("", result.get(0).get("B"));
    }

    @Test
    void readExcelEmptySheet() throws Exception {
        InputStream is = createExcel((wb, sheet) -> {
            // no rows at all
        });

        List<Map<String, String>> result = ExcelReader.readExcel(is);
        assertTrue(result.isEmpty());
    }

    @Test
    void readExcelHeaderOnlyNoDataRows() throws Exception {
        InputStream is = createExcel((wb, sheet) -> {
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Col1");
        });

        List<Map<String, String>> result = ExcelReader.readExcel(is);
        assertTrue(result.isEmpty());
    }
}
