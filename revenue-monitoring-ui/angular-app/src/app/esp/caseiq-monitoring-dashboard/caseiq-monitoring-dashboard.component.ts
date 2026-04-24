import {
  Component,
  OnInit,
  OnDestroy,
  HostBinding,
  HostListener,
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
  phosphorArrowLineDownBold,
} from '@ng-icons/phosphor-icons/bold';
import { phosphorEmptyDuotone } from '@ng-icons/phosphor-icons/duotone';
import { forkJoin, interval, Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

Chart.register(...registerables);

import { DestroyManager } from '../../providers/destroy-manager.service';
import { DataService, PeriodStatus } from '../../providers/data.service';
import { CaseiqMonitoringDataService } from './caseiq-monitoring-data.service';
import { HealthRingComponent } from './health-ring/health-ring.component';
import {
  HealthOverview,
  AnomalyItem,
  AnomalyBreakdownItem,
  StatusDistribution,
  TeamSummary,
  ThroughputEntry,
  ErrorCategory,
  TeamIssueMatrixEntry,
  P90ProcessingTime,
} from './caseiq-monitoring.models';
import { LineChartComponent } from './line-chart/line-chart.component';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';

@Component({
  selector: 'app-caseiq-monitoring-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    NgChartsModule,
    HealthRingComponent,
    LineChartComponent,
    LoadingSymbolComponent,
  ],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorSunBold,
      phosphorMoonBold,
      phosphorArrowLineDownBold,
      phosphorEmptyDuotone,
    }),
  ],
  templateUrl: './caseiq-monitoring-dashboard.component.html',
  styleUrls: ['./caseiq-monitoring-dashboard.component.css'],
})
export class CaseiqMonitoringDashboardComponent implements OnInit, OnDestroy {
  @HostBinding('class.dark-theme') isDarkMode = false;

  // Controls
  lookbackHours = 24;
  fiscQtr = '';
  lookbackOptions = [
    { value: 0, label: '—' },
    { value: 12, label: 'Last 12 hours' },
    { value: 24, label: 'Last 24 hours' },
    { value: 72, label: 'Last 3 days' },
    { value: 168, label: 'Last 7 days' },
  ];
  fiscQtrOptions: string[] = [];

  // Period info (from shared DataService)
  periodStatus: PeriodStatus | null = null;

  // State
  loading = true;
  initialLoad = true;
  lastUpdated = '';

  // Health
  healthScore = 0;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA';
  healthMeta = '';
  healthTotalIncidents = 0;
  healthSuccessPct = 0;
  healthErrorPct = 0;
  healthSuccessCount = 0;
  healthErrorCount = 0;
  healthData: HealthOverview | null = null;

  // KPIs
  kpiIssues = '-';
  kpiSuccessRate = '-';
  kpiAgents = '81';
  kpiTokens = 'TBD';
  kpiAvgTime = 'TBD';
  kpiStaleness = '-';
  kpiGhost = '-';
  kpiNotSupported = '-';

  // Anomaly breakdown
  anomalyBreakdown: AnomalyBreakdownItem[] = [];
  teamIssueMatrix: TeamIssueMatrixEntry[] = [];

  // Drilldown modal
  drilldownOpen = false;
  drilldownInsufficient = false;
  drilldownTitle = '';
  drilldownSubtitle = '';
  drilldownPoints: { label: string; value: number }[] = [];

  // Resolution status bars
  statusBars: {
    label: string;
    value: number;
    pct: number;
    color: string;
    displayText: string;
  }[] = [];

  // Team success bars
  teamBars: {
    label: string;
    value: number;
    pct: number;
    color: string;
    displayText: string;
  }[] = [];

  // Throughput bars (unused — kept for backward compat)
  throughputBars: {
    label: string;
    value: number;
    pct: number;
    color: string;
    displayText: string;
  }[] = [];

  // Throughput line chart (Chart.js)
  throughputIsWeekly = false;
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
    console.log('[CIQ-CHART] ViewChild setter:', {
      hasRef: !!ref,
      pending: this._throughputChartPending,
    });
    if (ref && this._throughputChartPending) {
      this._throughputChartPending = false;
      this.createThroughputChart(ref.nativeElement);
    }
  }

  // Tables
  teamTableData: TeamSummary[] = [];
  errorTableData: ErrorCategory[] = [];
  anomalyTableData: AnomalyItem[] = [];

  // Error Incidents filters
  errorFilterTeam = '';
  errorFilterIssue = '';
  errorTeamOptions: string[] = [
    'OM',
    'SM',
    'I2C',
    'AIT',
    'FPP',
    'P2P',
    'CAPITAL',
  ];
  errorIssueOptions: string[] = [
    'Ghost Success',
    'Not Defined',
    'No Resolution',
    'Exception',
    'Null Classification',
    'Unknown Team',
    'Resolution Error',
  ];

  // Error Incidents pagination (server-side)
  errorCurrentPage = 1;
  errorPageSize = 25;
  errorTotalPages = 1;
  errorTotalCount = 0;
  errorLoading = false;
  errorFilteredRows: AnomalyItem[] = [];

  // CSV download progress
  csvDownloading = false;
  csvDownloadProgress = 0;
  csvDownloadDone = false;

  // Status color map — aligned with analytics palette
  statusColors: Record<string, string> = {
    SUCCESS: '#6ebe4a',
    'PARTIAL SUCCESS': '#e6a800',
    ERROR: '#e53935',
    FAILURE: '#cd3d64',
    Unknown: '#c45200',
    NOT_SUPPORTED: '#9933ff',
  };

  // Dynamic icon class based on health status
  get healthIconClass(): string {
    switch (this.healthStatus) {
      case 'HEALTHY':
        return 'ciq-card-icon--green';
      case 'WARNING':
        return 'ciq-card-icon--orange';
      case 'CRITICAL':
        return 'ciq-card-icon--red';
      default:
        return 'ciq-card-icon--blue';
    }
  }

  private refreshSub?: Subscription;

  constructor(
    private dataService: CaseiqMonitoringDataService,
    private sharedDataService: DataService,
    private dm: DestroyManager,
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
    this.dataService.getQuarters(this.dm).subscribe({
      next: (quarters) => {
        this.fiscQtrOptions = quarters || [];
      },
    });
    this.refreshAll();
    this.refreshSub = interval(300000).subscribe(() => this.refreshAll());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.throughputChart?.destroy();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.updateThroughputChartTheme();
  }

  private updateThroughputChartTheme(): void {
    if (!this.throughputChart) return;
    const tickColor = this.isDarkMode ? '#8899a6' : '#555';
    const xScale = this.throughputChart.options.scales?.['x'];
    const yScale = this.throughputChart.options.scales?.['y'];
    if (xScale?.ticks) xScale.ticks.color = tickColor;
    if (yScale?.ticks) yScale.ticks.color = tickColor;
    this.throughputChart.update();
  }

  onFilterChange(): void {
    this.initialLoad = true;
    this.errorFilterTeam = '';
    this.errorFilterIssue = '';
    this.errorCurrentPage = 1;
    this.refreshAll();
  }

  onQuarterChange(): void {
    if (this.fiscQtr) {
      this.lookbackHours = 0;
    }
    this.onFilterChange();
  }

  onLookbackChange(): void {
    if (!this.lookbackHours) return; // ignore "—" selection
    this.fiscQtr = '';
    this.onFilterChange();
  }

  refreshAll(): void {
    if (this.initialLoad) {
      this.loading = true;
      // Destroy chart before DOM is removed — canvas will be recreated
      if (this.throughputChart) {
        console.log(
          '[CIQ-CHART] Destroying chart before loading (DOM will be removed)',
        );
        this.throughputChart.destroy();
        this.throughputChart = null;
      }
    }
    // Refetch period status on every refresh
    this.sharedDataService.loadPeriodStatus(this.dm);

    // Refetch quarters (preserve existing if call fails)
    this.dataService.getQuarters(this.dm).subscribe({
      next: (quarters) => {
        if (quarters && quarters.length) {
          this.fiscQtrOptions = quarters;
        }
      },
    });

    const lb = this.lookbackHours;
    const fq = this.fiscQtr || undefined;

    forkJoin({
      health: this.dataService.getHealth(this.dm, lb, fq),
      status: this.dataService.getResolutionDistribution(this.dm, lb, fq),
      teamSummary: this.dataService.getTeamSummary(this.dm, lb, fq),
      throughput: this.dataService.getThroughput(this.dm, fq ? lb : 24, fq),
      topErrors: this.dataService.getTopErrors(this.dm, lb, fq),
      teamIssueMatrix: this.dataService.getTeamIssueMatrix(this.dm, lb, fq),
      p90Time: this.dataService.getP90Time(this.dm, lb, fq),
    }).subscribe({
      next: (data) => {
        this.teamIssueMatrix = data.teamIssueMatrix || [];
        this.processHealth(data.health);
        this.processP90Time(data.p90Time);
        this.processStatusBars(data.status);
        this.processTeamData(data.teamSummary);
        this.processThroughput(data.throughput, fq);
        this.errorTableData = data.topErrors || [];
        this.loading = false;
        this.initialLoad = false;
        this.lastUpdated = new Date().toLocaleString();

        // Load error incidents separately (server-side paginated)
        // Skip reload if user has active filters (don't disrupt their work)
        const hasActiveFilters =
          !!this.errorFilterTeam || !!this.errorFilterIssue;
        if (!hasActiveFilters) {
          this.loadErrorIncidents();
        }
      },
      error: (err) => {
        console.error('[CIQ] forkJoin ERROR:', err);
        this.loading = false;
        this.initialLoad = false;
        this.lastUpdated = 'Error refreshing data';
      },
    });
  }

  private processHealth(h: HealthOverview): void {
    this.healthData = h;
    this.healthScore = h.health_score || 0;
    this.healthStatus = h.health_status || 'NO_DATA';

    const notSupported = h.NOT_SUPPORTED_CNT || 0;
    const totalProcessed = h.TOTAL_PROCESSED || 0;
    const successPct = Number(h.success_rate_pct || 0);
    const errorPct = Number(h.error_rate_pct || 0);
    const avgTime =
      h.AVG_PROCESSING_MINUTES && h.AVG_PROCESSING_MINUTES > 0
        ? `${h.AVG_PROCESSING_MINUTES} min`
        : // : 'N/A';
          'TBD';
    this.healthMeta =
      `Processed: ${totalProcessed.toLocaleString()} (${notSupported} NOT_SUPPORTED)<br>` +
      `Success: ${successPct}% · Errors: ${errorPct}%<br>` +
      `Avg Time: ${avgTime}`;

    // Health ring: success = SUCCESS + PARTIAL + NOT_SUPPORTED; failures = total − success
    const successCount =
      (h.SUCCESS_CNT || 0) + (h.PARTIAL_CNT || 0) + (h.NOT_SUPPORTED_CNT || 0);
    const failCount = totalProcessed - successCount;
    const failPct =
      totalProcessed > 0
        ? Math.round((failCount / totalProcessed) * 1000) / 10
        : 0;
    this.healthTotalIncidents = totalProcessed;
    this.healthSuccessPct = successPct;
    this.healthErrorPct = failPct;
    this.healthSuccessCount = successCount;
    this.healthErrorCount = failCount;

    // KPI: Issues = anomaly categories + fail count (matches Python loadHealth)
    const issuesCount =
      (h.GHOST_SUCCESS_CNT || 0) +
      (h.NOT_DEFINED_CNT || 0) +
      (h.NULL_CATEGORY_CNT || 0) +
      (h.UNKNOWN_TEAM_CNT || 0) +
      (h.EXCEPTION_CNT || 0) +
      failCount;

    this.kpiIssues = issuesCount.toLocaleString();
    this.kpiSuccessRate = `${successPct}%`;
    this.kpiStaleness =
      h.MINUTES_SINCE_LAST_RUN != null
        ? String(h.MINUTES_SINCE_LAST_RUN)
        : 'N/A';
    this.kpiGhost = (h.GHOST_SUCCESS_CNT || 0).toLocaleString();
    this.kpiNotSupported = (h.NOT_SUPPORTED_CNT || 0).toLocaleString();

    // Issues Breakdown: 6 categories derived from health query (mirrors Python loadHealth)
    const allIssues: AnomalyBreakdownItem[] = [
      {
        name: 'SUCCESS but missing summary/context',
        count: h.GHOST_SUCCESS_CNT || 0,
        severity: 'critical',
        issueKey: 'GHOST_SUCCESS',
      },
      {
        name: 'LLM Summary is "Not Defined"',
        count: h.NOT_DEFINED_CNT || 0,
        severity: 'warning',
        issueKey: 'NOT_DEFINED',
      },
      {
        name: 'category or core_issue is NULL',
        count: h.NULL_CATEGORY_CNT || 0,
        severity: 'warning',
        issueKey: 'NULL_CLASSIFICATION',
      },
      {
        name: 'team_name is "UNKNOWN"',
        count: h.UNKNOWN_TEAM_CNT || 0,
        severity: 'warning',
      },
      {
        name: 'CaseIQ errored (category=ERROR or exception in fields)',
        count: h.EXCEPTION_CNT || 0,
        severity: 'critical',
        issueKey: 'EXCEPTIONS',
      },
      {
        name: 'resolution_api_status is ERROR/FAILURE/Unknown/NULL',
        count: failCount,
        severity: 'critical',
        issueKey: 'RESOLUTION_FAILURES',
      },
    ];
    this.anomalyBreakdown = allIssues.filter((a) => a.count > 0);
  }

  private processP90Time(data: P90ProcessingTime): void {
    const secs = data?.P90_PROCESSING_SECS;
    if (secs && secs > 0) {
      const mins = Math.round((secs / 60) * 10) / 10;
      this.kpiAvgTime = String(mins);
    } else {
      this.kpiAvgTime = 'N/A';
    }
  }

  private processStatusBars(data: StatusDistribution[]): void {
    const maxVal = Math.max(...data.map((d) => d.CNT || 0), 1);
    this.statusBars = data.map((d) => {
      const label = d.RESOLUTION_API_STATUS || 'NULL';
      const value = d.CNT || 0;
      const pct = (value / maxVal) * 100;
      const color = this.statusColors[label] || '#2979ff';
      const displayPct = d.PCT != null ? d.PCT : 0;
      return {
        label,
        value,
        pct,
        color,
        displayText: `${value} (${displayPct}%)`,
      };
    });
  }

  private processTeamData(data: TeamSummary[]): void {
    this.teamTableData = data || [];

    this.teamBars = (data || []).map((d) => {
      const label = d.TEAM_NAME || 'N/A';
      const rate = d.SUCCESS_RATE_PCT || 0;
      const color = rate >= 80 ? '#6ebe4a' : rate >= 50 ? '#e6a800' : '#e53935';
      const success = d.SUCCESS || 0;
      const total = d.TOTAL_RECORDS || 0;
      return {
        label,
        value: rate,
        pct: rate,
        color,
        displayText: `${rate}% (${success}/${total})`,
      };
    });
  }

  private processThroughput(data: ThroughputEntry[], fiscQtr?: string): void {
    const raw = (data || []).slice().reverse(); // oldest → newest
    console.log('[CIQ-CHART] processThroughput:', {
      rawCount: (data || []).length,
      fiscQtr,
      firstRow: (data || [])[0],
    });

    if (fiscQtr) {
      // Weekly mode — need at least 2 weeks for a meaningful chart
      if (raw.length <= 1) {
        console.log(
          '[CIQ-CHART] Quarter has insufficient weekly data, showing empty state',
        );
        this.throughputIsWeekly = true;
        this.throughputPoints = [];
        return;
      }
      this.buildThroughputChart(raw, true);
    } else {
      // Hourly mode — take last 12 points
      this.buildThroughputChart(raw.slice(-12), false);
    }
  }

  private buildThroughputChart(
    points: ThroughputEntry[],
    weekly: boolean,
  ): void {
    this.throughputIsWeekly = weekly;
    console.log('[CIQ-CHART] buildThroughputChart:', {
      pointCount: points.length,
      weekly,
      chartExists: !!this.throughputChart,
      canvasInDOM: !!this.throughputChart?.canvas?.isConnected,
    });

    this.throughputPoints = points.map((d, i) => {
      let label: string;
      if (weekly) {
        label = `W${i + 1}`;
      } else {
        label = d.RUN_HOUR
          ? new Date(d.RUN_HOUR).toLocaleTimeString([], {
              hour: 'numeric',
              hour12: true,
            })
          : 'N/A';
      }
      return { label, value: d.CASES_PROCESSED || 0 };
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
      interaction: {
        intersect: false,
        mode: 'index',
      },
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
            label: (item) => item.parsed.y.toLocaleString(),
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

    // Update existing chart in-place, or flag for creation if canvas isn't in DOM yet
    if (this.throughputChart && this.throughputChart.canvas?.isConnected) {
      console.log('[CIQ-CHART] Updating existing chart in-place');
      this.throughputChart.data = this.throughputChartData;
      this.throughputChart.options = this.throughputChartOptions!;
      this.throughputChart.update();
    } else {
      if (this.throughputChart) {
        console.log(
          '[CIQ-CHART] Old chart exists but canvas detached — destroying',
        );
        this.throughputChart.destroy();
        this.throughputChart = null;
      }
      console.log(
        '[CIQ-CHART] Flagging chart for creation (pending ViewChild)',
      );
      this._throughputChartPending = true;
    }
  }

  private createThroughputChart(canvas: HTMLCanvasElement): void {
    console.log('[CIQ-CHART] Creating new Chart on canvas:', {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      labels: this.throughputChartData.labels,
      dataLen: this.throughputChartData.datasets?.[0]?.data?.length,
    });
    this.throughputChart = new Chart(canvas, {
      type: 'line',
      data: this.throughputChartData,
      options: this.throughputChartOptions,
    });
  }

  // ─── Server-side paginated Error Incidents ────────────────────────────────

  loadErrorIncidents(): void {
    this.errorLoading = true;
    const lb = this.lookbackHours;
    const fq = this.fiscQtr || undefined;
    const team = this.errorFilterTeam || undefined;
    const issue = this.errorFilterIssue || undefined;

    this.dataService
      .getErrorIncidentsPaged(
        this.dm,
        lb,
        this.errorCurrentPage,
        this.errorPageSize,
        fq,
        team,
        issue,
      )
      .subscribe({
        next: (page) => {
          this.anomalyTableData = (page.rows || []).map((r: any) => ({
            ...r,
            anomalyLabel: r.ANOMALY_LABEL,
          }));
          this.errorTotalCount = page.totalCount || 0;
          this.errorTotalPages = Math.max(
            1,
            Math.ceil(this.errorTotalCount / this.errorPageSize),
          );
          this.errorFilteredRows = this.anomalyTableData;

          this.errorLoading = false;
        },
        error: () => {
          this.errorLoading = false;
        },
      });
  }

  applyErrorFilters(): void {
    this.errorCurrentPage = 1;
    this.loadErrorIncidents();
  }

  updateErrorPage(): void {
    // no-op — server handles pagination
  }

  errorChangePage(delta: number): void {
    this.errorCurrentPage += delta;
    this.loadErrorIncidents();
  }

  errorChangePageSize(size: number): void {
    this.errorPageSize = size;
    this.errorCurrentPage = 1;
    this.loadErrorIncidents();
  }

  get errorPageStart(): number {
    return this.errorTotalCount === 0
      ? 0
      : (this.errorCurrentPage - 1) * this.errorPageSize + 1;
  }

  get errorPageEnd(): number {
    return Math.min(
      this.errorCurrentPage * this.errorPageSize,
      this.errorTotalCount,
    );
  }

  downloadErrorCsv(): void {
    if (this.csvDownloading) return;
    this.csvDownloading = true;
    this.csvDownloadProgress = 0;
    this.csvDownloadDone = false;

    const lb = this.lookbackHours;
    const fq = this.fiscQtr || undefined;
    const team = this.errorFilterTeam || undefined;
    const issue = this.errorFilterIssue || undefined;
    const total = this.errorTotalCount;

    if (total === 0) {
      this.csvDownloading = false;
      return;
    }

    const chunkSize = 500;
    const totalPages = Math.ceil(total / chunkSize);
    const allRows: any[] = [];
    let completedPages = 0;

    const fetchPage = (page: number) => {
      this.dataService
        .getErrorIncidentsPaged(this.dm, lb, page, chunkSize, fq, team, issue)
        .subscribe({
          next: (result) => {
            allRows.push(...(result.rows || []));
            completedPages++;
            this.csvDownloadProgress = Math.round(
              (completedPages / totalPages) * 100,
            );

            if (completedPages >= totalPages) {
              this.generateCsvDownload(allRows);
              this.csvDownloadDone = true;
              setTimeout(() => {
                this.csvDownloading = false;
                this.csvDownloadProgress = 0;
                this.csvDownloadDone = false;
              }, 800);
            } else {
              fetchPage(page + 1);
            }
          },
          error: () => {
            this.csvDownloading = false;
            this.csvDownloadProgress = 0;
          },
        });
    };

    fetchPage(1);
  }

  private generateCsvDownload(allRows: any[]): void {
    const headers = [
      'Incident',
      'Team',
      'Category',
      'Core Issue',
      'LLM Summary',
      'Issue Description',
      'Run Date',
    ];
    const csvRows = allRows.map((r: any) =>
      [
        r.INCIDENT_NUMBER || '',
        r.TEAM_NAME || '',
        r.CATEGORY || '',
        r.CORE_ISSUE || '',
        r.LLM_SUMMARY || '',
        r.ANOMALY_LABEL || '',
        r.CASEIQ_RUN_DATE || '',
      ]
        .map((v: string) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error_incidents_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  severityClass(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'badge-critical';
      case 'warning':
        return 'badge-warning';
      case 'ok':
        return 'badge-ok';
      default:
        return '';
    }
  }

  countColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'var(--ciq-red)';
      case 'warning':
        return 'var(--ciq-yellow)';
      case 'ok':
        return 'var(--ciq-green)';
      default:
        return '';
    }
  }

  formatDate(val: string): string {
    if (!val) return 'N/A';
    return new Date(val).toLocaleString();
  }

  getTeamChips(
    issueKey: string,
  ): { team: string; count: number; rawTeam: string }[] {
    if (!issueKey || !this.teamIssueMatrix.length) return [];
    return this.teamIssueMatrix
      .map((entry) => ({
        team: entry.TEAM_NAME === 'UNKNOWN' ? 'N/A' : entry.TEAM_NAME,
        rawTeam: entry.TEAM_NAME,
        count: (entry as unknown as Record<string, number>)[issueKey] || 0,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  openDrilldown(
    team: string,
    issueType: string,
    issueLabel: string,
    rawTeam?: string,
  ): void {
    this.drilldownTitle = `${issueLabel} — ${team}`;
    this.drilldownSubtitle = '';
    this.drilldownOpen = true;
    this.drilldownPoints = [];
    this.drilldownInsufficient = false;
    const fq = this.fiscQtr || undefined;
    this.dataService
      .getIssueTrend(this.dm, rawTeam || team, issueType, fq)
      .subscribe({
        next: (data) => {
          const pts = (data || []).map((d, i) => ({
            label: `W${i + 1}`,
            value: d.ISSUE_COUNT,
          }));
          const total = pts.reduce((s, p) => s + p.value, 0);
          const qtrLabel =
            this.fiscQtr ||
            this.fiscQtrOptions[this.fiscQtrOptions.length - 1] ||
            '';
          this.drilldownSubtitle = qtrLabel
            ? `WEEKLY TREND — ${qtrLabel} -  TOTAL: ${total}`
            : `WEEKLY TREND — TOTAL: ${total}`;

          if (pts.length < 2) {
            console.warn('[CIQ] Drilldown data insufficient for chart:', {
              team: rawTeam || team,
              issueType,
              fiscQtr: fq,
              rawData: data,
              points: pts,
            });
            this.drilldownInsufficient = true;
            this.drilldownPoints = [];
          } else {
            this.drilldownPoints = pts;
          }
        },
      });
  }

  closeDrilldown(): void {
    this.drilldownOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.drilldownOpen) this.closeDrilldown();
  }
}
