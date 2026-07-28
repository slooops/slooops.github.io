import {
  Component,
  OnInit,
  OnDestroy,
  HostBinding,
  HostListener,
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
import { forkJoin, interval, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

import { DestroyManager } from '../../providers/destroy-manager.service';
import { DataService, PeriodStatus } from '../../providers/data.service';
import { CaseiqMonitoringDataService } from './caseiq-monitoring-data.service';
import { ThemeService } from '../../providers/theme.service';
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
    NgxEchartsDirective,
    HealthRingComponent,
    LineChartComponent,
    LoadingSymbolComponent,
  ],
  providers: [
    provideEchartsCore({ echarts }),
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
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

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
  kpiAvgTime = '24.7';
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

  // Throughput line chart (ECharts)
  throughputIsWeekly = false;
  throughputPoints: { label: string; value: number }[] = [];
  throughputChartOptions: EChartsOption = {};

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
    'Awaiting Bot Response',
  ];

  // Error Incidents pagination (server-side)
  errorCurrentPage = 1;
  errorPageSize = 25;
  errorTotalPages = 1;
  errorTotalCount = 0;
  errorLoading = false;
  errorFilteredRows: AnomalyItem[] = [];

  // Error detail modal
  errorModalOpen = false;
  errorModalTitle = '';
  errorModalTab = '';
  errorModalContent = '';

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
  }

  toggleTheme(): void {
    this.themeService.toggle();
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
      throughput: this.dataService
        .getThroughput(this.dm, fq ? lb : 24, fq)
        .pipe(catchError(() => of([] as any[]))),
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

  private processP90Time(_data: P90ProcessingTime): void {
    // Hardcoded for now — backend P90 calculation under review
    this.kpiAvgTime = '24.7';
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

    if (fiscQtr) {
      // Weekly mode — need at least 2 weeks for a meaningful chart
      if (raw.length <= 1) {
        this.throughputIsWeekly = true;
        this.throughputPoints = [];
        return;
      }
      this.buildThroughputChart(raw, true);
    } else {
      // Hourly mode — build a dense 12-hour window with zeros for missing hours
      const hourMap = new Map<string, ThroughputEntry>();
      for (const d of raw) {
        if (d.RUN_HOUR) {
          const dt = new Date(d.RUN_HOUR);
          dt.setMinutes(0, 0, 0);
          hourMap.set(dt.toISOString(), d);
        }
      }

      // Derive window end from the latest data point (not browser clock)
      // This avoids timezone mismatches between server JVM and browser
      const latestEntry = raw[raw.length - 1];
      const end = latestEntry?.RUN_HOUR
        ? new Date(latestEntry.RUN_HOUR)
        : new Date();
      end.setMinutes(0, 0, 0);

      const dense: ThroughputEntry[] = [];
      for (let i = 11; i >= 0; i--) {
        const hour = new Date(end.getTime() - i * 3600000);
        const key = hour.toISOString();
        dense.push(
          hourMap.get(key) || {
            RUN_HOUR: hour.toISOString(),
            CASES_PROCESSED: 0,
            SUCCESS_COUNT: 0,
            ERROR_COUNT: 0,
          },
        );
      }
      this.buildThroughputChart(dense, false);
    }
  }

  private buildThroughputChart(
    points: ThroughputEntry[],
    weekly: boolean,
  ): void {
    this.throughputIsWeekly = weekly;

    this.throughputPoints = points.map((d, i) => {
      let label: string;
      if (weekly) {
        // RUN_HOUR is a fiscal week number (0-based) from gap-filled backend
        const weekNum = typeof d.RUN_HOUR === 'number' ? d.RUN_HOUR + 1 : i + 1;
        label = `W${weekNum}`;
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
          interval: labels.length <= 6 ? 0 : 1,
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

  openErrorDetailModal(row: any, tab: 'description' | 'resolution'): void {
    this.errorModalTitle = row.INCIDENT_NUMBER || 'Incident Detail';
    this.errorModalTab = tab;
    const raw =
      tab === 'description'
        ? row.INCIDENT_DESCRIPTION || 'No description available'
        : row.RESOLUTION_API_SUMMARY || 'No resolution summary available';
    this.errorModalContent = this.formatModalContent(raw);
    this.errorModalOpen = true;
  }

  private formatModalContent(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        // Truncated JSON — best-effort formatting
        return trimmed
          .replace(/,\s*"/g, ',\n"')
          .replace(/\{/g, '{\n')
          .replace(/\}/g, '\n}');
      }
    }
    return text;
  }

  closeErrorModal(): void {
    this.errorModalOpen = false;
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
          const pts = (data || []).map((d, i) => {
            if (fq) {
              return { label: `W${d.WEEK_START + 1}`, value: d.ISSUE_COUNT };
            }
            // Lookback view: WEEK_START is a date from TRUNC(..., 'IW')
            const dt = new Date(d.WEEK_START);
            const label = isNaN(dt.getTime())
              ? `W${i + 1}`
              : dt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
            return { label, value: d.ISSUE_COUNT };
          });
          const total = pts.reduce((s, p) => s + p.value, 0);
          this.drilldownSubtitle = fq
            ? `WEEKLY TREND — ${fq} -  TOTAL: ${total}`
            : `LAST 12 WEEKS TREND — TOTAL: ${total}`;

          if (pts.length < 2) {
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
