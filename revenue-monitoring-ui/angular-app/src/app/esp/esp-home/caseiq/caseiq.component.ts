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
    let values: number[] = [];

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
        values = [
          Number(teamData.TOTAL_CASES) || 0,
          Number(teamData.TOTAL_SERVICE_REQUESTS) || 0,
          Number(teamData.ROUTED_OUT) || 0,
          Number(teamData.CANCELLED) || 0,
        ];
      }
    }

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: 'rgb(54, 162, 235)',
            borderWidth: 0,
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
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            border: { display: true },
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
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              meta.data.forEach((bar, index) => {
                const data = dataset.data[index] as number;
                ctx.fillStyle = '#333';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(data.toString(), bar.x, bar.y - 5);
              });
            });
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
    const values = [
      Number(overall.TOTAL_CASES) || 0,
      Number(overall.TOTAL_SERVICE_REQUESTS) || 0,
      Number(overall.ROUTED_OUT) || 0,
      Number(overall.CANCELLED) || 0,
    ];

    chart.data.labels = labels;
    if (chart.data.datasets && chart.data.datasets[0]) {
      chart.data.datasets[0].data = values;
    }
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
