import { Component, Input } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartData, ChartDataset } from 'chart.js/auto';
import { ChartOptions } from 'chart.js'; // Import ChartOptions for proper typing

@Component({
  selector: 'app-o2c-donut',
  templateUrl: './o2c-donut.component.html',
  styleUrl: './o2c-donut.component.css',
})
export class O2cDonutComponent {
  @Input() data: {
    INCIDENT_TYPE: string;
    INCIDENT_COUNT: number;
    INCIDENT_VALUE: number;
  }[] = [];

  @Input() canvasId: string = 'donutCanvas'; // fallback if not set

  @Input() showCircleBackground?: boolean = true;

  @Input() showLegend?: boolean = true;

  @Input() chartSize?: string = '125px';

  legendItems: {
    type: string;
    count: number;
    value: number;
    color: string;
  }[] = [];

  legendMap: {
    [canvasId: string]: {
      type: string;
      count: number;
      value: number;
      color: string;
    }[];
  } = {};

  ngOnInit() {
    // Make sure chart container styles get applied before rendering
    setTimeout(() => {
      this.renderPieChart(this.data, this.canvasId);
    });
  }

  renderPieChart(
    data: {
      INCIDENT_TYPE: string;
      INCIDENT_COUNT: number;
      INCIDENT_VALUE: number;
    }[],
    canvasId: string
  ): void {
    const pieColors = [
      '#399E20',
      '#FBAB2C',
      '#1990FA',
      '#00509E',
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(100, 255, 218, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(235, 154, 229, 0.6)',
      'rgba(201, 203, 207, 0.6)',
      'rgba(0, 255, 157, 0.6)',
      'rgba(255, 205, 86, 0.6)',
    ];

    const counts = data.map((entry) => entry.INCIDENT_VALUE);
    const colors = data.map((_, index) => pieColors[index % pieColors.length]);

    // Compute totals
    const totalCount = data.reduce((sum, e) => {
      const count = e.INCIDENT_COUNT;
      return sum + (count !== undefined && count !== null ? count : 0);
    }, 0);

    const totalValue = data.reduce(
      (sum, e) => sum + (e.INCIDENT_VALUE || 0),
      0
    );

    // Format total value, e.g., $4.2M
    const formattedTotalValue =
      totalValue >= 1_000_000
        ? `$${(totalValue / 1_000_000).toFixed(1)} M`
        : `$${totalValue.toLocaleString()} M`;

    // Format count, handling empty/undefined values
    const formattedTotalCount = totalCount ? `#${totalCount}` : '';

    const ctx = (
      document.getElementById(canvasId) as HTMLCanvasElement
    )?.getContext('2d');

    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [
            {
              data: counts,
              backgroundColor: colors,
              borderWidth: 0,
              hoverOffset: 0,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            datalabels: { display: false },
          },
          hover: { mode: null },
          animation: {
            animateRotate: false,
            animateScale: false,
          },
          cutout: '70%',
        },
        plugins: [
          {
            id: 'centerText',
            beforeDraw(chart) {
              const { width, height, ctx } = chart;

              ctx.save();

              // Main center text (e.g., $4.2M)
              ctx.font = '600 16px Inter, sans-serif';
              ctx.fillStyle = '#333';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const mainTextY = height / 2 - 2;
              ctx.fillText(formattedTotalValue, width / 2, mainTextY);

              // Subtitle (e.g., #12)
              ctx.font = '12px Inter, sans-serif';
              ctx.fillStyle = '#666';
              ctx.fillText(formattedTotalCount, width / 2, height / 2 + 12);

              ctx.restore();
            },
          },
        ],
      });

      // Set custom legend
      const legendEntries = data.map((entry, i) => ({
        type: entry.INCIDENT_TYPE,
        count: entry.INCIDENT_COUNT,
        value: entry.INCIDENT_VALUE,
        color: colors[i],
      }));

      legendEntries.push({
        type: 'Total Exceptions',
        count: totalCount,
        value: totalValue,
        color: 'transparent',
      });

      this.legendItems = this.showLegend ? legendEntries : [];

      this.legendMap[canvasId] = legendEntries;
      // console.log(`Legend for ${canvasId}:`, this.legendMap[canvasId]);
    } else {
      console.error(`Canvas with id ${canvasId} not found`);
    }
  }
}
