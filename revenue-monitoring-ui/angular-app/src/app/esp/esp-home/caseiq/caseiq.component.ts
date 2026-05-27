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
import { Chart } from 'chart.js/auto';
import { Router } from '@angular/router';
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
  ],
  providers: [
    provideIcons({
      phosphorLinkBold,
      phosphorArrowsClockwiseBold,
      phosphorArrowLineDownBold,
      phosphorEmptyDuotone,
    }),
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

  // Track created Chart.js instances; using `any` here avoids
  // over-constraining generics for different chart types.
  private charts: any[] = [];
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
    { team: 'Finance IT', deployed: 81, total: 83 },
    { team: 'OM', deployed: 14, total: 14 },
    { team: 'SM', deployed: 11, total: 11 },
    { team: 'I2C', deployed: 18, total: 19 },
    { team: 'AIT', deployed: 10, total: 10 },
    { team: 'FPP', deployed: 14, total: 14 },
    { team: 'P2P', deployed: 8, total: 8 },
    { team: 'CAPITAL', deployed: 6, total: 7 },
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
  private analyticsCharts: any[] = [];
  teamCardFlipped = false;
  hourlyCardFlipped = false;
  private teamChart: any = null;
  private accuracyTimeChart: any = null;
  private hourlyChart: any = null;
  private weeklyStateChart: any = null;

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
      !changes['selectedQuarter'].firstChange
    ) {
      // Quarter changed by user — rebuild KPI charts (analytics charts use rolling window, no refetch needed)
      if (this.viewInitialized) {
        this.showLoadingForMoment();
        // Re-fetch monitoring data and accuracy data with new quarter
        this.fetchMonitoringData();
        this.fetchAccuracyData();
        this.refetchWeeklyTeamVolume();
      }
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    // Close chart dropdown on outside click
    document.addEventListener('click', this.outsideClickListener);

    // Fetch accuracy data
    this.fetchAccuracyData();

    // Fetch monitoring data (Issues Breakdown + Error Incidents)
    this.fetchMonitoringData();

    // Always fetch analytics chart data on init
    this.fetchAnalyticsCharts();

    // Initial build of sections/charts once view is ready
    this.buildSectionsFromMetrics();
    this.showLoadingForMoment();
  }

  ngOnDestroy(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
    this.analyticsCharts.forEach((chart) => chart.destroy());
    this.analyticsCharts = [];
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
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
    setTimeout(() => {
      this.createAllCharts();
    }, 0);
  }

  private createAllCharts(): void {
    // Clean up any existing charts before recreating
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];

    // Find the index of Finance IT section (canvas id is based on it)
    const sections = this.sections();
    const financeIndex = sections.indexOf('Finance IT');
    if (financeIndex === -1) return;

    const barId = `overall-bar-${financeIndex}`;
    this.createBarChart(barId, this.selectedChartComponent);
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

  private createBarChart(canvasId: string, sectionName: string): void {
    const canvas = document.getElementById(
      canvasId,
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let labels: string[] = [];

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
        labels = ['Service Requests', 'In Progress', 'Routed Out', 'Cancelled'];

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

    const axisFontSize =
      window.innerWidth <= 1700 ? (window.innerWidth <= 1500 ? 10 : 10) : 10;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            // Total Service Requests (Resolved by Ops)
            data: [serviceOthers, 0, 0, 0],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            ...({
              segmentPercentages: [resolvedOpsPct, 0, 0, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Resolved (Ops)',
          },
          {
            // Total Service Requests (Resolved by Agent)
            data: [serviceResolved, 0, 0, 0],
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            ...({
              segmentPercentages: [resolvedAgentPct, 0, 0, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Resolved (Agent)',
          },
          {
            // In Progress (Ops)
            data: [0, inProgressOps, 0, 0],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            ...({
              segmentPercentages: [0, inProgressOpsPct, 0, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'In Progress (Ops)',
          },
          {
            // In Progress (Agent)
            data: [0, inProgressAgent, 0, 0],
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            ...({
              segmentPercentages: [0, inProgressAgentPct, 0, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'In Progress (Agent)',
          },
          {
            // Routed Out (Misrouted)
            data: [0, 0, routedOutMisrouted, 0],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            ...({
              segmentPercentages: [0, 0, routedMisroutedPct, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Routed (Ops)',
          },
          {
            // Routed Out (Recommended)
            data: [0, 0, routedOutRecommended, 0],
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            ...({
              segmentPercentages: [0, 0, routedRecommendedPct, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Routed (Agent)',
          },
          {
            // Cancelled (Others)
            data: [0, 0, 0, cancelledOthers],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            ...({
              segmentPercentages: [0, 0, 0, cancelledOthersPct],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Cancelled (Ops)',
          },
          {
            // Cancelled (Recommended)
            data: [0, 0, 0, cancelledRecommended],
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            ...({
              segmentPercentages: [0, 0, 0, cancelledRecommendedPct],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Cancelled (Agent)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: true,
        },
        layout: {
          padding: {
            top: 12,
            bottom: 48,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            filter: (context) => {
              const dataIndex = context.dataIndex;
              let stackTotal = 0;

              context.chart.data.datasets.forEach((ds) => {
                const v = (ds.data?.[dataIndex] as number) || 0;
                stackTotal += v;
              });

              // Suppress tooltips when there is no data at this x-position
              return stackTotal > 0;
            },
            callbacks: {
              label: (context) => {
                const value = (context.parsed.y as number) || 0;
                const dataIndex = context.dataIndex;
                let stackTotal = 0;

                context.chart.data.datasets.forEach((ds) => {
                  const v = (ds.data?.[dataIndex] as number) || 0;
                  stackTotal += v;
                });

                const percent = stackTotal
                  ? ((value / stackTotal) * 100).toFixed(1)
                  : '0.0';

                const label = context.dataset.label || '';
                return `${label}: ${value} (${percent}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            border: { display: true },
            stacked: true,
            ticks: {
              color: '#000',
              font: {
                size: axisFontSize,
                // weight: 'bold',
              },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
            },
          },
          y: {
            display: false,
          },
        },
      },
      plugins: [
        {
          id: 'barValueLabels',
          afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const labelCount = chart.data.labels ? chart.data.labels.length : 0;

            for (let index = 0; index < labelCount; index++) {
              let stackTotal = 0;
              let x = 0;
              let topY = Number.POSITIVE_INFINITY;

              // First pass: compute stack total and top of bar for this x index
              chart.data.datasets.forEach((dataset, dsIndex) => {
                const meta = chart.getDatasetMeta(dsIndex);
                const bar: any = meta.data[index];
                if (!bar) {
                  return;
                }

                const value = (dataset.data?.[index] as number) || 0;
                stackTotal += value;

                if (!x) {
                  x = bar.x;
                }
                if (bar.y < topY) {
                  topY = bar.y;
                }
              });

              if (!stackTotal || !isFinite(topY)) {
                continue;
              }

              // Draw total label above the stacked bar
              ctx.fillStyle = '#333';
              ctx.font = `bold ${axisFontSize}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(stackTotal.toString(), x, topY - 5);

              // Second pass: draw labels inside each segment using
              // precomputed percentages from the API where available.
              chart.data.datasets.forEach((dataset, dsIndex) => {
                const meta = chart.getDatasetMeta(dsIndex);
                const bar: any = meta.data[index];
                if (!bar) {
                  return;
                }

                const value = (dataset.data?.[index] as number) || 0;
                if (!value || stackTotal <= 0) {
                  return;
                }

                const dsAny: any = dataset;
                const percentages: number[] = dsAny.segmentPercentages || [];
                const rawPercentage =
                  typeof percentages[index] === 'number'
                    ? percentages[index]
                    : (value / stackTotal) * 100;
                const percentage = Math.round(rawPercentage);

                if (value == 1) {
                  console.log('Skipping label for single value segment:');
                  return;
                }

                // Skip if percentage is 15% or less of the bar total
                if (percentage <= 15) {
                  return;
                }

                const centerX = bar.x;
                const centerY = (bar.y + bar.base) / 2;

                ctx.fillStyle = '#000';
                ctx.font = `bold ${axisFontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${value} (${percentage}%)`, centerX, centerY);
              });
            }
          },
        },
        {
          id: 'inlineLegend',
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;

            const items = [
              { label: agentLegendLabel, color: 'rgba(255, 206, 86, 0.7)' },
              { label: opsLegendLabel, color: 'rgba(54, 162, 235, 0.7)' },
            ];

            const boxSize = 11;
            const gap = 6;
            const itemGap = 16;
            const fontSize = 11;

            ctx.save();
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Measure total width to center the legend
            let totalWidth = 0;
            items.forEach((item, i) => {
              totalWidth += boxSize + gap + ctx.measureText(item.label).width;
              if (i < items.length - 1) totalWidth += itemGap;
            });

            let x = (chartArea.left + chartArea.right) / 2 - totalWidth / 2;
            const y = chart.height - 20;

            items.forEach((item, i) => {
              // Draw color box
              ctx.fillStyle = item.color;
              ctx.fillRect(x, y - boxSize / 2, boxSize, boxSize);

              // Draw label
              x += boxSize + gap;
              ctx.fillStyle = '#333';
              ctx.fillText(item.label, x, y);
              x += ctx.measureText(item.label).width;

              if (i < items.length - 1) x += itemGap;
            });

            ctx.restore();
          },
        },
      ],
    });

    this.charts.push(chart);
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

    this.http
      .get(
        `${base}/weekly-volume-by-state?lookbackDays=90`,
        this.destroyManager,
      )
      .subscribe({
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
        if (this.teamChart) {
          this.teamChart.destroy();
          this.teamChart = null;
        }

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

  private tryBuildAnalyticsCharts(): void {
    if (!this.analyticsDataReady || this.isLoading) return;
    setTimeout(() => {
      const testCanvas = document.getElementById('chart-weekly-team');
      if (!testCanvas) {
        // Canvases not in DOM yet — retry once more after a short delay
        setTimeout(() => this.buildAnalyticsCharts(), 200);
        return;
      }
      this.buildAnalyticsCharts();
    }, 0);
  }

  private buildAnalyticsCharts(): void {
    this.analyticsCharts.forEach((c) => c.destroy());
    this.analyticsCharts = [];

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

  private readonly stateColors: Record<string, string> = {
    Closed: '#6ebe4a',
    Resolved: '#0070d2',
    Cancelled: '#e53935',
    'Work In Progress': '#e6a800',
    Pending: '#ff6600',
    'Awaiting Assignment': '#9933ff',
    Unknown: '#8899a6',
    'Escalated to EOC': '#00bceb',
  };

  private buildWeeklyVolumeByTeamChart(): void {
    const canvas = document.getElementById(
      'chart-weekly-team',
    ) as HTMLCanvasElement;
    if (!canvas) return;

    // Pivot data: { weekNumber: { team: count } }
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

    // Always show all 13 weeks, padding missing ones with 0
    const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
    const labels = weeks.map((w) => `Week ${w}`);

    const teamColorHex = this.teamColors;
    const datasets = Array.from(teams)
      .filter((t) => t !== 'UNKNOWN')
      .sort((a, b) => a.localeCompare(b))
      .map((team) => {
        const hex = teamColorHex[team] ?? '#555555';
        // Parse hex to RGB for gradient
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return {
          label: team,
          data: weeks.map((w) => weekMap.get(w)?.get(team) ?? 0),
          borderColor: hex,
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return `rgba(${r}, ${g}, ${b}, 0.1)`;
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            return gradient;
          },
          borderWidth: 2,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: hex,
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5.5,
          tension: 0.4,
          fill: true,
        };
      });

    const chart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 10 }, padding: 12 },
          },
          tooltip: {
            backgroundColor: 'rgba(20, 30, 40, 0.9)',
            titleFont: { size: 10 },
            bodyFont: { size: 11 },
            borderColor: 'rgba(0, 188, 235, 0.3)',
            borderWidth: 1,
            cornerRadius: 10,
            padding: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
            },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, maxTicksLimit: 5 },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
    this.teamChart = chart;
    this.analyticsCharts.push(chart);
  }

  flipTeamCard(): void {
    this.teamCardFlipped = !this.teamCardFlipped;
    // Destroy current chart on the face being hidden
    setTimeout(() => {
      if (this.teamCardFlipped) {
        this.buildAccuracyOverTimeChart();
      } else {
        if (this.accuracyTimeChart) {
          this.accuracyTimeChart.destroy();
          this.accuracyTimeChart = null;
        }
        this.buildWeeklyVolumeByTeamChart();
      }
    }, 50);
  }

  flipHourlyCard(): void {
    this.hourlyCardFlipped = !this.hourlyCardFlipped;
    setTimeout(() => {
      if (this.hourlyCardFlipped) {
        if (this.hourlyChart) {
          this.hourlyChart.destroy();
          this.hourlyChart = null;
        }
        this.buildWeeklyVolumeByStateChart();
      } else {
        if (this.weeklyStateChart) {
          this.weeklyStateChart.destroy();
          this.weeklyStateChart = null;
        }
        this.buildHourlyCasePatternChart();
      }
    }, 50);
  }

  private buildAccuracyOverTimeChart(): void {
    const canvas = document.getElementById(
      'chart-accuracy-time',
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.teamChart) {
      this.teamChart.destroy();
      this.teamChart = null;
    }

    const sorted = [...this.accuracyOverTimeData].sort((a: any, b: any) =>
      (a.WEEK_START ?? '').localeCompare(b.WEEK_START ?? ''),
    );
    const labels = sorted.map((r: any) => {
      const d = new Date(r.WEEK_START);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const catAccuracy = sorted.map((r: any) => r.CATEGORY_ACCURACY ?? null);
    const coreAccuracy = sorted.map((r: any) => r.CORE_ISSUE_ACCURACY ?? null);

    this.accuracyTimeChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Category',
            data: catAccuracy,
            borderColor: '#00bceb',
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#00bceb',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5.5,
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
              gradient.addColorStop(0, 'rgba(0, 188, 235, 0.3)');
              gradient.addColorStop(1, 'rgba(0, 188, 235, 0)');
              return gradient;
            },
          },
          {
            label: 'Core Issue',
            data: coreAccuracy,
            borderColor: '#0070d2',
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#0070d2',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5.5,
            tension: 0.4,
            fill: true,
            backgroundColor: (ctx: any) => {
              const chart = ctx.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(0, 112, 210, 0.1)';
              const gradient = canvasCtx.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom,
              );
              gradient.addColorStop(0, 'rgba(0, 112, 210, 0.25)');
              gradient.addColorStop(1, 'rgba(0, 112, 210, 0)');
              return gradient;
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 8 } },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { size: 10 },
              padding: 12,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(20, 30, 40, 0.85)',
            titleFont: { size: 10, weight: 'normal' as const },
            titleColor: '#8899a6',
            bodyFont: { size: 12, weight: 'bold' as const },
            borderColor: 'rgba(0, 188, 235, 0.3)',
            borderWidth: 1,
            cornerRadius: 10,
            padding: { top: 6, bottom: 6, left: 10, right: 10 },
            callbacks: {
              label: (item) => `${item.dataset.label}: ${item.parsed.y}%`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
            },
            border: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              callback: (v) => v + '%',
              maxTicksLimit: 5,
            },
            border: { display: false },
          },
        },
      },
    });
    this.analyticsCharts.push(this.accuracyTimeChart);
  }

  private buildWeeklyVolumeByStateChart(): void {
    const canvas = document.getElementById(
      'chart-weekly-state',
    ) as HTMLCanvasElement;
    if (!canvas) return;

    // Simple weekly total volume (incident_state is unpopulated in recent data)
    const rows = this.weeklyVolumeByStateData;
    const sorted = [...rows].sort((a: any, b: any) =>
      (a.WEEK_START ?? '').localeCompare(b.WEEK_START ?? ''),
    );
    const labels = sorted.map((r: any) => {
      const d = new Date(r.WEEK_START);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const values = sorted.map((r: any) => r.CASE_COUNT ?? 0);

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#00bceb',
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#00bceb',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5.5,
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
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20, 30, 40, 0.85)',
            titleFont: { size: 10, weight: 'normal' as const },
            titleColor: '#8899a6',
            bodyFont: { size: 14, weight: 'bold' as const },
            bodyColor: '#00bceb',
            borderColor: 'rgba(0, 188, 235, 0.3)',
            borderWidth: 1,
            cornerRadius: 10,
            padding: { top: 6, bottom: 6, left: 10, right: 10 },
            displayColors: false,
            callbacks: {
              label: (item) => item.parsed.y.toLocaleString() + ' cases',
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12,
            },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 10 }, maxTicksLimit: 4 },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
    this.weeklyStateChart = chart;
    this.analyticsCharts.push(chart);
  }

  private buildHourlyCasePatternChart(): void {
    const canvas = document.getElementById(
      'chart-hourly-pattern',
    ) as HTMLCanvasElement;
    if (!canvas) return;

    // Gap-fill and show only the last 12 hours
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

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#00bceb',
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#00bceb',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5.5,
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
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20, 30, 40, 0.85)',
            titleFont: { size: 10, weight: 'normal' as const },
            titleColor: '#8899a6',
            bodyFont: { size: 14, weight: 'bold' as const },
            bodyColor: '#00bceb',
            borderColor: 'rgba(0, 188, 235, 0.3)',
            borderWidth: 1,
            cornerRadius: 10,
            padding: { top: 6, bottom: 6, left: 10, right: 10 },
            displayColors: false,
            callbacks: {
              title: (items) =>
                items[0]?.label ? `${items[0].label} UTC` : '',
              label: (item) => item.parsed.y.toLocaleString() + ' cases',
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              maxRotation: 0,
              autoSkip: false,
              callback: function (_value, index) {
                return index % 3 === 0 ? labels[index] : '';
              },
            },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 10 }, maxTicksLimit: 4 },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
    this.hourlyChart = chart;
    this.analyticsCharts.push(chart);
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
    const team = this.errorFilterTeam || undefined;
    const issue = this.errorFilterIssue || undefined;

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
}
