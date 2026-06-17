import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingSymbolComponent } from 'src/app/loading-symbol/loading-symbol.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorLinkBold,
  phosphorArrowsClockwiseBold,
  phosphorArrowLineDownBold,
} from '@ng-icons/phosphor-icons/bold';
import { phosphorEmptyDuotone } from '@ng-icons/phosphor-icons/duotone';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, SankeyChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Router } from '@angular/router';

echarts.use([
  BarChart,
  LineChart,
  SankeyChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from 'src/app/providers/http.service';
import { AccuracyDetailModalComponent } from 'src/app/components/accuracy-detail-modal/accuracy-detail-modal.component';
import { CaseiqMonitoringDataService } from '../../caseiq-monitoring-dashboard/caseiq-monitoring-data.service';
import { ThemeService } from 'src/app/providers/theme.service';
import {
  AnomalyBreakdownItem,
  AnomalyItem,
  HealthOverview,
  TeamIssueMatrixEntry,
} from '../../caseiq-monitoring-dashboard/caseiq-monitoring.models';
import { LineChartComponent } from '../../caseiq-monitoring-dashboard/line-chart/line-chart.component';
import { PaginationComponent } from '../../../ui/atoms/pagination/pagination.component';
import { PageChangeEvent } from '../../../ui';
import {
  ActionButtonConfig,
  FilterButtonBarComponent,
  FilterConfig,
  FilterValues,
} from '../../../components/filter-button-bar/filter-button-bar.component';

interface CaseIqTableMetric {
  total: number | null;
  agent: number | null;
  agentPct: number | null;
  ops: number | null;
  opsPct: number | null;
}

interface CaseIqTableRow {
  sectionName: string;
  totalCases: number | null;
  serviceIncidents: number | null;
  service: CaseIqTableMetric;
  inProgress: CaseIqTableMetric;
  routed: CaseIqTableMetric;
  cancelled: CaseIqTableMetric;
}

interface CaseiqKpi {
  title: string;
  color: string;
  pillWidth?: number;
  pillText?: string;
  pctText?: string;
  plain?: boolean;
  plainValue?: string;
}

@Component({
  selector: 'app-caseiq',
  templateUrl: './caseiq.component.html',
  styleUrl: './caseiq.component.css',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    LoadingSymbolComponent,
    NgIcon,
    AccuracyDetailModalComponent,
    LineChartComponent,
    NgxEchartsDirective,
    FilterButtonBarComponent,
    PaginationComponent,
  ],
  providers: [
    provideIcons({
      phosphorLinkBold,
      phosphorArrowsClockwiseBold,
      phosphorArrowLineDownBold,
      phosphorEmptyDuotone,
    }),
    provideEchartsCore({ echarts }),
  ],
  standalone: true,
})
export class CaseiqComponent implements AfterViewInit, OnDestroy, OnChanges {
  // Section names are derived dynamically from caseIqMetrics
  // (e.g. 'Finance IT' for TEAM_NAME 'ALL', then each TEAM_NAME).
  sections = signal<string[]>([]);

  /** External URL for Resolution Agents Active link (update when available) */
  resolutionAgentsUrl: string =
    'https://cisco.sharepoint.com/:x:/r/sites/ManagementandFinance/Shared%20Documents/Transformation%20Programs/Active%20Programs/AI%20in%20SDLC/Normalization%20%26%20Support%20Pillar/CaseIQ%20Agent%20status/CaseIQ%20Agent%20deployment%20status.xlsx?d=w39991f3a78824847a66383ad1c9db4d3&csf=1&web=1&e=sWPQgd';

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    private readonly monitoringService: CaseiqMonitoringDataService,
    public themeService: ThemeService,
    public router: Router,
  ) {}

  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  chartOptionsMap: Record<string, EChartsOption> = {};
  private viewInitialized = false;
  private readonly integerFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  });
  private readonly percentageFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });

  // Raw accuracy data from xxcaseiq-validated-cases-accuracy-v
  accuracyData: any[] = [];

  // Show a brief loading state when quarter or metrics change
  isLoading = true;

  // Selected component for the bar chart (default: Finance IT = ALL)
  selectedChartComponent: string = 'Finance IT';
  showChartDropdown: boolean = false;
  private outsideClickListener = () => {
    this.showChartDropdown = false;
  };

  // Resolution Agents Deployed per team
  resolutionAgents: { team: string; deployed: number; total: number }[] = [
    { team: 'Finance IT', deployed: 90, total: 90 },
    { team: 'OM', deployed: 14, total: 14 },
    { team: 'SM', deployed: 11, total: 11 },
    { team: 'I2C', deployed: 19, total: 19 },
    { team: 'AIT', deployed: 11, total: 11 },
    { team: 'FPP', deployed: 14, total: 14 },
    { team: 'P2P', deployed: 10, total: 10 },
    { team: 'CAPITAL', deployed: 11, total: 11 },
  ];

  @Input() caseIqMetrics: any;
  @Input() selectedQuarter: string = '';
  @Output() teamNavigate = new EventEmitter<string>();

  // ── Analytics chart data ──────────────────────────────────
  weeklyVolumeByTeamData: any[] = [];
  weeklyTeamChartLabel = '';
  weeklyTeamNoData = false;
  weeklyVolumeByStateData: any[] = [];
  hourlyCasePatternData: any[] = [];
  accuracyOverTimeData: any[] = [];
  analyticsChartsLoading = true;
  private analyticsDataReady = false;
  teamCardFlipped = false;
  hourlyCardFlipped = false;
  sankeyCardFlipped = false;

  // ── Context Switcher: "Operations" vs "Executive" ──────────
  @Input() caseiqView: 'ops' | 'executive' = 'ops';

  // ── Business/Executive view data ──────────────────────────
  espSummaryData: any[] = [];
  espSummaryLoading = true;
  private themeSub?: Subscription;

  ngOnChanges(changes: SimpleChanges): void {
    if ('caseIqMetrics' in changes) {
      // Always rebuild section list so template reflects latest metrics
      this.buildSectionsFromMetrics();

      // If view is already initialized, (re)create charts and update data
      if (this.viewInitialized) {
        this.showLoadingForMoment();
      }
    }

    if (
      'selectedQuarter' in changes &&
      changes['selectedQuarter'].currentValue
    ) {
      // Quarter changed — re-fetch monitoring data filtered by new quarter
      if (this.viewInitialized) {
        this.showLoadingForMoment();
        // Re-fetch monitoring data and accuracy data with new quarter
        this.fetchMonitoringData();
        this.fetchAccuracyData();
        this.refetchWeeklyTeamVolume();
        this.refetchWeeklyCasesAnalyzed();
        // Rebuild executive charts when quarter changes
        if (this.caseiqView === 'executive') {
          setTimeout(() => {
            this.buildMttrChart();
            this.buildExecWeeklyChart();
            this.buildExecHourlyChart();
            this.buildSankeyChart();
          }, 100);
        }
      }
    }

    if ('caseiqView' in changes && this.viewInitialized) {
      if (this.caseiqView === 'executive') {
        setTimeout(() => {
          this.buildMttrChart();
          this.buildExecWeeklyChart();
          this.buildExecHourlyChart();
          this.buildSankeyChart();
        }, 50);
      } else if (this.caseiqView === 'ops') {
        // Rebuild ops charts — canvases were removed from DOM during executive view
        setTimeout(() => {
          this.createAllCharts();
          this.tryBuildAnalyticsCharts();
        }, 50);
      }
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    // Rebuild executive charts when theme toggles
    this.themeSub = this.themeService.isDarkMode$.subscribe(() => {
      if (this.caseiqView === 'executive') {
        setTimeout(() => {
          this.buildMttrChart();
          this.buildExecWeeklyChart();
          this.buildExecHourlyChart();
          if (this.sankeyCardFlipped) {
            this.buildSankeyChart2Step();
          } else {
            this.buildSankeyChart();
          }
        }, 50);
      }
    });

    // Close chart dropdown on outside click
    document.addEventListener('click', this.outsideClickListener);

    // Fetch accuracy data
    this.fetchAccuracyData();

    // Fetch monitoring data (Issues Breakdown + Error Incidents)
    // Only call if quarter is already set; otherwise ngOnChanges will trigger it
    if (this.selectedQuarter) {
      this.fetchMonitoringData();
    }

    // Always fetch analytics chart data on init
    this.fetchAnalyticsCharts();

    // Fetch business view data
    this.fetchEspSummaryData();

    // Initial build of sections/charts once view is ready
    this.buildSectionsFromMetrics();
    this.showLoadingForMoment();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    document.removeEventListener('click', this.outsideClickListener);
  }

  /**
   * Briefly show the loading spinner while quarter/metrics changes propagate.
   */
  private showLoadingForMoment(): void {
    this.isLoading = true;
    // Keep the loading symbol visible for a short period to avoid
    // flashing stale charts while new data is applied.
    setTimeout(() => {
      this.isLoading = false;
      // Once loading finishes and the canvases are rendered (because
      // !isLoading), create all charts against the live DOM.
      setTimeout(() => {
        this.createAllCharts();
        // Also try building analytics charts now that canvases are in the DOM
        this.tryBuildAnalyticsCharts();
      }, 0);
    }, 800);
  }

  private buildSectionsFromMetrics(): void {
    if (!Array.isArray(this.caseIqMetrics) || this.caseIqMetrics.length === 0) {
      this.sections.set([]);
      return;
    }

    const names: string[] = [];

    // Define the desired order for other teams
    const teamOrder = ['OM', 'SM', 'I2C', 'AIT', 'FPP', 'P2P', 'CAPITAL'];

    // Collect available team names from metrics
    const availableTeams = new Set<string>();
    this.caseIqMetrics.forEach((m: any) => {
      if (
        m &&
        m.TEAM_NAME &&
        typeof m.TEAM_NAME === 'string' &&
        m.TEAM_NAME.toUpperCase() !== 'ALL'
      ) {
        availableTeams.add(m.TEAM_NAME);
      }
    });

    // Add teams in the specified order if they exist in metrics
    teamOrder.forEach((teamName) => {
      if (availableTeams.has(teamName)) {
        names.push(teamName);
      }
    });

    // Finance IT / ALL last if present
    const hasAll = this.caseIqMetrics.some(
      (m: any) =>
        m &&
        m.TEAM_NAME &&
        typeof m.TEAM_NAME === 'string' &&
        m.TEAM_NAME.toUpperCase() === 'ALL',
    );
    if (hasAll) {
      names.push('Finance IT');
    }

    this.sections.set(names);
  }

  getTotalCases(sectionName: string): number {
    const teamData = this.getSectionMetrics(sectionName);
    const total = this.toNumber(teamData?.TOTAL_CASES);
    return total ?? 0;
  }

  getNonFinanceSections(): string[] {
    return this.sections();
  }

  hasFinanceSection(): boolean {
    return this.sections().includes('Finance IT');
  }

  getTableRows(): CaseIqTableRow[] {
    return this.getNonFinanceSections()
      .map((sectionName) => this.buildTableRow(sectionName))
      .filter((row): row is CaseIqTableRow => !!row);
  }

  metricDisplay(value: number | null, percentage?: number | null): string {
    if (!this.isValidNumber(value)) {
      return '--';
    }

    const formattedValue = this.integerFormatter.format(value);

    if (!this.isValidNumber(percentage)) {
      return formattedValue;
    }

    const formattedPercentage = this.percentageFormatter.format(percentage);

    return `${formattedValue} (${formattedPercentage}%)`;
  }

  valueDisplay(value: number | null): string {
    if (!this.isValidNumber(value)) {
      return '--';
    }
    return this.integerFormatter.format(value);
  }

  pctDisplay(percentage: number | null): string {
    if (!this.isValidNumber(percentage)) {
      return '';
    }
    const rounded = Math.round(percentage);
    return `(${this.integerFormatter.format(rounded)}%)`;
  }

  getChartComponentOptions(): string[] {
    return this.sections();
  }

  toggleChartDropdown(event: Event): void {
    event.stopPropagation();
    this.showChartDropdown = !this.showChartDropdown;
  }

  selectChartComponent(option: string): void {
    this.selectedChartComponent = option;
    this.showChartDropdown = false;
    // Rebuild the chart when the dropdown selection changes
    this.createAllCharts();
  }

  private createAllCharts(): void {
    this.createBarChart('overall-bar', this.selectedChartComponent);
  }

  // Helper to filter metrics by the selected quarter (FISCAL_QTR).
  // If no quarter is selected, return the full metrics array.
  private getFilteredMetricsByQuarter(): any[] {
    if (!Array.isArray(this.caseIqMetrics)) {
      return [];
    }

    if (!this.selectedQuarter) {
      return this.caseIqMetrics;
    }

    return this.caseIqMetrics.filter(
      (m: any) => m && m.FISCAL_QTR === this.selectedQuarter,
    );
  }

  private createBarChart(_canvasId: string, sectionName: string): void {
    // Individual values for each bar/segment (excluding Total Cases bar)
    let serviceResolved = 0;
    let serviceOthers = 0;
    let inProgressAgent = 0;
    let inProgressOps = 0;
    let routedOutRecommended = 0;
    let routedOutMisrouted = 0;
    let cancelledRecommended = 0;
    let cancelledOthers = 0;

    // Percentage annotations supplied by API
    let resolvedAgentPct = 0;
    let resolvedOpsPct = 0;
    let inProgressAgentPct = 0;
    let inProgressOpsPct = 0;
    let routedRecommendedPct = 0;
    let routedMisroutedPct = 0;
    let cancelledRecommendedPct = 0;
    let cancelledOthersPct = 0;

    // Use metrics filtered by selectedQuarter (FISCAL_QTR)
    const metrics = this.getFilteredMetricsByQuarter();

    // Try to find metrics for this section from filtered metrics
    if (Array.isArray(metrics)) {
      const teamData = this.getSectionMetrics(sectionName);

      if (teamData) {
        // First bar now represents total RESOLVED,
        // stacked as RESOLVED_AGENT and RESOLVED_OPS.
        serviceResolved = Number(teamData.RESOLVED_AGENT) || 0;
        serviceOthers = Number(teamData.RESOLVED_OPS) || 0;
        resolvedAgentPct = Number(teamData.RESOLVED_PERCENTAGE_AGENT) || 0;
        resolvedOpsPct = Number(teamData.RESOLVED_PERCENTAGE_OPS) || 0;

        // New In Progress stacked bar (Agent + Ops)
        inProgressAgent = Number(teamData.IN_PROGRESS_AGENT) || 0;
        inProgressOps = Number(teamData.IN_PROGRESS_OPS) || 0;
        inProgressAgentPct = Number(teamData.IN_PROGRESS_AGENT_PERCENTAGE) || 0;
        inProgressOpsPct = Number(teamData.IN_PROGRESS_OPS_PERCENTAGE) || 0;

        routedOutRecommended =
          Number(
            teamData.RECOMMENDED_ROUTE_OUT ?? teamData.RECOMMENDED_ROUTED_OUT,
          ) || 0;
        routedOutMisrouted = Number(teamData.NOT_RECOMMENDED_ROUTED_OUT) || 0;
        routedRecommendedPct =
          Number(teamData.RECOMMENDED_ROUTED_OUT_PERCENTAGE) || 0;
        routedMisroutedPct =
          Number(teamData.NOT_RECOMMENDED_ROUTED_OUT_PERCENTAGE) || 0;

        cancelledRecommended = Number(teamData.RECOMMENDED_CANCELLED) || 0;
        cancelledOthers = Number(teamData.NOT_RECOMMENDED_CANCELLED) || 0;
        cancelledRecommendedPct =
          Number(teamData.RECOMMENDED_CANCELLED_PERCENTAGE) || 0;
        cancelledOthersPct =
          Number(teamData.NOT_RECOMMENDED_CANCELLED_PERCENTAGE) || 0;
      }
    }

    const agentLegendCount =
      serviceResolved +
      inProgressAgent +
      routedOutRecommended +
      cancelledRecommended;
    const opsLegendCount =
      serviceOthers + inProgressOps + routedOutMisrouted + cancelledOthers;

    const totalCasesForSection = this.getTotalCases(sectionName);
    const agentPercent = totalCasesForSection
      ? (agentLegendCount / totalCasesForSection) * 100
      : 0;
    const opsPercent = totalCasesForSection
      ? (opsLegendCount / totalCasesForSection) * 100
      : 0;

    const agentLegendLabel = `Agent (${this.integerFormatter.format(
      agentLegendCount,
    )} - ${this.percentageFormatter.format(agentPercent)}%)`;
    const opsLegendLabel = `Ops (${this.integerFormatter.format(
      opsLegendCount,
    )} - ${this.percentageFormatter.format(opsPercent)}%)`;

    const categories = [
      'Service Requests',
      'In Progress',
      'Routed Out',
      'Cancelled',
    ];

    this.chartOptionsMap['barChart'] = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#222',
        textStyle: { color: '#fff' },
      },
      legend: {
        bottom: 0,
        data: [agentLegendLabel, opsLegendLabel],
        textStyle: { fontSize: 11 },
        itemWidth: 11,
        itemHeight: 11,
      },
      grid: { top: 20, left: 40, right: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 10 },
        axisLine: { show: true },
        axisTick: { show: false },
      },
      yAxis: { type: 'value', show: false },
      series: [
        {
          name: opsLegendLabel,
          type: 'bar',
          stack: 'total',
          data: [
            serviceOthers,
            inProgressOps,
            routedOutMisrouted,
            cancelledOthers,
          ],
          itemStyle: { color: 'rgba(54, 162, 235, 0.7)' },
          barMaxWidth: 60,
          label: {
            show: true,
            position: 'inside',
            formatter: (params: any) => {
              const pcts = [
                resolvedOpsPct,
                inProgressOpsPct,
                routedMisroutedPct,
                cancelledOthersPct,
              ];
              const val = params.value;
              const pct = Math.round(pcts[params.dataIndex]);
              return val && pct > 15 ? `${val} (${pct}%)` : '';
            },
            fontSize: 10,
            color: '#000',
            fontWeight: 'bold',
          },
        },
        {
          name: agentLegendLabel,
          type: 'bar',
          stack: 'total',
          data: [
            serviceResolved,
            inProgressAgent,
            routedOutRecommended,
            cancelledRecommended,
          ],
          itemStyle: { color: 'rgba(255, 206, 86, 0.7)' },
          barMaxWidth: 60,
          label: {
            show: true,
            position: 'inside',
            formatter: (params: any) => {
              const pcts = [
                resolvedAgentPct,
                inProgressAgentPct,
                routedRecommendedPct,
                cancelledRecommendedPct,
              ];
              const val = params.value;
              const pct = Math.round(pcts[params.dataIndex]);
              return val && pct > 15 ? `${val} (${pct}%)` : '';
            },
            fontSize: 10,
            color: '#000',
            fontWeight: 'bold',
          },
        },
      ],
    };
  }

  private getSectionMetrics(sectionName: string): any | null {
    const metrics = this.getFilteredMetricsByQuarter();

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return null;
    }

    if (sectionName === 'Finance IT') {
      return (
        metrics.find(
          (m: any) =>
            m &&
            m.TEAM_NAME &&
            typeof m.TEAM_NAME === 'string' &&
            m.TEAM_NAME.toUpperCase() === 'ALL',
        ) || null
      );
    }

    return (
      metrics.find(
        (m: any) =>
          m &&
          m.TEAM_NAME &&
          typeof m.TEAM_NAME === 'string' &&
          m.TEAM_NAME === sectionName,
      ) || null
    );
  }

  private buildTableRow(sectionName: string): CaseIqTableRow | null {
    const teamData = this.getSectionMetrics(sectionName);

    if (!teamData) {
      return null;
    }

    return {
      sectionName,
      totalCases: this.toNumber(teamData.TOTAL_CASES),
      serviceIncidents: this.toNumber(teamData.SERVICE_INCIDENTS),
      service: {
        total: this.toNumber(teamData.RESOLVED),
        agent: this.toNumber(teamData.RESOLVED_AGENT),
        agentPct: this.toNumber(teamData.RESOLVED_PERCENTAGE_AGENT),
        ops: this.toNumber(teamData.RESOLVED_OPS),
        opsPct: this.toNumber(teamData.RESOLVED_PERCENTAGE_OPS),
      },
      inProgress: {
        total: this.toNumber(teamData.IN_PROGRESS),
        agent: this.toNumber(teamData.IN_PROGRESS_AGENT),
        agentPct: this.toNumber(teamData.IN_PROGRESS_AGENT_PERCENTAGE),
        ops: this.toNumber(teamData.IN_PROGRESS_OPS),
        opsPct: this.toNumber(teamData.IN_PROGRESS_OPS_PERCENTAGE),
      },
      routed: {
        total: this.toNumber(teamData.ROUTED_OUT),
        agent: this.toNumber(
          teamData.RECOMMENDED_ROUTE_OUT ?? teamData.RECOMMENDED_ROUTED_OUT,
        ),
        agentPct: this.toNumber(teamData.RECOMMENDED_ROUTED_OUT_PERCENTAGE),
        ops: this.toNumber(teamData.NOT_RECOMMENDED_ROUTED_OUT),
        opsPct: this.toNumber(teamData.NOT_RECOMMENDED_ROUTED_OUT_PERCENTAGE),
      },
      cancelled: {
        total: this.toNumber(teamData.CANCELLED),
        agent: this.toNumber(teamData.RECOMMENDED_CANCELLED),
        agentPct: this.toNumber(teamData.RECOMMENDED_CANCELLED_PERCENTAGE),
        ops: this.toNumber(teamData.NOT_RECOMMENDED_CANCELLED),
        opsPct: this.toNumber(teamData.NOT_RECOMMENDED_CANCELLED_PERCENTAGE),
      },
    };
  }

  private toNumber(value: any): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private isValidNumber(value: number | null | undefined): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  }

  // ── Summary view helpers ──────────────────────────────────────

  /** Finance IT (ALL) metrics for summary KPI cards */
  getFinanceITMetrics(): any | null {
    return this.getSectionMetrics('Finance IT');
  }

  /** Ops automation rate = total ops / total cases * 100 */
  getOpsAutomationRate(): number {
    const fm = this.getFinanceITMetrics();
    if (!fm) return 0;
    const totalCases =
      (this.getFinanceITAgentTotalCases() ?? 0) +
      (this.getOpsTotalCases() ?? 0);

    if (!totalCases) return 0;
    const totalOps = this.getFinanceITAgentTotalCases();
    return Math.round((totalOps / totalCases) * 1000) / 10; // 1 decimal
  }

  /** Finance IT active agents info */
  getFinanceAgents(): { deployed: number; total: number; utilization: number } {
    const agent = this.resolutionAgents.find((a) => a.team === 'Finance IT');
    const deployed = agent?.deployed ?? 0;
    const total = agent?.total ?? 1;
    return {
      deployed,
      total,
      utilization: Math.round((deployed / total) * 100),
    };
  }

  /** Cancelled percentage for a row — used to highlight in red when high */
  getCancelledPct(row: CaseIqTableRow): number {
    const total = row.totalCases ?? 0;
    const cancelled = row.cancelled.total ?? 0;
    return total ? Math.round((cancelled / total) * 100) : 0;
  }

  /** Agent percentage of total for ratio bar */
  getAgentRatio(row: CaseIqTableRow): number {
    const total =
      this.getAgentTotalCases(row) + this.getComponentOpsTotalCases(row);
    if (!total) return 0;
    const agentTotal =
      (row.service.agent ?? 0) +
      (row.inProgress.agent ?? 0) +
      (row.routed.agent ?? 0) +
      (row.cancelled.agent ?? 0);
    return Math.round((agentTotal / total) * 100);
  }

  /** Total Cases (Agent) = inProgress.agent + service.agent + routed.agent + cancelled.agent */
  getAgentTotalCases(row: CaseIqTableRow): number {
    return (
      (row.inProgress.agent ?? 0) +
      (row.service.agent ?? 0) +
      (row.routed.agent ?? 0) +
      (row.cancelled.agent ?? 0)
    );
  }

  getComponentOpsTotalCases(row: CaseIqTableRow): number {
    return (
      (row.inProgress.ops ?? 0) +
      (row.service.ops ?? 0) +
      (row.routed.ops ?? 0) +
      (row.cancelled.ops ?? 0)
    );
  }

  /** Agent total for Finance IT metrics */
  getFinanceITAgentTotalCases(): number {
    const fm = this.getFinanceITMetrics();
    if (!fm) return 0;
    return (
      (Number(fm.IN_PROGRESS_AGENT) || 0) +
      (Number(fm.RESOLVED_AGENT) || 0) +
      (Number(fm.RECOMMENDED_ROUTE_OUT) ||
        Number(fm.RECOMMENDED_ROUTED_OUT) ||
        0) +
      (Number(fm.RECOMMENDED_CANCELLED) || 0)
    );
  }

  getOpsTotalCases(): number {
    const fm = this.getFinanceITMetrics();
    if (!fm) return 0;
    return (
      (Number(fm.IN_PROGRESS_OPS) || 0) +
      (Number(fm.RESOLVED_OPS) || 0) +
      (Number(fm.NOT_RECOMMENDED_ROUTE_OUT) ||
        Number(fm.NOT_RECOMMENDED_ROUTED_OUT) ||
        0) +
      (Number(fm.NOT_RECOMMENDED_CANCELLED) || 0)
    );
  }
  getAgentForRow(row: CaseIqTableRow): { deployed: number; total: number } {
    const agent = this.resolutionAgents.find((a) => a.team === row.sectionName);
    return agent
      ? { deployed: agent.deployed, total: agent.total }
      : { deployed: 0, total: 0 };
  }

  getSummaryRows(): CaseIqTableRow[] {
    return this.getTableRows().filter((r) => r.sectionName !== 'Finance IT');
  }

  /** Sum of a specific metric's total across all component (non-Finance IT) rows */
  getSumMetricTotal(
    metric: 'inProgress' | 'routed' | 'cancelled' | 'service',
  ): number {
    return this.getSummaryRows().reduce(
      (sum, row) => sum + (row[metric].total ?? 0),
      0,
    );
  }

  /** Finance IT row built from metrics — used for summary tiles */
  getFinanceITRow(): CaseIqTableRow | null {
    return this.buildTableRow('Finance IT');
  }

  /** Non-Finance IT resolution agents for the track section */
  getTrackAgents(): { team: string; deployed: number; total: number }[] {
    return this.resolutionAgents.filter((a) => a.team !== 'Finance IT');
  }

  /** Open resolution agents URL in a new tab */
  openResolutionAgents(event: Event): void {
    event.preventDefault();
    if (this.resolutionAgentsUrl) {
      window.open(this.resolutionAgentsUrl, '_blank', 'noopener,noreferrer');
    }
  }

  /** Data-driven KPI strip — mirrors the landing ctx2Kpis() pattern */
  caseiqKpis(): CaseiqKpi[] {
    const fitRow = this.getFinanceITRow();
    const accuracyPct = this.getAccuracyForSection('Finance IT');
    const accuracyCases = this.getTotalCasesFromAccuracy('Finance IT');
    const opsRate = this.getOpsAutomationRate();
    const agentTotal = this.getFinanceITAgentTotalCases();
    const opsTotal = this.getOpsTotalCases();
    const fm = this.getFinanceITMetrics();

    return [
      {
        title: 'Case Analyzer Accuracy',
        color: 'accent',
        pillWidth: accuracyPct ?? 0,
        pillText:
          accuracyCases != null
            ? `${accuracyCases.toLocaleString()} cases`
            : '--',
        pctText: accuracyPct != null ? `${accuracyPct.toFixed(1)}%` : '--',
      },
      {
        title: 'In Progress',
        color: 'cyan',
        pillWidth: fitRow?.inProgress?.agentPct ?? 0,
        pillText: `${fitRow ? this.valueDisplay(fitRow.inProgress.agent) : '--'} / ${this.getSumMetricTotal('inProgress').toLocaleString()}`,
        pctText:
          fitRow?.inProgress?.agentPct != null
            ? `${Math.round(fitRow.inProgress.agentPct)}%`
            : '--',
      },
      {
        title: 'Routed Out',
        color: 'purple',
        pillWidth: fitRow?.routed?.agentPct ?? 0,
        pillText: `${fitRow ? this.valueDisplay(fitRow.routed.agent) : '--'} / ${this.getSumMetricTotal('routed').toLocaleString()}`,
        pctText:
          fitRow?.routed?.agentPct != null
            ? `${Math.round(fitRow.routed.agentPct)}%`
            : '--',
      },
      {
        title: 'Canceled',
        color: 'amber',
        pillWidth: fitRow?.cancelled?.agentPct ?? 0,
        pillText: `${fitRow ? this.valueDisplay(fitRow.cancelled.agent) : '--'} / ${this.getSumMetricTotal('cancelled').toLocaleString()}`,
        pctText:
          fitRow?.cancelled?.agentPct != null
            ? `${Math.round(fitRow.cancelled.agentPct)}%`
            : '--',
      },
      {
        title: 'Service Requests',
        color: 'green',
        pillWidth: fitRow?.service?.agentPct ?? 0,
        pillText: `${fitRow ? this.valueDisplay(fitRow.service.agent) : '--'} / ${this.getSumMetricTotal('service').toLocaleString()}`,
        pctText:
          fitRow?.service?.agentPct != null
            ? `${Math.round(fitRow.service.agentPct)}%`
            : '--',
      },
      {
        title: 'Agent vs Ops %',
        color: 'dual',
        pillWidth: opsRate,
        pillText: `${opsRate.toFixed(1)}%`,
        pctText: `${agentTotal.toLocaleString()} / ${(agentTotal + opsTotal).toLocaleString()}`,
      },
      {
        title: 'Service Incidents',
        color: 'accent',
        plain: true,
        plainValue:
          fm?.SERVICE_INCIDENTS != null
            ? Number(fm.SERVICE_INCIDENTS).toLocaleString()
            : '--',
      },
    ];
  }

  /** Agent ratio for Finance IT */
  getFinanceITAgentRatio(): number {
    const row = this.getFinanceITRow();
    return row ? this.getAgentRatio(row) : 0;
  }

  /** Fetch accuracy/validation data from the CaseIQ monitoring service */
  private fetchAccuracyData(): void {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        if (Array.isArray(data)) {
          this.accuracyData = data;
        }
      });
  }

  /** Look up Accuracy Rate for a section (Total Accuracy), filtered by selectedQuarter */
  getAccuracyForSection(sectionName: string): number | null {
    if (!this.accuracyData.length) return null;

    // Filter by quarter first
    const filtered = this.selectedQuarter
      ? this.accuracyData.filter(
          (item: any) => item.Quarter === this.selectedQuarter,
        )
      : this.accuracyData;

    if (!filtered.length) return null;

    // For Finance IT / ALL: simple average of Total Accuracy across all teams
    if (sectionName === 'Finance IT' || sectionName === 'ALL') {
      let count = 0;
      let sum = 0;
      for (const item of filtered) {
        const acc = Number(item['Total Accuracy']);
        if (Number.isFinite(acc)) {
          sum += acc;
          count++;
        }
      }
      return count > 0 ? Math.round((sum / count) * 100) / 100 : null;
    }

    // Individual team lookup
    const match = filtered.find(
      (item: any) =>
        item.TEAM_NAME &&
        item.TEAM_NAME.toUpperCase() === sectionName.toUpperCase(),
    );

    if (!match) return null;
    const val = Number(match['Total Accuracy']);
    return Number.isFinite(val) ? val : null;
  }

  /** Look up Validation (Total Accuracy) for a section, filtered by selectedQuarter */
  getValidationForSection(sectionName: string): number | null {
    if (!this.accuracyData.length) return null;

    const filtered = this.selectedQuarter
      ? this.accuracyData.filter(
          (item: any) => item.Quarter === this.selectedQuarter,
        )
      : this.accuracyData;

    if (!filtered.length) return null;

    // For Finance IT / ALL: compute weighted average of Total Accuracy across all teams
    if (sectionName === 'Finance IT' || sectionName === 'ALL') {
      let totalCases = 0;
      let weightedAccuracy = 0;
      for (const item of filtered) {
        const cases = Number(item['Total Cases']) || 0;
        const acc = Number(item['Total Accuracy']);
        if (Number.isFinite(acc) && cases > 0) {
          totalCases += cases;
          weightedAccuracy += acc * cases;
        }
      }
      return totalCases > 0
        ? Math.round((weightedAccuracy / totalCases) * 10) / 10
        : null;
    }

    // Individual team lookup
    const match = filtered.find(
      (item: any) =>
        item.TEAM_NAME &&
        item.TEAM_NAME.toUpperCase() === sectionName.toUpperCase(),
    );

    if (!match) return null;
    const val = Number(match['Total Accuracy']);
    return Number.isFinite(val) ? val : null;
  }

  /** Look up Total Cases from accuracyData for a section, filtered by selectedQuarter */
  getTotalCasesFromAccuracy(sectionName: string): number | null {
    if (!this.accuracyData.length) return null;

    const filtered = this.selectedQuarter
      ? this.accuracyData.filter(
          (item: any) => item.Quarter === this.selectedQuarter,
        )
      : this.accuracyData;

    if (!filtered.length) return null;

    // For Finance IT / ALL: sum Total Cases across all teams
    if (sectionName === 'Finance IT' || sectionName === 'ALL') {
      let totalCases = 0;
      for (const item of filtered) {
        const cases = Number(item['Total Cases']) || 0;
        totalCases += cases;
      }
      return totalCases > 0 ? totalCases : null;
    }

    // Individual team lookup
    const match = filtered.find(
      (item: any) =>
        item.TEAM_NAME &&
        item.TEAM_NAME.toUpperCase() === sectionName.toUpperCase(),
    );

    if (!match) return null;
    const val = Number(match['Total Cases']);
    return Number.isFinite(val) ? val : null;
  }

  /** Return a pill color class based on accuracy percentage thresholds */
  getAccuracyColor(sectionName: string): string {
    const val = this.getAccuracyForSection(sectionName);
    if (val == null || val === 0) return 'neutral';
    if (val >= 75) return 'green';
    if (val >= 50) return 'grey';
    if (val >= 25) return 'amber';
    return 'orange';
  }

  getValidationColor(sectionName: string): string {
    const val = this.getValidationForSection(sectionName);
    if (val == null || val === 0) return 'neutral';
    if (val >= 75) return 'green';
    if (val >= 50) return 'grey';
    if (val >= 25) return 'amber';
    return 'orange';
  }

  /** Map section names to tile names used by esp-home tabs */
  private readonly sectionToTile: Record<string, string> = {
    OM: 'OM',
    SM: 'SM',
    I2C: 'I2C',
    AIT: 'AIT',
    FPP: 'FPP',
    P2P: 'P2P',
    CAPITAL: 'Capital',
  };

  /** Navigate to the component's team tab */
  navigateToTeam(sectionName: string): void {
    const tileName = this.sectionToTile[sectionName] ?? sectionName;
    this.teamNavigate.emit(tileName);
  }

  // ── Analytics Charts ──────────────────────────────────────

  fetchAnalyticsCharts(): void {
    this.analyticsChartsLoading = true;
    this.analyticsDataReady = false;
    const base = 'caseiq/charts';

    let completed = 0;
    const total = 4;
    const done = () => {
      completed++;
      if (completed >= total) {
        this.analyticsChartsLoading = false;
        this.analyticsDataReady = true;
        this.tryBuildAnalyticsCharts();
      }
    };

    // Weekly volume by team uses the quarter-based view
    const weeklyTeamUrl = this.selectedQuarter
      ? `${base}/weekly-volume-by-team?fiscQtr=${this.selectedQuarter}`
      : `${base}/weekly-volume-by-team?fiscQtr=Q4FY26`;
    this.weeklyTeamChartLabel = this.selectedQuarter || 'Q4FY26';

    this.http.get(weeklyTeamUrl, this.destroyManager).subscribe({
      next: (d: any) => {
        this.weeklyVolumeByTeamData = d;
        done();
      },
      error: () => done(),
    });

    // Weekly volume by state uses the quarter-based view
    const weeklyStateUrl = this.selectedQuarter
      ? `${base}/weekly-volume-by-state?fiscQtr=${this.selectedQuarter}`
      : `${base}/weekly-volume-by-state?fiscQtr=Q4FY26`;

    this.http.get(weeklyStateUrl, this.destroyManager).subscribe({
      next: (d: any) => {
        this.weeklyVolumeByStateData = d;
        done();
      },
      error: () => done(),
    });

    this.http
      .get(`${base}/hourly-case-pattern?lookbackDays=1`, this.destroyManager)
      .subscribe({
        next: (d: any) => {
          this.hourlyCasePatternData = d;
          done();
        },
        error: () => done(),
      });

    this.http
      .get(`${base}/accuracy-over-time?lookbackDays=120`, this.destroyManager)
      .subscribe({
        next: (d: any) => {
          this.accuracyOverTimeData = d;
          done();
        },
        error: () => done(),
      });
  }

  private refetchWeeklyTeamVolume(): void {
    if (!this.selectedQuarter) return;

    const url = `caseiq/charts/weekly-volume-by-team?fiscQtr=${this.selectedQuarter}`;
    this.weeklyTeamChartLabel = this.selectedQuarter;

    this.http.get(url, this.destroyManager).subscribe({
      next: (d: any) => {
        if (!d || d.length === 0) {
          this.weeklyTeamNoData = true;
          this.weeklyVolumeByTeamData = [];
        } else {
          this.weeklyTeamNoData = false;
          this.weeklyVolumeByTeamData = d;
          this.buildWeeklyVolumeByTeamChart();
        }
      },
    });
  }

  private refetchWeeklyCasesAnalyzed(): void {
    if (!this.selectedQuarter) return;

    const url = `caseiq/charts/weekly-volume-by-state?fiscQtr=${this.selectedQuarter}`;

    this.http.get(url, this.destroyManager).subscribe({
      next: (d: any) => {
        this.weeklyVolumeByStateData = d ?? [];
        if (this.hourlyCardFlipped) {
          this.buildWeeklyVolumeByStateChart();
        }
      },
    });
  }

  private tryBuildAnalyticsCharts(): void {
    if (!this.analyticsDataReady || this.isLoading) return;
    this.buildAnalyticsCharts();
  }

  private buildAnalyticsCharts(): void {
    this.buildWeeklyVolumeByTeamChart();
    if (!this.hourlyCardFlipped) {
      this.buildHourlyCasePatternChart();
    } else {
      this.buildWeeklyVolumeByStateChart();
    }
  }

  private readonly teamColors: Record<string, string> = {
    OM: '#0070d2',
    SM: '#00bceb',
    I2C: '#6ebe4a',
    AIT: '#e6a800',
    FPP: '#9933ff',
    P2P: '#ff6600',
    CAPITAL: '#e53935',
  };

  private buildWeeklyVolumeByTeamChart(): void {
    const weekMap = new Map<number, Map<string, number>>();
    const teams = new Set<string>();
    for (const row of this.weeklyVolumeByTeamData) {
      const week = row.WEEK_NUMBER;
      const team = row.TEAM_NAME;
      if (week == null || !team) continue;
      teams.add(team);
      if (!weekMap.has(week)) weekMap.set(week, new Map());
      weekMap.get(week)?.set(team, row.INCIDENT_COUNT ?? 0);
    }

    const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
    const labels = weeks.map((w) => `Week ${w}`);

    const series = Array.from(teams)
      .filter((t) => t !== 'UNKNOWN')
      .sort((a, b) => a.localeCompare(b))
      .map((team) => {
        const hex = this.teamColors[team] ?? '#555555';
        const match = hex.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)!;
        const [r, g, b] = [
          parseInt(match[1], 16),
          parseInt(match[2], 16),
          parseInt(match[3], 16),
        ];
        return {
          name: team,
          type: 'line' as const,
          data: weeks.map((w) => weekMap.get(w)?.get(team) ?? 0),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: hex },
          itemStyle: { color: hex },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `rgba(${r},${g},${b},0.25)` },
              { offset: 1, color: `rgba(${r},${g},${b},0)` },
            ]),
          },
        };
      });

    this.chartOptionsMap['weeklyTeam'] = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,30,40,0.9)',
        textStyle: { color: '#fff', fontSize: 11 },
      },
      legend: {
        bottom: 2,
        textStyle: { fontSize: 10 },
        itemWidth: 10,
        itemGap: 14,
      },
      grid: { top: 10, left: 40, right: 20, bottom: 88 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9, rotate: 45, margin: 12 },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
      },
      series,
    };
  }

  flipTeamCard(): void {
    this.teamCardFlipped = !this.teamCardFlipped;
    setTimeout(() => {
      if (this.teamCardFlipped) {
        this.buildAccuracyOverTimeChart();
      } else {
        this.buildWeeklyVolumeByTeamChart();
      }
    }, 50);
  }

  flipHourlyCard(): void {
    this.hourlyCardFlipped = !this.hourlyCardFlipped;
    setTimeout(() => {
      if (this.hourlyCardFlipped) {
        this.buildWeeklyVolumeByStateChart();
      } else {
        this.buildHourlyCasePatternChart();
      }
    }, 50);
  }

  private buildAccuracyOverTimeChart(): void {
    const sorted = [...this.accuracyOverTimeData].sort((a: any, b: any) =>
      (a.WEEK_START ?? '').localeCompare(b.WEEK_START ?? ''),
    );
    const labels = sorted.map((r: any) => {
      const d = new Date(r.WEEK_START);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const catAccuracy = sorted.map((r: any) => r.CATEGORY_ACCURACY ?? null);
    const coreAccuracy = sorted.map((r: any) => r.CORE_ISSUE_ACCURACY ?? null);

    this.chartOptionsMap['accuracyTime'] = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,30,40,0.85)',
        textStyle: { color: '#fff' },
      },
      legend: {
        bottom: 2,
        textStyle: { fontSize: 10 },
        itemWidth: 10,
        itemGap: 14,
      },
      grid: { top: 10, left: 40, right: 20, bottom: 84 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9, rotate: 45, margin: 12 },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { fontSize: 10, formatter: '{value}%' },
        splitLine: { show: false },
      },
      series: [
        {
          name: 'Category',
          type: 'line',
          data: catAccuracy,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#00bceb' },
          itemStyle: { color: '#00bceb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,188,235,0.3)' },
              { offset: 1, color: 'rgba(0,188,235,0)' },
            ]),
          },
        },
        {
          name: 'Core Issue',
          type: 'line',
          data: coreAccuracy,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#0070d2' },
          itemStyle: { color: '#0070d2' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,112,210,0.25)' },
              { offset: 1, color: 'rgba(0,112,210,0)' },
            ]),
          },
        },
      ],
    };
  }

  private buildWeeklyVolumeByStateChart(): void {
    const rows = this.weeklyVolumeByStateData;
    const weekMap = new Map<number, number>();
    for (const row of rows) {
      const week = row.WEEK_NUMBER;
      if (week == null) continue;
      weekMap.set(week, (weekMap.get(week) ?? 0) + (row.CASE_COUNT ?? 0));
    }

    const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
    const labels = weeks.map((w) => `Week ${w}`);
    const values = weeks.map((w) => weekMap.get(w) ?? 0);

    this.chartOptionsMap['weeklyState'] = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,30,40,0.85)',
        textStyle: { color: '#00bceb', fontSize: 14, fontWeight: 'bold' },
      },
      grid: { top: 10, left: 40, right: 20, bottom: 20 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9, rotate: 45 },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#00bceb' },
          itemStyle: { color: '#00bceb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,188,235,0.35)' },
              { offset: 1, color: 'rgba(0,188,235,0)' },
            ]),
          },
        },
      ],
    };
  }

  private buildHourlyCasePatternChart(): void {
    const hourMap = new Map<number, number>();
    for (const row of this.hourlyCasePatternData) {
      hourMap.set(row.HOUR_OF_DAY, row.CASE_COUNT);
    }
    const currentHour = new Date().getHours();
    const hours = Array.from(
      { length: 12 },
      (_, i) => (currentHour - 11 + i + 24) % 24,
    );
    const values = hours.map((h) => hourMap.get(h) ?? 0);
    const labels = hours.map((h) => {
      const suffix = h >= 12 ? 'pm' : 'am';
      let display = h % 12;
      if (display === 0) display = 12;
      return `${display}${suffix}`;
    });

    this.chartOptionsMap['hourlyPattern'] = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,30,40,0.85)',
        textStyle: { color: '#00bceb', fontSize: 14, fontWeight: 'bold' },
      },
      grid: { top: 10, left: 40, right: 20, bottom: 20 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9 },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#00bceb' },
          itemStyle: { color: '#00bceb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,188,235,0.35)' },
              { offset: 1, color: 'rgba(0,188,235,0)' },
            ]),
          },
        },
      ],
    };
  }

  // ── Monitoring: Issues Breakdown + Error Incidents ──────────
  anomalyBreakdown: AnomalyBreakdownItem[] = [];
  teamIssueMatrix: TeamIssueMatrixEntry[] = [];
  monitoringLoading = true;

  // Drilldown modal
  drilldownOpen = false;
  drilldownInsufficient = false;
  drilldownTitle = '';
  drilldownSubtitle = '';
  drilldownPoints: { label: string; value: number }[] = [];

  // Error Incidents table
  monitoringErrorData: AnomalyItem[] = [];

  errorFilterValues: FilterValues = {
    team: [],
    issue: [],
  };

  errorFilterConfigs: FilterConfig[] = [
    {
      id: 'team',
      label: 'Team',
      type: 'multi-select',
      placeholder: 'All Teams',
      options: [],
    },
    {
      id: 'issue',
      label: 'Issue',
      type: 'multi-select',
      placeholder: 'All Issues',
      options: [],
    },
  ];

  get errorActionButtons(): ActionButtonConfig[] {
    return [
      {
        id: 'download',
        label: 'CSV',
        variant: 'secondary',
        icon: 'phosphorArrowLineDownBold',
        visible: true,
        disabled: this.csvDownloading || this.errorTotalCount === 0,
      },
    ];
  }

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
  errorCurrentPage = 1;
  errorPageSize = 10;
  errorTotalPages = 1;
  errorTotalCount = 0;
  errorLoading = false;
  csvDownloading = false;
  csvDownloadProgress = 0;
  csvDownloadDone = false;

  // Error detail modal
  errorModalOpen = false;
  errorModalTitle = '';
  errorModalTab = '';
  errorModalContent = '';

  private getSelectedSingleFilterValue(
    filterId: 'team' | 'issue',
  ): string | undefined {
    const raw = this.errorFilterValues[filterId];
    if (!Array.isArray(raw) || raw.length === 0) {
      return undefined;
    }
    return raw[0] || undefined;
  }

  private rebuildErrorFilterConfigs(): void {
    this.errorFilterConfigs = [
      {
        id: 'team',
        label: 'Team',
        type: 'multi-select',
        placeholder: 'All Teams',
        options: this.errorTeamOptions.map((team) => ({
          label: team,
          value: team,
        })),
      },
      {
        id: 'issue',
        label: 'Issue',
        type: 'multi-select',
        placeholder: 'All Issues',
        options: this.errorIssueOptions.map((issue) => ({
          label: issue,
          value: issue,
        })),
      },
    ];
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

  /** Fetch monitoring data (Issues Breakdown + Error Incidents) using the current quarter */
  fetchMonitoringData(): void {
    this.rebuildErrorFilterConfigs();
    this.monitoringLoading = true;
    const lb = 24; // default lookback when no quarter selected
    const fq = this.selectedQuarter || undefined;

    this.monitoringService.getHealth(this.destroyManager, lb, fq).subscribe({
      next: (h) => {
        this.processHealthForBreakdown(h);
        this.monitoringLoading = false;
      },
      error: () => {
        this.monitoringLoading = false;
      },
    });

    this.monitoringService
      .getTeamIssueMatrix(this.destroyManager, lb, fq)
      .subscribe({
        next: (matrix) => {
          this.teamIssueMatrix = matrix || [];
        },
      });

    this.loadErrorIncidents();
  }

  private processHealthForBreakdown(h: HealthOverview): void {
    const totalProcessed = h.TOTAL_PROCESSED || 0;
    const successCount =
      (h.SUCCESS_CNT || 0) + (h.PARTIAL_CNT || 0) + (h.NOT_SUPPORTED_CNT || 0);
    const failCount = totalProcessed - successCount;

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
        name: 'Awaiting response from bot',
        count: h.AWAITING_BOT_CNT || 0,
        severity: 'warning',
        issueKey: 'AWAITING_RESPONSE_FROM_BOT',
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

  loadErrorIncidents(): void {
    this.errorLoading = true;
    const lb = 24;
    const fq = this.selectedQuarter || undefined;
    const team = this.getSelectedSingleFilterValue('team');
    const issue = this.getSelectedSingleFilterValue('issue');

    this.monitoringService
      .getErrorIncidentsPaged(
        this.destroyManager,
        lb,
        this.errorCurrentPage,
        this.errorPageSize,
        fq,
        team,
        issue,
      )
      .subscribe({
        next: (page) => {
          this.monitoringErrorData = (page.rows || []).map((r: any) => ({
            ...r,
            anomalyLabel: r.ANOMALY_LABEL,
          }));
          this.errorTotalCount = page.totalCount || 0;
          this.errorTotalPages = Math.max(
            1,
            Math.ceil(this.errorTotalCount / this.errorPageSize),
          );
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

  onErrorFilterChange(values: FilterValues): void {
    const selectedTeams = Array.isArray(values['team'])
      ? (values['team'] as string[])
      : [];
    const selectedIssues = Array.isArray(values['issue'])
      ? (values['issue'] as string[])
      : [];

    this.errorFilterValues = {
      team: selectedTeams.length
        ? [selectedTeams[selectedTeams.length - 1]]
        : [],
      issue: selectedIssues.length
        ? [selectedIssues[selectedIssues.length - 1]]
        : [],
    };

    this.applyErrorFilters();
  }

  onErrorFilterClear(): void {
    this.errorFilterValues = {
      team: [],
      issue: [],
    };
    this.applyErrorFilters();
  }

  onErrorActionClick(actionId: string): void {
    if (actionId === 'download') {
      this.downloadErrorCsv();
    }
  }

  onErrorPageChange(event: PageChangeEvent): void {
    this.errorCurrentPage = event.pageIndex + 1;
    this.errorPageSize = event.pageSize;
    this.loadErrorIncidents();
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

    const lb = 24;
    const fq = this.selectedQuarter || undefined;
    const team = this.getSelectedSingleFilterValue('team');
    const issue = this.getSelectedSingleFilterValue('issue');
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
      this.monitoringService
        .getErrorIncidentsPaged(
          this.destroyManager,
          lb,
          page,
          chunkSize,
          fq,
          team,
          issue,
        )
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

  formatMonitoringDate(val: string): string {
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
    const fq = this.selectedQuarter || undefined;
    this.monitoringService
      .getIssueTrend(this.destroyManager, rawTeam || team, issueType, fq)
      .subscribe({
        next: (data) => {
          const pts = (data || []).map((d, i) => {
            if (fq) {
              return { label: `W${d.WEEK_START + 1}`, value: d.ISSUE_COUNT };
            }
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
            ? `WEEKLY TREND — ${fq} — TOTAL: ${total}`
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
    if (this.showAccuracyModal) this.closeAccuracyModal();
  }

  // ── Accuracy Detail Modal ─────────────────────────────────
  showAccuracyModal = false;
  accuracyModalTeam = '';
  accuracyModalTeamAccuracy: number | null = null;

  openAccuracyModal(sectionName: string): void {
    if (sectionName === 'Finance IT') return; // Only for individual teams
    const accuracy = this.getAccuracyForSection(sectionName);
    if (accuracy == null) return;
    this.accuracyModalTeam = sectionName;
    this.accuracyModalTeamAccuracy = accuracy;
    this.showAccuracyModal = true;
  }

  closeAccuracyModal(): void {
    this.showAccuracyModal = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Executive / Business View ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // switchView is no longer needed — caseiqView is an @Input from parent

  private fetchEspSummaryData(): void {
    this.espSummaryLoading = true;
    this.http
      .get('esp-case-service-metric-summary', this.destroyManager)
      .subscribe({
        next: (data: any) => {
          this.espSummaryData = Array.isArray(data) ? data : [];
          this.espSummaryLoading = false;
          if (this.caseiqView === 'executive') {
            setTimeout(() => {
              this.buildMttrChart();
              this.buildExecWeeklyChart();
              this.buildExecHourlyChart();
              this.buildSankeyChart();
            }, 0);
          }
        },
        error: () => {
          this.espSummaryLoading = false;
        },
      });
  }

  /** Get ESP summary rows filtered by the currently selected quarter */
  getEspForQuarter(): any[] {
    const qtr = this.selectedQuarter || '';
    if (!qtr) return this.espSummaryData;
    return this.espSummaryData.filter((r: any) => r.FISC_QTR === qtr);
  }

  /** Grand Total row for the selected quarter */
  getEspGrandTotal(): any | null {
    return (
      this.getEspForQuarter().find(
        (r: any) => r.SERVICE_OFFERING === 'Grand Total',
      ) || null
    );
  }

  /** Non-total service offering rows for selected quarter, sorted by inflow desc */
  getEspServiceOfferings(): any[] {
    return this.getEspForQuarter()
      .filter((r: any) => r.SERVICE_OFFERING !== 'Grand Total')
      .sort((a: any, b: any) => (b.INFLOW || 0) - (a.INFLOW || 0));
  }

  /** Aggregate ESP metrics by CaseIQ team */
  getEspByTeam(): {
    team: string;
    inflow: number;
    resolved: number;
    cancelled: number;
    routedOut: number;
    backlog: number;
    escalated: number;
    mttrBiz: number;
    mttrCal: number;
  }[] {
    const teamMap: Record<string, string> = {};
    // Build SO→team mapping from CaseIQ metrics
    if (Array.isArray(this.caseIqMetrics)) {
      this.caseIqMetrics.forEach((m: any) => {
        if (m?.TEAM_NAME && m?.IMPACTED_SERVICE_OFFERING) {
          teamMap[m.IMPACTED_SERVICE_OFFERING] = m.TEAM_NAME;
        }
      });
    }

    const teams: Record<string, any> = {};
    for (const row of this.getEspServiceOfferings()) {
      const team = teamMap[row.SERVICE_OFFERING] || 'Other';
      if (!teams[team]) {
        teams[team] = {
          team,
          inflow: 0,
          resolved: 0,
          cancelled: 0,
          routedOut: 0,
          backlog: 0,
          escalated: 0,
          mttrBizSum: 0,
          mttrCalSum: 0,
          mttrCount: 0,
        };
      }
      const t = teams[team];
      t.inflow += Number(row.INFLOW) || 0;
      t.resolved += Number(row.RESOLVED) || 0;
      t.cancelled += Number(row.CANCELLED) || 0;
      t.routedOut += Number(row.ROUTED_OUT) || 0;
      t.backlog += Number(row.BACKLOG) || 0;
      t.escalated += Number(row.ESCALATED) || 0;
      const parsed = this.parseMttr(row.MTTR);
      if (parsed) {
        t.mttrBizSum += parsed.biz;
        t.mttrCalSum += parsed.cal;
        t.mttrCount++;
      }
    }
    return Object.values(teams)
      .map((t: any) => ({
        team: t.team,
        inflow: t.inflow,
        resolved: t.resolved,
        cancelled: t.cancelled,
        routedOut: t.routedOut,
        backlog: t.backlog,
        escalated: t.escalated,
        mttrBiz: t.mttrCount
          ? Math.round((t.mttrBizSum / t.mttrCount) * 100) / 100
          : 0,
        mttrCal: t.mttrCount
          ? Math.round((t.mttrCalSum / t.mttrCount) * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.inflow - a.inflow);
  }

  /** Parse MTTR string like "(1.49/2.35)" into { biz, cal } */
  parseMttr(mttr: string | null): { biz: number; cal: number } | null {
    if (!mttr || mttr === '0') return null;
    const match = mttr.match(/\(?([\d.]+)\/([\d.]+)\)?/);
    if (!match) return null;
    return { biz: parseFloat(match[1]), cal: parseFloat(match[2]) };
  }

  /** Executive KPIs */
  executiveKpis(): CaseiqKpi[] {
    const gt = this.getEspGrandTotal();
    if (!gt) return [];
    const parsed = this.parseMttr(gt.MTTR);
    const inflow = Number(gt.INFLOW) || 0;
    const resolved = Number(gt.RESOLVED) || 0;
    const resolutionRate = inflow
      ? Math.round((resolved / inflow) * 1000) / 10
      : 0;

    return [
      {
        title: 'MTTR (Business Days)',
        color: 'accent',
        plain: true,
        plainValue: parsed ? `${parsed.biz} days` : '--',
      },
      {
        title: 'MTTR (Calendar Days)',
        color: 'cyan',
        plain: true,
        plainValue: parsed ? `${parsed.cal} days` : '--',
      },
      {
        title: 'Resolution Rate',
        color: 'green',
        pillWidth: resolutionRate,
        pillText: `${resolved} / ${inflow}`,
        pctText: `${resolutionRate}%`,
      },
      {
        title: 'Inflow',
        color: 'cyan',
        plain: true,
        plainValue: inflow.toLocaleString(),
      },
      {
        title: 'Current Backlog',
        color: 'amber',
        plain: true,
        plainValue: (Number(gt.BACKLOG) || 0).toLocaleString(),
      },
      {
        title: 'Escalations',
        color: 'purple',
        plain: true,
        plainValue: (Number(gt.ESCALATED) || 0).toLocaleString(),
      },
    ];
  }

  /** Build MTTR by Service Offering horizontal bar chart (ECharts) */
  private buildMttrChart(): void {
    const offerings = this.getEspServiceOfferings()
      .map((r: any) => ({
        name: r.SERVICE_OFFERING,
        ...this.parseMttr(r.MTTR),
      }))
      .filter((r: any) => r.biz != null && r.biz > 0)
      .sort((a: any, b: any) => b.cal - a.cal);

    if (!offerings.length) return;

    const labels = offerings.map((o: any) => {
      let name: string = o.name;
      name = name.replace('Billing, Invoice and Revenue - ', 'BIR: ');
      name = name.replace('Billing Invoice and Revenue - ', 'BIR: ');
      return name.length > 35 ? name.substring(0, 32) + '...' : name;
    });

    const isDark = this.themeService.isDarkMode;
    const textColor = isDark ? '#e0e6ed' : '#1b1c1d';
    const mutedColor = isDark ? '#8899a6' : '#666';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    this.chartOptionsMap['mttrSO'] = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(20,30,40,0.9)',
        textStyle: { color: textColor, fontSize: 11 },
      },
      legend: {
        top: 0,
        textStyle: { color: textColor, fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
      },
      grid: { top: 30, left: 10, right: 30, bottom: 10, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Days',
        nameTextStyle: { color: mutedColor, fontSize: 11 },
        axisLabel: { color: mutedColor },
        splitLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: textColor, fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Business Days',
          type: 'bar',
          data: offerings.map((o: any) => o.biz),
          itemStyle: {
            color: 'rgba(0, 112, 210, 0.7)',
            borderRadius: [0, 4, 4, 0],
          },
          barGap: '10%',
        },
        {
          name: 'Calendar Days',
          type: 'bar',
          data: offerings.map((o: any) => o.cal),
          itemStyle: {
            color: 'rgba(0, 188, 235, 0.5)',
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }

  /** Build a weekly volume chart for the executive view (ECharts) */
  private buildExecWeeklyChart(): void {
    if (this.weeklyTeamNoData || !this.weeklyVolumeByTeamData.length) return;

    const weekMap = new Map<number, Map<string, number>>();
    const teams = new Set<string>();
    for (const row of this.weeklyVolumeByTeamData) {
      const week = row.WEEK_NUMBER;
      const team = row.TEAM_NAME;
      if (week == null || !team) continue;
      teams.add(team);
      if (!weekMap.has(week)) weekMap.set(week, new Map());
      weekMap.get(week)?.set(team, row.INCIDENT_COUNT ?? 0);
    }

    const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
    const labels = weeks.map((w) => `Week ${w}`);
    const teamColorHex = this.teamColors;

    const series = Array.from(teams)
      .filter((t) => t !== 'UNKNOWN')
      .sort((a, b) => a.localeCompare(b))
      .map((team) => {
        const hex = teamColorHex[team] ?? '#555555';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return {
          name: team,
          type: 'line' as const,
          data: weeks.map((w) => weekMap.get(w)?.get(team) ?? 0),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: hex },
          itemStyle: { color: hex },
          areaStyle: { color: `rgba(${r}, ${g}, ${b}, 0.1)` },
        };
      });

    const isDark = this.themeService.isDarkMode;
    const textColor = isDark ? '#e0e6ed' : '#1b1c1d';

    this.chartOptionsMap['execWeekly'] = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20, 30, 40, 0.9)',
        textStyle: { fontSize: 11 },
      },
      legend: {
        bottom: 0,
        textStyle: { color: textColor, fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
        padding: [0, 0, 0, 0],
      },
      grid: { top: 10, left: 40, right: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9, rotate: 45 },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
      },
      series,
    };
  }

  /** Build hourly throughput chart for the executive view (24h window, ECharts) */
  private buildExecHourlyChart(): void {
    if (!this.hourlyCasePatternData.length) return;

    const hourMap = new Map<number, number>();
    for (const row of this.hourlyCasePatternData) {
      hourMap.set(row.HOUR_OF_DAY, row.CASE_COUNT);
    }
    const currentHour = new Date().getHours();
    const hours = Array.from(
      { length: 24 },
      (_, i) => (currentHour - 23 + i + 24) % 24,
    );
    const values = hours.map((h) => hourMap.get(h) ?? 0);
    const labels = hours.map((h) => {
      const suffix = h >= 12 ? 'pm' : 'am';
      let display = h % 12;
      if (display === 0) display = 12;
      return `${display}${suffix}`;
    });

    this.chartOptionsMap['execHourly'] = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,30,40,0.85)',
        textStyle: { color: '#00bceb', fontSize: 14, fontWeight: 'bold' },
        formatter: (params: any) => {
          const p = params[0];
          return `<span style="color:#8899a6;font-size:10px">${p.name} UTC</span><br/><span style="color:#00bceb;font-size:14px;font-weight:bold">${p.value.toLocaleString()} cases</span>`;
        },
      },
      grid: { top: 10, left: 40, right: 20, bottom: 20 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          fontSize: 9,
          interval: 3,
        },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#00bceb' },
          itemStyle: { color: '#00bceb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,188,235,0.35)' },
              { offset: 1, color: 'rgba(0,188,235,0)' },
            ]),
          },
        },
      ],
    };
  }

  flipSankeyCard(): void {
    this.sankeyCardFlipped = !this.sankeyCardFlipped;
    setTimeout(() => {
      if (this.sankeyCardFlipped) {
        this.buildSankeyChart2Step();
      } else {
        this.buildSankeyChart();
      }
    }, 50);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Sankey Diagram (ECharts native) ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  private buildSankeyChart(): void {
    const rows = this.getSummaryRows();
    if (!rows.length) return;

    // 3-step Sankey: Component → Agent/Ops → Outcome
    const links: { source: string; target: string; value: number }[] = [];
    const nodeSet = new Set<string>();

    // Accumulators for step 2 → step 3
    const agentOutcomes = {
      inProgress: 0,
      routedOut: 0,
      canceled: 0,
      serviceReqs: 0,
    };
    const opsOutcomes = {
      inProgress: 0,
      routedOut: 0,
      canceled: 0,
      serviceReqs: 0,
    };

    // Step 1: Component → Agent / Ops
    for (const row of rows) {
      const comp = row.sectionName;
      nodeSet.add(comp);
      const agentTotal = this.getAgentTotalCases(row);
      const opsTotal = this.getComponentOpsTotalCases(row);

      if (agentTotal > 0) {
        links.push({ source: comp, target: 'Agent', value: agentTotal });
        nodeSet.add('Agent');
      }
      if (opsTotal > 0) {
        links.push({ source: comp, target: 'Ops', value: opsTotal });
        nodeSet.add('Ops');
      }

      agentOutcomes.inProgress += row.inProgress.agent ?? 0;
      agentOutcomes.routedOut += row.routed.agent ?? 0;
      agentOutcomes.canceled += row.cancelled.agent ?? 0;
      agentOutcomes.serviceReqs += row.service.agent ?? 0;

      opsOutcomes.inProgress += row.inProgress.ops ?? 0;
      opsOutcomes.routedOut += row.routed.ops ?? 0;
      opsOutcomes.canceled += row.cancelled.ops ?? 0;
      opsOutcomes.serviceReqs += row.service.ops ?? 0;
    }

    // Step 2: Agent → outcomes
    if (agentOutcomes.inProgress > 0) {
      links.push({
        source: 'Agent',
        target: 'In Progress',
        value: agentOutcomes.inProgress,
      });
      nodeSet.add('In Progress');
    }
    if (agentOutcomes.routedOut > 0) {
      links.push({
        source: 'Agent',
        target: 'Routed Out',
        value: agentOutcomes.routedOut,
      });
      nodeSet.add('Routed Out');
    }
    if (agentOutcomes.canceled > 0) {
      links.push({
        source: 'Agent',
        target: 'Canceled',
        value: agentOutcomes.canceled,
      });
      nodeSet.add('Canceled');
    }
    if (agentOutcomes.serviceReqs > 0) {
      links.push({
        source: 'Agent',
        target: 'Service Requests',
        value: agentOutcomes.serviceReqs,
      });
      nodeSet.add('Service Requests');
    }

    // Step 2: Ops → outcomes
    if (opsOutcomes.inProgress > 0) {
      links.push({
        source: 'Ops',
        target: 'In Progress',
        value: opsOutcomes.inProgress,
      });
      nodeSet.add('In Progress');
    }
    if (opsOutcomes.routedOut > 0) {
      links.push({
        source: 'Ops',
        target: 'Routed Out',
        value: opsOutcomes.routedOut,
      });
      nodeSet.add('Routed Out');
    }
    if (opsOutcomes.canceled > 0) {
      links.push({
        source: 'Ops',
        target: 'Canceled',
        value: opsOutcomes.canceled,
      });
      nodeSet.add('Canceled');
    }
    if (opsOutcomes.serviceReqs > 0) {
      links.push({
        source: 'Ops',
        target: 'Service Requests',
        value: opsOutcomes.serviceReqs,
      });
      nodeSet.add('Service Requests');
    }

    if (!links.length) return;

    const nodeColors: Record<string, string> = {
      Agent: '#0070d2',
      Ops: '#8899a6',
      'In Progress': '#e6a800',
      'Routed Out': '#00bceb',
      Canceled: '#9933ff',
      'Service Requests': '#6ebe4a',
    };

    const colorFor = (key: string) => {
      if (nodeColors[key]) return nodeColors[key];
      if (this.teamColors[key]) return this.teamColors[key];
      return '#0070d2';
    };

    const isDark = this.themeService.isDarkMode;
    const textColor = isDark ? '#e0e6ed' : '#1b1c1d';

    const data = Array.from(nodeSet).map((name) => ({
      name,
      itemStyle: { color: colorFor(name) },
    }));

    this.chartOptionsMap['sankey3Step'] = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(20,30,40,0.9)',
        textStyle: { fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' },
      },
      series: [
        {
          type: 'sankey',
          data,
          links,
          lineStyle: { color: 'gradient', opacity: 0.4 },
          label: {
            color: textColor,
            fontSize: 9,
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          emphasis: { focus: 'adjacency' },
          nodeWidth: 20,
          nodeGap: 10,
          layoutIterations: 32,
          draggable: false,
          left: '2%',
          right: '15%',
          top: '5%',
          bottom: '5%',
        },
      ],
    } as EChartsOption;
  }

  /** 2-step Sankey: Component → Outcomes directly (ECharts) */
  private buildSankeyChart2Step(): void {
    const rows = this.getSummaryRows();
    if (!rows.length) return;

    const links: { source: string; target: string; value: number }[] = [];
    const nodeSet = new Set<string>();

    for (const row of rows) {
      const comp = row.sectionName;
      nodeSet.add(comp);
      const inProg = row.inProgress.total ?? 0;
      const routed = row.routed.total ?? 0;
      const cancelled = row.cancelled.total ?? 0;
      const service = row.service.total ?? 0;

      if (inProg > 0) {
        links.push({ source: comp, target: 'In Progress', value: inProg });
        nodeSet.add('In Progress');
      }
      if (routed > 0) {
        links.push({ source: comp, target: 'Routed Out', value: routed });
        nodeSet.add('Routed Out');
      }
      if (cancelled > 0) {
        links.push({ source: comp, target: 'Canceled', value: cancelled });
        nodeSet.add('Canceled');
      }
      if (service > 0) {
        links.push({
          source: comp,
          target: 'Service Requests',
          value: service,
        });
        nodeSet.add('Service Requests');
      }
    }

    if (!links.length) return;

    const outcomeColors: Record<string, string> = {
      'In Progress': '#e6a800',
      'Routed Out': '#00bceb',
      Canceled: '#9933ff',
      'Service Requests': '#6ebe4a',
    };

    const colorFor = (key: string) => {
      if (outcomeColors[key]) return outcomeColors[key];
      if (this.teamColors[key]) return this.teamColors[key];
      return '#0070d2';
    };

    const isDark = this.themeService.isDarkMode;
    const textColor = isDark ? '#e0e6ed' : '#1b1c1d';

    const data = Array.from(nodeSet).map((name) => ({
      name,
      itemStyle: { color: colorFor(name) },
    }));

    this.chartOptionsMap['sankey2Step'] = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(20,30,40,0.9)',
        textStyle: { fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' },
      },
      series: [
        {
          type: 'sankey',
          data,
          links,
          lineStyle: { color: 'gradient', opacity: 0.4 },
          label: {
            color: textColor,
            fontSize: 9,
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          emphasis: { focus: 'adjacency' },
          nodeWidth: 20,
          nodeGap: 10,
          layoutIterations: 32,
          draggable: false,
          left: '2%',
          right: '15%',
          top: '5%',
          bottom: '5%',
        },
      ],
    } as EChartsOption;
  }
}
