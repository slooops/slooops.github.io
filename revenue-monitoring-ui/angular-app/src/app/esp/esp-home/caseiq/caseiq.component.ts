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
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-caseiq',
  templateUrl: './caseiq.component.html',
  styleUrl: './caseiq.component.css',
  imports: [CommonModule],
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

  @Input() caseIqMetrics: any;

  ngOnChanges(changes: SimpleChanges): void {
    if ('caseIqMetrics' in changes) {
      // Always rebuild section list so template reflects latest metrics
      this.buildSectionsFromMetrics();

      // If view is already initialized, (re)create charts and update data
      // Use setTimeout to ensure Angular has updated the DOM with new canvases
      if (this.viewInitialized) {
        setTimeout(() => {
          this.createAllCharts();
        }, 0);
      }
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    // Initial build of sections/charts once view is ready
    // Use setTimeout to ensure Angular has updated the DOM
    this.buildSectionsFromMetrics();
    setTimeout(() => {
      this.createAllCharts();
    }, 0);
  }

  ngOnDestroy(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
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
    if (!Array.isArray(this.caseIqMetrics)) {
      return 0;
    }

    let teamData: any = null;

    if (sectionName === 'Finance IT') {
      teamData = this.caseIqMetrics.find(
        (m: any) =>
          m &&
          m.TEAM_NAME &&
          typeof m.TEAM_NAME === 'string' &&
          m.TEAM_NAME.toUpperCase() === 'ALL',
      );
    } else {
      teamData = this.caseIqMetrics.find(
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

  private createBarChart(canvasId: string, sectionName: string): void {
    const canvas = document.getElementById(
      canvasId,
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let labels: (string | string[])[] = [];

    // Individual values for each bar/segment (excluding Total Cases bar)
    let serviceResolved = 0;
    let serviceOthers = 0;
    let routedOutRecommended = 0;
    let routedOutMisrouted = 0;
    let cancelledRecommended = 0;
    let cancelledOthers = 0;

    // Try to find metrics for this section from caseIqMetrics
    if (Array.isArray(this.caseIqMetrics)) {
      let teamData: any = null;

      if (sectionName === 'Finance IT') {
        // For Finance IT section, find TEAM_NAME === 'ALL'
        teamData = this.caseIqMetrics.find(
          (m: any) =>
            m &&
            m.TEAM_NAME &&
            typeof m.TEAM_NAME === 'string' &&
            m.TEAM_NAME.toUpperCase() === 'ALL',
        );
      } else {
        // For other sections, find matching TEAM_NAME
        teamData = this.caseIqMetrics.find(
          (m: any) =>
            m &&
            m.TEAM_NAME &&
            typeof m.TEAM_NAME === 'string' &&
            m.TEAM_NAME === sectionName,
        );
      }

      if (teamData) {
        labels = ['Total Service Requests', 'Routed Out', 'Canceled'];

        // First bar now represents total RESOLVED,
        // stacked as RESOLVED_AGENT and RESOLVED_OPS.
        const resolvedAgent = Number(teamData.RESOLVED_AGENT) || 0;
        const resolvedOps = Number(teamData.RESOLVED_OPS) || 0;
        serviceResolved = resolvedAgent;
        serviceOthers = resolvedOps;

        routedOutRecommended =
          Number(
            teamData.RECOMMENDED_ROUTE_OUT ?? teamData.RECOMMENDED_ROUTED_OUT,
          ) || 0;
        routedOutMisrouted = Number(teamData.NOT_RECOMMENDED_ROUTED_OUT) || 0;

        const cancelledTotal = Number(teamData.CANCELLED) || 0;
        const recommendedCancelled =
          Number(teamData.RECOMMENDED_CANCELLED) || 0;
        cancelledRecommended = recommendedCancelled;
        cancelledOthers = Number(teamData.NOT_RECOMMENDED_CANCELLED);
      }
    }

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            // Total Service Requests (Resolved by Ops)
            data: [serviceOthers, 0, 0],
            // Percentages come directly from API fields
            // RESOLVED_PERCENTAGE_OPS applies to the first bar
            ...({
              segmentPercentages: [
                Number(
                  (Array.isArray(this.caseIqMetrics)
                    ? this.caseIqMetrics.find(
                        (m: any) =>
                          m &&
                          m.TEAM_NAME &&
                          typeof m.TEAM_NAME === 'string' &&
                          (sectionName === 'Finance IT'
                            ? m.TEAM_NAME.toUpperCase() === 'ALL'
                            : m.TEAM_NAME === sectionName),
                      )
                    : null
                  )?.RESOLVED_PERCENTAGE_OPS,
                ) || 0,
                0,
                0,
              ],
            } as any),
            backgroundColor: '#4CAF50',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Resolved (Ops)',
          },
          {
            // Total Service Requests (Resolved by Agent)
            data: [serviceResolved, 0, 0],
            // RESOLVED_PERCENTAGE_AGENT applies to the first bar
            ...({
              segmentPercentages: [
                Number(
                  (Array.isArray(this.caseIqMetrics)
                    ? this.caseIqMetrics.find(
                        (m: any) =>
                          m &&
                          m.TEAM_NAME &&
                          typeof m.TEAM_NAME === 'string' &&
                          (sectionName === 'Finance IT'
                            ? m.TEAM_NAME.toUpperCase() === 'ALL'
                            : m.TEAM_NAME === sectionName),
                      )
                    : null
                  )?.RESOLVED_PERCENTAGE_AGENT,
                ) || 0,
                0,
                0,
              ],
            } as any),
            backgroundColor: '#81C784',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Resolved (Agent)',
          },
          {
            // Routed Out (Misrouted)
            data: [0, routedOutMisrouted, 0],
            // NOT_RECOMMENDED_ROUTED_OUT_PERCENTAGE applies to the second bar
            ...({
              segmentPercentages: [
                0,
                Number(
                  (Array.isArray(this.caseIqMetrics)
                    ? this.caseIqMetrics.find(
                        (m: any) =>
                          m &&
                          m.TEAM_NAME &&
                          typeof m.TEAM_NAME === 'string' &&
                          (sectionName === 'Finance IT'
                            ? m.TEAM_NAME.toUpperCase() === 'ALL'
                            : m.TEAM_NAME === sectionName),
                      )
                    : null
                  )?.NOT_RECOMMENDED_ROUTED_OUT_PERCENTAGE,
                ) || 0,
                0,
              ],
            } as any),
            backgroundColor: '#FFA000',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Not Recommended Routed Out',
          },
          {
            // Routed Out (Recommended)
            data: [0, routedOutRecommended, 0],
            // RECOMMENDED_ROUTED_OUT_PERCENTAGE applies to the second bar
            ...({
              segmentPercentages: [
                0,
                Number(
                  (Array.isArray(this.caseIqMetrics)
                    ? this.caseIqMetrics.find(
                        (m: any) =>
                          m &&
                          m.TEAM_NAME &&
                          typeof m.TEAM_NAME === 'string' &&
                          (sectionName === 'Finance IT'
                            ? m.TEAM_NAME.toUpperCase() === 'ALL'
                            : m.TEAM_NAME === sectionName),
                      )
                    : null
                  )?.RECOMMENDED_ROUTED_OUT_PERCENTAGE,
                ) || 0,
                0,
              ],
            } as any),
            backgroundColor: '#FFD54F',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Recommended Routed Out',
          },
          {
            // Cancelled (Others)
            data: [0, 0, cancelledOthers],
            // NOT_RECOMMENDED_CANCELLED_PERCENTAGE applies to the third bar
            ...({
              segmentPercentages: [
                0,
                0,
                Number(
                  (Array.isArray(this.caseIqMetrics)
                    ? this.caseIqMetrics.find(
                        (m: any) =>
                          m &&
                          m.TEAM_NAME &&
                          typeof m.TEAM_NAME === 'string' &&
                          (sectionName === 'Finance IT'
                            ? m.TEAM_NAME.toUpperCase() === 'ALL'
                            : m.TEAM_NAME === sectionName),
                      )
                    : null
                  )?.NOT_RECOMMENDED_CANCELLED_PERCENTAGE,
                ) || 0,
              ],
            } as any),
            backgroundColor: '#E57373',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Not Recommended Canceled',
          },
          {
            // Cancelled
            data: [0, 0, cancelledRecommended],
            // RECOMMENDED_CANCELLED_PERCENTAGE applies to the third bar
            ...({
              segmentPercentages: [
                0,
                0,
                Number(
                  (Array.isArray(this.caseIqMetrics)
                    ? this.caseIqMetrics.find(
                        (m: any) =>
                          m &&
                          m.TEAM_NAME &&
                          typeof m.TEAM_NAME === 'string' &&
                          (sectionName === 'Finance IT'
                            ? m.TEAM_NAME.toUpperCase() === 'ALL'
                            : m.TEAM_NAME === sectionName),
                      )
                    : null
                  )?.RECOMMENDED_CANCELLED_PERCENTAGE,
                ) || 0,
              ],
            } as any),
            backgroundColor: '#EF9A9A',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Recommended Canceled',
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
              font: {
                size: 10,
              },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
            },
          },
          y: {
            display: true,
            grid: { display: true },
            border: { display: true },
            beginAtZero: true,
            stacked: true,
            ticks: {
              font: {
                size: 10,
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
              ctx.font = 'bold 10px sans-serif';
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
                const percentage =
                  typeof percentages[index] === 'number'
                    ? percentages[index]
                    : Math.round((value / stackTotal) * 100);

                // Skip if percentage is 15% or less of the bar total
                if (percentage <= 15) {
                  return;
                }

                const centerX = bar.x;
                const centerY = (bar.y + bar.base) / 2;

                ctx.fillStyle = '#000';
                ctx.font = 'bold 10px sans-serif';
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
