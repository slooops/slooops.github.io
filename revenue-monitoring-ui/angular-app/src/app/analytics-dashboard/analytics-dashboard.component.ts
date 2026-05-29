import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostBinding,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { ThemeService } from '../providers/theme.service';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPresentationChartDuotone,
  phosphorUsersDuotone,
  phosphorChartDonutDuotone,
  phosphorTrophyDuotone,
  phosphorShieldCheckDuotone,
  phosphorBrainDuotone,
  phosphorLightbulbDuotone,
  phosphorFireDuotone,
  phosphorTableDuotone,
  phosphorChartBarDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { phosphorArrowClockwiseBold } from '@ng-icons/phosphor-icons/bold';

Chart.register(...registerables);

interface PageVisitSummary {
  PAGE_ROUTE: string;
  TOTAL_VISITS: number;
  UNIQUE_USERS: number;
}

interface ChartDataset {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

interface RouteVisitDetail {
  USER_NAME: string;
  VISIT_DATE: string;
  FIRST_VISIT_TIME: string;
  LAST_VISIT_TIME: string;
  VISIT_COUNT: number;
}

// Helper to normalize keys to uppercase (Oracle returns uppercase)
function normalizeData(data: any[]): PageVisitSummary[] {
  return data.map((item) => ({
    PAGE_ROUTE: item.PAGE_ROUTE || item.page_route || '',
    TOTAL_VISITS: Number(item.TOTAL_VISITS || item.total_visits || 0),
    UNIQUE_USERS: Number(item.UNIQUE_USERS || item.unique_users || 0),
  }));
}

// Parent-only routes that should be excluded from charts/totals
// These are container routes with no meaningful standalone content
const EXCLUDED_ROUTES = ['/business-insights', '/case-iq'];

// Known acronyms that should be displayed in uppercase
const ACRONYMS: Record<string, string> = {
  i2c: 'I2C',
  om: 'OM',
  p2p: 'P2P',
  sm: 'SM',
  ait: 'AIT',
  fpp: 'FPP',
  o2c: 'O2C',
  wd0: 'WD0',
  esp: 'ESP',
  'finance it': 'Finance IT',
};

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSymbolComponent, NgIcon],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorPresentationChartDuotone,
      phosphorUsersDuotone,
      phosphorChartDonutDuotone,
      phosphorTrophyDuotone,
      phosphorShieldCheckDuotone,
      phosphorBrainDuotone,
      phosphorLightbulbDuotone,
      phosphorFireDuotone,
      phosphorTableDuotone,
      phosphorChartBarDuotone,
      phosphorArrowClockwiseBold,
    }),
  ],
})
export class AnalyticsDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  isLoading = true;
  summaryData: PageVisitSummary[] = [];

  // Lookback period
  selectedDays = 30;
  readonly periodOptions = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 90, label: 'Last 90 Days' },
  ];

  // Route detail modal
  modalOpen = false;
  modalRoute = '';
  modalLoading = false;
  modalDetails: RouteVisitDetail[] = [];

  // Charts
  private continuousMonitoringChart: any = null;
  private caseIqChart: any = null;
  private businessInsightsChart: any = null;
  private topPagesChart: any = null;
  private uniqueUsersChart: any = null;

  // Color palettes
  private readonly COLORS = {
    blue: ['#0066cc', '#3399ff', '#66b3ff', '#99ccff', '#cce6ff'],
    green: ['#00aa55', '#33cc77', '#66dd99', '#99eebb', '#ccffdd'],
    purple: ['#6600cc', '#9933ff', '#b366ff', '#cc99ff', '#e6ccff'],
    orange: ['#ff6600', '#ff8833', '#ffaa66', '#ffcc99', '#ffeecc'],
    red: ['#cc0033', '#ff3366', '#ff6699', '#ff99cc', '#ffccdd'],
    cisco: [
      '#00bceb',
      '#00bceb',
      '#64bbe3',
      '#005073',
      '#7f7f7f',
      '#1e4471',
      '#fbab18',
      '#6ebe4a',
    ],
  };

  // Stats
  totalVisits = 0;
  uniqueUsers = 0;
  topPage = '';
  lastUpdated = '';

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService,
    public themeService: ThemeService,
  ) {}

  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  private themeSub?: Subscription;

  private get chartTextColor(): string {
    return this.themeService.isDarkMode ? '#e0e6ed' : '#1b1c1d';
  }

  private get chartMutedColor(): string {
    return this.themeService.isDarkMode ? '#8899a6' : '#555';
  }

  private get chartGridColor(): string {
    return this.themeService.isDarkMode ? '#2a3f50' : '#e0e0e0';
  }

  private get donutBorderColor(): string {
    return this.themeService.isDarkMode ? '#111b25' : '#ffffff';
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.themeSub = this.themeService.isDarkMode$.subscribe(() => {
      if (!this.isLoading && this.summaryData.length > 0) {
        // Recreate charts so colors update
        setTimeout(() => this.initializeCharts(), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  ngOnDestroy(): void {
    // Destroy all charts to prevent memory leaks
    this.destroyAllCharts();
    this.themeSub?.unsubscribe();
  }

  private destroyAllCharts(): void {
    if (this.continuousMonitoringChart) {
      this.continuousMonitoringChart.destroy();
      this.continuousMonitoringChart = null;
    }
    if (this.caseIqChart) {
      this.caseIqChart.destroy();
      this.caseIqChart = null;
    }
    if (this.businessInsightsChart) {
      this.businessInsightsChart.destroy();
      this.businessInsightsChart = null;
    }
    if (this.topPagesChart) {
      this.topPagesChart.destroy();
      this.topPagesChart = null;
    }
    if (this.uniqueUsersChart) {
      this.uniqueUsersChart.destroy();
      this.uniqueUsersChart = null;
    }
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    this.http
      .get(`page-visit-summary?days=${this.selectedDays}`, this.destroyManager)
      .subscribe({
        next: (data: any) => {
          console.log('Raw analytics data received:', data);
          this.summaryData = normalizeData(data as any[]);
          console.log('Normalized data:', this.summaryData);
          this.calculateStats();
          this.lastUpdated = new Date().toLocaleString();

          // FIRST: Set isLoading = false so DOM renders the canvas elements
          this.isLoading = false;

          // THEN: Wait for Angular to render the DOM, then initialize charts
          setTimeout(() => {
            this.initializeCharts();
          }, 100);
        },
        error: (err) => {
          console.error('Failed to load analytics data:', err);
          this.isLoading = false;
        },
      });
  }

  private calculateStats(): void {
    // Filter out parent-only routes for stats calculation
    const filteredData = this.summaryData.filter(
      (item) => !EXCLUDED_ROUTES.includes(item.PAGE_ROUTE),
    );

    this.totalVisits = filteredData.reduce(
      (sum, item) => sum + Number(item.TOTAL_VISITS),
      0,
    );

    // Get unique users from the data (can't just sum since same user might visit multiple pages)
    const userSet = new Set<number>();
    filteredData.forEach((item) => userSet.add(Number(item.UNIQUE_USERS)));
    this.uniqueUsers = Math.max(
      ...filteredData.map((item) => Number(item.UNIQUE_USERS)),
      0,
    );

    if (filteredData.length > 0) {
      this.topPage = filteredData[0].PAGE_ROUTE;
    }
  }

  private initializeCharts(): void {
    // console.log('[CHARTS] initializeCharts() called');
    // console.log('[CHARTS] summaryData length:', this.summaryData.length);
    this.destroyAllCharts();

    try {
      this.createContinuousMonitoringChart();
    } catch (e) {
      console.error('[CHARTS] Error in createContinuousMonitoringChart:', e);
    }

    try {
      this.createCaseIqChart();
    } catch (e) {
      console.error('[CHARTS] Error in createCaseIqChart:', e);
    }

    try {
      this.createBusinessInsightsChart();
    } catch (e) {
      console.error('[CHARTS] Error in createBusinessInsightsChart:', e);
    }

    try {
      this.createTopPagesChart();
    } catch (e) {
      console.error('[CHARTS] Error in createTopPagesChart:', e);
    }

    try {
      this.createUniqueUsersChart();
    } catch (e) {
      console.error('[CHARTS] Error in createUniqueUsersChart:', e);
    }

    console.log('[CHARTS] All chart creation attempts complete');
  }

  private filterByPrefix(prefix: string): PageVisitSummary[] {
    // Match both exact route (e.g., "/invoice-to-cash") and sub-routes (e.g., "/invoice-to-cash/pre-invoicing")
    // Exclude parent-only routes from the results
    const filtered = this.summaryData.filter(
      (item) =>
        !EXCLUDED_ROUTES.includes(item.PAGE_ROUTE) &&
        (item.PAGE_ROUTE === prefix ||
          item.PAGE_ROUTE.startsWith(prefix + '/')),
    );
    console.log(
      `[CHARTS] filterByPrefix('${prefix}') returned ${filtered.length} items:`,
      filtered,
    );
    return filtered;
  }

  private extractTabName(route: string): string {
    const parts = route.split('/');
    const lastPart = parts[parts.length - 1];
    // Convert slug to title case, respecting known acronyms
    return lastPart
      .split('-')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        // Check if this word is a known acronym
        if (ACRONYMS[lowerWord]) {
          return ACRONYMS[lowerWord];
        }
        // Otherwise, title case it
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  private createDonutChart(
    canvasId: string,
    data: PageVisitSummary[],
    title: string,
    colors: string[],
  ): any {
    // console.log(
    //   `[CHARTS] createDonutChart('${canvasId}') called with ${data.length} data items`,
    // );

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    // console.log(`[CHARTS] Canvas element for '${canvasId}':`, canvas);

    if (!canvas) {
      console.log(`[CHARTS] Canvas element '${canvasId}' NOT FOUND in DOM`);
      return null;
    }
    if (data.length === 0) {
      console.log(`[CHARTS] No data for chart '${canvasId}', skipping`);
      return null;
    }

    const labels = data.map((item) => this.extractTabName(item.PAGE_ROUTE));
    const values = data.map((item) => Number(item.TOTAL_VISITS));
    // console.log(`[CHARTS] '${canvasId}' labels:`, labels);
    // console.log(`[CHARTS] '${canvasId}' values:`, values);

    const textColor = this.chartTextColor;
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 2,
            borderColor: this.donutBorderColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 11 },
              color: textColor,
            },
          },
          title: {
            display: true,
            text: title,
            font: { size: 14, weight: 'bold' },
            color: textColor,
            padding: { bottom: 10 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = values.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} visits (${percentage}%)`;
              },
            },
          },
        },
        cutout: '60%',
      },
    });
  }

  private createContinuousMonitoringChart(): void {
    // console.log('[CHARTS] createContinuousMonitoringChart() called');

    // Combine all monitoring-related routes (include parent route + sub-routes)
    const invoiceData = this.filterByPrefix('/invoice-to-cash');
    const revenueData = this.filterByPrefix('/revenue-accounting');
    const orderData = this.filterByPrefix('/order-management');
    const opsData = this.filterByPrefix('/operations-controls');

    // Aggregate by category
    const aggregated: { label: string; visits: number }[] = [
      {
        label: 'Invoice to Cash',
        visits: invoiceData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
      {
        label: 'Revenue Accounting',
        visits: revenueData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
      {
        label: 'Order Management',
        visits: orderData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
      {
        label: 'Operations Controls',
        visits: opsData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
    ].filter((item) => item.visits > 0);

    // console.log('[CHARTS] Continuous Monitoring aggregated data:', aggregated);

    const canvas = document.getElementById(
      'continuousMonitoringChart',
    ) as HTMLCanvasElement;

    // console.log('[CHARTS] continuousMonitoringChart canvas:', canvas);

    if (!canvas) {
      console.log('[CHARTS] Canvas continuousMonitoringChart NOT FOUND');
      return;
    }
    if (aggregated.length === 0) {
      console.log('[CHARTS] No aggregated data for continuousMonitoringChart');
      return;
    }

    // console.log('[CHARTS] Creating continuousMonitoringChart...');
    const cmTextColor = this.chartTextColor;
    this.continuousMonitoringChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: aggregated.map((i) => i.label),
        datasets: [
          {
            data: aggregated.map((i) => i.visits),
            backgroundColor: this.COLORS.cisco.slice(0, aggregated.length),
            borderWidth: 2,
            borderColor: this.donutBorderColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 11 },
              color: cmTextColor,
            },
          },
          title: {
            display: true,
            text: 'Continuous Monitoring Usage',
            font: { size: 14, weight: 'bold' },
            color: cmTextColor,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = aggregated.reduce((a, b) => a + b.visits, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} visits (${percentage}%)`;
              },
            },
          },
        },
        cutout: '60%',
      },
    });
  }

  private createCaseIqChart(): void {
    const caseIqData = this.filterByPrefix('/case-iq');
    this.caseIqChart = this.createDonutChart(
      'caseIqChart',
      caseIqData,
      'Case IQ Team Usage',
      this.COLORS.cisco,
    );
  }

  private createBusinessInsightsChart(): void {
    const biData = this.filterByPrefix('/business-insights');
    this.businessInsightsChart = this.createDonutChart(
      'businessInsightsChart',
      biData,
      'Business Insights Usage',
      this.COLORS.green,
    );
  }

  private createTopPagesChart(): void {
    // console.log('[CHARTS] createTopPagesChart() called');

    // Get top 10 pages overall, excluding parent-only routes
    const topPages = this.summaryData
      .filter((item) => !EXCLUDED_ROUTES.includes(item.PAGE_ROUTE))
      .slice(0, 10)
      .map((item) => ({
        label: this.extractTabName(item.PAGE_ROUTE),
        visits: Number(item.TOTAL_VISITS),
        route: item.PAGE_ROUTE,
      }));

    // console.log('[CHARTS] topPages data:', topPages);

    const canvas = document.getElementById(
      'topPagesChart',
    ) as HTMLCanvasElement;

    // console.log('[CHARTS] topPagesChart canvas:', canvas);

    if (!canvas) {
      console.log('[CHARTS] Canvas topPagesChart NOT FOUND');
      return;
    }
    if (topPages.length === 0) {
      console.log('[CHARTS] No data for topPagesChart');
      return;
    }

    // console.log('[CHARTS] Creating topPagesChart...');
    const tpTextColor = this.chartTextColor;
    const tpMutedColor = this.chartMutedColor;
    this.topPagesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: topPages.map((i) => i.label),
        datasets: [
          {
            label: 'Total Visits',
            data: topPages.map((i) => i.visits),
            backgroundColor: this.COLORS.cisco[0],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Top 10 Most Visited Pages',
            font: { size: 14, weight: 'bold' },
            color: tpTextColor,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { display: false },
            ticks: { color: tpMutedColor },
          },
          y: {
            grid: { display: false },
            ticks: { color: tpMutedColor },
          },
        },
      },
    });
  }

  private createUniqueUsersChart(): void {
    // console.log('[CHARTS] createUniqueUsersChart() called');

    // Get pages by unique users, excluding parent-only routes
    const byUsers = this.summaryData
      .filter((item) => !EXCLUDED_ROUTES.includes(item.PAGE_ROUTE))
      .slice(0, 8)
      .map((item) => ({
        label: this.extractTabName(item.PAGE_ROUTE),
        users: Number(item.UNIQUE_USERS),
      }));

    // console.log('[CHARTS] byUsers data:', byUsers);

    const canvas = document.getElementById(
      'uniqueUsersChart',
    ) as HTMLCanvasElement;

    // console.log('[CHARTS] uniqueUsersChart canvas:', canvas);

    if (!canvas) {
      console.log('[CHARTS] Canvas uniqueUsersChart NOT FOUND');
      return;
    }
    if (byUsers.length === 0) {
      console.log('[CHARTS] No data for uniqueUsersChart');
      return;
    }

    // console.log('[CHARTS] Creating uniqueUsersChart...');
    const uuTextColor = this.chartTextColor;
    const uuMutedColor = this.chartMutedColor;
    const uuGridColor = this.chartGridColor;
    this.uniqueUsersChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: byUsers.map((i) => i.label),
        datasets: [
          {
            label: 'Unique Users',
            data: byUsers.map((i) => i.users),
            backgroundColor: this.COLORS.cisco[1],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Pages by Unique Users',
            font: { size: 14, weight: 'bold' },
            color: uuTextColor,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: uuMutedColor },
          },
          y: {
            beginAtZero: true,
            grid: { color: uuGridColor },
            ticks: { color: uuMutedColor },
          },
        },
      },
    });
  }

  onPeriodChange(): void {
    this.loadAnalyticsData();
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }

  openRouteDetail(route: string): void {
    this.modalRoute = route;
    this.modalOpen = true;
    this.modalLoading = true;
    this.modalDetails = [];

    this.http
      .get(
        `page-visit-analytics?days=${this.selectedDays}`,
        this.destroyManager,
      )
      .subscribe({
        next: (data: any) => {
          const all = (data as any[]) || [];
          // Filter to selected route, aggregate per user across dates
          const userMap = new Map<
            string,
            {
              totalVisits: number;
              firstVisit: string;
              lastVisit: string;
              dayCount: number;
            }
          >();

          all
            .filter((r: any) => r.PAGE_ROUTE === route)
            .forEach((r: any) => {
              const user = r.USER_NAME || 'UNKNOWN';
              const existing = userMap.get(user);
              const visits = Number(r.VISIT_COUNT || 0);
              const first = r.FIRST_VISIT_TIME || r.VISIT_DATE || '';
              const last = r.LAST_VISIT_TIME || r.VISIT_DATE || '';

              if (existing) {
                existing.totalVisits += visits;
                existing.dayCount += 1;
                if (first < existing.firstVisit) existing.firstVisit = first;
                if (last > existing.lastVisit) existing.lastVisit = last;
              } else {
                userMap.set(user, {
                  totalVisits: visits,
                  firstVisit: first,
                  lastVisit: last,
                  dayCount: 1,
                });
              }
            });

          this.modalDetails = Array.from(userMap.entries())
            .map(([user, info]) => ({
              USER_NAME: user,
              VISIT_DATE: `${info.dayCount} day${info.dayCount === 1 ? '' : 's'}`,
              FIRST_VISIT_TIME: info.firstVisit,
              LAST_VISIT_TIME: info.lastVisit,
              VISIT_COUNT: info.totalVisits,
            }))
            .sort((a, b) => b.VISIT_COUNT - a.VISIT_COUNT);

          this.modalLoading = false;
        },
        error: () => {
          this.modalLoading = false;
        },
      });
  }

  closeRouteDetail(): void {
    this.modalOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.modalOpen) this.closeRouteDetail();
  }

  get modalTotalVisits(): number {
    return this.modalDetails.reduce((s, d) => s + d.VISIT_COUNT, 0);
  }
}
