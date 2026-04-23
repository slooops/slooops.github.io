import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostBinding,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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

Chart.register(...registerables);

@Component({
  selector: 'app-ctm-alerts-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [
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
export class CtmAlertsDashboardComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @HostBinding('class.dark-theme') isDarkMode = false;

  // State
  loading = true;
  lastUpdated = '';
  guideOpen = false;
  periodStatus: PeriodStatus | null = null;
  private chartsReady = false;

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
  private alertTypeChart?: Chart<'doughnut'>;
  private priorityChart?: Chart<'doughnut'>;

  // Bar chart
  downstreamBars: {
    label: string;
    value: number;
    pct: number;
    color: string;
  }[] = [];

  // Throughput line chart (Chart.js)
  throughputPoints: { label: string; value: number }[] = [];
  throughputChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  throughputChartOptions: ChartConfiguration<'line'>['options'] = {};
  private throughputChart: Chart<'line'> | null = null;
  private _throughputChartPending = false;

  @ViewChild('throughputCanvas')
  set throughputCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref && this._throughputChartPending) {
      this._throughputChartPending = false;
      this.createThroughputChart(ref.nativeElement);
    }
  }

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

  ngAfterViewInit(): void {
    this.chartsReady = true;
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.alertTypeChart?.destroy();
    this.priorityChart?.destroy();
    this.throughputChart?.destroy();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  refreshAll(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }
    forkJoin({
      alerts: this.dataService.getAllAlerts(this.dm),
      summary: this.dataService.getSummary(this.dm),
      byType: this.dataService.getAlertTypeDistribution(this.dm),
      byPriority: this.dataService.getPriorityDistribution(this.dm),
      topDownstream: this.dataService.getTopDownstreamBlocked(this.dm),
      hourlyTrend: this.dataService.getHourlyTrend(this.dm),
    }).subscribe({
      next: (data) => {
        this.processSummary(data.summary);
        this.processAlertTypeDonut(data.byType);
        this.processPriorityDonut(data.byPriority);
        this.processDownstream(data.topDownstream);
        this.processThroughput(data.hourlyTrend);
        this.processAlerts(data.alerts);
        this.loading = false;
        this.lastUpdated = new Date().toLocaleString();
        // Render charts after Angular updates the DOM (canvas must exist)
        setTimeout(() => this.renderAllCharts());
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

  private processAlertTypeDonut(data: CtmDistribution[]): void {
    this.alertTypeTotal = data.reduce((sum, d) => sum + (d.CNT || 0), 0);
    this.alertTypeData = {
      labels: data.map((d) => d.ALERT_TYPE || 'Unknown'),
      values: data.map((d) => d.CNT || 0),
      colors: data.map(
        (d) => this.alertTypeColors[d.ALERT_TYPE || ''] || '#888',
      ),
    };
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
  }

  private renderAllCharts(): void {
    this.renderDonut(
      'alertTypeCanvas',
      this.alertTypeData,
      this.alertTypeTotal,
      'alerts',
      'alertType',
    );
    this.renderDonut(
      'priorityCanvas',
      this.priorityData,
      this.priorityTotal,
      'total',
      'priority',
    );
    // Rebuild throughput line chart
    this.throughputChart?.destroy();
    this.throughputChart = null;
    const canvas = document.getElementById(
      'throughputCanvas',
    ) as HTMLCanvasElement;
    if (canvas) {
      this.createThroughputChart(canvas);
    }
  }

  private renderDonut(
    canvasId: string,
    data: { labels: string[]; values: number[]; colors: string[] },
    total: number,
    subtitle: string,
    type: 'alertType' | 'priority',
  ): void {
    // Destroy existing chart
    if (type === 'alertType') {
      this.alertTypeChart?.destroy();
      this.alertTypeChart = undefined;
    } else {
      this.priorityChart?.destroy();
      this.priorityChart = undefined;
    }

    // Wait for DOM
    setTimeout(() => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isDark = this.isDarkMode;
      const textColor = isDark ? '#e0e6ed' : '#1b1c1d';
      const mutedColor = isDark ? '#8899a6' : '#555';

      const chart = new Chart<'doughnut'>(ctx, {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [
            {
              data: data.values,
              backgroundColor: data.colors,
              borderWidth: 2,
              borderColor: isDark ? '#1a2733' : '#ffffff',
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => {
                  const pct =
                    total > 0
                      ? (((c.raw as number) / total) * 100).toFixed(1)
                      : '0';
                  return `${c.label}: ${c.raw} (${pct}%)`;
                },
              },
            },
          },
        },
        plugins: [
          {
            id: 'centerText',
            beforeDraw(chart) {
              const { width, height, ctx: c } = chart;
              if (!c) return;
              c.save();
              c.textAlign = 'center';
              c.textBaseline = 'middle';
              const cx = width / 2;
              const cy = height / 2;
              c.font = `700 ${Math.min(width, height) * 0.16}px Inter, system-ui, sans-serif`;
              c.fillStyle = textColor;
              c.fillText(String(total), cx, cy - 6);
              c.font = `600 ${Math.min(width, height) * 0.065}px Inter, system-ui, sans-serif`;
              c.fillStyle = mutedColor;
              c.fillText(subtitle.toUpperCase(), cx, cy + 14);
              c.restore();
            },
          },
        ],
      });

      if (type === 'alertType') {
        this.alertTypeChart = chart;
      } else {
        this.priorityChart = chart;
      }
    });
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

    this.throughputChartData = {
      labels,
      datasets: [
        {
          data: values,
          borderColor: '#00bceb',
          borderWidth: 2.5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#00bceb',
          pointBorderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 5.5,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#00bceb',
          pointHoverBorderWidth: 2.5,
          tension: 0.4,
          fill: true,
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return 'rgba(0, 188, 235, 0.1)';
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, 'rgba(0, 188, 235, 0.35)');
            gradient.addColorStop(1, 'rgba(0, 188, 235, 0)');
            return gradient;
          },
        },
      ],
    };

    this.throughputChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(20, 30, 40, 0.85)',
          titleFont: { size: 10, weight: 'normal' },
          titleColor: '#8899a6',
          bodyFont: { size: 14, weight: 'bold' },
          bodyColor: '#00bceb',
          borderColor: 'rgba(0, 188, 235, 0.3)',
          borderWidth: 1,
          padding: { top: 6, bottom: 6, left: 10, right: 10 },
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (item) => String(item.parsed.y),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: this.isDarkMode ? '#8899a6' : '#555',
            font: { size: 10, weight: 500 as any },
            maxRotation: 0,
            callback: function (_value, index) {
              return index % 2 === 0 ? this.getLabelForValue(index) : '';
            },
          },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: this.isDarkMode ? '#8899a6' : '#555',
            font: { size: 10, weight: 500 as any },
            maxTicksLimit: 4,
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    };

    // Don't render here — renderAllCharts() handles it after DOM is ready
  }

  private createThroughputChart(canvas: HTMLCanvasElement): void {
    this.throughputChart = new Chart(canvas, {
      type: 'line',
      data: this.throughputChartData,
      options: this.throughputChartOptions,
    });
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
