import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
Chart.register(...registerables);

@Component({
  selector: 'app-esp-case-analyzer',
  templateUrl: './esp-case-analyzer.component.html',
  styleUrl: './esp-case-analyzer.component.css',
  providers: [DestroyManager],
})
export class EspCaseAnalyzerComponent implements OnInit {
  constructor(http: ApiHttpService, private destroyManager: DestroyManager) {
    this.http = http;
    Chart.register(...registerables);
  }
  protected http: ApiHttpService;

  selectedTabIndex = 0;

  isQ1Q2Loading = true;
  isQ2Q3Loading = true;
  isQ3Q4Loading = true;
  isQ4Q1Loading = true;

  quarterComparisons: [string, string][] = [];

  displayedColumnsForAgingBacklog: { [key: number]: string[] } = {};
  dataSourceAgingBacklog: { [key: number]: MatTableDataSource<any> } = {};

  displayedColumnsForCaseSummaryQuarter: { [key: number]: string[] } = {};
  dataSourceCaseSummaryQuarter: MatTableDataSource<any>[] = [];

  espWeeklyComparisonSummary: any[] = [];

  birChartQ1Q2: Chart | null = null;
  birChartQ2Q3: Chart | null = null;
  birChartQ3Q4: Chart | null = null;
  birChartQ4Q1: Chart | null = null;

  prmcChartQ1Q2: Chart | null = null;
  prmcChartQ2Q3: Chart | null = null;
  prmcChartQ3Q4: Chart | null = null;
  prmcChartQ4Q1: Chart | null = null;

  q1: string | null = null;
  q2: string | null = null;
  q3: string | null = null;
  q4: string | null = null;
  q5: string | null = null;

  ngOnInit(): void {
    this.http
      .get('esp-weekly-comparison-summary', this.destroyManager, {
        responseType: 'json',
      })
      .subscribe((data: any) => {
        const recentQuarters = this.extractRecentQuarters(data);

        // Assign quarters based on available data
        recentQuarters.forEach((quarter, index) => {
          switch (index) {
            case 0:
              this.q1 = quarter.fiscalQuarter;
              break;
            case 1:
              this.q2 = quarter.fiscalQuarter;
              break;
            case 2:
              this.q3 = quarter.fiscalQuarter;
              break;
            case 3:
              this.q4 = quarter.fiscalQuarter;
              break;
            case 4:
              this.q5 = quarter.fiscalQuarter;
              break;
          }
        });

        this.selectedTabIndex = Math.max(0, recentQuarters.length - 2); // last valid pair is at length - 2

        this.espWeeklyComparisonSummary = data;

        console.log('Final quarter assignments:', {
          q1: this.q1,
          q2: this.q2,
          q3: this.q3,
          q4: this.q4,
          q5: this.q5,
        });

        this.getEspAgingCaseSummary();
        this.getEspCaseServiceMetricSummary();
      });
  }

  getEspCaseServiceMetricSummary() {
    this.http
      .get('esp-case-service-metric-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Columns to remove
          const columnsToRemove = [
            'CREATED_BY',
            'CREATED_TIME',
            'LAST_UPDATED_BY',
            'LAST_UPDATED_TIME',
            'IS_ACTIVE',
            'FISC_QTR',
            'QTR_RELATIVE_POSITION',
          ];

          // Process available quarter data dynamically
          for (let i = 1; i <= 5; i++) {
            const quarterName = this[`q${i}` as keyof this];
            if (quarterName) {
              const quarterData = data.filter(
                (item: any) => item.FISC_QTR === quarterName
              );
              const cleanedData = this.removeColumns(
                quarterData,
                columnsToRemove
              );

              if (cleanedData.length > 0) {
                this.displayedColumnsForCaseSummaryQuarter[i] = Object.keys(
                  cleanedData[0]
                );
                this.dataSourceCaseSummaryQuarter[i] = new MatTableDataSource(
                  cleanedData
                );
              }
            }
          }
        }
      });
  }

  getEspAgingCaseSummary() {
    this.http
      .get('esp-aging-case-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Columns to remove
          const columnsToRemove = [
            'FISC_QTR',
            'CREATED_AT',
            'LAST_UPDATED_AT',
            'QTR_RELATIVE_POSITION',
          ];

          // Columns to check for non-zero values
          const columnsToCheck = [
            'LESS_THAN_5_DAYS',
            'BETWEEN_5_TO_10_DAYS',
            'BETWEEN_10_TO_15_DAYS',
            'GREATER_THAN_15_DAYS',
          ];

          // Process available quarter data dynamically
          for (let i = 1; i <= 5; i++) {
            const quarterName = this[`q${i}` as keyof this];
            if (quarterName) {
              const quarterData = data.filter(
                (item: any) => item.FISC_QTR === quarterName
              );

              const cleanedData = this.removeColumns(
                quarterData,
                columnsToRemove
              );
              const renamedData = this.renameColumns(cleanedData);
              const finalData = this.filterNonZeroRows(
                renamedData,
                columnsToCheck
              );

              if (finalData.length > 0) {
                this.displayedColumnsForAgingBacklog[i] = Object.keys(
                  finalData[0]
                );
                this.dataSourceAgingBacklog[i] = new MatTableDataSource(
                  finalData
                );
              }
            }
          }
        }
      });
  }

  generateChartForPair(qStart: string, qEnd: string, name: string): void {
    console.log(
      `Generating chart for ${name} with start: ${qStart}, end: ${qEnd}`
    );
    const prmcCategories = ['PDF', 'ROUTED OUT', 'MISROUTED', 'CANCELLED'];
    const birCategories = ['BACKLOG', 'INFLOW', 'RESOLVED'];
    const labels = this.getSortedLabels();

    const prmcDatasets = this.generateDatasetsForQuarterComparison(
      qStart,
      qEnd,
      prmcCategories,
      this.COLORS
    );
    const birDatasets = this.generateDatasetsForQuarterComparison(
      qStart,
      qEnd,
      birCategories,
      this.COLORS
    );

    const prmcCanvas = document.getElementById(
      `prmcChart${name}`
    ) as HTMLCanvasElement;
    const birCanvas = document.getElementById(
      `birChart${name}`
    ) as HTMLCanvasElement;

    if (prmcCanvas && prmcCanvas.getContext('2d')) {
      this[`prmcChart${name}`] = new Chart(prmcCanvas, {
        type: 'bar',
        data: { labels, datasets: prmcDatasets },
        options: this.sharedChartOptions,
      });
    }

    if (birCanvas && birCanvas.getContext('2d')) {
      this[`birChart${name}`] = new Chart(birCanvas, {
        type: 'bar',
        data: { labels, datasets: birDatasets },
        options: this.sharedChartOptions,
      });
    }
  }

  sharedChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        // mode: 'index',
        // intersect: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  transformData(fiscalQuarter: string, category: string): number[] {
    const labels = this.getSortedLabels();
    return labels.map((label) => {
      const weekNum = parseInt(label.split(' ')[1], 10);
      const entry = this.espWeeklyComparisonSummary.find(
        (item) =>
          item.WEEK_NUM === weekNum &&
          item.FISC_QTR === fiscalQuarter &&
          item.CATEGORY === category
      );

      return entry ? entry.COUNT : 0;
    });
  }

  getSortedLabels(): string[] {
    return Array.from(
      new Set(
        this.espWeeklyComparisonSummary.map((item) => `WEEK ${item.WEEK_NUM}`)
      )
    ).sort((a, b) => {
      const numA = parseInt(a.split(' ')[1], 10);
      const numB = parseInt(b.split(' ')[1], 10);
      return numA - numB;
    });
  }

  onTabClick(event: any): void {
    const tabIndex = event.index;

    this.destroyCharts();

    if (tabIndex === 0 && this.q5 && this.q2) {
      this.isQ1Q2Loading = false;
      setTimeout(() => this.generateChartForPair(this.q5, this.q2, 'Q1Q2'), 0);
    } else if (tabIndex === 0 && this.q1 && this.q2) {
      this.isQ1Q2Loading = false;
      setTimeout(() => this.generateChartForPair(this.q1, this.q2, 'Q1Q2'), 0);
    }

    if (tabIndex === 1 && this.q2 && this.q3) {
      this.isQ2Q3Loading = false;
      setTimeout(() => this.generateChartForPair(this.q2, this.q3, 'Q2Q3'), 0);
    }

    if (tabIndex === 2 && this.q3 && this.q4) {
      this.isQ3Q4Loading = false;
      setTimeout(() => this.generateChartForPair(this.q3, this.q4, 'Q3Q4'), 0);
    }

    if (tabIndex === 3 && this.q4 && this.q1) {
      this.isQ4Q1Loading = false;
      setTimeout(() => this.generateChartForPair(this.q4, this.q1, 'Q4Q1'), 0);
      console.log('Generating Q4 - Q1 chart using:', this.q4, this.q1);
    }
  }

  destroyCharts(): void {
    // Destroy charts if they exist
    if (this.birChartQ1Q2) {
      this.birChartQ1Q2.destroy();
      this.birChartQ1Q2 = null;
    }
    if (this.birChartQ2Q3) {
      this.birChartQ2Q3.destroy();
      this.birChartQ2Q3 = null;
    }
    if (this.birChartQ3Q4) {
      this.birChartQ3Q4.destroy();
      this.birChartQ3Q4 = null;
    }
    if (this.birChartQ4Q1) {
      this.birChartQ4Q1.destroy();
      this.birChartQ4Q1 = null;
    }
    if (this.prmcChartQ1Q2) {
      this.prmcChartQ1Q2.destroy();
      this.prmcChartQ1Q2 = null;
    }
    if (this.prmcChartQ2Q3) {
      this.prmcChartQ2Q3.destroy();
      this.prmcChartQ2Q3 = null;
    }
    if (this.prmcChartQ3Q4) {
      this.prmcChartQ3Q4.destroy();
      this.prmcChartQ3Q4 = null;
    }
    if (this.prmcChartQ4Q1) {
      this.prmcChartQ4Q1.destroy();
      this.prmcChartQ4Q1 = null;
    }
  }

  COLORS = {
    backlogCurrent: {
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      pointBorderColor: 'rgba(75, 192, 192, 1)',
    },
    backlogPrevious: {
      backgroundColor: 'rgba(75, 192, 192, 0.3)',
      borderColor: 'rgba(75, 192, 192, 0.5)',
      pointBackgroundColor: 'rgba(75, 192, 192, 0.5)',
      pointBorderColor: 'rgba(75, 192, 192, 0.5)',
    },
    inflowCurrent: {
      backgroundColor: 'rgba(255, 159, 64, 0.6)',
      borderColor: 'rgba(255, 159, 64, 1)',
      pointBackgroundColor: 'rgba(255, 159, 64, 1)',
      pointBorderColor: 'rgba(255, 159, 64, 1)',
    },
    inflowPrevious: {
      backgroundColor: 'rgba(255, 159, 64, 0.3)',
      borderColor: 'rgba(255, 159, 64, 0.5)',
      pointBackgroundColor: 'rgba(255, 159, 64, 0.5)',
      pointBorderColor: 'rgba(255, 159, 64, 0.5)',
    },
    resolvedCurrent: {
      backgroundColor: 'rgba(235, 154, 229, 0.6)', // Muted pink-purple with 60% opacity
      borderColor: 'rgba(212, 114, 205, 1)', // Muted pink-purple with 100% opacity
      pointBackgroundColor: 'rgba(235, 154, 229, 1)', // Muted pink-purple with 100% opacity
      pointBorderColor: 'rgba(230, 109, 221, 1)', // Muted pink-purple with 100% opacity
    },
    resolvedPrevious: {
      backgroundColor: 'rgba(235, 154, 229, 0.3)', // Muted pink-purple with 30% opacity
      borderColor: 'rgba(213, 103, 206, 0.5)', // Muted pink-purple with 50% opacity
      pointBackgroundColor: 'rgba(235, 154, 229, 0.5)', // Muted pink-purple with 50% opacity
      pointBorderColor: 'rgba(232, 87, 223, 0.5)', // Muted pink-purple with 50% opacity
    },
    routedOutCurrent: {
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      pointBorderColor: 'rgba(54, 162, 235, 1)',
    },
    routedOutPrevious: {
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      borderColor: 'rgba(54, 162, 235, 0.5)',
      pointBackgroundColor: 'rgba(54, 162, 235, 0.5)',
      pointBorderColor: 'rgba(54, 162, 235, 0.5)',
    },
    misroutedCurrent: {
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      pointBorderColor: 'rgba(255, 99, 132, 1)',
    },
    misroutedPrevious: {
      backgroundColor: 'rgba(255, 99, 132, 0.3)',
      borderColor: 'rgba(255, 99, 132, 0.5)',
      pointBackgroundColor: 'rgba(255, 99, 132, 0.5)',
      pointBorderColor: 'rgba(255, 99, 132, 0.5)',
    },
    pdfCurrent: {
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
      borderColor: 'rgba(153, 102, 255, 1)',
      pointBackgroundColor: 'rgba(153, 102, 255, 1)',
      pointBorderColor: 'rgba(153, 102, 255, 1)',
    },
    pdfPrevious: {
      backgroundColor: 'rgba(153, 102, 255, 0.3)',
      borderColor: 'rgba(153, 102, 255, 0.5)',
      pointBackgroundColor: 'rgba(153, 102, 255, 0.5)',
      pointBorderColor: 'rgba(153, 102, 255, 0.5)',
    },
    canceledCurrent: {
      backgroundColor: 'rgba(201, 203, 207, 0.6)',
      borderColor: 'rgba(201, 203, 207, 1)',
      pointBackgroundColor: 'rgba(201, 203, 207, 1)',
      pointBorderColor: 'rgba(201, 203, 207, 1)',
    },
    canceledPrevious: {
      backgroundColor: 'rgba(201, 203, 207, 0.3)',
      borderColor: 'rgba(201, 203, 207, 0.5)',
      pointBackgroundColor: 'rgba(201, 203, 207, 0.5)',
      pointBorderColor: 'rgba(201, 203, 207, 0.5)',
    },
    totalCurrent: {
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      pointBorderColor: 'rgba(75, 192, 192, 1)',
    },
    totalPrevious: {
      backgroundColor: 'rgba(75, 192, 192, 0.3)',
      borderColor: 'rgba(75, 192, 192, 0.5)',
      pointBackgroundColor: 'rgba(75, 192, 192, 0.5)',
      pointBorderColor: 'rgba(75, 192, 192, 0.5)',
    },
  };

  private removeColumns(data: any[], columnsToRemove: string[]): any[] {
    return data.map((item: any) => {
      columnsToRemove.forEach((column) => delete item[column]);
      return item;
    });
  }

  private filterNonZeroRows(data: any[], columnsToCheck: string[]): any[] {
    return data.filter((item) =>
      columnsToCheck.some((column) => item[column] !== 0)
    );
  }

  private renameColumns(data: any[]): any[] {
    return data.map((item) => {
      const newItem: any = {};
      Object.keys(item).forEach((key) => {
        const newKey = key.includes('_TO_') ? key.replace(/_TO_/g, '-') : key;
        newItem[newKey] = item[key];
      });
      return newItem;
    });
  }

  private extractRecentQuarters(
    data: any[]
  ): { quarterIndex: number; fiscalQuarter: string }[] {
    // Step 1: Use QTR_RELATIVE_POSITION to get quarters in chronological order
    const quarterPositionMap = new Map<number, string>();

    data.forEach((item) => {
      const position = item.QTR_RELATIVE_POSITION;
      const fiscalQuarter = item.FISC_QTR;

      if (position !== undefined && fiscalQuarter) {
        quarterPositionMap.set(position, fiscalQuarter);
      }
    });

    // Get available positions sorted (0 = newest, higher = older)
    const availablePositions = Array.from(quarterPositionMap.keys()).sort(
      (a, b) => a - b
    );

    // Step 2: Parse quarters and organize by quarter type
    const quartersByType: {
      [key: number]: Array<{
        fiscalQuarter: string;
        fiscalYear: number;
        position: number;
      }>;
    } = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    availablePositions.forEach((position) => {
      const fiscalQuarter = quarterPositionMap.get(position)!;
      const match = fiscalQuarter.match(/Q(\d)FY(\d+)/);

      if (match) {
        const quarterNumber = parseInt(match[1], 10);
        const fiscalYear = parseInt(match[2], 10);

        quartersByType[quarterNumber].push({
          fiscalQuarter,
          fiscalYear,
          position,
        });
      }
    });

    // console.log('Quarters organized by type:', quartersByType);

    // Step 3: Smart assignment based on quarter type
    const result: { quarterIndex: number; fiscalQuarter: string }[] = [];

    // Assign Q1 - use the newest (lowest position number)
    if (quartersByType[1].length > 0) {
      const newestQ1 = quartersByType[1].sort(
        (a, b) => a.position - b.position
      )[0];
      result.push({ quarterIndex: 1, fiscalQuarter: newestQ1.fiscalQuarter });
    }

    // Assign Q2 - use the newest available Q2
    if (quartersByType[2].length > 0) {
      const newestQ2 = quartersByType[2].sort(
        (a, b) => a.position - b.position
      )[0];
      result.push({ quarterIndex: 2, fiscalQuarter: newestQ2.fiscalQuarter });
    }

    // Assign Q3 - use the newest available Q3
    if (quartersByType[3].length > 0) {
      const newestQ3 = quartersByType[3].sort(
        (a, b) => a.position - b.position
      )[0];
      result.push({ quarterIndex: 3, fiscalQuarter: newestQ3.fiscalQuarter });
    }

    // Assign Q4 - use the newest available Q4
    if (quartersByType[4].length > 0) {
      const newestQ4 = quartersByType[4].sort(
        (a, b) => a.position - b.position
      )[0];
      result.push({ quarterIndex: 4, fiscalQuarter: newestQ4.fiscalQuarter });
    }

    // Assign Q5 - use older Q1 if available (for year-end transition)
    if (quartersByType[1].length > 1) {
      const olderQ1 = quartersByType[1].sort(
        (a, b) => a.position - b.position
      )[1];
      result.push({ quarterIndex: 5, fiscalQuarter: olderQ1.fiscalQuarter });
    }

    // Sort result by quarterIndex to ensure proper order
    result.sort((a, b) => a.quarterIndex - b.quarterIndex);

    return result;
  }

  generateDatasetsForQuarterComparison(
    firstQuarter: string | null,
    secondQuarter: string | null,
    categories: string[],
    colors: any
  ) {
    if (!firstQuarter || !secondQuarter) {
      console.warn('One of the quarters is null, skipping dataset generation.');
      return [];
    }

    const categoryColorKeyMap: { [key: string]: string } = {
      pdf: 'pdf',
      'routed out': 'routedOut',
      misrouted: 'misrouted',
      cancelled: 'canceled',
      backlog: 'backlog',
      inflow: 'inflow',
      resolved: 'resolved',
    };

    const toTitleCase = (str: string) =>
      str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const datasets = categories.flatMap((category) => {
      const mappedKey =
        categoryColorKeyMap[category.toLowerCase()] ||
        category.toLowerCase().replace(/[\s_]+/g, '');

      const chartType = ['PDF', 'BACKLOG'].includes(category.toUpperCase())
        ? undefined
        : 'line';

      const previousColor = colors[`${mappedKey}Previous`];
      const currentColor = colors[`${mappedKey}Current`];

      const displayName =
        category.toUpperCase() === 'PDF' ? 'PDF' : toTitleCase(category);
      return [
        {
          label: `${displayName} ${firstQuarter.slice(0, 2)}`,
          data: this.transformData(firstQuarter, category),
          ...(previousColor || {}),
          ...(chartType && { type: chartType }),
        },
        {
          label: `${displayName} ${secondQuarter.slice(0, 2)}`,
          data: this.transformData(secondQuarter, category),
          ...(currentColor || {}),
          ...(chartType && { type: chartType }),
        },
      ];
    });

    return datasets;
  }
}
