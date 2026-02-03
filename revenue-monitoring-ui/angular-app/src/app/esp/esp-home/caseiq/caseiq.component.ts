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

  private charts: Chart[] = [];
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
          this.updateOverallBarFromMetrics();
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
      this.updateOverallBarFromMetrics();
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

  private createAllCharts(): void {
    // Clean up any existing charts before recreating
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];

    this.sections().forEach((sectionName, sectionIndex) => {
      const barId = `overall-bar-${sectionIndex}`;
      this.createBarChart(barId, sectionName);

      // For now, use three generic pies per section
      for (let pieIndex = 0; pieIndex < 3; pieIndex++) {
        const pieId = `overall-pie-${sectionIndex}-${pieIndex}`;
        this.createPieChart(pieId, sectionName, pieIndex);
      }
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

    // Individual values for each bar/segment
    let totalCases = 0;
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
        labels = [
          'Total Cases',
          ['Total Service', 'Requests'],
          'Routed Out',
          'Cancelled',
        ];

        totalCases = Number(teamData.TOTAL_CASES) || 0;

        const totalServiceRequests =
          Number(teamData.TOTAL_SERVICE_REQUESTS) || 0;
        const resolvedFromService = Number(teamData.RESOLVED) || 0;
        serviceResolved = resolvedFromService;
        serviceOthers = totalServiceRequests - resolvedFromService;

        routedOutRecommended = Number(teamData.RECOMMENDED_ROUTE_OUT) || 0;
        routedOutMisrouted = Number(teamData.MISROUTED) || 0;

        const cancelledTotal = Number(teamData.CANCELLED) || 0;
        const recommendedCancelled =
          Number(teamData.RECOMMENDED_CANCELLED) || 0;
        cancelledRecommended = recommendedCancelled;
        cancelledOthers = cancelledTotal - recommendedCancelled;
      }
    }

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            // Total Cases
            data: [totalCases, 0, 0, 0],
            backgroundColor: 'rgb(54, 162, 235)',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Total Cases',
          },
          {
            // Total Service Requests (Resolved)
            data: [0, serviceResolved, 0, 0],
            backgroundColor: '#81C784',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Resolved (CaseIQ)',
          },
          {
            // Total Service Requests (Others)
            data: [0, serviceOthers, 0, 0],
            backgroundColor: '#4CAF50',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Resolved (Ops)',
          },
          {
            // Routed Out (Recommended)
            data: [0, 0, routedOutRecommended, 0],
            backgroundColor: '#FFD54F',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Routed (Recommended)',
          },
          {
            // Routed Out (Misrouted)
            data: [0, 0, routedOutMisrouted, 0],
            backgroundColor: '#FFA000',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Misrouted',
          },
          {
            // Cancelled
            data: [0, 0, 0, cancelledRecommended],
            backgroundColor: '#EF9A9A',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Recommended Canceled',
          },
          {
            // Cancelled (Others)
            data: [0, 0, 0, cancelledOthers],
            backgroundColor: '#E57373',
            borderWidth: 0,
            stack: 'stack1',
            label: 'Others',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 30,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
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

              ctx.fillStyle = '#333';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(stackTotal.toString(), x, topY - 5);
            }
          },
        },
      ],
    });

    this.charts.push(chart);
  }

  /**
   * Updates the Finance IT bar chart (section 'Finance IT', canvas id 'overall-bar-0')
   * with values from caseIqMetrics where TEAM_NAME === 'ALL'.\n   */
  private updateOverallBarFromMetrics(): void {
    if (!Array.isArray(this.caseIqMetrics)) {
      return;
    }

    const overall = this.caseIqMetrics.find(
      (m: any) =>
        m &&
        m.TEAM_NAME &&
        typeof m.TEAM_NAME === 'string' &&
        m.TEAM_NAME.toUpperCase() === 'ALL',
    );

    if (!overall) {
      return;
    }

    const chart = this.charts.find(
      (c) => c.canvas && c.canvas.id === 'overall-bar-0',
    );

    if (!chart) {
      return;
    }

    const labels = [
      'Total Cases',
      ['Total Service', 'Requests'],
      'Routed Out',
      'Cancelled',
    ];

    const totalCases = Number(overall.TOTAL_CASES) || 0;

    const totalServiceRequests = Number(overall.TOTAL_SERVICE_REQUESTS) || 0;
    const resolvedFromService = Number(overall.RESOLVED) || 0;
    const serviceResolved = resolvedFromService;
    const serviceOthers = totalServiceRequests - resolvedFromService;

    const routedOutRecommended = Number(overall.RECOMMENDED_ROUTE_OUT) || 0;
    const routedOutMisrouted = Number(overall.MISROUTED) || 0;

    const cancelledTotal = Number(overall.CANCELLED) || 0;
    const recommendedCancelled = Number(overall.RECOMMENDED_CANCELLED) || 0;
    const cancelledRecommended = recommendedCancelled;
    const cancelledOthers = cancelledTotal - recommendedCancelled;

    chart.data.labels = labels;
    chart.data.datasets = [
      {
        data: [totalCases, 0, 0, 0],
        backgroundColor: 'rgb(54, 162, 235)',
        borderWidth: 0,
        stack: 'stack1',
      },
      {
        data: [0, serviceResolved, 0, 0],
        backgroundColor: '#81C784',
        borderWidth: 0,
        stack: 'stack1',
      },
      {
        data: [0, serviceOthers, 0, 0],
        backgroundColor: '#4CAF50',
        borderWidth: 0,
        stack: 'stack1',
      },
      {
        data: [0, 0, routedOutRecommended, 0],
        backgroundColor: '#FFD54F',
        borderWidth: 0,
        stack: 'stack1',
      },
      {
        data: [0, 0, routedOutMisrouted, 0],
        backgroundColor: '#FFA000',
        borderWidth: 0,
        stack: 'stack1',
      },
      {
        data: [0, 0, 0, cancelledRecommended],
        backgroundColor: '#EF9A9A',
        borderWidth: 0,
        stack: 'stack1',
      },
      {
        data: [0, 0, 0, cancelledOthers],
        backgroundColor: '#E57373',
        borderWidth: 0,
        stack: 'stack1',
      },
    ];

    chart.update();
  }

  private createPieChart(
    canvasId: string,
    sectionName: string,
    pieIndex: number,
  ): void {
    const canvas = document.getElementById(
      canvasId,
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let labels: (string | string[])[] = [];
    let data: number[] = [];
    let colors: string[] = [];

    // First doughnut for all sections: Resolved by CaseIQ vs Resolved by Ops
    if (pieIndex === 0 && Array.isArray(this.caseIqMetrics)) {
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
        const resolved = Number(teamData.RESOLVED) || 0;
        const totalServiceRequests =
          Number(teamData.TOTAL_SERVICE_REQUESTS) || 0;
        const resolvedByOps = totalServiceRequests - resolved;

        labels = ['Resolved (CaseIQ)', 'Resolved (Ops)'];
        data = [resolved, resolvedByOps];
        colors = ['#81C784', '#4CAF50'];
      }
    }

    // Second doughnut for all sections: Recommended Routed Out vs Misrouted
    if (pieIndex === 1 && Array.isArray(this.caseIqMetrics)) {
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
        const recommendedRoutedOut =
          Number(teamData.RECOMMENDED_ROUTE_OUT) || 0;
        const misrouted = Number(teamData.MISROUTED) || 0;

        labels = ['Routed (Recommended)', 'Misrouted'];
        data = [recommendedRoutedOut, misrouted];
        colors = ['#FFD54F', '#FFA000'];
      }
    }

    // Third doughnut for all sections: Recommended Canceled vs Others
    if (pieIndex === 2 && Array.isArray(this.caseIqMetrics)) {
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
        const recommendedCancelled =
          Number(teamData.RECOMMENDED_CANCELLED) || 0;
        const cancelled = Number(teamData.CANCELLED) || 0;
        const others = cancelled - recommendedCancelled;

        labels = ['Recommended Canceled', 'Others'];
        data = [recommendedCancelled, others];
        colors = ['#EF9A9A', '#E57373'];
      }
    }

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: true,
        cutout: '35%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
      plugins: [
        {
          id: 'doughnutPercentage',
          afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;

            chart.data.datasets.forEach((dataset, datasetIndex) => {
              const meta = chart.getDatasetMeta(datasetIndex);
              const total = (dataset.data as number[]).reduce(
                (a, b) => a + b,
                0,
              );

              meta.data.forEach((arc: any, index) => {
                const angle = (arc.startAngle + arc.endAngle) / 2;
                const radius = (arc.outerRadius + arc.innerRadius) / 2;
                const value = dataset.data[index] as number;
                const percentage = ((value / total) * 100).toFixed(0);

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'normal 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Draw percentage
                ctx.fillText(`${percentage}%`, x, y - 5);

                // Draw actual count in brackets below
                ctx.fillText(`(${value})`, x, y + 5);
              });
            });
          },
        },
      ],
    });

    this.charts.push(chart);
  }
}
