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
} from '@ng-icons/phosphor-icons/bold';
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
  ],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorSunBold,
      phosphorMoonBold,
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

  // Tables
  teamTableData: TeamSummary[] = [];
  errorTableData: ErrorCategory[] = [];
  anomalyTableData: AnomalyItem[] = [];
  private allAnomalyRows: AnomalyItem[] = [];

  // Error Incidents filters
  errorFilterTeam = '';
  errorFilterIssue = '';
  errorTeamOptions: string[] = [];
  errorIssueOptions: string[] = [];

  // Error Incidents pagination
  errorCurrentPage = 1;
  errorPageSize = 25;
  errorTotalPages = 1;
  errorFilteredRows: AnomalyItem[] = [];

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
    this.refreshSub = interval(60000).subscribe(() => this.refreshAll());
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
    this.refreshAll();
  }

  refreshAll(): void {
    if (this.initialLoad) {
      this.loading = true;
    }
    const lb = this.lookbackHours;
    const fq = this.fiscQtr || undefined;

    forkJoin({
      health: this.dataService.getHealth(this.dm, lb, fq),
      status: this.dataService.getResolutionDistribution(this.dm, lb, fq),
      teamSummary: this.dataService.getTeamSummary(this.dm, lb, fq),
      throughput: this.dataService.getThroughput(this.dm, lb, fq),
      topErrors: this.dataService.getTopErrors(this.dm, lb, fq),
      ghostSuccess: this.dataService.getGhostSuccess(this.dm, lb, fq),
      notDefined: this.dataService.getNotDefined(this.dm, lb, fq),
      nullStatus: this.dataService.getNullStatus(this.dm, lb, fq),
      exceptions: this.dataService.getExceptions(this.dm, lb, fq),
      nullClassification: this.dataService.getNullClassification(
        this.dm,
        lb,
        fq,
      ),
      unknownTeam: this.dataService.getUnknownTeam(this.dm, lb, fq),
      resolutionErrors: this.dataService.getResolutionErrors(this.dm, lb, fq),
      teamIssueMatrix: this.dataService.getTeamIssueMatrix(this.dm, lb, fq),
      p90Time: this.dataService.getP90Time(this.dm, lb, fq),
    }).subscribe({
      next: (data) => {
        this.teamIssueMatrix = data.teamIssueMatrix || [];
        this.processHealth(data.health);
        this.processP90Time(data.p90Time);
        this.processStatusBars(data.status);
        this.processTeamData(data.teamSummary);
        this.processThroughput(data.throughput);
        this.errorTableData = data.topErrors || [];
        this.processAnomalyTable(
          data.ghostSuccess,
          data.notDefined,
          data.nullStatus,
          data.exceptions,
          data.nullClassification,
          data.unknownTeam,
          data.resolutionErrors,
        );
        this.loading = false;
        this.initialLoad = false;
        this.lastUpdated = new Date().toLocaleString();
      },
      error: () => {
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
    this.healthTotalIncidents = totalProcessed;
    this.healthSuccessPct = successPct;
    this.healthErrorPct = errorPct;
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

  private processThroughput(data: ThroughputEntry[]): void {
    const sliced = (data || []).slice(0, 12).reverse(); // oldest → newest (left → right)

    this.throughputPoints = sliced.map((d) => {
      const label = d.RUN_HOUR
        ? new Date(d.RUN_HOUR).toLocaleTimeString([], {
            hour: 'numeric',
            hour12: true,
          })
        : 'N/A';
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

    // Update existing chart in-place, or flag for creation if canvas isn't in DOM yet
    if (this.throughputChart) {
      this.throughputChart.data = this.throughputChartData;
      this.throughputChart.options = this.throughputChartOptions!;
      this.throughputChart.update();
    } else {
      this._throughputChartPending = true;
    }
  }

  private createThroughputChart(canvas: HTMLCanvasElement): void {
    this.throughputChart = new Chart(canvas, {
      type: 'line',
      data: this.throughputChartData,
      options: this.throughputChartOptions,
    });
  }

  private processAnomalyTable(
    ghost: AnomalyItem[],
    notDef: AnomalyItem[],
    nullStat: AnomalyItem[],
    exceptions: AnomalyItem[],
    nullClassification: AnomalyItem[],
    unknownTeam: AnomalyItem[],
    resolutionErrors: AnomalyItem[],
  ): void {
    const rows: AnomalyItem[] = [];
    const add = (list: AnomalyItem[], label: string) =>
      (list || []).forEach((r) => rows.push({ ...r, anomalyLabel: label }));
    add(ghost, 'Ghost Success');
    add(notDef, 'Not Defined');
    add(nullStat, 'No Resolution');
    add(exceptions, 'Exception');
    add(nullClassification, 'Null Classification');
    add(unknownTeam, 'Unknown Team');
    add(resolutionErrors, 'Resolution Error');

    rows.sort((a, b) =>
      (b.CASEIQ_RUN_DATE || '').localeCompare(a.CASEIQ_RUN_DATE || ''),
    );
    this.allAnomalyRows = rows;
    this.errorTeamOptions = [
      ...new Set(rows.map((r) => r.TEAM_NAME || 'N/A')),
    ].sort();
    this.errorIssueOptions = [
      ...new Set(rows.map((r) => r.anomalyLabel || '').filter(Boolean)),
    ].sort();
    this.errorFilterTeam = '';
    this.errorFilterIssue = '';
    this.applyErrorFilters();
  }

  applyErrorFilters(): void {
    let filtered = this.allAnomalyRows;
    if (this.errorFilterTeam) {
      filtered = filtered.filter(
        (r) => (r.TEAM_NAME || 'N/A') === this.errorFilterTeam,
      );
    }
    if (this.errorFilterIssue) {
      filtered = filtered.filter(
        (r) => r.anomalyLabel === this.errorFilterIssue,
      );
    }
    this.errorFilteredRows = filtered;
    this.errorCurrentPage = 1;
    this.updateErrorPage();
  }

  updateErrorPage(): void {
    const total = this.errorFilteredRows.length;
    this.errorTotalPages = Math.max(1, Math.ceil(total / this.errorPageSize));
    if (this.errorCurrentPage > this.errorTotalPages)
      this.errorCurrentPage = this.errorTotalPages;
    const start = (this.errorCurrentPage - 1) * this.errorPageSize;
    this.anomalyTableData = this.errorFilteredRows.slice(
      start,
      start + this.errorPageSize,
    );
  }

  errorChangePage(delta: number): void {
    this.errorCurrentPage += delta;
    this.updateErrorPage();
  }

  errorChangePageSize(size: number): void {
    this.errorPageSize = size;
    this.errorCurrentPage = 1;
    this.updateErrorPage();
  }

  get errorPageStart(): number {
    return this.errorFilteredRows.length === 0
      ? 0
      : (this.errorCurrentPage - 1) * this.errorPageSize + 1;
  }

  get errorPageEnd(): number {
    return Math.min(
      this.errorCurrentPage * this.errorPageSize,
      this.errorFilteredRows.length,
    );
  }

  downloadErrorCsv(): void {
    const headers = [
      'Incident',
      'Team',
      'Category',
      'Core Issue',
      'LLM Summary',
      'Issue Description',
      'Run Date',
    ];
    const rows = this.errorFilteredRows.map((r) =>
      [
        r.INCIDENT_NUMBER || '',
        r.TEAM_NAME || '',
        r.CATEGORY || '',
        r.CORE_ISSUE || '',
        r.LLM_SUMMARY || '',
        r.anomalyLabel || r.ANOMALY_TYPE || '',
        r.CASEIQ_RUN_DATE || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
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
    const fq = this.fiscQtr || undefined;
    this.dataService
      .getIssueTrend(this.dm, rawTeam || team, issueType, fq)
      .subscribe({
        next: (data) => {
          const pts = (data || []).map((d, i) => ({
            label: `W${i + 1}`,
            value: d.ISSUE_COUNT,
          }));
          this.drilldownPoints = pts;
          const total = pts.reduce((s, p) => s + p.value, 0);
          const qtrLabel =
            this.fiscQtr ||
            this.fiscQtrOptions[this.fiscQtrOptions.length - 1] ||
            '';
          this.drilldownSubtitle = qtrLabel
            ? `WEEKLY TREND — ${qtrLabel} -  TOTAL: ${total}`
            : `WEEKLY TREND — TOTAL: ${total}`;
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
