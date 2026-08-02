import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowClockwiseBold,
  phosphorSunBold,
  phosphorMoonBold,
  phosphorCaretUpBold,
  phosphorCaretDownBold,
  phosphorBookOpenBold,
} from '@ng-icons/phosphor-icons/bold';
import {
  phosphorListChecksDuotone,
  phosphorHourglassMediumDuotone,
  phosphorCheckCircleDuotone,
  phosphorWarningDiamondDuotone,
  phosphorWarningDuotone,
  phosphorXCircleDuotone,
  phosphorClockCountdownDuotone,
  phosphorAlarmDuotone,
  phosphorChartDonutDuotone,
  phosphorChartBarHorizontalDuotone,
  phosphorTableDuotone,
  phosphorTrendUpDuotone,
  phosphorCalendarCheckDuotone,
  phosphorClockDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { forkJoin, interval, Subscription } from 'rxjs';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { PieChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

import { DestroyManager } from '../providers/destroy-manager.service';
import { DataService, PeriodStatus } from '../providers/data.service';
import {
  CtmAlertsDataService,
  CtmAlertRow,
  CtmSummary,
  CtmDistribution,
  CtmDownstreamBlocked,
  CtmHourlyTrend,
} from './ctm-alerts-data.service';
import { ThemeService } from '../providers/theme.service';

echarts.use([
  PieChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-ctm-alerts-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, NgxEchartsDirective],
  providers: [
    provideEchartsCore({ echarts }),
    DestroyManager,
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorSunBold,
      phosphorMoonBold,
      phosphorCaretUpBold,
      phosphorCaretDownBold,
      phosphorBookOpenBold,
      phosphorListChecksDuotone,
      phosphorHourglassMediumDuotone,
      phosphorCheckCircleDuotone,
      phosphorWarningDiamondDuotone,
      phosphorWarningDuotone,
      phosphorXCircleDuotone,
      phosphorClockCountdownDuotone,
      phosphorAlarmDuotone,
      phosphorChartDonutDuotone,
      phosphorChartBarHorizontalDuotone,
      phosphorTableDuotone,
      phosphorTrendUpDuotone,
      phosphorCalendarCheckDuotone,
      phosphorClockDuotone,
    }),
  ],
  templateUrl: './ctm-alerts-dashboard.component.html',
  styleUrls: ['./ctm-alerts-dashboard.component.css'],
})
export class CtmAlertsDashboardComponent implements OnInit, OnDestroy {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  // State
  loading = true;
  lastUpdated = '';
  guideOpen = false;
  periodStatus: PeriodStatus | null = null;

  // KPIs
  kpiTotal = 0;
  kpiPending = 0;
  kpiResolved = 0;
  kpiP1 = 0;
  kpiP2 = 0;
  kpiFailed = 0;
  kpiDelayed = 0;
  kpiLateStart = 0;

  // Donut chart data (raw, for building Chart.js)
  alertTypeData: { labels: string[]; values: number[]; colors: string[] } = {
    labels: [],
    values: [],
    colors: [],
  };
  alertTypeTotal = 0;
  priorityData: { labels: string[]; values: number[]; colors: string[] } = {
    labels: [],
    values: [],
    colors: [],
  };
  priorityTotal = 0;
  alertTypeChartOptions: EChartsOption = {};
  priorityChartOptions: EChartsOption = {};

  // Bar chart
  downstreamBars: {
    label: string;
    value: number;
    pct: number;
    color: string;
  }[] = [];

  // Throughput line chart
  throughputPoints: { label: string; value: number }[] = [];
  throughputChartOptions: EChartsOption = {};

  // Table data
  allAlerts: CtmAlertRow[] = [];
  filteredAlerts: CtmAlertRow[] = [];
  pagedAlerts: CtmAlertRow[] = [];

  // Filters
  filterStatus = '';
  filterPriority = '';
  filterType = '';
  filterApp = '';
  filterSearch = '';
  applicationOptions: string[] = [];

  // Sort
  sortKey = 'ALERT_TIME';
  sortAsc = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Modal
  modalOpen = false;
  modalTitle = '';
  modalTab: 'log' | 'command' | 'output' = 'log';
  modalRow: CtmAlertRow | null = null;

  // Color maps
  alertStatusColors: Record<string, string> = {
    Pending: '#e6a800',
    Resolved: '#6ebe4a',
  };

  alertTypeColors: Record<string, string> = {
    FAILED: '#e53935',
    DELAYED: '#e6a800',
    LATE_START: '#00bceb',
  };

  priorityColors: Record<string, string> = {
    P1: '#e53935',
    P2: '#ff6600',
    P3: '#e6a800',
    P4: '#9933ff',
    None: '#888',
  };

  private refreshSub?: Subscription;

  constructor(
    private readonly dataService: CtmAlertsDataService,
    private readonly sharedDataService: DataService,
    private readonly dm: DestroyManager,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.loadPeriodStatus(this.dm);
    this.sharedDataService.periodStatus$.subscribe((status) => {
      if (status) {
        this.periodStatus = {
          ...status,
          lastUpdated: new Date().toLocaleString(),
        };
      }
    });
    this.refreshAll(true);
    this.refreshSub = interval(60000).subscribe(() => this.refreshAll(false));
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  refreshAll(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }
    forkJoin({
      alerts: this.dataService.getAllAlerts(this.dm),
      summary: this.dataService.getSummary(this.dm),
      byPriority: this.dataService.getPriorityDistribution(this.dm),
      topDownstream: this.dataService.getTopDownstreamBlocked(this.dm),
      hourlyTrend: this.dataService.getHourlyTrend(this.dm),
    }).subscribe({
      next: (data) => {
        this.processSummary(data.summary);
        this.processAlertStatusDonut(data.summary);
        this.processPriorityDonut(data.byPriority);
        this.processDownstream(data.topDownstream);
        this.processThroughput(data.hourlyTrend);
        this.processAlerts(data.alerts);
        this.loading = false;
        this.lastUpdated = new Date().toLocaleString();
      },
      error: () => {
        this.loading = false;
        this.lastUpdated = 'Error refreshing data';
      },
    });
  }

  // ─── Data Processing ──────────────────────────────────────────────

  private processSummary(s: CtmSummary): void {
    this.kpiTotal = s.TOTAL || 0;
    this.kpiPending = s.PENDING || 0;
    this.kpiResolved = s.RESOLVED || 0;
    this.kpiP1 = s.P1 || 0;
    this.kpiP2 = s.P2 || 0;
    this.kpiFailed = s.FAILED || 0;
    this.kpiDelayed = s.DELAYED || 0;
    this.kpiLateStart = s.LATE_START || 0;
  }

  private processAlertStatusDonut(summary: CtmSummary): void {
    const pending = summary.PENDING || 0;
    const resolved = summary.RESOLVED || 0;
    this.alertTypeTotal = pending + resolved;
    this.alertTypeData = {
      labels: ['Pending', 'Resolved'],
      values: [pending, resolved],
      colors: [
        this.alertStatusColors['Pending'],
        this.alertStatusColors['Resolved'],
      ],
    };
    this.alertTypeChartOptions = this.buildDonutOptions(
      this.alertTypeData,
      this.alertTypeTotal,
      'alerts',
    );
  }

  private processPriorityDonut(data: CtmDistribution[]): void {
    this.priorityTotal = data.reduce((sum, d) => sum + (d.CNT || 0), 0);
    this.priorityData = {
      labels: data.map((d) => d.PRIORITY_LEVEL || 'None'),
      values: data.map((d) => d.CNT || 0),
      colors: data.map(
        (d) => this.priorityColors[d.PRIORITY_LEVEL || 'None'] || '#888',
      ),
    };
    this.priorityChartOptions = this.buildDonutOptions(
      this.priorityData,
      this.priorityTotal,
      'total',
    );
  }

  private buildDonutOptions(
    data: { labels: string[]; values: number[]; colors: string[] },
    total: number,
    subtitle: string,
  ): EChartsOption {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const pct =
            total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
          return `${params.name}: ${params.value} (${pct}%)`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['68%', '100%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: `{val|${total}}\n{sub|${subtitle.toUpperCase()}}`,
            rich: {
              val: {
                fontSize: 22,
                fontWeight: 700,
                color: this.themeService.isDarkMode ? '#e0e6ed' : '#1b1c1d',
                lineHeight: 30,
              },
              sub: {
                fontSize: 10,
                fontWeight: 600,
                color: this.themeService.isDarkMode ? '#8899a6' : '#555',
                lineHeight: 18,
              },
            },
          },
          labelLine: { show: false },
          data: data.labels.map((label, i) => ({
            name: label,
            value: data.values[i],
            itemStyle: { color: data.colors[i] },
          })),
        },
      ],
    };
  }

  private processDownstream(data: CtmDownstreamBlocked[]): void {
    const maxVal = Math.max(
      ...data.map((d) => d.DOWNSTREAM_BLOCKED_COUNT || 0),
      1,
    );
    this.downstreamBars = data.map((d) => ({
      label: d.JOB_NAME || 'N/A',
      value: d.DOWNSTREAM_BLOCKED_COUNT || 0,
      pct: ((d.DOWNSTREAM_BLOCKED_COUNT || 0) / maxVal) * 100,
      color: '#00bceb',
    }));
  }

  private processThroughput(data: CtmHourlyTrend[]): void {
    const sliced = (data || []).slice(0, 12).reverse();

    this.throughputPoints = sliced.map((d) => {
      const label = d.ALERT_HOUR
        ? new Date(d.ALERT_HOUR).toLocaleTimeString([], {
            hour: 'numeric',
            hour12: true,
          })
        : 'N/A';
      return { label, value: d.TOTAL_ALERTS || 0 };
    });

    const labels = this.throughputPoints.map((p) => p.label);
    const values = this.throughputPoints.map((p) => p.value);

    this.throughputChartOptions = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20, 30, 40, 0.85)',
        borderColor: 'rgba(0, 188, 235, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#00bceb', fontSize: 14, fontWeight: 'bold' },
      },
      grid: { top: 10, right: 10, bottom: 24, left: 36, containLabel: false },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: this.themeService.isDarkMode ? '#8899a6' : '#555',
          interval: 1,
        },
      },
      yAxis: {
        type: 'value',
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: this.themeService.isDarkMode ? '#8899a6' : '#555',
        },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 7,
          itemStyle: { color: '#00bceb' },
          lineStyle: { width: 2.5, color: '#00bceb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 188, 235, 0.35)' },
              { offset: 1, color: 'rgba(0, 188, 235, 0)' },
            ]),
          },
        },
      ],
    };
  }

  private processAlerts(data: CtmAlertRow[]): void {
    this.allAlerts = data || [];
    this.applicationOptions = [
      ...new Set(this.allAlerts.map((a) => a.APPLICATION).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
    this.applyFilters();
  }

  // ─── Filters / Sort / Pagination ──────────────────────────────────

  applyFilters(): void {
    let filtered = this.allAlerts;
    if (this.filterStatus) {
      filtered = filtered.filter((a) => a.STATUS === this.filterStatus);
    }
    if (this.filterPriority) {
      filtered = filtered.filter((a) => a.PRIORITY === this.filterPriority);
    }
    if (this.filterType) {
      filtered = filtered.filter((a) => a.ALERT_TYPE === this.filterType);
    }
    if (this.filterApp) {
      filtered = filtered.filter((a) => a.APPLICATION === this.filterApp);
    }
    if (this.filterSearch) {
      const q = this.filterSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.JOB_NAME || '').toLowerCase().includes(q) ||
          (a.APPLICATION || '').toLowerCase().includes(q) ||
          (a.SUB_APPLICATION || '').toLowerCase().includes(q),
      );
    }

    // Sort
    filtered = filtered.slice().sort((a, b) => {
      const va = (a as any)[this.sortKey];
      const vb = (b as any)[this.sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp =
        typeof va === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortAsc ? cmp : -cmp;
    });

    this.filteredAlerts = filtered;
    this.currentPage = 1;
    this.updatePage();
  }

  sortBy(key: string): void {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }
    this.applyFilters();
  }

  sortArrow(key: string): string {
    if (this.sortKey !== key) return 'phosphorCaretDownBold';
    return this.sortAsc ? 'phosphorCaretUpBold' : 'phosphorCaretDownBold';
  }

  updatePage(): void {
    const total = this.filteredAlerts.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedAlerts = this.filteredAlerts.slice(start, start + this.pageSize);
  }

  changePage(delta: number): void {
    this.currentPage += delta;
    this.updatePage();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.updatePage();
  }

  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredAlerts.length,
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  formatDate(val: string | null): string {
    if (!val) return '—';
    return new Date(val).toLocaleString();
  }

  formatShortDate(val: string | null): string {
    if (!val) return '—';
    const d = new Date(val);
    return (
      d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  }

  // ─── Modal ────────────────────────────────────────────────────────

  openDetailModal(row: CtmAlertRow, tab: 'log' | 'command' | 'output'): void {
    this.modalRow = row;
    this.modalTab = tab;
    this.modalTitle = row.JOB_NAME;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalRow = null;
  }

  get modalContent(): string {
    if (!this.modalRow) return '';
    switch (this.modalTab) {
      case 'log':
        return this.modalRow.JOB_LOG || 'No log available';
      case 'command':
        return this.modalRow.JOB_COMMAND || 'No command available';
      case 'output':
        return this.modalRow.JOB_OUTPUT || 'No output available';
    }
  }
}
