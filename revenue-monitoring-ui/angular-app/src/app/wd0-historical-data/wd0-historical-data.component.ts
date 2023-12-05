import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.css'],
})
export class Wd0HistoricalDataComponent implements OnInit {
  @ViewChild('barChartTemplate') barChartTemplate: TemplateRef<any>;
  @ViewChild('lineChartTemplate') lineChartTemplate: TemplateRef<any>;

  private lineChart: Chart | null = null;
  private barChart: Chart | null = null;

  private currentDialogRef: MatDialogRef<any>;

  protected http: ApiHttpService;

  constructor(http: ApiHttpService, private dialog: MatDialog) {
    this.http = http;
    Chart.register(...registerables);
  }

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  dataSource: any;
  chartProcessedData: any[] = [];

  tableData: any[] = [];

  ngOnInit(): void {
    this.getHistoricalData();
  }

  generateLineChart(
    historicalData: HistoricalDataModel[],
    canvasId: string = 'lineChartCanvasId'
  ) {
    const filteredData = this.filterDataByDate(
      historicalData,
      new Date(2022, 9) // October 2022
    );
    const entityData = this.sumEntityData(filteredData);
    const labels = this.getSortedMonths(entityData).map((label) =>
      label.replace(/_/g, ' ')
    );

    const datasets = Object.keys(entityData).map((entity) => {
      return {
        label: entity.replace(/_/g, ' '), // Replace underscores
        data: labels.map(
          (label) => entityData[entity][label.replace(/ /g, '_')] || 0
        ), // Replace spaces back to underscores to match keys
        tension: 0.3, // Smooth lines
      };
    });

    this.lineChart = new Chart(canvasId, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  generateBarChart(
    historicalData: HistoricalDataModel[],
    canvasId: string = 'barChartCanvasId'
  ) {
    const filteredData = this.filterDataByDate(
      historicalData,
      new Date(2022, 9)
    ); // October 2022

    const quarterlyData = this.sumQuarterlyData(filteredData);

    const labels = Object.keys(quarterlyData).map((label) =>
      label.replace(/_/g, ' ')
    ); // Replace underscores

    const datasets = [
      {
        label: 'Service',
        data: labels.map(
          (label) => quarterlyData[label.replace(/ /g, '_')].service || 0
        ), // Replace spaces back to underscores to match keys
        backgroundColor: 'rgb(0,119,188)',
      },
      {
        label: 'Product',
        data: labels.map(
          (label) => quarterlyData[label.replace(/ /g, '_')].product || 0
        ), // Replace spaces back to underscores to match keys
        backgroundColor: 'rgb(77,184,255)',
      },
    ];

    this.barChart = new Chart(canvasId, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  getHistoricalData() {
    this.http.get('wd0-historical-data').subscribe((data: any) => {
      const grandTotal = {};
      data.forEach((obj) => {
        for (const key in obj) {
          if (obj[key] && !isNaN(parseInt(obj[key]))) {
            if (grandTotal[key]) {
              grandTotal[key] += parseInt(obj[key]);
            } else {
              grandTotal[key] = parseInt(obj[key]);
            }
          }
        }
      });
      const grandTotalObject = { ENTITY: 'Grand Total', LINE_TYPE: 'Total' }; // Added LINE_TYPE here
      for (const key in grandTotal) {
        grandTotalObject[key] = grandTotal[key].toString();
      }

      data.unshift(grandTotalObject); // This will add the grand total to the start of the array

      this.historicalData = data;
      const entityMap = new Map<string, boolean>();

      for (const data of this.historicalData) {
        const entity = data.ENTITY;

        if (entityMap.has(entity)) {
          data.ENTITY = null;
        } else {
          entityMap.set(entity, true);
        }
      }
      this.displayedColumns = Object.keys(this.historicalData[0]);
      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        this.historicalData
      );

      // Once the data is fetched, generate the charts
      this.generateLineChart(this.historicalData);
      this.generateBarChart(this.historicalData);
    });
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  saveAsExcelFile(buffer: any, filename: string) {
    let data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    let url = window.URL.createObjectURL(data);
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
  }

  openChartDialog(chartType: string): void {
    let dialogRef;
    if (chartType === 'bar') {
      dialogRef = this.dialog.open(this.barChartTemplate, {
        width: '80vw',
      });
    } else if (chartType === 'line') {
      dialogRef = this.dialog.open(this.lineChartTemplate, {
        width: '80vw',
      });
    }

    dialogRef.afterOpened().subscribe(() => {
      if (chartType === 'bar') {
        this.generateBarChart(this.historicalData, 'modalBarChartCanvasId');
      } else if (chartType === 'line') {
        this.generateLineChart(this.historicalData, 'modalLineChartCanvasId');
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Handle tasks after closing the dialog
    });

    this.currentDialogRef = dialogRef; // Store the reference
  }

  closeDialog(): void {
    if (this.currentDialogRef) {
      this.currentDialogRef.close();
    }
  }

  filterDataByDate(
    historicalData: HistoricalDataModel[],
    startDate: Date
  ): HistoricalDataModel[] {
    return historicalData.filter((data) => {
      const keys = Object.keys(data).filter((key) => key.includes('_')); // Only consider keys with an underscore

      return keys.some((key) => {
        const [month, year] = key.split('_');

        // Check if year is defined and adjust if it's only two digits
        const fullYear = year && year.length === 2 ? `20${year}` : year;
        if (fullYear && !isNaN(+fullYear)) {
          const monthNumber = this.monthStringToNumber(month);
          if (!isNaN(monthNumber)) {
            const date = new Date(+fullYear, monthNumber - 1);
            return date >= startDate;
          }
        }
        return false;
      });
    });
  }

  // Helper method to convert month strings to month numbers
  private monthStringToNumber(month: string): number {
    const months = {
      JAN: 1,
      APR: 4,
      JUL: 7,
      OCT: 10,
    };
    const monthNumber = months[month] || 0;
    return monthNumber;
  }

  // Method to sum entity data
  sumEntityData(historicalData: HistoricalDataModel[]): any {
    const entitySums = {};
    let currentEntity = '';

    historicalData.forEach((data, index) => {
      // Skip the 'Grand Total' line
      if (data.ENTITY === 'Grand Total') {
        return;
      }

      // If the entity is not null, it's a new country
      if (data.ENTITY) {
        currentEntity = data.ENTITY;
      }

      // Ensure the entity has been initialized in the entitySums
      if (!entitySums[currentEntity]) {
        entitySums[currentEntity] = {};
      }

      // Sum up the values for the current entity
      Object.keys(data).forEach((key) => {
        if (
          key.includes('_') &&
          !['ENTITY', 'LINE_TYPE', 'SEQUENCE_NUMBER'].includes(key)
        ) {
          const value = parseInt(data[key] || '0', 10);
          if (entitySums[currentEntity][key]) {
            entitySums[currentEntity][key] += value;
          } else {
            entitySums[currentEntity][key] = value;
          }
        }
      });
    });

    return entitySums;
  }

  // Method to get sorted months considering the fiscal year starting in August
  getSortedMonths(entityData: any): string[] {
    const allMonths = new Set<string>();
    Object.values(entityData).forEach((entity: any) => {
      Object.keys(entity).forEach((month) => allMonths.add(month));
    });

    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const [monthA, yearA] = a.split('_');
      const [monthB, yearB] = b.split('_');
      const fiscalYearA = this.getFiscalYear(monthA, yearA);
      const fiscalYearB = this.getFiscalYear(monthB, yearB);
      return fiscalYearA.getTime() - fiscalYearB.getTime();
    });

    return sortedMonths;
  }

  // Helper method to get the start of the fiscal year for a given month and year
  getFiscalYear(month: string, year: string): Date {
    const fiscalYearStartMonth = 8; // August
    const monthNumber = this.monthStringToNumber(month);
    let fiscalYear = parseInt(year, 10);

    // If the month is before August, it belongs to the current fiscal year
    if (monthNumber < fiscalYearStartMonth) {
      fiscalYear++;
    }

    const fiscalYearStartDate = new Date(fiscalYear, fiscalYearStartMonth - 1);
    return fiscalYearStartDate;
  }

  sumQuarterlyData(historicalData: HistoricalDataModel[]): any {
    const quarterlySums = {};
    historicalData.forEach((data) => {
      Object.keys(data).forEach((key) => {
        if (
          key.includes('_') &&
          !['ENTITY', 'LINE_TYPE', 'SEQUENCE_NUMBER'].includes(key)
        ) {
          const [month, year] = key.split('_');
          const quarter = this.getFiscalQuarter(month, year);
          const lineType = data.LINE_TYPE ? data.LINE_TYPE.toLowerCase() : null;
          const valueString = data[key];
          const value = valueString ? parseInt(valueString, 10) : 0;

          if (lineType && !isNaN(value)) {
            if (!quarterlySums[quarter]) {
              quarterlySums[quarter] = { service: 0, product: 0 };
            }
            quarterlySums[quarter][lineType] += value;
          }
        }
      });
    });
    return quarterlySums;
  }

  private getFiscalQuarter(month: string, year: string): string {
    const fiscalMonths = {
      OCT: 'Q1',
      JAN: 'Q2',
      APR: 'Q3',
      JUL: 'Q4',
    };
    const fiscalQuarter = fiscalMonths[month];
    return fiscalQuarter ? `${fiscalQuarter}_${year}` : '';
  }

  downloadChart(canvasId: string, fileName: string) {
    // Get the canvas element by its ID
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (canvas) {
      // Get the image data URL
      const imageUrl = canvas.toDataURL('image/png');

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = fileName;

      // Append the link to the body (required for Firefox)
      document.body.appendChild(link);

      // Simulate a click on the link
      link.click();

      // Remove the link after download
      document.body.removeChild(link);
    } else {
      console.error('Canvas with specified ID not found');
    }
  }
}

export interface HistoricalDataModel {
  APR_20: string | null;
  APR_21: string | null;
  APR_22: string | null;
  APR_23: string | null;
  JAN_20: string | null;
  JAN_21: string | null;
  JAN_22: string | null;
  JAN_23: string | null;
  JUL_19: string | null;
  JUL_20: string | null;
  JUL_21: string | null;
  JUL_22: string | null;
  JUL_23: string | null;
  OCT_20: string | null;
  OCT_21: string | null;
  OCT_22: string | null;
  OCT_23: string | null;
  OCT_24: string | null;

  ENTITY: string | null;
  LINE_TYPE: string | null;

  [key: string]: string | null;
}
