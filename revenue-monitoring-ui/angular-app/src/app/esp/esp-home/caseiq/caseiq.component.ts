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
  phosphorSparkleBold,
} from '@ng-icons/phosphor-icons/bold';
import {
  phosphorEmptyDuotone,
  phosphorCoffeeDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  SankeyChart,
  ScatterChart,
  CustomChart,
} from 'echarts/charts';
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
  ScatterChart,
  CustomChart,
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
import {
  ChordChartComponent,
  ChordFlow,
} from '../../../components/chord-chart/chord-chart.component';
import {
  ParallelSetRecord,
  ParallelSetsComponent,
} from '../../../components/parallel-sets/parallel-sets.component';
import {
  HiveLink,
  HiveNode,
  HivePlotComponent,
} from '../../../components/hive-plot/hive-plot.component';

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
  autoResolved: number | null;
  casesReopened: number | null;
}

interface CaseiqKpi {
  title: string;
  color: string;
  pillWidth?: number;
  pillText?: string;
  pctText?: string;
  plain?: boolean;
  plainValue?: string;
  clickable?: boolean;
}

/** Outcome buckets tracked per component row. */
type OutcomeKey = 'inProgress' | 'routed' | 'cancelled' | 'service';
/** Resolution Status buckets shared by the team roll-up and core-issue drilldown. */
type ResolutionMixKey =
  'success' | 'notSupported' | 'error' | 'warning' | 'unknown';

interface ResolutionMixSource {
  success: number;
  notSupported: number;
  error: number;
  warning: number;
  unknown: number;
}

/** One component row of the ctx-3 response time table. */
interface ResponseTimeRow {
  component: string;
  incidentCount: number;
  importTime: number | null;
  executionTime: number | null;
  mttr: number | null;
  executionTimeP80: number | null;
  mttrP80: number | null;
  executionTimeP90: number | null;
  mttrP90: number | null;
  autoResolved: number;
  touchedLt5: number;
  touchedLt10: number;
  touchedGt10: number;
  /** Cases that reached a post-CaseIQ state (all four churn buckets). */
  cohortTotal: number;
}

/** One core issue row of the response time drilldown modal. */
interface CoreIssueRow extends Omit<ResponseTimeRow, 'component'> {
  coreIssue: string;
}

/** One team row of the ctx-4 auto-resolve metrics table. */
interface AutoResolveRow {
  component: string;
  incidentCount: number;
  importTime: number | null;
  executionTime: number | null;
  resolutionTime: number | null;
}

/** One team row of the DSH_90_80 percentile metrics table. */
interface ExecMetricsRow {
  component: string;
  incidentCount: number;
  executionTimeP80: number | null;
  mttrP80: number | null;
  executionTimeP90: number | null;
  mttrP90: number | null;
}

/** One issue-type row of the ctx-4 not-interfaced pivot table. */
interface NotInterfacedRow {
  issueType: string;
  issueKey: 'kafkaMiss' | 'awaitingBotResponse' | 'technicalIssue';
  teams: { component: string; count: number }[];
  totalCount: number;
}

/** One team row of the ctx-4 resolution status roll-up table. */
interface ResolutionStatusRow {
  component: string;
  coreIssueCount: number;
  success: number;
  notSupported: number;
  error: number;
  warning: number;
  unknown: number;
  total: number;
}

/** One core issue row of the resolution status drilldown modal. */
interface ResolutionStatusCoreIssueRow {
  coreIssue: string;
  success: number;
  notSupported: number;
  error: number;
  warning: number;
  unknown: number;
  total: number;
}

/** Display order shared by every per-component table in this dashboard. */
const COMPONENT_ORDER = ['OM', 'SM', 'I2C', 'AIT', 'FPP', 'P2P', 'CAPITAL'];

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
    ChordChartComponent,
    ParallelSetsComponent,
    HivePlotComponent,
  ],
  providers: [
    provideIcons({
      phosphorLinkBold,
      phosphorArrowsClockwiseBold,
      phosphorArrowLineDownBold,
      phosphorSparkleBold,
      phosphorEmptyDuotone,
      phosphorCoffeeDuotone,
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
    protected readonly http: ApiHttpService,
    protected readonly destroyManager: DestroyManager,
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
    { team: 'Finance IT', deployed: 122, total: 122 },
    { team: 'OM', deployed: 14, total: 14 },
    { team: 'SM', deployed: 11, total: 11 },
    { team: 'I2C', deployed: 18, total: 18 },
    { team: 'AIT', deployed: 11, total: 11 },
    { team: 'FPP', deployed: 14, total: 14 },
    { team: 'P2P', deployed: 16, total: 16 },
    { team: 'CAPITAL', deployed: 38, total: 38 },
  ];

  showActiveAgentsModal = false;

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

  // ── Context Switcher: 1 = Operations, 2 = Executive, 3 = Executive (redux) ──
  @Input() caseiqView: 1 | 2 | 3 | 4 = 1;

  // ── Executive view data (all from new p80/p90/worknotes/coverage-gap views) ──
  /**
   * Combined p80 + p90 metrics per team from ASK_CASEIQ_METRICS_DSH_90_80_V.
   * Row columns: TEAM_NAME, INCIDENT_COUNT, CASE_IQ_EXECUTION_TIME_P80 (import
   * + execution summed), MTTR_80, CASE_IQ_EXECUTION_TIME_P90, MTTR_90.
   */
  execMetricsData: any[] = [];
  /** Global (dashboard-wide) p80/p90 averages for the quarter from ASK_CASEIQ_METRICS_AVG_EXEC_V. */
  avgExecMetricsData: any[] = [];
  /** Case-churn buckets per team from ASK_CASEIQ_WORKNOTES_DATA_V */
  execWorknotesData: any[] = [];
  /** Coverage gap (ESP cases not in CaseIQ) from ASK_CASEIQ_NOT_EXISTS_INC_V */
  execCoverageGapData: any[] = [];
  /** Response time + post-CaseIQ churn per component, filtered by quarter (ctx 3) */
  execResponseTimeData: any[] = [];
  execResponseTimeLoading = false;
  /** Per-team auto-resolve metrics from ASK_CASEIQ_AUTO_RESOLVE_METRICS_V (ctx 4) */
  autoResolveData: any[] = [];
  autoResolveLoading = false;
  /** Per-team not-interfaced counts from ASK_CASEIQ_NOT_INTERFACED_V (ctx 4) */
  notInterfacedData: any[] = [];
  notInterfacedLoading = false;
  /** Per-team resolution status roll-up from ASK_CASEIQ_RESOLUTION_STATUS_V (ctx 4) */
  resolutionStatusData: any[] = [];
  resolutionStatusLoading = false;
  /** Resolution status drilldown modal (per-team core issue breakdown) */
  resolutionModalOpen = false;
  resolutionModalTeam = '';
  resolutionModalRows: ResolutionStatusCoreIssueRow[] = [];
  resolutionModalLoading = false;
  resolutionModalFailed = false;
  /** Ctx-4 Resolution Time drilldown modal (import/execution/incidents) */
  resolutionTimeModalOpen = false;
  resolutionTimeModalComponent = '';
  resolutionTimeModalRow: AutoResolveRow | null = null;
  /** True until every executive dataset for the selected quarter has settled */
  execViewLoading = true;
  /** Response time drilldown modal (per component core-issue breakdown) */
  responseModalOpen = false;
  responseModalComponent = '';
  /** Core issue rows for the open modal — fetched only when it is opened. */
  responseModalRows: CoreIssueRow[] = [];
  responseModalLoading = false;
  responseModalFailed = false;
  /** Chord diagram inputs (Component → Channel → Outcome). */
  chordFlows: ChordFlow[] = [];
  chordColors: Record<string, string> = {};
  chordOrder: string[] = [];
  /** Parallel sets inputs (one record per Component × Channel × Outcome). */
  parsetRecords: ParallelSetRecord[] = [];
  parsetColors: Record<string, string> = {};
  parsetOrder: string[][] = [];
  readonly parsetDimensions = ['Component', 'Channel', 'Outcome'];
  /** Hive plot inputs. */
  hiveNodes: HiveNode[] = [];
  hiveLinks: HiveLink[] = [];
  hiveColors: Record<string, string> = {};
  readonly hiveAxes = ['Components', 'Channels', 'Outcomes'];
  /** Flip state for middle-top card (Resolution Time ↔ Case Churn) */
  execMttrCardFlipped = false;
  /** Flip state for middle-bottom card (Weekly Case Volume ↔ Hourly Processing Load) */
  execBottomCardFlipped = false;
  /**
   * Row labels (team names) currently hidden on the P80 → P90 dumbbell chart.
   * Clicking a y-axis label toggles membership so users can hide outlier rows
   * that blow out the shared x-axis scale. FPP is hidden by default because
   * bulk-load spikes skew the axis.
   */
  hiddenDumbbellRows = new Set<string>(['FPP']);
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
        this.fetchExecResponseTime();
        this.fetchExecViewData();
        this.fetchAutoResolveMetrics();
        this.fetchNotInterfaced();
        this.fetchResolutionStatus();
        // Rebuild the active context's charts when the quarter changes
        this.scheduleContextChartRebuild(100, false);
      }
    }

    if ('caseiqView' in changes && this.viewInitialized) {
      this.scheduleContextChartRebuild(50, true);
    }
  }

  /**
   * Rebuild the charts belonging to the active context after `delayMs`.
   * When `includeOps` is true, context 1 also re-creates its canvases (they are
   * removed from the DOM while another context is displayed).
   */
  private scheduleContextChartRebuild(delayMs: number, includeOps: boolean) {
    if (this.caseiqView === 2) {
      setTimeout(() => {
        this.buildMttrChart();
        this.buildChurnChart();
        this.buildExecWeeklyChart();
        this.buildExecHourlyChart();
        this.buildSankeyChart();
      }, delayMs);
    } else if (this.caseiqView === 3) {
      setTimeout(() => this.buildCtx3Charts(), delayMs);
    } else if (includeOps) {
      setTimeout(() => {
        this.createAllCharts();
        this.tryBuildAnalyticsCharts();
      }, delayMs);
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    // Rebuild executive charts when theme toggles
    this.themeSub = this.themeService.isDarkMode$.subscribe(() => {
      if (this.caseiqView === 2) {
        setTimeout(() => {
          this.buildMttrChart();
          this.buildChurnChart();
          this.buildExecWeeklyChart();
          this.buildExecHourlyChart();
          if (this.sankeyCardFlipped) {
            this.buildSankeyChart2Step();
          } else {
            this.buildSankeyChart();
          }
        }, 50);
      } else if (this.caseiqView === 3) {
        setTimeout(() => this.buildCtx3Charts(), 50);
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

    // Fetch executive-view datasets (p80, p90, worknotes churn, coverage gap)
    this.fetchExecViewData();
    this.fetchExecResponseTime();
    this.fetchAutoResolveMetrics();
    this.fetchNotInterfaced();
    this.fetchResolutionStatus();

    // Initial build of sections/charts once view is ready
    this.buildSectionsFromMetrics();
    this.showLoadingForMoment();
  }

  /**
   * Rebuild `sections` from the current metrics array. Exposed so subclasses
   * (e.g. {@link QbrComponent}) can trigger it after assigning
   * `caseIqMetrics` outside of the normal parent-driven `@Input` flow.
   */
  protected rebuildSections(): void {
    this.buildSectionsFromMetrics();
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
      autoResolved: this.toNumber(teamData.AUTO_RESOLVED),
      casesReopened: this.toNumber(teamData.CASES_REOPENED),
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
  getSumMetricTotal(metric: OutcomeKey): number {
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
        color: 'cyan',
        pillWidth: opsRate,
        pillText: `${agentTotal.toLocaleString()} / ${(agentTotal + opsTotal).toLocaleString()}`,
        pctText: `${opsRate.toFixed(1)}%`,
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

  /**
   * Secondary KPI strip for ctx-1: global p80/p90 averages (from
   * ASK_CASEIQ_METRICS_AVG_EXEC_V) plus active-agent coverage from the
   * component table. Auto Resolved + Cases Reopened are pending queries.
   */
  avgExecKpis(): CaseiqKpi[] {
    const row = this.avgExecMetricsData?.[0] ?? null;
    const num = (key: string): number | null => {
      if (!row) return null;
      const v = Number(row[key] ?? row[key.toUpperCase()]);
      return Number.isFinite(v) ? v : null;
    };
    const mttrText = (min: number | null): string => {
      if (min == null) return '—';
      if (Math.abs(min) < 1440) return `${(min / 60).toFixed(1)} h`;
      return `${(min / 1440).toFixed(1)} days`;
    };

    const summaryRows = this.getSummaryRows();
    let deployed = 0;
    let total = 0;
    for (const r of summaryRows) {
      const a = this.getAgentForRow(r);
      deployed += a.deployed;
      total += a.total;
    }
    const agentPct = total > 0 ? (deployed / total) * 100 : 0;

    const totalCases = summaryRows.reduce(
      (acc, r) => acc + (r.totalCases ?? 0),
      0,
    );
    const autoResolvedSum = summaryRows.reduce(
      (acc, r) => acc + (r.autoResolved ?? 0),
      0,
    );
    const casesReopenedSum = summaryRows.reduce(
      (acc, r) => acc + (r.casesReopened ?? 0),
      0,
    );
    // Check raw backend rows (not summaryRows) because toNumber() coerces null to 0.
    const rawMetrics = this.getFilteredMetricsByQuarter() ?? [];
    const hasAutoResolvedData =
      Array.isArray(rawMetrics) &&
      rawMetrics.some((m: any) => m?.AUTO_RESOLVED != null);
    const hasReopenedData =
      Array.isArray(rawMetrics) &&
      rawMetrics.some((m: any) => m?.CASES_REOPENED != null);
    const pillOf = (title: string, color: string, value: number): CaseiqKpi => {
      const pct = totalCases > 0 ? (value / totalCases) * 100 : 0;
      return {
        title,
        color,
        pillWidth: pct,
        pillText: `${value.toLocaleString()} / ${totalCases.toLocaleString()}`,
        pctText: totalCases > 0 ? `${pct.toFixed(1)}%` : '--',
      };
    };

    return [
      {
        title: 'Active Agents',
        color: 'accent',
        pillWidth: agentPct,
        pillText: `${deployed.toLocaleString()} / ${total.toLocaleString()}`,
        pctText: total > 0 ? `${agentPct.toFixed(0)}%` : '--',
        clickable: true,
      },
      ...(this.hasAutoResolveColumns() && hasAutoResolvedData
        ? [pillOf('Auto Resolved', 'green', autoResolvedSum)]
        : []),
      ...(this.hasAutoResolveColumns() && hasReopenedData
        ? [pillOf('Cases Reopened', 'amber', casesReopenedSum)]
        : []),
    ];
  }

  /**
   * Two custom MTTR cards (CaseIQ + Case) rendered at the front of the ctx-1
   * secondary strip. Each card has a colored label box on the left with a
   * stacked "CaseIQ / MTTR" or "Case / MTTR" title, and two p80/p90 pair
   * stacks to the right.
   */
  mttrCards(): {
    label: string;
    sublabel: string;
    color: string;
    pairs: { title: string; value: string }[];
  }[] {
    const row = this.avgExecMetricsData?.[0] ?? null;
    const num = (key: string): number | null => {
      if (!row) return null;
      const v = Number(row[key] ?? row[key.toUpperCase()]);
      return Number.isFinite(v) ? v : null;
    };
    const mttrText = (min: number | null): string => {
      if (min == null) return '—';
      if (Math.abs(min) < 1440) return `${(min / 60).toFixed(1)} h`;
      return `${(min / 1440).toFixed(1)} days`;
    };
    return [
      {
        label: 'CaseIQ',
        sublabel: 'MTTR',
        color: 'green',
        pairs: [
          {
            title: '80th percentile',
            value: this.formatDuration(num('AVG_EXECUTION_TIME_P80_MIN')),
          },
          {
            title: '90th percentile',
            value: this.formatDuration(num('AVG_EXECUTION_TIME_P90_MIN')),
          },
        ],
      },
      {
        label: 'Case',
        sublabel: 'MTTR',
        color: 'cyan',
        pairs: [
          { title: '80th percentile', value: mttrText(num('MTTR_80_MIN')) },
          { title: '90th percentile', value: mttrText(num('MTTR_90_MIN')) },
        ],
      },
    ];
  }

  /** True when the selected quarter is Q1FY27 or later — the point at which AUTO_RESOLVED / CASES_REOPENED data starts flowing. */
  hasAutoResolveColumns(): boolean {
    const match = /^Q(\d)FY(\d+)$/i.exec(this.selectedQuarter ?? '');
    if (!match) return false;
    const q = Number(match[1]);
    const fy = Number(match[2]);
    return fy * 10 + q >= 27 * 10 + 1;
  }

  /** Rows shown inside the Active Agents modal — one per non-Finance IT team plus totals. */
  activeAgentsModalRows(): { team: string; deployed: number; total: number }[] {
    return this.getSummaryRows().map((r) => ({
      team: r.sectionName,
      ...this.getAgentForRow(r),
    }));
  }

  openActiveAgentsModal(): void {
    this.showActiveAgentsModal = true;
  }

  closeActiveAgentsModal(): void {
    this.showActiveAgentsModal = false;
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
    OM: '#00bceb',
    SM: '#0070d2',
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
      .sort((a, b) => {
        // Draw OM last so it renders on top of the other lines.
        if (a === 'OM') return 1;
        if (b === 'OM') return -1;
        return a.localeCompare(b);
      })
      .map((team) => {
        const hex = this.teamColors[team] ?? '#555555';
        const match = hex.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)!;
        const [r, g, b] = [
          parseInt(match[1], 16),
          parseInt(match[2], 16),
          parseInt(match[3], 16),
        ];
        const isOm = team === 'OM';
        return {
          name: team,
          type: 'line' as const,
          // Force OM above every other series (line + symbol + area layers).
          z: isOm ? 10 : 2,
          zlevel: isOm ? 1 : 0,
          data: weeks.map((w) => weekMap.get(w)?.get(team) ?? 0),
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2.5, color: hex },
          itemStyle: { color: '#ffffff', borderColor: hex, borderWidth: 2.5 },
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
          symbolSize: 7,
          lineStyle: { width: 2.5, color: '#00bceb' },
          itemStyle: {
            color: '#ffffff',
            borderColor: '#00bceb',
            borderWidth: 2.5,
          },
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
          symbolSize: 7,
          lineStyle: { width: 2.5, color: '#0070d2' },
          itemStyle: {
            color: '#ffffff',
            borderColor: '#0070d2',
            borderWidth: 2.5,
          },
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
          symbolSize: 7,
          lineStyle: { width: 2.5, color: '#00bceb' },
          itemStyle: {
            color: '#ffffff',
            borderColor: '#00bceb',
            borderWidth: 2.5,
          },
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
          symbolSize: 7,
          lineStyle: { width: 2.5, color: '#00bceb' },
          itemStyle: {
            color: '#ffffff',
            borderColor: '#00bceb',
            borderWidth: 2.5,
          },
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
    'Awaiting Bot Response',
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
    if (this.responseModalOpen) this.closeResponseDetail();
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
  // ── Executive View ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // switchView is no longer needed — caseiqView is an @Input from parent

  /**
   * Fetch the three executive-view datasets for the selected quarter
   * (combined p80/p90 metrics, worknotes churn, coverage gap).
   */
  private fetchExecViewData(): void {
    const qtr = this.selectedQuarter || 'Q4FY26';
    this.execViewLoading = true;
    let settled = 0;
    const settle = () => {
      settled += 1;
      if (settled >= 3) this.execViewLoading = false;
    };
    const rebuild = () => {
      settle();
      if (this.caseiqView === 2) {
        setTimeout(() => {
          this.buildMttrChart();
        }, 0);
      } else if (this.caseiqView === 3) {
        setTimeout(() => this.buildCtx3Charts(), 0);
      }
    };
    const rebuildChurn = () => {
      settle();
      if (this.caseiqView === 2) {
        setTimeout(() => {
          this.buildChurnChart();
        }, 0);
      } else if (this.caseiqView === 3) {
        setTimeout(() => this.buildCtx3Charts(), 0);
      }
    };
    this.http
      .get(`caseiq/exec/metrics?fiscQtr=${qtr}`, this.destroyManager)
      .subscribe({
        next: (d: any) => {
          this.execMetricsData = Array.isArray(d) ? d : [];
          rebuild();
        },
        error: () => settle(),
      });
    this.http
      .get(`caseiq/exec/avg-metrics?fiscQtr=${qtr}`, this.destroyManager)
      .subscribe({
        next: (d: any) => {
          this.avgExecMetricsData = Array.isArray(d) ? d : [];
        },
        error: () => {
          this.avgExecMetricsData = [];
        },
      });
    this.http
      .get(`caseiq/exec/worknotes-churn?fiscQtr=${qtr}`, this.destroyManager)
      .subscribe({
        next: (d: any) => {
          this.execWorknotesData = Array.isArray(d) ? d : [];
          rebuildChurn();
        },
        error: () => settle(),
      });
    this.http
      .get(`caseiq/exec/coverage-gap?fiscQtr=${qtr}`, this.destroyManager)
      .subscribe({
        next: (d: any) => {
          this.execCoverageGapData = Array.isArray(d) ? d : [];
          settle();
        },
        error: () => settle(),
      });
  }

  /** No percentile metrics for the selected quarter (dumbbell + MTTR charts). */
  get execMetricsNoData(): boolean {
    return !this.execViewLoading && !this.execMetricsData.length;
  }

  /** No post-CaseIQ worknote activity for the selected quarter (churn chart). */
  get execChurnNoData(): boolean {
    return !this.execViewLoading && !this.execWorknotesData.length;
  }

  /**
   * Column-prefix resilient reader for the exec metrics views. Reading by
   * prefix lets us survive column renames by the DB owner.
   */
  protected execCol(row: any, prefix: string): number | null {
    if (!row) return null;
    const target = prefix.toUpperCase();
    for (const key of Object.keys(row)) {
      if (key.toUpperCase().startsWith(target)) {
        const val = Number(row[key]);
        return Number.isFinite(val) ? val : null;
      }
    }
    return null;
  }

  private execTeam(row: any): string | null {
    if (!row) return null;
    for (const key of Object.keys(row)) {
      if (key.toUpperCase() === 'TEAM_NAME') {
        const v = row[key];
        return v == null ? null : String(v);
      }
    }
    return null;
  }

  /** Executive KPIs — Sourced entirely from the new p80/p90/coverage-gap/accuracy views. */
  executiveKpis(): CaseiqKpi[] {
    // Weighted MTTR (hours) from MTTR_90 + INCIDENT_COUNT.
    const mttrHrs = this.computeWeightedResolutionHours('90');

    // Response time P80/P90 (minutes) already summed as import + execution in
    // the combined view. Weighted by INCIDENT_COUNT.
    const rtP80 = this.computeWeightedResponseMinutes('P80');
    const rtP90 = this.computeWeightedResponseMinutes('P90');

    // Cases in ESP but not picked by CaseIQ.
    const notPicked = this.execCoverageGapData.reduce(
      (sum: number, row: any) =>
        sum + (Number(this.execCol(row, 'INCIDENT_COUNT')) || 0),
      0,
    );

    // Touchless rate = UPDATED_ONCE cases / all worknote-count cases.
    const touchless = this.computeTouchless();

    // Accuracy — reuse the Finance IT accuracy already computed for the ops strip.
    const accuracyPct = this.getAccuracyForSection('Finance IT');
    const accuracyCases = this.getTotalCasesFromAccuracy('Finance IT');

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
        title: 'Touchless Rate',
        color: 'cyan',
        pillWidth: touchless ? touchless.pct : 0,
        pillText: touchless
          ? `${touchless.touchless.toLocaleString()} / ${touchless.total.toLocaleString()}`
          : '--',
        pctText: touchless ? `${Math.round(touchless.pct)}%` : '--',
      },
      {
        title: 'MTTR',
        color: 'cyan',
        plain: true,
        plainValue: mttrHrs != null ? `${mttrHrs.toFixed(1)} hrs` : '--',
      },
      {
        title: 'Response Time P80',
        color: 'green',
        plain: true,
        plainValue: rtP80 != null ? `${rtP80.toFixed(1)} min` : '--',
      },
      {
        title: 'Response Time P90',
        color: 'green',
        plain: true,
        plainValue: rtP90 != null ? `${rtP90.toFixed(1)} min` : '--',
      },
      {
        title: 'Not Picked by CaseIQ',
        color: 'amber',
        plain: true,
        plainValue: notPicked ? notPicked.toLocaleString() : '--',
      },
      {
        title: 'Cases Not Analyzed (Conv Bot Timeout)',
        color: 'purple',
        plain: true,
        plainValue: 'need data',
      },
    ];
  }

  /**
   * Weighted mean of the combined "response time" column
   * (CASE_IQ_EXECUTION_TIME_P80 / _P90 — already includes import + execution)
   * from ASK_CASEIQ_METRICS_DSH_90_80_V, weighted by INCIDENT_COUNT.
   */
  protected computeWeightedResponseMinutes(
    percentile: 'P80' | 'P90',
  ): number | null {
    const rows = this.execMetricsData;
    if (!Array.isArray(rows) || !rows.length) return null;
    const col = `CASE_IQ_EXECUTION_TIME_${percentile}`;
    let weighted = 0;
    let totalWeight = 0;
    for (const row of rows) {
      const val = this.execCol(row, col);
      const count = this.execCol(row, 'INCIDENT_COUNT') ?? 0;
      if (val == null || count <= 0) continue;
      weighted += val * count;
      totalWeight += count;
    }
    return totalWeight > 0 ? weighted / totalWeight : null;
  }

  /**
   * Weighted mean of MTTR_80 or MTTR_90 (stored in minutes) converted to hours.
   */
  protected computeWeightedResolutionHours(
    percentile: '80' | '90',
  ): number | null {
    const rows = this.execMetricsData;
    if (!Array.isArray(rows) || !rows.length) return null;
    const col = `MTTR_${percentile}`;
    let weighted = 0;
    let totalWeight = 0;
    for (const row of rows) {
      const rt = this.execCol(row, col);
      const count = this.execCol(row, 'INCIDENT_COUNT') ?? 0;
      if (rt == null || count <= 0) continue;
      weighted += rt * count;
      totalWeight += count;
    }
    return totalWeight > 0 ? weighted / totalWeight / 60 : null;
  }

  /**
   * Touchless case share = UPDATED_ONCE / total across all worknote buckets.
   * Returns null when the worknotes view has not yet loaded.
   */
  private computeTouchless(): {
    touchless: number;
    total: number;
    pct: number;
  } | null {
    if (!this.execWorknotesData.length) return null;
    let touchless = 0;
    let total = 0;
    for (const row of this.execWorknotesData) {
      const count = this.execCol(row, 'INCIDENT_COUNT') ?? 0;
      if (count <= 0) continue;
      total += count;
      const bucket = this.readChurnBucket(row);
      if (bucket === 'UPDATED_ONCE') touchless += count;
    }
    if (total <= 0) return null;
    return { touchless, total, pct: (touchless / total) * 100 };
  }

  /**
   * Handle clicks on the P80 → P90 dumbbell chart. Y-axis labels have
   * `triggerEvent: true`, so clicking a label like "FPP — Import" fires here
   * with `componentType === 'yAxis'`. We toggle the row in
   * {@link hiddenDumbbellRows} and rebuild the chart so the axis label
   * updates (strikethrough) and data points/connectors are re-filtered.
   */
  onDumbbellChartClick(event: any): void {
    if (event?.componentType !== 'yAxis') return;
    const value = event?.value;
    const label = typeof value === 'string' ? value : String(value ?? '');
    if (!label) return;

    if (this.hiddenDumbbellRows.has(label)) {
      this.hiddenDumbbellRows.delete(label);
    } else {
      this.hiddenDumbbellRows.add(label);
    }
    this.buildMttrChart();
  }

  /** Restore every hidden row on the P80 → P90 dumbbell chart. */
  resetHiddenDumbbellRows(): void {
    if (this.hiddenDumbbellRows.size === 0) return;
    this.hiddenDumbbellRows.clear();
    this.buildMttrChart();
  }

  /**
   * Build the P80 → P90 dumbbell chart of response time (import + execution,
   * already summed by the DSH_90_80 view) per component. One row per team.
   * Also drives the sibling MTTR bar chart via {@link buildResolutionChart}.
   */
  private buildMttrChart(): void {
    this.buildResolutionChart();

    if (!this.execMetricsData.length) return;

    // Preferred display order matches the component table below (OM first, CAPITAL last).
    // ECharts renders yAxis category data bottom-up, so reverse the order so
    // the visual top-to-bottom matches OM → SM → I2C → AIT → FPP → P2P → CAPITAL.
    const teamOrder = ['OM', 'SM', 'I2C', 'AIT', 'FPP', 'P2P', 'CAPITAL'];

    const rowByTeam: Record<string, any> = {};
    for (const row of this.execMetricsData) {
      const team = this.execTeam(row);
      if (team) rowByTeam[team] = row;
    }

    const teams = teamOrder.filter((t) => rowByTeam[t]).reverse();
    if (!teams.length) return;

    // yLabels: one row per team. Rows in `hiddenDumbbellRows` stay on the axis
    // (with a muted / strikethrough label) so users can click to unhide them —
    // data points and connectors are simply suppressed below.
    const yLabels: string[] = teams.slice();

    const dotColor = '#0070d2';

    const p80Points: Array<[number, string, string, number, string]> = []; // [x, y-label, kind, count, team]
    const p90Points: Array<[number, string, string, number, string]> = [];
    const connectors: Array<Array<[number, string]>> = [];

    for (const team of teams) {
      if (this.hiddenDumbbellRows.has(team)) continue;
      const row = rowByTeam[team];
      const count = this.execCol(row, 'INCIDENT_COUNT') ?? 0;
      const rt80 = this.execCol(row, 'CASE_IQ_EXECUTION_TIME_P80');
      const rt90 = this.execCol(row, 'CASE_IQ_EXECUTION_TIME_P90');
      if (rt80 == null || rt90 == null) continue;
      p80Points.push([rt80, team, 'Response Time P80', count, team]);
      p90Points.push([rt90, team, 'Response Time P90', count, team]);
      connectors.push([
        [rt80, team],
        [rt90, team],
      ]);
    }

    const isDark = this.themeService.isDarkMode;
    const textColor = isDark ? '#e0e6ed' : '#1b1c1d';
    const mutedColor = isDark ? '#8899a6' : '#666';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const axisLabelColor = (val: string) =>
      this.hiddenDumbbellRows.has(val) ? mutedColor : textColor;

    const axisLabelFormatter = (val: string) =>
      this.hiddenDumbbellRows.has(val) ? `✕  ${val}` : val;

    this.chartOptionsMap['mttrSO'] = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(20,30,40,0.9)',
        textStyle: { color: '#e0e6ed', fontSize: 11 },
        formatter: (params: any) => {
          const [x, , kind, count, team] = params.value as [
            number,
            string,
            string,
            number,
            string,
          ];
          return (
            `<div style="font-weight:600;color:${dotColor};">${team}</div>` +
            `<div>${kind}: <strong>${x.toFixed(1)} min</strong></div>` +
            `<div style="color:${mutedColor};font-size:10px;">n = ${count.toLocaleString()}</div>`
          );
        },
      },
      legend: {
        top: 0,
        data: [
          { name: 'P80', icon: 'circle', itemStyle: { color: mutedColor } },
          { name: 'P90', icon: 'circle', itemStyle: { color: dotColor } },
        ],
        textStyle: { color: textColor, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { top: 35, left: 10, right: 60, bottom: 30, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Minutes',
        nameLocation: 'end',
        nameGap: 12,
        nameTextStyle: {
          color: mutedColor,
          fontSize: 11,
          padding: [0, 0, 0, 4],
        },
        axisLabel: { color: mutedColor, fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        triggerEvent: true,
        axisLabel: {
          fontSize: 11,
          color: (val: string) => axisLabelColor(val),
          fontWeight: 500,
          formatter: axisLabelFormatter,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'custom',
          renderItem: (_params: any, api: any) => {
            const start = api.coord([api.value(0), api.value(1)]);
            const end = api.coord([api.value(2), api.value(1)]);
            return {
              type: 'line',
              shape: {
                x1: start[0],
                y1: start[1],
                x2: end[0],
                y2: end[1],
              },
              style: {
                stroke: dotColor,
                lineWidth: 3,
                opacity: 0.35,
              },
            };
          },
          encode: { x: [0, 2], y: 1 },
          data: connectors.map(([a, b]) => [a[0], a[1], b[0]]),
          silent: true,
          z: 1,
        },
        {
          name: 'P80',
          type: 'scatter',
          data: p80Points,
          symbolSize: 12,
          itemStyle: {
            color: '#ffffff',
            borderColor: mutedColor,
            borderWidth: 2,
          },
          z: 3,
        },
        {
          name: 'P90',
          type: 'scatter',
          data: p90Points,
          symbolSize: 13,
          itemStyle: {
            color: dotColor,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          z: 4,
        },
      ],
    };
  }

  /**
   * Middle-top card: MTTR (P90) by component, horizontal bars. Reads MTTR_90
   * from the DSH_90_80 view (minutes; rendered in hours).
   */
  private buildResolutionChart(): void {
    if (!this.execMetricsData.length) return;

    const teamOrder = ['OM', 'SM', 'I2C', 'AIT', 'FPP', 'P2P', 'CAPITAL'];
    const rowByTeam: Record<string, any> = {};
    for (const row of this.execMetricsData) {
      const team = this.execTeam(row);
      if (team) rowByTeam[team] = row;
    }

    const entries = teamOrder
      .filter((t) => rowByTeam[t])
      .map((team) => {
        const mins = this.execCol(rowByTeam[team], 'MTTR_90') ?? 0;
        const count = this.execCol(rowByTeam[team], 'INCIDENT_COUNT') ?? 0;
        return { team, hours: Math.round((mins / 60) * 10) / 10, count };
      })
      .filter((e) => e.hours > 0)
      // Ascending → ECharts renders data[0] at bottom, so largest lands at top.
      .sort((a, b) => a.hours - b.hours);

    if (!entries.length) return;

    const isDark = this.themeService.isDarkMode;
    const textColor = isDark ? '#e0e6ed' : '#1b1c1d';
    const mutedColor = isDark ? '#8899a6' : '#666';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    this.chartOptionsMap['resolutionByTeam'] = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(20,30,40,0.9)',
        textStyle: { color: '#e0e6ed', fontSize: 11 },
        formatter: (params: any) => {
          const p = params[0];
          const entry = entries[p.dataIndex];
          return (
            `<div style="font-weight:600;">${entry.team}</div>` +
            `<div>MTTR: <strong>${entry.hours.toFixed(1)} hrs</strong></div>` +
            `<div style="color:${mutedColor};font-size:10px;">n = ${entry.count.toLocaleString()}</div>`
          );
        },
      },
      grid: { top: 20, left: 10, right: 40, bottom: 20, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Hours',
        nameTextStyle: { color: mutedColor, fontSize: 11 },
        axisLabel: { color: mutedColor, fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: 'category',
        data: entries.map((e) => e.team),
        axisLabel: {
          color: textColor,
          fontSize: 11,
          fontWeight: 400,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: entries.map((e) => e.hours),
          itemStyle: {
            // Muted single-family gradient (accent KPI palette: dark blue → cyan).
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#0070d2' },
              { offset: 1, color: '#00bceb' },
            ]),
            borderRadius: [6, 6, 6, 6],
          },
          label: {
            show: true,
            position: 'right',
            color: mutedColor,
            fontSize: 11,
            fontWeight: 400,
            formatter: (params: any) =>
              `${entries[params.dataIndex].hours.toFixed(1)} hrs`,
          },
          barMaxWidth: 24,
        },
      ],
    };
  }

  /**
   * Case Churn by Component — horizontal stacked bar of worknote-count buckets
   * per team (UPDATED_ONCE = touchless / good, >10 = high churn / bad).
   * Data source: ASK_CASEIQ_WORKNOTES_DATA_V via /api/caseiq/exec/worknotes-churn.
   */
  private buildChurnChart(): void {
    if (!this.execWorknotesData.length) return;

    // Preferred display order — same as dumbbell (reversed so OM lands at top).
    const teamOrder = ['OM', 'SM', 'I2C', 'AIT', 'FPP', 'P2P', 'CAPITAL'];
    // Bucket order + friendly labels + severity gradients (green → red).
    // Each gradient shifts within its color family so stacked segments still
    // have visual depth even when a segment is short.
    const buckets: Array<{
      key: string;
      label: string;
      legendColor: string;
      gradient: [string, string];
    }> = [
      {
        key: 'UPDATED_ONCE',
        label: 'Touchless (1 update)',
        legendColor: '#16a34a',
        gradient: ['#4ade80', '#16a34a'],
      },
      {
        key: '<5',
        label: '< 5 updates',
        legendColor: '#00bceb',
        gradient: ['#22d3ee', '#0891b2'],
      },
      {
        key: '<10',
        label: '< 10 updates',
        legendColor: '#e6a800',
        gradient: ['#fbbf24', '#d97706'],
      },
      {
        key: '>10',
        label: '> 10 updates',
        legendColor: '#dc2626',
        gradient: ['#f87171', '#dc2626'],
      },
    ];

    const totals = this.aggregateChurnTotals();
    const teams = teamOrder.filter((t) => totals[t]).reverse();
    if (!teams.length) return;

    // Precompute per-team first/last non-zero bucket indices for rounded caps.
    const capIndices = teams.map((t) =>
      this.churnCapIndices(t, totals, buckets),
    );

    const isDark = this.themeService.isDarkMode;
    const textColor = isDark ? '#e0e6ed' : '#1b1c1d';
    const mutedColor = isDark ? '#8899a6' : '#666';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const churnTooltipFormatter = (params: any) => {
      const team = params[0]?.axisValue ?? '';
      const total = params.reduce(
        (s: number, p: any) => s + (Number(p.value) || 0),
        0,
      );
      const rows = params
        .map(
          (p: any) =>
            `<div style="display:flex;justify-content:space-between;gap:12px;">` +
            `<span>${p.marker}${p.seriesName}</span>` +
            `<strong>${(Number(p.value) || 0).toLocaleString()}</strong>` +
            `</div>`,
        )
        .join('');
      return (
        `<div style="font-weight:600;margin-bottom:4px;">${team}</div>` +
        rows +
        `<div style="border-top:1px solid ${mutedColor};margin-top:4px;padding-top:4px;` +
        `display:flex;justify-content:space-between;gap:12px;">` +
        `<span>Total</span><strong>${total.toLocaleString()}</strong></div>`
      );
    };

    this.chartOptionsMap['churnByTeam'] = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(20,30,40,0.9)',
        textStyle: { color: '#e0e6ed', fontSize: 11 },
        formatter: churnTooltipFormatter,
      },
      legend: {
        top: 0,
        data: buckets.map((b) => ({
          name: b.label,
          itemStyle: { color: b.legendColor },
        })),
        textStyle: { color: textColor, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { top: 35, left: 10, right: 40, bottom: 20, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Cases',
        nameLocation: 'end',
        nameGap: 12,
        nameTextStyle: {
          color: mutedColor,
          fontSize: 11,
          padding: [0, 0, 0, 4],
        },
        axisLabel: { color: mutedColor, fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: 'category',
        data: teams,
        axisLabel: { color: textColor, fontSize: 11, fontWeight: 400 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: buckets.map((b, bIdx) => ({
        name: b.label,
        type: 'bar',
        stack: 'churn',
        data: teams.map((t, tIdx) => ({
          value: totals[t]?.[b.key] ?? 0,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: b.gradient[0] },
              { offset: 1, color: b.gradient[1] },
            ]),
            borderRadius: this.churnDatumRadius(bIdx, capIndices[tIdx]),
          },
        })),
        barMaxWidth: 28,
        emphasis: { focus: 'series' },
      })),
    };
  }

  /** Aggregate churn buckets into team → bucketKey → count for buildChurnChart. */
  private aggregateChurnTotals(): Record<string, Record<string, number>> {
    const totals: Record<string, Record<string, number>> = {};
    for (const row of this.execWorknotesData) {
      const team = this.execTeam(row);
      if (!team) continue;
      const bucket = this.readChurnBucket(row);
      if (!bucket) continue;
      const count = this.execCol(row, 'INCIDENT_COUNT') ?? 0;
      totals[team] = totals[team] ?? {};
      totals[team][bucket] = (totals[team][bucket] ?? 0) + count;
    }
    return totals;
  }

  private readChurnBucket(row: any): string | null {
    for (const key of Object.keys(row)) {
      if (key.toUpperCase() === 'WORK_NOTES_COUNT') {
        const v = row[key];
        return v == null ? null : String(v);
      }
    }
    return null;
  }

  /** Return {first, last} indices of the non-zero buckets for a team's stack. */
  private churnCapIndices(
    team: string,
    totals: Record<string, Record<string, number>>,
    buckets: Array<{ key: string }>,
  ): { first: number; last: number } {
    let first = -1;
    let last = -1;
    for (let i = 0; i < buckets.length; i++) {
      const v = totals[team]?.[buckets[i].key] ?? 0;
      if (v > 0) {
        if (first === -1) first = i;
        last = i;
      }
    }
    return { first, last };
  }

  /** Per-datum radius: round only the visual outer caps of each team's stack. */
  private churnDatumRadius(
    bIdx: number,
    caps: { first: number; last: number },
  ): number[] {
    const isFirst = bIdx === caps.first;
    const isLast = bIdx === caps.last;
    if (isFirst && isLast) return [6, 6, 6, 6];
    if (isFirst) return [6, 0, 0, 6];
    if (isLast) return [0, 6, 6, 0];
    return [0, 0, 0, 0];
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
      .sort((a, b) => {
        // Draw OM last so it renders on top of the other lines.
        if (a === 'OM') return 1;
        if (b === 'OM') return -1;
        return a.localeCompare(b);
      })
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
          symbolSize: 7,
          lineStyle: { width: 2.5, color: hex },
          itemStyle: { color: '#ffffff', borderColor: hex, borderWidth: 2.5 },
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
        padding: [4, 0, 0, 0],
      },
      grid: { top: 10, left: 40, right: 20, bottom: 50 },
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
          symbolSize: 7,
          lineStyle: { width: 3, color: '#00bceb' },
          itemStyle: {
            color: '#ffffff',
            borderColor: '#00bceb',
            borderWidth: 2.5,
          },
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

  /** Middle-bottom exec card: Weekly Case Volume ↔ Hourly Processing Load. */
  flipExecBottomCard(): void {
    this.execBottomCardFlipped = !this.execBottomCardFlipped;
    setTimeout(() => {
      if (this.execBottomCardFlipped) {
        this.buildExecHourlyChart();
      } else {
        this.buildExecWeeklyChart();
      }
    }, 50);
  }

  /** Middle-top exec card: Resolution Time (MTTR) ↔ Case Churn by Component. */
  flipExecMttrCard(): void {
    this.execMttrCardFlipped = !this.execMttrCardFlipped;
    setTimeout(() => {
      if (this.execMttrCardFlipped) {
        this.buildChurnChart();
      } else {
        this.buildResolutionChart();
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Context 3 (Executive redux draft) ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  /** Build every chart rendered by context 3. */
  private buildCtx3Charts(): void {
    this.buildSankeyChart4Step();
    this.buildResolutionChart();
    this.buildChurnChart();
    this.buildExecWeeklyChart();
    this.buildExecHourlyChart();
    this.buildChordChart();
    this.buildAlluvialChart();
    this.buildHiveChart();
  }

  /**
   * Fetch the quarter-filtered response time + churn table. Unlike the
   * DSH_80/DSH_90/WORKNOTES views (which hardcode Q4FY26), this endpoint takes
   * the selected quarter.
   */
  private fetchExecResponseTime(): void {
    const qtr = this.selectedQuarter || 'Q4FY26';
    this.execResponseTimeLoading = true;
    this.http
      .get(`caseiq/exec/response-time?fiscQtr=${qtr}`, this.destroyManager)
      .subscribe({
        next: (d: any) => {
          this.execResponseTimeData = Array.isArray(d) ? d : [];
          this.execResponseTimeLoading = false;
        },
        error: () => {
          this.execResponseTimeData = [];
          this.execResponseTimeLoading = false;
        },
      });
  }

  /** Per-team auto-resolve metrics for ctx 4, filtered by selected quarter. */
  private fetchAutoResolveMetrics(): void {
    const qtr = this.selectedQuarter || 'Q4FY26';
    this.autoResolveLoading = true;
    this.http
      .get(
        `caseiq/auto-resolve-metrics?fiscQtr=${encodeURIComponent(qtr)}`,
        this.destroyManager,
      )
      .subscribe({
        next: (d: any) => {
          this.autoResolveData = Array.isArray(d) ? d : [];
          this.autoResolveLoading = false;
        },
        error: () => {
          this.autoResolveData = [];
          this.autoResolveLoading = false;
        },
      });
  }

  /** Rows for the ctx-4 auto-resolve table, one per team, sorted by component order. */
  autoResolveRows(): AutoResolveRow[] {
    const num = (row: any, key: string): number | null => {
      const val = Number(row?.[key] ?? row?.[key.toUpperCase()]);
      return Number.isFinite(val) ? val : null;
    };
    return this.autoResolveData
      .map((row) => ({
        component: this.execTeam(row) ?? '—',
        incidentCount: num(row, 'INCIDENT_COUNT') ?? 0,
        importTime: num(row, 'IMPORT_TIME'),
        executionTime: num(row, 'EXECUTION_TIME'),
        resolutionTime: num(row, 'RESOLUTION_TIME'),
      }))
      .filter((r) => r.component !== 'UNKNOWN')
      .sort(
        (a, b) =>
          this.componentRank(a.component) - this.componentRank(b.component),
      );
  }

  /** Total incident count across all teams — denominator for the share pill. */
  autoResolveTotalIncidents(): number {
    return this.autoResolveRows().reduce((sum, r) => sum + r.incidentCount, 0);
  }

  /** Share of total incidents contributed by a single team (0–100). */
  autoResolveShare(row: AutoResolveRow): number {
    const total = this.autoResolveTotalIncidents();
    return total > 0 ? (row.incidentCount / total) * 100 : 0;
  }

  /** Look up the auto-resolve row for a given component name (case-insensitive). */
  autoResolveForComponent(component: string): AutoResolveRow | undefined {
    if (!component) return undefined;
    const key = component.toUpperCase();
    return this.autoResolveRows().find(
      (r) => r.component.toUpperCase() === key,
    );
  }

  /** Per-team not-interfaced counts for ctx 4, filtered by selected quarter. */
  private fetchNotInterfaced(): void {
    const qtr = this.selectedQuarter || 'Q4FY26';
    this.notInterfacedLoading = true;
    this.http
      .get(
        `caseiq/not-interfaced?fiscQtr=${encodeURIComponent(qtr)}`,
        this.destroyManager,
      )
      .subscribe({
        next: (d: any) => {
          this.notInterfacedData = Array.isArray(d) ? d : [];
          this.notInterfacedLoading = false;
        },
        error: () => {
          this.notInterfacedData = [];
          this.notInterfacedLoading = false;
        },
      });
  }

  /** Per-team resolution status roll-up for ctx 4, filtered by selected quarter. */
  private fetchResolutionStatus(): void {
    const qtr = this.selectedQuarter || 'Q4FY26';
    this.resolutionStatusLoading = true;
    this.http
      .get(
        `caseiq/resolution-status?fiscQtr=${encodeURIComponent(qtr)}`,
        this.destroyManager,
      )
      .subscribe({
        next: (d: any) => {
          this.resolutionStatusData = Array.isArray(d) ? d : [];
          this.resolutionStatusLoading = false;
        },
        error: () => {
          this.resolutionStatusData = [];
          this.resolutionStatusLoading = false;
        },
      });
  }

  /** Pivots ASK_CASEIQ_NOT_INTERFACED_V into 3 issue-type rows × team badges. */
  notInterfacedRows(): NotInterfacedRow[] {
    const num = (row: any, key: string): number => {
      const val = Number(row?.[key] ?? row?.[key.toUpperCase()]);
      return Number.isFinite(val) ? val : 0;
    };
    const teams = this.notInterfacedData
      .map((row) => ({
        component: this.execTeam(row) ?? '—',
        kafkaMiss: num(row, 'KAFKA_MISS'),
        awaitingBotResponse: num(row, 'AWAITING_BOT_RESPONSE'),
        technicalIssue: num(row, 'TECHNICAL_ISSUE'),
      }))
      .filter((r) => r.component !== 'UNKNOWN')
      .sort(
        (a, b) =>
          this.componentRank(a.component) - this.componentRank(b.component),
      );
    const buildRow = (
      label: string,
      key: NotInterfacedRow['issueKey'],
      pick: (t: any) => number,
    ): NotInterfacedRow => {
      const teamBadges = teams
        .map((t) => ({ component: t.component, count: pick(t) }))
        .filter((t) => t.count > 0);
      const total = teamBadges.reduce((s, t) => s + t.count, 0);
      return {
        issueType: label,
        issueKey: key,
        teams: teamBadges,
        totalCount: total,
      };
    };
    return [
      buildRow('Kafka Miss', 'kafkaMiss', (t) => t.kafkaMiss),
      buildRow(
        'Awaiting Bot Response',
        'awaitingBotResponse',
        (t) => t.awaitingBotResponse,
      ),
      buildRow('Technical Issue', 'technicalIssue', (t) => t.technicalIssue),
    ];
  }

  /** Rows for the ctx-4 resolution status team roll-up table. */
  resolutionStatusRows(): ResolutionStatusRow[] {
    const num = (row: any, key: string): number => {
      const val = Number(row?.[key] ?? row?.[key.toUpperCase()]);
      return Number.isFinite(val) ? val : 0;
    };
    return this.resolutionStatusData
      .map((row) => {
        const success = num(row, 'SUCCESS');
        const notSupported = num(row, 'NOT_SUPPORTED');
        const error = num(row, 'ERROR');
        const warning = num(row, 'WARNING');
        const unknown = num(row, 'UNKNOWN');
        return {
          component: this.execTeam(row) ?? '—',
          coreIssueCount: num(row, 'CORE_ISSUE_COUNT'),
          success,
          notSupported,
          error,
          warning,
          unknown,
          total: success + notSupported + error + warning + unknown,
        };
      })
      .filter((r) => r.component !== 'UNKNOWN')
      .sort(
        (a, b) =>
          this.componentRank(a.component) - this.componentRank(b.component),
      );
  }

  /** Segment percentage of the stacked outcome pill (0 when total is 0). */
  resolutionSegmentPct(count: number, total: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }

  /**
   * Pixel width for one bucket inside a Resolution Status Outcome Mix cell.
   * Same clamp-and-redistribute logic as the ctx-4 component-table pill so
   * a row with tiny buckets never overruns the column.
   */
  resolutionMixWidthPx(
    row: ResolutionMixSource,
    key: ResolutionMixKey,
  ): number {
    return this.resolutionMixWidths(row)[key] ?? 0;
  }

  private resolutionMixWidths(
    row: ResolutionMixSource,
  ): Partial<Record<ResolutionMixKey, number>> {
    const AVAIL = 196;
    const MIN = 18;
    const GAP = 3;
    const keys: ResolutionMixKey[] = [
      'success',
      'notSupported',
      'error',
      'warning',
      'unknown',
    ];
    const nonZero = keys
      .map((k) => ({ key: k, total: row[k] || 0 }))
      .filter((x) => x.total > 0);
    if (!nonZero.length) return {};

    let pool = AVAIL - (nonZero.length - 1) * GAP;
    const clamped = new Set<ResolutionMixKey>();

    while (true) {
      const flex = nonZero.filter((x) => !clamped.has(x.key));
      const flexTotal = flex.reduce((s, x) => s + x.total, 0);
      if (!flex.length || flexTotal === 0) break;
      const belowMin = flex.filter((x) => (x.total / flexTotal) * pool < MIN);
      if (!belowMin.length) break;
      for (const x of belowMin) {
        clamped.add(x.key);
        pool -= MIN;
      }
    }

    const flex = nonZero.filter((x) => !clamped.has(x.key));
    const flexTotal = flex.reduce((s, x) => s + x.total, 0);
    const result: Partial<Record<ResolutionMixKey, number>> = {};
    for (const x of nonZero) {
      result[x.key] = clamped.has(x.key) ? MIN : (x.total / flexTotal) * pool;
    }
    return result;
  }

  openResolutionTimeModal(component: string): void {
    const row = this.autoResolveForComponent(component);
    if (!row) return;
    this.resolutionTimeModalComponent = component;
    this.resolutionTimeModalRow = row;
    this.resolutionTimeModalOpen = true;
  }

  closeResolutionTimeModal(): void {
    this.resolutionTimeModalOpen = false;
    this.resolutionTimeModalRow = null;
    this.resolutionTimeModalComponent = '';
  }

  openResolutionDetail(team: string): void {
    this.resolutionModalTeam = team;
    this.resolutionModalOpen = true;
    this.fetchResolutionCoreIssues(team);
  }

  closeResolutionDetail(): void {
    this.resolutionModalOpen = false;
    this.resolutionModalRows = [];
    this.resolutionModalFailed = false;
  }

  /** Fetches per-core-issue rows for one team when the drilldown modal opens. */
  private fetchResolutionCoreIssues(team: string): void {
    const qtr = this.selectedQuarter || 'Q4FY26';
    this.resolutionModalRows = [];
    this.resolutionModalFailed = false;
    this.resolutionModalLoading = true;
    const url =
      `caseiq/resolution-status/core-issues?fiscQtr=${encodeURIComponent(qtr)}` +
      `&teamName=${encodeURIComponent(team)}`;
    this.http.get(url, this.destroyManager).subscribe({
      next: (d: any) => {
        const num = (row: any, key: string): number => {
          const val = Number(row?.[key] ?? row?.[key.toUpperCase()]);
          return Number.isFinite(val) ? val : 0;
        };
        const rows = Array.isArray(d) ? d : [];
        this.resolutionModalRows = rows.map((row: any) => {
          const success = num(row, 'SUCCESS');
          const notSupported = num(row, 'NOT_SUPPORTED');
          const error = num(row, 'ERROR');
          const warning = num(row, 'WARNING');
          const unknown = num(row, 'UNKNOWN');
          return {
            coreIssue: String(row?.CORE_ISSUE ?? row?.core_issue ?? '—'),
            success,
            notSupported,
            error,
            warning,
            unknown,
            total: success + notSupported + error + warning + unknown,
          };
        });
        this.resolutionModalLoading = false;
      },
      error: () => {
        this.resolutionModalRows = [];
        this.resolutionModalFailed = true;
        this.resolutionModalLoading = false;
      },
    });
  }

  /** Rows for the ctx-3 response time table, one per component. */
  responseTimeRows(): ResponseTimeRow[] {
    const metricsByTeam = this.execMetricsByTeam();
    return this.execResponseTimeData
      .map((row) => {
        const component = this.execTeam(row) ?? '—';
        const metrics = metricsByTeam[component];
        return {
          component,
          ...this.mapResponseMetrics(row),
          executionTimeP80: metrics?.executionTimeP80 ?? null,
          mttrP80: metrics?.mttrP80 ?? null,
          executionTimeP90: metrics?.executionTimeP90 ?? null,
          mttrP90: metrics?.mttrP90 ?? null,
        };
      })
      .filter((row) => row.component !== 'UNKNOWN')
      .sort(
        (a, b) =>
          this.componentRank(a.component) - this.componentRank(b.component),
      );
  }

  /** Rows for the ctx-1 team metrics card and ctx-4 auto-resolve table, sorted by component order. */
  execMetricsRows(): ExecMetricsRow[] {
    return this.execMetricsData
      .map((row) => ({
        component: this.execTeam(row) ?? '—',
        incidentCount: this.execCol(row, 'INCIDENT_COUNT') ?? 0,
        executionTimeP80: this.execCol(row, 'CASE_IQ_EXECUTION_TIME_P80'),
        mttrP80: this.execCol(row, 'MTTR_80'),
        executionTimeP90: this.execCol(row, 'CASE_IQ_EXECUTION_TIME_P90'),
        mttrP90: this.execCol(row, 'MTTR_90'),
      }))
      .filter((row) => row.component !== 'UNKNOWN' && row.component !== '—')
      .sort(
        (a, b) =>
          this.componentRank(a.component) - this.componentRank(b.component),
      );
  }

  /** Percentile metrics keyed by TEAM_NAME for O(1) joins with churn data. */
  private execMetricsByTeam(): Record<string, ExecMetricsRow> {
    const out: Record<string, ExecMetricsRow> = {};
    for (const row of this.execMetricsRows()) out[row.component] = row;
    return out;
  }

  /** Position in the dashboard-wide component order; unknowns sort last. */
  private componentRank(component: string): number {
    const idx = COMPONENT_ORDER.indexOf(component);
    return idx === -1 ? COMPONENT_ORDER.length : idx;
  }

  /** Shared numeric mapping for the response time / core issue tables. */
  private mapResponseMetrics(row: any): Omit<ResponseTimeRow, 'component'> {
    const num = (key: string): number | null => {
      const val = Number(row?.[key] ?? row?.[key.toUpperCase()]);
      return Number.isFinite(val) ? val : null;
    };
    const autoResolved = num('AUTO_RESOLVED') ?? 0;
    const touchedLt5 = num('TOUCHED_LT_5') ?? 0;
    const touchedLt10 = num('TOUCHED_LT_10') ?? 0;
    const touchedGt10 = num('TOUCHED_GT_10') ?? 0;
    return {
      incidentCount: num('INCIDENT_COUNT') ?? 0,
      importTime: num('IMPORT_TIME'),
      executionTime: num('EXECUTION_TIME'),
      mttr: num('RESOLUTION_TIME'),
      executionTimeP80: null,
      mttrP80: null,
      executionTimeP90: null,
      mttrP90: null,
      autoResolved,
      touchedLt5,
      touchedLt10,
      touchedGt10,
      cohortTotal: autoResolved + touchedLt5 + touchedLt10 + touchedGt10,
    };
  }

  /**
   * KPI strip summarising the response time table: mean percentile times across
   * the components plus each churn bucket as a share of all post-CaseIQ cases.
   */
  responseKpis(): CaseiqKpi[] {
    const rows = this.responseTimeRows();
    const mean = (pick: (r: ResponseTimeRow) => number | null) => {
      const vals = rows
        .map(pick)
        .filter((v): v is number => v != null && Number.isFinite(v));
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    const total = rows.reduce((sum, r) => sum + r.cohortTotal, 0);
    const bucket = (title: string, color: string, value: number): CaseiqKpi => {
      const pct = total > 0 ? (value / total) * 100 : 0;
      return {
        title,
        color,
        pillWidth: pct,
        pillText: `${value.toLocaleString()} / ${total.toLocaleString()}`,
        pctText: total > 0 ? `${pct.toFixed(1)}%` : '--',
      };
    };
    const sum = (pick: (r: ResponseTimeRow) => number) =>
      rows.reduce((acc, r) => acc + pick(r), 0);

    return [
      {
        title: 'Execution Time P80',
        color: 'green',
        plain: true,
        plainValue: this.formatDuration(mean((r) => r.executionTimeP80)),
      },
      {
        title: 'MTTR Time P80',
        color: 'cyan',
        plain: true,
        plainValue: this.formatDuration(mean((r) => r.mttrP80)),
      },
      {
        title: 'Execution Time P90',
        color: 'green',
        plain: true,
        plainValue: this.formatDuration(mean((r) => r.executionTimeP90)),
      },
      {
        title: 'MTTR Time P90',
        color: 'cyan',
        plain: true,
        plainValue: this.formatDuration(mean((r) => r.mttrP90)),
      },
      bucket(
        'Auto Resolved',
        'accent',
        sum((r) => r.autoResolved),
      ),
      bucket(
        'Touched < 5',
        'cyan',
        sum((r) => r.touchedLt5),
      ),
      bucket(
        'Touched < 10',
        'amber',
        sum((r) => r.touchedLt10),
      ),
      bucket(
        'Touched > 10',
        'purple',
        sum((r) => r.touchedGt10),
      ),
    ];
  }

  /** Auto-resolved share of the post-CaseIQ cohort for a table row. */
  autoResolvedPct(row: { autoResolved: number; cohortTotal: number }): number {
    return row.cohortTotal > 0 ? (row.autoResolved / row.cohortTotal) * 100 : 0;
  }

  /** Minutes → "12.3 min" under an hour, "3.4 h" above, "—" when missing. */
  formatDuration(minutes: number | null): string {
    if (minutes == null) return '—';
    if (Math.abs(minutes) < 60) return `${minutes.toFixed(1)} min`;
    return `${(minutes / 60).toFixed(1)} h`;
  }

  /** Same as {@link formatDuration} but split so the unit can be de-emphasised. */
  durationParts(minutes: number | null): { value: string; unit: string } {
    if (minutes == null) return { value: '—', unit: '' };
    if (Math.abs(minutes) < 60)
      return { value: minutes.toFixed(1), unit: 'min' };
    return { value: (minutes / 60).toFixed(1), unit: 'h' };
  }

  /** MTTR rendered in days for the ctx-1 team table; falls back to hours under 1 day. */
  mttrDaysParts(minutes: number | null): { value: string; unit: string } {
    if (minutes == null) return { value: '—', unit: '' };
    if (Math.abs(minutes) < 1440)
      return { value: (minutes / 60).toFixed(1), unit: 'h' };
    return { value: (minutes / 1440).toFixed(1), unit: 'days' };
  }

  openResponseDetail(component: string): void {
    this.responseModalComponent = component;
    this.responseModalOpen = true;
    this.fetchResponseCoreIssues(component);
  }

  closeResponseDetail(): void {
    this.responseModalOpen = false;
    this.responseModalRows = [];
    this.responseModalFailed = false;
  }

  /**
   * Core issue breakdown for one component, fetched only when the modal opens
   * (the seven components carry ~279 core issues between them).
   */
  private fetchResponseCoreIssues(component: string): void {
    const qtr = this.selectedQuarter || 'Q4FY26';
    this.responseModalRows = [];
    this.responseModalFailed = false;
    this.responseModalLoading = true;
    const url =
      `caseiq/exec/response-time/core-issues?fiscQtr=${encodeURIComponent(qtr)}` +
      `&teamName=${encodeURIComponent(component)}`;
    this.http.get(url, this.destroyManager).subscribe({
      next: (d: any) => {
        const rows = Array.isArray(d) ? d : [];
        this.responseModalRows = rows.map((row) => ({
          coreIssue: row?.CORE_ISSUE ?? row?.core_issue ?? 'Unclassified',
          ...this.mapResponseMetrics(row),
        }));
        this.responseModalLoading = false;
      },
      error: () => {
        this.responseModalRows = [];
        this.responseModalFailed = true;
        this.responseModalLoading = false;
      },
    });
  }

  /**
   * 4-step Sankey: Component → Agent/Ops → Outcome → Component.
   *
   * The 3-step flow loses the originating component once cases pass through
   * the Agent/Ops node, so the component set is repeated as a terminal stage.
   * Terminal node names carry a trailing NBSP to stay unique from the leading
   * component nodes; the label formatter trims it back off for display.
   */
  private buildSankeyChart4Step(): void {
    const rows = this.getSummaryRows();
    if (!rows.length) return;

    const { links, nodeSet } = this.buildSankey4StepLinks(rows);
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
      const base = key.trim();
      return nodeColors[base] ?? this.teamColors[base] ?? '#0070d2';
    };

    const textColor = this.themeService.isDarkMode ? '#e0e6ed' : '#1b1c1d';

    const data = Array.from(nodeSet).map((name) => ({
      name,
      itemStyle: { color: colorFor(name) },
    }));

    this.chartOptionsMap['sankey4Step'] = {
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
            formatter: (params: any) => String(params.name).trim(),
          },
          emphasis: { focus: 'adjacency' },
          nodeWidth: 16,
          nodeGap: 8,
          layoutIterations: 32,
          draggable: false,
          left: '2%',
          right: '10%',
          top: '4%',
          bottom: '4%',
        },
      ],
    } as EChartsOption;
  }

  /** Assemble the nodes/links for the 4-step (Component → … → Component) Sankey. */
  private buildSankey4StepLinks(rows: CaseIqTableRow[]): {
    links: { source: string; target: string; value: number }[];
    nodeSet: Set<string>;
  } {
    /** Trailing NBSP keeps terminal component nodes distinct from source ones. */
    const TERMINAL = '\u00a0';
    const outcomes: {
      key: OutcomeKey;
      label: string;
    }[] = [
      { key: 'inProgress', label: 'In Progress' },
      { key: 'routed', label: 'Routed Out' },
      { key: 'cancelled', label: 'Canceled' },
      { key: 'service', label: 'Service Requests' },
    ];

    const links: { source: string; target: string; value: number }[] = [];
    const nodeSet = new Set<string>();
    const laneOutcomes: Record<string, Record<string, number>> = {
      Agent: {},
      Ops: {},
    };

    const addLink = (source: string, target: string, value: number) => {
      if (value <= 0) return;
      links.push({ source, target, value });
      nodeSet.add(source);
      nodeSet.add(target);
    };

    // Steps 1 & 3: Component → Agent/Ops, and Outcome → originating Component.
    for (const row of rows) {
      const comp = row.sectionName;
      nodeSet.add(comp);
      addLink(comp, 'Agent', this.getAgentTotalCases(row));
      addLink(comp, 'Ops', this.getComponentOpsTotalCases(row));

      for (const outcome of outcomes) {
        const agentVal = row[outcome.key].agent ?? 0;
        const opsVal = row[outcome.key].ops ?? 0;
        laneOutcomes['Agent'][outcome.label] =
          (laneOutcomes['Agent'][outcome.label] ?? 0) + agentVal;
        laneOutcomes['Ops'][outcome.label] =
          (laneOutcomes['Ops'][outcome.label] ?? 0) + opsVal;
        addLink(outcome.label, comp + TERMINAL, agentVal + opsVal);
      }
    }

    // Step 2: Agent/Ops → Outcome.
    for (const lane of ['Agent', 'Ops']) {
      for (const outcome of outcomes) {
        addLink(lane, outcome.label, laneOutcomes[lane][outcome.label] ?? 0);
      }
    }

    return { links, nodeSet };
  }

  // ── Relationship charts (Component × Channel × Outcome) ───────────────────

  /** Outcome columns shared by the sankey and the relationship charts. */
  private readonly relationOutcomes: {
    key: OutcomeKey;
    label: string;
  }[] = [
    { key: 'inProgress', label: 'In Progress' },
    { key: 'routed', label: 'Routed Out' },
    { key: 'cancelled', label: 'Canceled' },
    { key: 'service', label: 'Service Requests' },
  ];

  private readonly relationColors: Record<string, string> = {
    Agent: '#1f6feb',
    Ops: '#0f8b8d',
    'In Progress': '#e6a800',
    'Routed Out': '#00bceb',
    Canceled: '#9933ff',
    'Service Requests': '#6ebe4a',
  };

  private relationColor(name: string): string {
    return this.relationColors[name] ?? this.teamColors[name] ?? '#0070d2';
  }

  /**
   * Flatten the component table into Component × Channel × Outcome triples.
   * Every relationship chart below reads from this single joint distribution.
   */
  private buildRelationTriples(): {
    component: string;
    lane: string;
    outcome: string;
    value: number;
  }[] {
    const triples: {
      component: string;
      lane: string;
      outcome: string;
      value: number;
    }[] = [];
    for (const row of this.getSummaryRows()) {
      for (const outcome of this.relationOutcomes) {
        const byLane: Record<string, number> = {
          Agent: row[outcome.key].agent ?? 0,
          Ops: row[outcome.key].ops ?? 0,
        };
        for (const lane of ['Agent', 'Ops']) {
          if (byLane[lane] > 0) {
            triples.push({
              component: row.sectionName,
              lane,
              outcome: outcome.label,
              value: byLane[lane],
            });
          }
        }
      }
    }
    return triples;
  }

  /**
   * Chord data: each sector's slice of the circumference is its case volume
   * (components → channel → outcome), and every ribbon is width-proportional
   * to the flow it carries. Rendered by the d3 chord component.
   */
  private buildChordChart(): void {
    const triples = this.buildRelationTriples();
    if (!triples.length) {
      this.chordFlows = [];
      return;
    }

    const agg = new Map<string, number>();
    const add = (source: string, target: string, value: number) => {
      const key = `${source}|${target}`;
      agg.set(key, (agg.get(key) ?? 0) + value);
    };
    for (const t of triples) {
      add(t.component, t.lane, t.value);
      add(t.lane, t.outcome, t.value);
    }

    this.chordFlows = Array.from(agg, ([key, value]) => {
      const [source, target] = key.split('|');
      return { source, target, value };
    });

    const colors: Record<string, string> = {};
    for (const flow of this.chordFlows) {
      colors[flow.source] = this.relationColor(flow.source);
      colors[flow.target] = this.relationColor(flow.target);
    }
    this.chordColors = colors;
    this.chordOrder = [
      ...COMPONENT_ORDER,
      'Agent',
      'Ops',
      ...this.relationOutcomes.map((o) => o.label),
    ];
  }

  /**
   * Parallel sets: unlike a Sankey, every Component × Channel × Outcome
   * combination keeps its own ribbon from the first axis to the last, so a
   * band arriving at "Routed Out" can still be traced back to its component.
   */
  private buildAlluvialChart(): void {
    const triples = this.buildRelationTriples();
    if (!triples.length) {
      this.parsetRecords = [];
      return;
    }

    this.parsetRecords = triples.map((t) => ({
      keys: [t.component, t.lane, t.outcome],
      value: t.value,
    }));
    this.parsetOrder = [
      COMPONENT_ORDER,
      ['Agent', 'Ops'],
      this.relationOutcomes.map((o) => o.label),
    ];
    this.parsetColors = this.relationPalette(triples);
  }

  /**
   * Hive plot: components, channels and outcomes each get their own radial
   * axis, ordered by volume. Edges cover both hops (component ↔ channel,
   * channel ↔ outcome) plus the direct component ↔ outcome relationship.
   */
  private buildHiveChart(): void {
    const triples = this.buildRelationTriples();
    if (!triples.length) {
      this.hiveNodes = [];
      this.hiveLinks = [];
      return;
    }

    const totals = new Map<string, number>();
    const bump = (name: string, value: number) =>
      totals.set(name, (totals.get(name) ?? 0) + value);
    const pairs = new Map<string, number>();
    const addPair = (source: string, target: string, value: number) => {
      const key = `${source}|${target}`;
      pairs.set(key, (pairs.get(key) ?? 0) + value);
    };

    for (const t of triples) {
      bump(t.component, t.value);
      bump(t.lane, t.value);
      bump(t.outcome, t.value);
      addPair(t.component, t.lane, t.value);
      addPair(t.lane, t.outcome, t.value);
      addPair(t.component, t.outcome, t.value);
    }

    const axisOf = (name: string): number => {
      if (name === 'Agent' || name === 'Ops') return 1;
      return this.relationOutcomes.some((o) => o.label === name) ? 2 : 0;
    };

    this.hiveNodes = Array.from(totals, ([name, value]) => ({
      name,
      axis: axisOf(name),
      value,
    }));
    this.hiveLinks = Array.from(pairs, ([key, value]) => {
      const [source, target] = key.split('|');
      return { source, target, value };
    });
    this.hiveColors = this.relationPalette(triples);
  }

  /** Colour lookup covering every name used by the relationship charts. */
  private relationPalette(
    triples: { component: string; lane: string; outcome: string }[],
  ): Record<string, string> {
    const colors: Record<string, string> = {};
    for (const t of triples) {
      colors[t.component] = this.relationColor(t.component);
      colors[t.lane] = this.relationColor(t.lane);
      colors[t.outcome] = this.relationColor(t.outcome);
    }
    return colors;
  }
}
