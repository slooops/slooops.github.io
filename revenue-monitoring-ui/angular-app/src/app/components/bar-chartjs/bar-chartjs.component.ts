import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CommonModule } from '@angular/common';

// Register Chart.js components
Chart.register(...registerables, ChartDataLabels);
// Default datalabels OFF globally — charts opt-in via their own config
Chart.defaults.set('plugins.datalabels', { display: false });

export interface StackedBarChartDataPoint {
  label: string;
  segments: {
    name: string;
    value: number;
    color?: string;
  }[];
}

@Component({
  selector: 'app-bar-chartjs',
  templateUrl: './bar-chartjs.component.html',
  styleUrl: './bar-chartjs.component.css',
  imports: [CommonModule],
  standalone: true,
})
export class BarChartjsComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @ViewChild('chartCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() data: StackedBarChartDataPoint[] = [];
  @Input() canvasId: string = 'barChartJS';
  @Input() isLoading: boolean = false;
  @Input() chartHeight: number = 300;
  @Input() titleCaseLabels: boolean = true;

  titleCaseExceptions: string[] = [
    'N/A',
    'NA',
    'IT',
    'API',
    'UI',
    'ID',
    'VT',
    'and',
    'is',
  ];

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.data.length > 0 && !this.isLoading) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.createChart();
    }
    if (changes['isLoading'] && !this.isLoading && this.data.length > 0) {
      this.createChart();
    }
  }

  private createChart(): void {
    if (this.isLoading || !this.data || this.data.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Extract unique segment names
    const segmentNames = new Set<string>();
    this.data.forEach((item) => {
      item.segments.forEach((segment) => {
        segmentNames.add(segment.name);
      });
    });

    // Build datasets for Chart.js (one dataset per segment type)
    const datasets = Array.from(segmentNames).map((segmentName) => {
      const dataPoints: number[] = [];
      let segmentColor = '#cccccc';
      let total = 0;

      this.data.forEach((item) => {
        const segment = item.segments.find((s) => s.name === segmentName);
        const value = segment ? segment.value : 0;
        dataPoints.push(value);
        total += value;
        if (segment?.color) {
          segmentColor = segment.color;
        }
      });

      return {
        label: `${total} ${this.toTitleCase(segmentName)}`,
        data: dataPoints,
        backgroundColor: segmentColor,
      };
    });

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: this.data.map((item) => this.toTitleCase(item.label)),
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false, // Hide x-axis grid lines
            },
            border: {
              display: false, // Hide x-axis line
            },
            ticks: {
              display: true, // Show labels
            },
          },
          y: {
            stacked: true,
            display: false, // Hide y-axis completely
            grid: {
              display: false, // Hide y-axis grid lines
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
          datalabels: {
            display: true,
            color: '#fff',
            font: {
              weight: 'bold',
              size: 10,
            },
            formatter: (value: number, context: any) => {
              // Only show label if value is greater than 0 and segment is large enough
              if (value === 0 || value < 5) {
                return '';
              }
              return value;
            },
            anchor: 'center',
            align: 'center',
          },
        },
      },
      plugins: [
        {
          id: 'topLabels',
          afterDatasetsDraw: (chart: any) => {
            const ctx = chart.ctx;
            chart.data.datasets.forEach(
              (dataset: any, datasetIndex: number) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (
                  !meta.hidden &&
                  datasetIndex === chart.data.datasets.length - 1
                ) {
                  meta.data.forEach((bar: any, index: number) => {
                    // Calculate total for this bar
                    const total = chart.data.datasets.reduce(
                      (sum: number, ds: any) => {
                        return sum + (ds.data[index] || 0);
                      },
                      0,
                    );

                    // Check if bar has multiple segments
                    const hasMultipleSegments =
                      chart.data.datasets.filter(
                        (ds: any) => ds.data[index] > 0,
                      ).length > 1;

                    // Only show total label if there are multiple segments
                    if (hasMultipleSegments && total > 0) {
                      ctx.fillStyle = '#333';
                      ctx.font = 'bold 11px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'bottom';
                      ctx.fillText(total.toString(), bar.x, bar.y - 5);
                    }
                  });
                }
              },
            );
          },
        },
      ],
    };

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, config);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private toTitleCase(text: string): string {
    if (!this.titleCaseLabels) {
      return text;
    }

    return text
      .split(' ')
      .map((word) => {
        // Check if word is in exceptions array (case-insensitive check)
        const matchingException = this.titleCaseExceptions.find(
          (exception) => exception.toLowerCase() === word.toLowerCase(),
        );

        if (matchingException) {
          return matchingException; // Return the exception as defined
        }

        // Otherwise, apply title case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
