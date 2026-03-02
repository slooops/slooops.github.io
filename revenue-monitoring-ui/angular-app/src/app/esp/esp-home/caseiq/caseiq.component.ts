import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingSymbolComponent } from 'src/app/loading-symbol/loading-symbol.component';
import { Chart } from 'chart.js/auto';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from 'src/app/providers/http.service';

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
  ],
  standalone: true,
})
export class CaseiqComponent implements AfterViewInit, OnDestroy, OnChanges {
  // Section names are derived dynamically from caseIqMetrics
  // (e.g. 'Finance IT' for TEAM_NAME 'ALL', then each TEAM_NAME).
  sections = signal<string[]>([]);

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
  ) {}

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
    { team: 'Finance IT', deployed: 73, total: 80 },
    { team: 'OM', deployed: 14, total: 14 },
    { team: 'SM', deployed: 8, total: 11 },
    { team: 'I2C', deployed: 18, total: 19 },
    { team: 'AIT', deployed: 10, total: 10 },
    { team: 'FPP', deployed: 14, total: 14 },
    { team: 'P2P', deployed: 5, total: 5 },
    { team: 'CAPITAL', deployed: 4, total: 7 },
  ];

  @Input() caseIqMetrics: any;
  @Input() selectedQuarter: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if ('caseIqMetrics' in changes) {
      // Always rebuild section list so template reflects latest metrics
      this.buildSectionsFromMetrics();

      // If view is already initialized, (re)create charts and update data
      // Use setTimeout to ensure Angular has updated the DOM with new canvases
      if (this.viewInitialized) {
        this.showLoadingForMoment();
      }
    }

    if ('selectedQuarter' in changes) {
      // Quarter changed; rebuild charts to reflect the filtered metrics
      if (this.viewInitialized) {
        this.showLoadingForMoment();
      }
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    // Close chart dropdown on outside click
    document.addEventListener('click', this.outsideClickListener);

    // Fetch accuracy data
    this.fetchAccuracyData();

    // Initial build of sections/charts once view is ready
    // Use setTimeout to ensure Angular has updated the DOM
    this.buildSectionsFromMetrics();
    this.showLoadingForMoment();
  }

  ngOnDestroy(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
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
    const totalCases = this.getTotalCasesFromAccuracy('Finance IT') ?? 0;

    if (!totalCases) return 0;
    // Sum of all Ops across categories
    const totalOps =
      (Number(fm.RESOLVED_AGENT) || 0) +
      (Number(fm.IN_PROGRESS_AGENT) || 0) +
      (Number(fm.RECOMMENDED_ROUTE_OUT) || 0) +
      (Number(fm.RECOMMENDED_CANCELLED) || 0);
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
      this.getTotalCasesFromAccuracy(row.sectionName) ?? row.totalCases ?? 0;
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
  getAgentForRow(row: CaseIqTableRow): { deployed: number; total: number } {
    const agent = this.resolutionAgents.find((a) => a.team === row.sectionName);
    return agent
      ? { deployed: agent.deployed, total: agent.total }
      : { deployed: 0, total: 0 };
  }

  getSummaryRows(): CaseIqTableRow[] {
    return this.getTableRows().filter((r) => r.sectionName !== 'Finance IT');
  }

  /** Finance IT row built from metrics — used for summary tiles */
  getFinanceITRow(): CaseIqTableRow | null {
    return this.buildTableRow('Finance IT');
  }

  /** Non-Finance IT resolution agents for the track section */
  getTrackAgents(): { team: string; deployed: number; total: number }[] {
    return this.resolutionAgents.filter((a) => a.team !== 'Finance IT');
  }

  /** Agent ratio for Finance IT */
  getFinanceITAgentRatio(): number {
    const row = this.getFinanceITRow();
    return row ? this.getAgentRatio(row) : 0;
  }

  /** Fetch accuracy data from API and store for template use */
  private fetchAccuracyData(): void {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        if (Array.isArray(data)) {
          this.accuracyData = data;
        }
      });
  }

  /** Look up Total Accuracy for a section, filtered by selectedQuarter */
  getAccuracyForSection(sectionName: string): number | null {
    if (!this.accuracyData.length) return null;

    // Filter by quarter first
    const filtered = this.selectedQuarter
      ? this.accuracyData.filter(
          (item: any) => item.Quarter === this.selectedQuarter,
        )
      : this.accuracyData;

    if (!filtered.length) return null;

    // For Finance IT / ALL: compute weighted average across all teams
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
}
