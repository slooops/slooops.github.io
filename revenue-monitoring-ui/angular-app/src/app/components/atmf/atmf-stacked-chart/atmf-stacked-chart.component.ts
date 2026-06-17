import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-atmf-stacked-chart',
  templateUrl: './atmf-stacked-chart.component.html',
  styleUrl: './atmf-stacked-chart.component.css',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
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

  echartsOptions: EChartsOption = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (this.labels?.length && this.datasets?.length) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    const series = this.datasets.map((ds: any) => ({
      name: ds.label || '',
      type: 'bar' as const,
      stack: this.stacked ? 'total' : undefined,
      data: ds.data || [],
      itemStyle: { color: ds.backgroundColor || '#ccc' },
    }));

    this.echartsOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = params[0]?.axisValueLabel + '<br/>';
          params.forEach((p: any) => {
            const val = this.currencyFormat
              ? '$' +
                p.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : p.value.toLocaleString();
            result += `${p.marker} ${p.seriesName}: ${val}<br/>`;
          });
          return result;
        },
      },
      legend: { show: false },
      grid: { top: 20, right: 10, bottom: 20, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: this.labels,
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: this.yAxisLabel || undefined,
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
        axisLabel: {
          formatter: (value: number) => {
            if (this.currencyFormat) {
              if (value >= 1_000_000_000)
                return '$' + (value / 1_000_000_000).toFixed(1) + 'B';
              if (value >= 1_000_000)
                return '$' + (value / 1_000_000).toFixed(0) + 'M';
              if (value >= 1_000) return '$' + (value / 1_000).toFixed(0) + 'K';
              return '$' + value;
            }
            return value.toLocaleString();
          },
        },
      },
      series,
    };
  }
}
