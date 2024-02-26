import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { RegressionService } from '../regression.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.css'],
})
export class Wd0HistoricalDataComponent implements OnInit {
  protected http: ApiHttpService;

  constructor(
    http: ApiHttpService,
    private regressionService: RegressionService
  ) {
    this.http = http;
  }

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  dataSource: any;

  ngOnInit(): void {
    this.getHistoricalData();
  }

  private getHistoricalData() {
    this.http.get('wd0-historical-data').subscribe((data: any) => {
      const grandTotal = {};
      const serviceTotal = {};
      const productTotal = {};

      data.forEach((obj) => {
        for (const key in obj) {
          if (obj[key] && !isNaN(parseInt(obj[key]))) {
            // Update grandTotal
            grandTotal[key] = (grandTotal[key] || 0) + parseInt(obj[key]);

            // Update serviceTotal or productTotal based on LINE_TYPE
            if (obj.LINE_TYPE === 'Service') {
              serviceTotal[key] = (serviceTotal[key] || 0) + parseInt(obj[key]);
            } else if (obj.LINE_TYPE === 'Product') {
              productTotal[key] = (productTotal[key] || 0) + parseInt(obj[key]);
            }
          }
        }
      });

      const grandTotalObject = {
        ENTITY: 'Grand Total',
        LINE_TYPE: 'Total',
        ...grandTotal,
      };
      const serviceTotalObject = {
        ENTITY: 'Service Total',
        LINE_TYPE: 'Service',
        ...serviceTotal,
      };
      const productTotalObject = {
        ENTITY: 'Product Total',
        LINE_TYPE: 'Product',
        ...productTotal,
      };

      // Insert total rows at the beginning of the data array
      data.unshift(grandTotalObject, serviceTotalObject, productTotalObject);

      this.historicalData = data;

      this.removeDuplicateEntityEntries(data);

      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        this.historicalData
      );

      // Linear Regeression
      this.regression();

      this.initializeChart();
    });
  }

  initializeChart(): void {
    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
      width = 460 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select('#my_dataviz')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    d3.csv(
      'https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered.csv'
    ).then((data) => {
      const allGroup = new Set(data.map((d) => d.name));

      d3.select('#selectButton')
        .selectAll('myOptions')
        .data(Array.from(allGroup))
        .enter()
        .append('option')
        .text((d) => d)
        .attr('value', (d) => d);

      const myColor = d3
        .scaleOrdinal()
        .domain(Array.from(allGroup))
        .range(d3.schemeSet2);

      const x = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.year))
        .range([0, width]);
      svg
        .append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(7));

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => +d.n)])
        .range([height, 0]);
      svg.append('g').call(d3.axisLeft(y));

      let line = svg
        .append('g')
        .append('path')
        .datum(data.filter((d) => d.name == 'Helen'))
        .attr(
          'd',
          d3
            .line()
            .x((d) => x(d.year))
            .y((d) => y(+d.n))
        )
        .attr('stroke', myColor('valueA'))
        .style('stroke-width', 4)
        .style('fill', 'none');

      function update(selectedGroup) {
        const dataFilter = data.filter((d) => d.name == selectedGroup);
        line
          .datum(dataFilter)
          .transition()
          .duration(1000)
          .attr(
            'd',
            d3
              .line()
              .x((d) => x(d.year))
              .y((d) => y(+d.n))
          )
          .attr('stroke', myColor(selectedGroup));
      }

      d3.select('#selectButton').on('change', function (event) {
        const selectedOption = d3.select(this).property('value');
        update(selectedOption);
      });
    });
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  isProductTotalRow(row: any): boolean {
    return row.ENTITY === 'Product Total';
  }

  getTrend(
    row: any,
    prevColumn: string,
    currentColumn: string
  ): { trend: 'up' | 'down' | 'same'; change: number } {
    const prevValue = parseFloat(row[prevColumn]);
    const currentValue = parseFloat(row[currentColumn]);

    if (!isNaN(prevValue) && !isNaN(currentValue)) {
      const change = ((currentValue - prevValue) / prevValue) * 100;
      if (currentValue > prevValue) return { trend: 'up', change: change };
      else if (currentValue < prevValue)
        return { trend: 'down', change: change };
      else return { trend: 'same', change: 0 };
    }
    return { trend: 'same', change: 0 };
  }

  private removeDuplicateEntityEntries(data: any[]) {
    const entityMap = new Map<string, boolean>();
    data.forEach((row) => {
      if (row.ENTITY && entityMap.has(row.ENTITY)) {
        // Optionally, adjust based on your specific requirements
        row.ENTITY = null; // This line effectively marks duplicates
      } else {
        entityMap.set(row.ENTITY, true);
      }
    });

    // Update displayedColumns based on the processed data
    this.updateDisplayedColumns(data);
  }

  private updateDisplayedColumns(data: any[]) {
    const allKeys = new Set();

    data.forEach((obj) => {
      Object.keys(obj).forEach((key) => {
        allKeys.add(key);
      });
    });
    this.displayedColumns = [
      'ENTITY',
      'LINE_TYPE',
      ...Array.from(allKeys).filter(
        (key) => key !== 'ENTITY' && key !== 'LINE_TYPE'
      ),
    ].map((key) => String(key));
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
    let url = window.URL.createObjectURL(data); // temp URL that points to the generated excel file data buffer
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
  }

  private regression() {
    // Filter out rows for totals and null ENTITY values
    const filteredData = this.historicalData.filter(
      (row) =>
        row.ENTITY &&
        !['Grand Total', 'Service Total', 'Product Total'].includes(row.ENTITY)
    );

    // Identify all potential quarter keys, excluding non-date keys
    const quarterKeys = Object.keys(filteredData[0] || {}).filter(
      (key) =>
        /^[A-Za-z]{3}_\d{2}$/.test(key) &&
        filteredData.some((row) => !isNaN(parseFloat(row[key])))
    );

    // Define custom sort logic for quarters based on fiscal year ending in July
    const fiscalQuarterSorter = (a, b) => {
      const monthOrder = { Oct: 1, Jan: 2, Apr: 3, Jul: 4 };
      const [monthA, yearA] = a.split('_');
      const [monthB, yearB] = b.split('_');
      return yearA === yearB
        ? monthOrder[monthA] - monthOrder[monthB]
        : parseInt(yearA, 10) - parseInt(yearB, 10);
    };

    // Sort quarter keys based on custom logic
    const sortedQuarterKeys = quarterKeys.sort(fiscalQuarterSorter);

    // Select the most recent 3 quarters
    const recentQuarters = sortedQuarterKeys.slice(-3);

    // Now, for the sake of demonstration, let's extract Y values (e.g., sales) for these quarters for service lines
    let x = [],
      y = [];
    filteredData.forEach((row) => {
      if (row.LINE_TYPE === 'Service' || row.LINE_TYPE === 'Product') {
        // Adjust based on your criteria
        recentQuarters.forEach((quarter, index) => {
          const value = parseFloat(row[quarter]);
          if (!isNaN(value)) {
            // Ensure we only include valid numerical values
            x.push(index + 1); // X values representing the quarters in a simple numerical form
            y.push(value); // Corresponding Y values
          }
        });
      }
    });

    // Assuming 'x' and 'y' are populated, perform linear regression using your RegressionService
    if (x.length && y.length) {
      // Ensure we have data to work with
      const { slope, intercept } =
        this.regressionService.performLinearRegression(x, y);
      console.log(`Slope: ${slope}, Intercept: ${intercept}`); // For demonstration
    }
  }
}

export interface HistoricalDataModel {
  [key: string]: string | null;
  ENTITY: string | null;
  LINE_TYPE: string | null;
}
