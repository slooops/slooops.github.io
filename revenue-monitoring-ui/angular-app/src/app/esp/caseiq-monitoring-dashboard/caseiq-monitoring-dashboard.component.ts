import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowClockwiseBold,
  phosphorSunBold,
  phosphorMoonBold,
  phosphorHeartbeatBold,
  phosphorWarningCircleBold,
  phosphorChartBarHorizontalBold,
  phosphorTableBold,
} from '@ng-icons/phosphor-icons/bold';
import { forkJoin, interval, Subscription } from 'rxjs';

import { DestroyManager } from '../../providers/destroy-manager.service';
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
} from './caseiq-monitoring.models';

@Component({
  selector: 'app-caseiq-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, HealthRingComponent],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorSunBold,
      phosphorMoonBold,
      phosphorHeartbeatBold,
      phosphorWarningCircleBold,
      phosphorChartBarHorizontalBold,
      phosphorTableBold,
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
    { value: 1, label: 'Last 1 hour' },
    { value: 6, label: 'Last 6 hours' },
    { value: 12, label: 'Last 12 hours' },
    { value: 24, label: 'Last 24 hours' },
    { value: 72, label: 'Last 3 days' },
    { value: 168, label: 'Last 7 days' },
  ];
  fiscQtrOptions = ['', 'Q1FY26', 'Q2FY26', 'Q3FY26'];

  // State
  loading = true;
  initialLoad = true;
  lastUpdated = '';

  // Health
  healthScore = 0;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA';
  healthMeta = '';
  healthData: HealthOverview | null = null;

  // KPIs
  kpiTotal = '-';
  kpiSuccessRate = '-';
  kpiErrors = '-';
  kpiAnomalies = '-';
  kpiAvgTime = '-';
  kpiStaleness = '-';
  kpiGhost = '-';
  kpiNotSupported = '-';

  // Anomaly breakdown
  anomalyBreakdown: AnomalyBreakdownItem[] = [];

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

  // Throughput bars
  throughputBars: {
    label: string;
    value: number;
    pct: number;
    color: string;
    displayText: string;
  }[] = [];

  // Tables
  teamTableData: TeamSummary[] = [];
  errorTableData: ErrorCategory[] = [];
  anomalyTableData: AnomalyItem[] = [];

  // Status color map
  statusColors: Record<string, string> = {
    SUCCESS: '#00c853',
    'PARTIAL SUCCESS': '#ffd600',
    ERROR: '#ff1744',
    FAILURE: '#ff1744',
    Unknown: '#ff9100',
    NOT_SUPPORTED: '#aa00ff',
  };

  private refreshSub?: Subscription;

  constructor(
    private dataService: CaseiqMonitoringDataService,
    private dm: DestroyManager,
  ) {}

  ngOnInit(): void {
    this.refreshAll();
    this.refreshSub = interval(60000).subscribe(() => this.refreshAll());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
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
    }).subscribe({
      next: (data) => {
        this.processHealth(data.health);
        this.processStatusBars(data.status);
        this.processTeamData(data.teamSummary);
        this.processThroughput(data.throughput);
        this.errorTableData = data.topErrors || [];
        this.processAnomalyTable(
          data.ghostSuccess,
          data.notDefined,
          data.nullStatus,
          data.exceptions,
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
    const avgTime =
      h.AVG_PROCESSING_MINUTES && h.AVG_PROCESSING_MINUTES > 0
        ? `${h.AVG_PROCESSING_MINUTES} min`
        : 'N/A';
    this.healthMeta =
      `Processed: ${(h.TOTAL_PROCESSED || 0).toLocaleString()} (${notSupported} NOT_SUPPORTED)<br>` +
      `Success: ${h.success_rate_pct || 0}% · Errors: ${h.error_rate_pct || 0}%<br>` +
      `Avg Time: ${avgTime}`;

    this.kpiTotal = (h.TOTAL_PROCESSED || 0).toLocaleString();
    this.kpiSuccessRate = `${h.success_rate_pct || 0}%`;
    this.kpiErrors = (
      (h.ERROR_CNT || 0) + (h.UNKNOWN_CNT || 0)
    ).toLocaleString();
    const anomCount =
      (h.NULL_STATUS_CNT || 0) +
      (h.NOT_DEFINED_CNT || 0) +
      (h.NULL_CATEGORY_CNT || 0) +
      (h.UNKNOWN_TEAM_CNT || 0) +
      (h.GHOST_SUCCESS_CNT || 0) +
      (h.EXCEPTION_CNT || 0);
    this.kpiAnomalies = anomCount.toLocaleString();
    this.kpiAvgTime =
      h.AVG_PROCESSING_MINUTES && h.AVG_PROCESSING_MINUTES > 0
        ? String(h.AVG_PROCESSING_MINUTES)
        : 'N/A';
    this.kpiStaleness =
      h.MINUTES_SINCE_LAST_RUN != null
        ? String(h.MINUTES_SINCE_LAST_RUN)
        : 'N/A';
    this.kpiGhost = (h.GHOST_SUCCESS_CNT || 0).toLocaleString();
    this.kpiNotSupported = (h.NOT_SUPPORTED_CNT || 0).toLocaleString();

    const staleMins = h.MINUTES_SINCE_LAST_RUN || 0;
    this.anomalyBreakdown = [
      {
        name: 'Incomplete Resolution – SUCCESS but missing summary/context',
        count: h.GHOST_SUCCESS_CNT || 0,
        severity: 'critical',
      },
      {
        name: 'Resolution Not Attempted – resolution_api_status is NULL',
        count: h.NULL_STATUS_CNT || 0,
        severity: 'critical',
      },
      {
        name: 'Analysis Incomplete – LLM Summary is "Not Defined"',
        count: h.NOT_DEFINED_CNT || 0,
        severity: 'warning',
      },
      {
        name: 'Missing Classification – category or core_issue is NULL',
        count: h.NULL_CATEGORY_CNT || 0,
        severity: 'warning',
      },
      {
        name: 'Team Mapping Failed – team_name is "UNKNOWN"',
        count: h.UNKNOWN_TEAM_CNT || 0,
        severity: 'warning',
      },
      {
        name: 'System Processing Error – CaseIQ errored (category=ERROR or exception in fields)',
        count: h.EXCEPTION_CNT || 0,
        severity: 'critical',
      },
      {
        name: 'Staleness – minutes since last case processed (cron runs hourly)',
        count: staleMins,
        severity:
          staleMins > 65 ? 'critical' : staleMins > 45 ? 'warning' : 'ok',
      },
    ];
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
      const color = rate >= 80 ? '#00c853' : rate >= 50 ? '#ffd600' : '#ff1744';
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
    const sliced = (data || []).slice(0, 12);
    const maxVal = Math.max(...sliced.map((d) => d.CASES_PROCESSED || 0), 1);
    this.throughputBars = sliced.map((d) => {
      const label = d.RUN_HOUR
        ? new Date(d.RUN_HOUR).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'N/A';
      const value = d.CASES_PROCESSED || 0;
      const pct = (value / maxVal) * 100;
      const color = (d.ERROR_COUNT || 0) > 0 ? '#ff9100' : '#00e5ff';
      return { label, value, pct, color, displayText: String(value) };
    });
  }

  private processAnomalyTable(
    ghost: AnomalyItem[],
    notDef: AnomalyItem[],
    nullStat: AnomalyItem[],
    exceptions: AnomalyItem[],
  ): void {
    const rows: AnomalyItem[] = [];
    const add = (list: AnomalyItem[], label: string) =>
      (list || [])
        .slice(0, 10)
        .forEach((r) => rows.push({ ...r, anomalyLabel: label }));
    add(ghost, 'Ghost Success');
    add(notDef, 'Not Defined');
    add(nullStat, 'No Resolution');
    add(exceptions, 'Exception');

    rows.sort((a, b) =>
      (b.CASEIQ_RUN_DATE || '').localeCompare(a.CASEIQ_RUN_DATE || ''),
    );
    this.anomalyTableData = rows.slice(0, 30);
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
}
