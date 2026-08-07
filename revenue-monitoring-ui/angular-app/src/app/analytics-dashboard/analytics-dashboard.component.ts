import {
  Component,
  OnInit,
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
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
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

echarts.use([
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);

interface PageVisitSummary {
  PAGE_ROUTE: string;
  TOTAL_VISITS: number;
  UNIQUE_USERS: number;
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
  imports: [
    CommonModule,
    FormsModule,
    LoadingSymbolComponent,
    NgIcon,
    NgxEchartsDirective,
  ],
  providers: [
    provideEchartsCore({ echarts }),
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
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
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

  // ECharts options
  continuousMonitoringChartOptions: EChartsOption = {};
  caseIqChartOptions: EChartsOption = {};
  businessInsightsChartOptions: EChartsOption = {};
  topPagesChartOptions: EChartsOption = {};
  uniqueUsersChartOptions: EChartsOption = {};

  // Color palettes
  private readonly COLORS = {
    blue: ['#0066cc', '#3399ff', '#66b3ff', '#99ccff', '#cce6ff'],
    green: ['#00aa55', '#33cc77', '#66dd99', '#99eebb', '#ccffdd'],
    purple: ['#6600cc', '#9933ff', '#b366ff', '#cc99ff', '#e6ccff'],
    orange: ['#ff6600', '#ff8833', '#ffaa66', '#ffcc99', '#ffeecc'],
    red: ['#cc0033', '#ff3366', '#ff6699', '#ff99cc', '#ffccdd'],
    // Categorical palette: Cisco cyan leads, then contrasting hues so
    // adjacent slices are always visually distinguishable.
    cisco: [
      '#00bceb', // Cisco cyan (lead)
      '#0070d2', // Cisco blue
      '#6ebe4a', // green
      '#fbab18', // amber
      '#9933ff', // purple
      '#e53935', // red
      '#005073', // deep navy
      '#ff6600', // orange
      '#00a99d', // teal
      '#7f7f7f', // gray
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

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.themeSub = this.themeService.isDarkMode$.subscribe(() => {
      if (!this.isLoading && this.summaryData.length > 0) {
        this.initializeCharts();
      }
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
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

          this.isLoading = false;
          this.initializeCharts();
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
    this.createContinuousMonitoringChart();
    this.createCaseIqChart();
    this.createBusinessInsightsChart();
    this.createTopPagesChart();
    this.createUniqueUsersChart();
  }

  private filterByPrefix(prefix: string): PageVisitSummary[] {
    return this.summaryData.filter(
      (item) =>
        !EXCLUDED_ROUTES.includes(item.PAGE_ROUTE) &&
        (item.PAGE_ROUTE === prefix ||
          item.PAGE_ROUTE.startsWith(prefix + '/')),
    );
  }

  private extractTabName(route: string): string {
    const parts = route.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart
      .split('-')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (ACRONYMS[lowerWord]) {
          return ACRONYMS[lowerWord];
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  private buildDonutOptions(
    data: PageVisitSummary[],
    title: string,
    colors: string[],
  ): EChartsOption {
    if (data.length === 0) return {};
    const labels = data.map((item) => this.extractTabName(item.PAGE_ROUTE));
    const values = data.map((item) => Number(item.TOTAL_VISITS));
    const total = values.reduce((a, b) => a + b, 0);
    const textColor = this.chartTextColor;

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const pct =
            total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
          return `${params.name}: ${params.value} visits (${pct}%)`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: textColor, fontSize: 11 },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '80%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data: labels.map((name, i) => ({
            name,
            value: values[i],
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    };
  }

  private createContinuousMonitoringChart(): void {
    const invoiceData = this.filterByPrefix('/invoice-to-cash');
    const revenueData = this.filterByPrefix('/revenue-accounting');
    const orderData = this.filterByPrefix('/order-management');
    const opsData = this.filterByPrefix('/operations-controls');

    const aggregated = [
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

    if (aggregated.length === 0) {
      this.continuousMonitoringChartOptions = {};
      return;
    }
    const total = aggregated.reduce((a, b) => a + b.visits, 0);
    const textColor = this.chartTextColor;

    this.continuousMonitoringChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const pct = ((params.value / total) * 100).toFixed(1);
          return `${params.name}: ${params.value} visits (${pct}%)`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: textColor, fontSize: 11 },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '80%'],
          center: ['50%', '45%'],
          label: { show: false },
          labelLine: { show: false },
          data: aggregated.map((item, i) => ({
            name: item.label,
            value: item.visits,
            itemStyle: {
              color: this.COLORS.cisco[i % this.COLORS.cisco.length],
            },
          })),
        },
      ],
    };
  }

  private createCaseIqChart(): void {
    const caseIqData = this.filterByPrefix('/case-iq');
    this.caseIqChartOptions = this.buildDonutOptions(
      caseIqData,
      'Case IQ Team Usage',
      this.COLORS.cisco,
    );
  }

  private createBusinessInsightsChart(): void {
    const biData = this.filterByPrefix('/business-insights');
    this.businessInsightsChartOptions = this.buildDonutOptions(
      biData,
      'Business Insights Usage',
      this.COLORS.cisco,
    );
  }

  private createTopPagesChart(): void {
    const topPages = this.summaryData
      .filter((item) => !EXCLUDED_ROUTES.includes(item.PAGE_ROUTE))
      .slice(0, 10)
      .map((item) => ({
        label: this.extractTabName(item.PAGE_ROUTE),
        visits: Number(item.TOTAL_VISITS),
      }));

    if (topPages.length === 0) {
      this.topPagesChartOptions = {};
      return;
    }
    const textColor = this.chartTextColor;
    const mutedColor = this.chartMutedColor;

    this.topPagesChartOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 20, top: 10, bottom: 20, containLabel: false },
      xAxis: {
        type: 'value',
        axisLabel: { color: mutedColor },
        splitLine: { show: false },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: topPages.map((i) => i.label).reverse(),
        axisLabel: { color: mutedColor, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: topPages.map((i) => i.visits).reverse(),
          itemStyle: {
            color: this.COLORS.cisco[0],
            borderRadius: [0, 4, 4, 0],
          },
          barMaxWidth: 20,
        },
      ],
    };
  }

  private createUniqueUsersChart(): void {
    const byUsers = this.summaryData
      .filter((item) => !EXCLUDED_ROUTES.includes(item.PAGE_ROUTE))
      .slice(0, 8)
      .map((item) => ({
        label: this.extractTabName(item.PAGE_ROUTE),
        users: Number(item.UNIQUE_USERS),
      }));

    if (byUsers.length === 0) {
      this.uniqueUsersChartOptions = {};
      return;
    }
    const textColor = this.chartTextColor;
    const mutedColor = this.chartMutedColor;

    this.uniqueUsersChartOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 10, right: 10, top: 10, bottom: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: byUsers.map((i) => i.label),
        axisLabel: { color: mutedColor, fontSize: 10, rotate: 30 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: mutedColor },
        splitLine: { lineStyle: { color: this.chartGridColor } },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: byUsers.map((i) => i.users),
          itemStyle: {
            color: this.COLORS.cisco[1],
            borderRadius: [4, 4, 0, 0],
          },
          barMaxWidth: 30,
        },
      ],
    };
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
