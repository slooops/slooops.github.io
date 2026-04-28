import { Component, OnInit, signal } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';
import { CardComponent } from '../../components/card/card.component';
import { TableComponent } from '../../components/table/table.component';
import { HomeDataService } from 'src/app/home/home-data.service';
import { provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import {
  MenuMiniComponent,
  MenuMiniItem,
} from '../../shared/menu-mini/menu-mini.component';
Chart.register(...registerables);

// Types for new quarter-pair logic
type QuarterPairKey = 'Q1-Q2' | 'Q2-Q3' | 'Q3-Q4' | 'Q4-Q1';
type PairConfig = {
  key: QuarterPairKey;
  left: string; // e.g. "Q2FY25"
  right: string; // e.g. "Q3FY25"
  yearContext: number; // FY used for the pair (for Q4–Q1, yearContext = FY of Q1)
};

@Component({
  selector: 'app-esp-case-analyzer',
  templateUrl: './esp-case-analyzer.component.html',
  styleUrl: './esp-case-analyzer.component.css',
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [
    CommonModule,
    MatTooltipModule,
    LoadingSymbolComponent,
    CardComponent,
    TableComponent,
    MenuMiniComponent,
  ],
  standalone: true,
})
export class EspCaseAnalyzerComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private homeDataService: HomeDataService,
    private authService: AuthenticationService,
  ) {
    this.http = http;
    Chart.register(...registerables);
  }
  protected http: ApiHttpService;

  selectedTabIndex = 0;
  periodInfo = signal<any>(null);
  timeNow: string = '';

  isQ1Q2Loading = true;
  isQ2Q3Loading = true;
  isQ3Q4Loading = true;
  isQ4Q1Loading = true;

  quarterComparisons: [string, string][] = [];

  displayedColumnsForAgingBacklog: { [key: string]: string[] } = {};
  dataSourceAgingBacklog: { [key: string]: MatTableDataSource<any> } = {};

  displayedColumnsForCaseSummaryQuarter: { [key: string]: string[] } = {};
  dataSourceCaseSummaryQuarter: { [key: string]: MatTableDataSource<any> } = {};

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

  // New pair-based configuration
  quarterPairs: PairConfig[] = [];
  roles: string[] = [];

  ngOnInit(): void {
    this.updateTime();
    this.loadPeriodInfo();
    this.roles = this.authService.getRoles();

    this.http
      .get('esp-weekly-comparison-summary', this.destroyManager, {
        responseType: 'json',
      })
      .subscribe((data: any) => {
        // NEW: Build quarter pairs using the latest complete pair logic
        this.quarterPairs = this.buildLatestQuarterPairs(data);

        // Map pairs to q1-q5 for backwards compatibility with existing data loading
        // This allows existing getEspAgingCaseSummary and getEspCaseServiceMetricSummary to work
        const allQuarters = new Set<string>();
        this.quarterPairs.forEach((pair) => {
          allQuarters.add(pair.left);
          allQuarters.add(pair.right);
        });

        const sortedQuarters = Array.from(allQuarters).sort((a, b) => {
          // Sort by position in data (if available) or by parsing
          const posA =
            data.find((d: any) => d.FISC_QTR === a)?.QTR_RELATIVE_POSITION ??
            999;
          const posB =
            data.find((d: any) => d.FISC_QTR === b)?.QTR_RELATIVE_POSITION ??
            999;
          return posA - posB;
        });

        // Assign to q1-q5 variables for existing code
        this.q1 = sortedQuarters[0] || null;
        this.q2 = sortedQuarters[1] || null;
        this.q3 = sortedQuarters[2] || null;
        this.q4 = sortedQuarters[3] || null;
        this.q5 = sortedQuarters[4] || null;

        // Default to the tab with the highest yearContext (most recent fiscal year)
        // Stop at the first decrease in yearContext to avoid selecting older Q4-Q1 tabs
        let maxYearContext = -1;
        let selectedIndex = 0;

        for (let i = 0; i < this.quarterPairs.length; i++) {
          const pair = this.quarterPairs[i];

          if (pair.yearContext > maxYearContext) {
            // Found a higher yearContext, select it
            maxYearContext = pair.yearContext;
            selectedIndex = i;
          } else if (pair.yearContext < maxYearContext) {
            // YearContext decreased (e.g., Q4-Q1 with older left quarter)
            // Stop here - we've found the most recent complete pair
            break;
          }
          // If yearContext === maxYearContext, continue to next (prefer later index within same year)
          else if (pair.yearContext === maxYearContext) {
            selectedIndex = i;
          }
        }

        this.selectedTabIndex = selectedIndex;

        this.espWeeklyComparisonSummary = data;

        console.log('Quarter pairs:', this.quarterPairs);
        console.log('Legacy quarter assignments:', {
          q1: this.q1,
          q2: this.q2,
          q3: this.q3,
          q4: this.q4,
          q5: this.q5,
        });

        this.getEspAgingCaseSummary();
        this.getEspCaseServiceMetricSummary();

        // Render charts for the default selected tab
        this.onTabClick({ index: this.selectedTabIndex });
      });
  }

  get menuItems(): MenuMiniItem[] {
    return this.quarterPairs.map((p) => ({ label: p.key }));
  }

  selectTab(index: number): void {
    this.selectedTabIndex = index;
    this.onTabClick({ index });
  }

  updateTime(): void {
    this.timeNow = new Date().toLocaleString();
  }

  private loadPeriodInfo(): void {
    this.homeDataService.getPeriodInfo(this.destroyManager).subscribe({
      next: (periodData) => {
        this.periodInfo.set(periodData);
      },
      error: (error) => {
        console.error('Error loading period info:', error);
        this.periodInfo.set({
          periodName: '',
          periodEndDate: '',
          lastUpdated: new Date().toLocaleString(),
        });
      },
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

          // Get all unique quarter names from the data
          const uniqueQuarters = Array.from(
            new Set(data.map((item: any) => item.FISC_QTR)),
          );

          // Process each quarter dynamically
          uniqueQuarters.forEach((quarterName: any) => {
            if (quarterName) {
              const quarterData = data.filter(
                (item: any) => item.FISC_QTR === quarterName,
              );
              const cleanedData = this.removeColumns(
                quarterData,
                columnsToRemove,
              );

              if (cleanedData.length > 0) {
                this.displayedColumnsForCaseSummaryQuarter[quarterName] =
                  Object.keys(cleanedData[0]);
                this.dataSourceCaseSummaryQuarter[quarterName] =
                  new MatTableDataSource(cleanedData);
              }
            }
          });
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

          // Get all unique quarter names from the data
          const uniqueQuarters = Array.from(
            new Set(data.map((item: any) => item.FISC_QTR)),
          );

          // Process each quarter dynamically
          uniqueQuarters.forEach((quarterName: any) => {
            if (quarterName) {
              const quarterData = data.filter(
                (item: any) => item.FISC_QTR === quarterName,
              );

              const cleanedData = this.removeColumns(
                quarterData,
                columnsToRemove,
              );
              const renamedData = this.renameColumns(cleanedData);
              const finalData = this.filterNonZeroRows(
                renamedData,
                columnsToCheck,
              );

              if (finalData.length > 0) {
                this.displayedColumnsForAgingBacklog[quarterName] = Object.keys(
                  finalData[0],
                );
                this.dataSourceAgingBacklog[quarterName] =
                  new MatTableDataSource(finalData);
              }
            }
          });
        }
      });
  }

  generateChartForPair(qStart: string, qEnd: string, name: string): void {
    const prmcCategories = ['PDF', 'ROUTED OUT', 'MISROUTED', 'CANCELLED'];
    const birCategories = ['BACKLOG', 'INFLOW', 'RESOLVED'];
    const labels = this.getSortedLabels();

    const prmcDatasets = this.generateDatasetsForQuarterComparison(
      qStart,
      qEnd,
      prmcCategories,
      this.COLORS,
    );
    const birDatasets = this.generateDatasetsForQuarterComparison(
      qStart,
      qEnd,
      birCategories,
      this.COLORS,
    );

    const prmcCanvasId = `prmcChart${name}`;
    const birCanvasId = `birChart${name}`;

    const prmcCanvas = document.getElementById(
      prmcCanvasId,
    ) as HTMLCanvasElement;
    const birCanvas = document.getElementById(birCanvasId) as HTMLCanvasElement;

    // Validate canvas elements exist before attempting to create charts
    if (!prmcCanvas) {
      console.error(`Canvas not found: ${prmcCanvasId}`);
      return;
    }
    if (!birCanvas) {
      console.error(`Canvas not found: ${birCanvasId}`);
      return;
    }

    try {
      if (prmcCanvas.getContext('2d')) {
        const existingChart = this[`prmcChart${name}`];
        if (existingChart) {
          existingChart.destroy();
        }

        this[`prmcChart${name}`] = new Chart(prmcCanvas, {
          type: 'bar',
          data: { labels, datasets: prmcDatasets },
          options: this.sharedChartOptions,
        });
      }

      if (birCanvas.getContext('2d')) {
        const existingChart = this[`birChart${name}`];
        if (existingChart) {
          existingChart.destroy();
        }

        this[`birChart${name}`] = new Chart(birCanvas, {
          type: 'bar',
          data: { labels, datasets: birDatasets },
          options: this.sharedChartOptions,
        });
      }
    } catch (error) {
      console.error(`Error creating charts for ${name}:`, error);
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
      datalabels: {
        display: false, // Disable data point labels
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
          item.CATEGORY === category,
      );

      return entry ? entry.COUNT : 0;
    });
  }

  getSortedLabels(): string[] {
    return Array.from(
      new Set(
        this.espWeeklyComparisonSummary.map((item) => `WEEK ${item.WEEK_NUM}`),
      ),
    ).sort((a, b) => {
      const numA = parseInt(a.split(' ')[1], 10);
      const numB = parseInt(b.split(' ')[1], 10);
      return numA - numB;
    });
  }

  onTabClick(event: any): void {
    const tabIndex = event.index;

    this.destroyCharts();

    // NEW: Use quarter pairs based on tab index
    const pair = this.quarterPairs[tabIndex];
    if (!pair) {
      console.error('No quarter pair found for tab index:', tabIndex);
      return;
    }

    const chartNameMap: { [key: string]: string } = {
      'Q1-Q2': 'Q1Q2',
      'Q2-Q3': 'Q2Q3',
      'Q3-Q4': 'Q3Q4',
      'Q4-Q1': 'Q4Q1',
    };

    const chartName = chartNameMap[pair.key];
    const loadingFlag = `is${chartName}Loading` as keyof this;

    this[loadingFlag] = false as any;

    // Timeout allows Angular's change detection to complete before Chart.js renders
    setTimeout(() => {
      this.generateChartForPair(pair.left, pair.right, chartName);
    }, 100);
  }

  destroyCharts(): void {
    try {
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
    } catch (error) {
      console.error('Error destroying charts:', error);
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
      columnsToCheck.some((column) => item[column] !== 0),
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

  /**
   * NEW LOGIC: Build latest complete quarter pairs
   * Always returns up to 4 PairConfigs (one per tab: Q1-Q2, Q2-Q3, Q3-Q4, Q4-Q1)
   * Never disables tabs - finds the most recent complete pair for each adjacency
   *
   * TEST CASES:
   *
   * Example A (sample data):
   * Input: Q1FY26(pos=1), Q2FY25(pos=4), Q2FY26(pos=0), Q3FY25(pos=3), Q4FY25(pos=2)
   * Expected:
   *   - Q1-Q2: Q1FY26 vs Q2FY26 (both in FY26)
   *   - Q2-Q3: Q2FY25 vs Q3FY25 (both in FY25, don't mix FY26 Q2 with FY25 Q3)
   *   - Q3-Q4: Q3FY25 vs Q4FY25 (both in FY25)
   *   - Q4-Q1: Q4FY25 vs Q1FY26 (cross-year)
   *
   * Example B (FY26 complete; FY27 Q1 missing):
   * Expected:
   *   - Q1-Q2, Q2-Q3, Q3-Q4: all FY26
   *   - Q4-Q1: Q4FY25 vs Q1FY26 (fallback, can't use Q4FY26 vs Q1FY27)
   *
   * Example C (only Q1FY27 exists; others in FY26):
   * Expected:
   *   - Q1-Q2, Q2-Q3, Q3-Q4: FY26
   *   - Q4-Q1: Q4FY26 vs Q1FY27 (complete cross-year)
   *
   * Duplicate handling: Two rows for Q2FY26 at pos=2 and pos=0 → Use pos=0 (newest)
   * Negative positions: Always ignored
   */
  private buildLatestQuarterPairs(
    data: Array<{ FISC_QTR: string; QTR_RELATIVE_POSITION?: number }>,
  ): PairConfig[] {
    // Step 1: Normalize & dedupe - keep only newest row per (fy, q)
    const bestByFyQ = new Map<string, { fisc_qtr: string; position: number }>();

    data.forEach((item) => {
      const position = item.QTR_RELATIVE_POSITION;
      const fiscQtr = item.FISC_QTR;

      // Skip rows with negative or undefined positions
      if (position === undefined || position < 0 || !fiscQtr) {
        return;
      }

      // Parse FISC_QTR: e.g., "Q2FY26" -> q=2, fy=26
      const match = fiscQtr.match(/Q(\d)FY(\d{2,4})/);
      if (!match) return;

      const q = parseInt(match[1], 10);
      const fy = parseInt(match[2], 10);
      const key = `${fy}-${q}`;

      const existing = bestByFyQ.get(key);
      if (!existing || position < existing.position) {
        bestByFyQ.set(key, { fisc_qtr: fiscQtr, position });
      }
    });

    // Step 2: Index presence - organize by fiscal year and quarter
    const byYear = new Map<number, Set<number>>();
    const bestFiscQtrBy = new Map<string, string>(); // key: "fy-q", value: "Q2FY26"

    bestByFyQ.forEach((value, key) => {
      const [fyStr, qStr] = key.split('-');
      const fy = parseInt(fyStr, 10);
      const q = parseInt(qStr, 10);

      if (!byYear.has(fy)) {
        byYear.set(fy, new Set());
      }
      byYear.get(fy)!.add(q);
      bestFiscQtrBy.set(key, value.fisc_qtr);
    });

    // Step 3: Helper to find latest year with both quarters
    const latestYearWithBoth = (qA: number, qB: number): number | null => {
      // Get all years sorted descending (newest first)
      const years = Array.from(byYear.keys()).sort((a, b) => b - a);

      for (const year of years) {
        const quarters = byYear.get(year)!;
        if (quarters.has(qA) && quarters.has(qB)) {
          return year;
        }
      }
      return null;
    };

    // Step 4: Build pairs
    const pairs: PairConfig[] = [];

    // Q1-Q2: latest year with both Q1 and Q2
    const y12 = latestYearWithBoth(1, 2);
    if (y12 !== null) {
      pairs.push({
        key: 'Q1-Q2',
        left: bestFiscQtrBy.get(`${y12}-1`)!,
        right: bestFiscQtrBy.get(`${y12}-2`)!,
        yearContext: y12,
      });
    }

    // Q2-Q3: latest year with both Q2 and Q3
    const y23 = latestYearWithBoth(2, 3);
    if (y23 !== null) {
      pairs.push({
        key: 'Q2-Q3',
        left: bestFiscQtrBy.get(`${y23}-2`)!,
        right: bestFiscQtrBy.get(`${y23}-3`)!,
        yearContext: y23,
      });
    }

    // Q3-Q4: latest year with both Q3 and Q4
    const y34 = latestYearWithBoth(3, 4);
    if (y34 !== null) {
      pairs.push({
        key: 'Q3-Q4',
        left: bestFiscQtrBy.get(`${y34}-3`)!,
        right: bestFiscQtrBy.get(`${y34}-4`)!,
        yearContext: y34,
      });
    }

    // Q4-Q1 (cross-year): latest Y where Q4FY(Y-1) and Q1FY(Y) both exist
    const years = Array.from(byYear.keys()).sort((a, b) => b - a);
    let y41: number | null = null;
    for (const year of years) {
      const currentYearQuarters = byYear.get(year);
      const prevYearQuarters = byYear.get(year - 1);

      if (currentYearQuarters?.has(1) && prevYearQuarters?.has(4)) {
        y41 = year;
        break;
      }
    }

    if (y41 !== null) {
      pairs.push({
        key: 'Q4-Q1',
        left: bestFiscQtrBy.get(`${y41 - 1}-4`)!,
        right: bestFiscQtrBy.get(`${y41}-1`)!,
        yearContext: y41,
      });
    }

    return pairs;
  }

  generateDatasetsForQuarterComparison(
    firstQuarter: string | null,
    secondQuarter: string | null,
    categories: string[],
    colors: any,
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
