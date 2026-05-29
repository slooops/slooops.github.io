import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { NgChartsModule } from 'ng2-charts';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-atmf-stacked-chart',
  templateUrl: './atmf-stacked-chart.component.html',
  styleUrl: './atmf-stacked-chart.component.css',
  imports: [NgChartsModule],
  standalone: true,
})
export class AtmfStackedChartComponent implements OnChanges {
  @Input() labels: string[] = [];
  @Input() datasets: any[] = [];
  @Input() yAxisLabel: string = '';
  @Input() y1AxisLabel: string = '';
  @Input() showY1Axis: boolean = false;
  @Input() stacked: boolean = true;
  @Input() currencyFormat: boolean = false;

  public chartType: ChartType = 'bar';
  public chartData: any = { labels: [], datasets: [] };

  public chartOptions: ChartConfiguration['options'] = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (this.labels?.length && this.datasets?.length) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    this.chartData = {
      labels: this.labels,
      datasets: this.datasets,
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (label.includes('Count')) {
                return `${label}: ${value.toLocaleString()}`;
              }
              if (this.currencyFormat) {
                return `${label}: $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
              return `${label}: ${value.toLocaleString()}`;
            },
          },
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: {
          stacked: this.stacked,
          grid: { display: false },
        },
        y: {
          stacked: this.stacked,
          position: 'left',
          display: true,
          title: {
            display: !!this.yAxisLabel,
            text: this.yAxisLabel,
          },
          grid: {
            drawOnChartArea: true,
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1,
          },
          ticks: {
            callback: (value: any) => {
              if (this.currencyFormat) {
                if (value >= 1_000_000_000)
                  return '$' + (value / 1_000_000_000).toFixed(1) + 'B';
                if (value >= 1_000_000)
                  return '$' + (value / 1_000_000).toFixed(0) + 'M';
                if (value >= 1_000)
                  return '$' + (value / 1_000).toFixed(0) + 'K';
                return '$' + value;
              }
              return value.toLocaleString();
            },
          },
        },
        ...(this.showY1Axis
          ? {
              y1: {
                type: 'linear' as const,
                position: 'right' as const,
                display: false,
                grid: { drawOnChartArea: false },
              },
            }
          : {}),
      },
    };
  }
}
