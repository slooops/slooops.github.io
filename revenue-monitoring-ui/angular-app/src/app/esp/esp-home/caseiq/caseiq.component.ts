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
import { LoadingSymbolComponent } from 'src/app/loading-symbol/loading-symbol.component';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-caseiq',
  templateUrl: './caseiq.component.html',
  styleUrl: './caseiq.component.css',
  imports: [CommonModule, LoadingSymbolComponent],
  standalone: true,
})
export class CaseiqComponent implements AfterViewInit, OnDestroy, OnChanges {
  // Section names are derived dynamically from caseIqMetrics
  // (e.g. 'Finance IT' for TEAM_NAME 'ALL', then each TEAM_NAME).
  sections = signal<string[]>([]);

  // Track created Chart.js instances; using `any` here avoids
  // over-constraining generics for different chart types.
  private charts: any[] = [];
  private viewInitialized = false;

  // Show a brief loading state when quarter or metrics change
  isLoading = true;

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

    // Initial build of sections/charts once view is ready
    // Use setTimeout to ensure Angular has updated the DOM
    this.buildSectionsFromMetrics();
    this.showLoadingForMoment();
  }

  ngOnDestroy(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
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

    // Finance IT / ALL first if present
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

    this.sections.set(names);
  }

  getTotalCases(sectionName: string): number {
    const metrics = this.getFilteredMetricsByQuarter();

    if (!Array.isArray(metrics)) {
      return 0;
    }

    let teamData: any = null;

    if (sectionName === 'Finance IT') {
      teamData = metrics.find(
        (m: any) =>
          m &&
          m.TEAM_NAME &&
          typeof m.TEAM_NAME === 'string' &&
          m.TEAM_NAME.toUpperCase() === 'ALL',
      );
    } else {
      teamData = metrics.find(
        (m: any) =>
          m &&
          m.TEAM_NAME &&
          typeof m.TEAM_NAME === 'string' &&
          m.TEAM_NAME === sectionName,
      );
    }

    return Number(teamData?.TOTAL_CASES) || 0;
  }

  private createAllCharts(): void {
    // Clean up any existing charts before recreating
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];

    this.sections().forEach((sectionName, sectionIndex) => {
      const barId = `overall-bar-${sectionIndex}`;
      this.createBarChart(barId, sectionName);
    });
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
      let teamData: any = null;

      if (sectionName === 'Finance IT') {
        // For Finance IT section, find TEAM_NAME === 'ALL'
        teamData = metrics.find(
          (m: any) =>
            m &&
            m.TEAM_NAME &&
            typeof m.TEAM_NAME === 'string' &&
            m.TEAM_NAME.toUpperCase() === 'ALL',
        );
      } else {
        // For other sections, find matching TEAM_NAME
        teamData = metrics.find(
          (m: any) =>
            m &&
            m.TEAM_NAME &&
            typeof m.TEAM_NAME === 'string' &&
            m.TEAM_NAME === sectionName,
        );
      }

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

    const axisFontSize =
      window.innerWidth <= 1700 ? (window.innerWidth <= 1500 ? 7.5 : 8.5) : 10;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            // Total Service Requests (Resolved by Ops)
            data: [serviceOthers, 0, 0, 0],
            backgroundColor: 'rgba(135, 206, 250, 0.7)',
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
            backgroundColor: 'rgba(144, 238, 144, 0.7)',
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
            backgroundColor: 'rgba(255, 158, 128, 0.85)',
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
            backgroundColor: 'rgba(255, 128, 171, 0.85)',
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
            backgroundColor: 'rgba(255, 179, 102, 0.7)',
            ...({
              segmentPercentages: [0, 0, routedMisroutedPct, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Not Recommended Routed Out',
          },
          {
            // Routed Out (Recommended)
            data: [0, 0, routedOutRecommended, 0],
            backgroundColor: 'rgba(255, 214, 102, 0.7)',
            ...({
              segmentPercentages: [0, 0, routedRecommendedPct, 0],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Recommended Routed Out',
          },
          {
            // Cancelled (Others)
            data: [0, 0, 0, cancelledOthers],
            backgroundColor: 'rgba(144, 220, 210, 0.7)',
            ...({
              segmentPercentages: [0, 0, 0, cancelledOthersPct],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Not Recommended Cancelled',
          },
          {
            // Cancelled (Recommended)
            data: [0, 0, 0, cancelledRecommended],
            backgroundColor: 'rgba(218, 165, 255, 0.7)',
            ...({
              segmentPercentages: [0, 0, 0, cancelledRecommendedPct],
            } as any),
            borderWidth: 0,
            stack: 'stack1',
            label: 'Recommended Cancelled',
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
            top: 30,
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
                weight: 'bold',
              },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
            },
          },
          y: {
            display: true,
            grid: { display: false }, // Remove horizontal grid lines
            border: { display: true },
            beginAtZero: true,
            stacked: true,
            ticks: {
              color: '#000',
              font: {
                size: axisFontSize,
                weight: 'bold',
              },
            },
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
      ],
    });

    this.charts.push(chart);
  }
}
