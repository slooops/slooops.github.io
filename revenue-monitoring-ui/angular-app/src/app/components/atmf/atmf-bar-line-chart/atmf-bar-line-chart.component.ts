import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

@Component({
    selector: 'app-atmf-bar-line-chart',
    templateUrl: './atmf-bar-line-chart.component.html',
    styleUrl: './atmf-bar-line-chart.component.css',
    imports: [
    NgChartsModule
  ],
  standalone: true
})
export class AtmfBarLineChartComponent implements OnChanges {
  @Input() chartData: any;
  @Input() title: string = '';

  public barChartType: ChartType = 'bar';
  public barChartData: any = {
    labels: [],
    datasets: [],
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend/table
        position: 'bottom',
      },
      title: {
        display: false, // Hide chart title
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;

            // Format any percentage change labels with % symbol
            if (label.includes('%')) {
              return `${label}: ${value.toFixed(1)}%`;
            }
            // Format numbers with commas
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
      datalabels: {
        display: true, // Enable datalabels for bars
        color: 'white',
        formatter: (value: any, context: any) => {
          // Only show labels for bar datasets, not lines
          const datasetType = context.dataset.type;
          if (datasetType === 'line') {
            return null;
          }
          return value.toLocaleString();
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        position: 'left',
        title: {
          display: false,
          text: 'Volume',
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          callback: (value) => {
            return value.toLocaleString();
          },
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        display: false, // Hide y1 axis visually
        title: {
          display: false,
          text: '% Change',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          display: false,
          callback: (value) => {
            return value + '%';
          },
        },
      },
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && this.chartData) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (!this.chartData) return;

    const {
      labels,
      productValues,
      serviceValues,
      productPercentChanges,
      servicePercentChanges,
    } = this.chartData;

    this.barChartData = {
      labels: labels || [],
      datasets: [
        {
          type: 'line',
          label: 'Product % Change',
          data: productPercentChanges || [],
          borderColor: '#e69710ff', // Product line warning color
          backgroundColor: '#e69710ff',
          borderWidth: 3,
          borderDash: [5, 5],
          fill: false,
          yAxisID: 'y1',
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#e69710ff',
          pointBorderColor: '#e69710ff',
          order: 0, // Draw last (in front)
          tension: 0.3,
        },
        {
          type: 'line',
          label: 'Service % Change',
          data: servicePercentChanges || [],
          borderColor: '#7D8AFF', // Service line color
          backgroundColor: '#7D8AFF',
          borderWidth: 3,
          fill: false,
          yAxisID: 'y1',
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#7D8AFF',
          pointBorderColor: '#7D8AFF',
          order: 0, // Draw last (in front)
          tension: 0.3,
        },
        {
          type: 'bar',
          label: 'Service',
          data: serviceValues || [],
          backgroundColor: '#7d8affe4', // Service color
          borderColor: '#7D8AFF',
          borderWidth: 1,
          yAxisID: 'y',
          order: 2, // Draw first (behind)
        },
        {
          type: 'bar',
          label: 'Product',
          data: productValues || [],
          backgroundColor: '#b02863ff', // Product color
          borderColor: '#B02863',
          borderWidth: 1,
          yAxisID: 'y',
          order: 1, // Draw second (on top in stack)
        },
      ],
    };
  }
}
