import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-atmf-bar-line-chart',
  templateUrl: './atmf-bar-line-chart.component.html',
  styleUrl: './atmf-bar-line-chart.component.css',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  standalone: true,
})
export class AtmfBarLineChartComponent implements OnChanges {
  @Input() chartData: any;
  @Input() title: string = '';

  echartsOptions: EChartsOption = {};

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

    this.echartsOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { show: false },
      grid: { top: 30, right: 60, bottom: 20, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels || [],
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          position: 'left',
          splitLine: { show: false },
          axisLabel: { formatter: (v: number) => v.toLocaleString() },
        },
        {
          type: 'value',
          position: 'right',
          name: '% Change',
          splitLine: { lineStyle: { type: 'dashed' } },
          axisLabel: { formatter: (v: number) => v + '%' },
        },
      ],
      series: [
        {
          name: 'Service',
          type: 'bar',
          stack: 'total',
          data: serviceValues || [],
          itemStyle: { color: '#7d8affe4' },
          yAxisIndex: 0,
        },
        {
          name: 'Product',
          type: 'bar',
          stack: 'total',
          data: productValues || [],
          itemStyle: { color: '#b02863ff' },
          yAxisIndex: 0,
        },
        {
          name: 'Product % Change',
          type: 'line',
          data: productPercentChanges || [],
          lineStyle: { color: '#e69710ff', width: 3, type: 'dashed' },
          itemStyle: { color: '#e69710ff' },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
          yAxisIndex: 1,
        },
        {
          name: 'Service % Change',
          type: 'line',
          data: servicePercentChanges || [],
          lineStyle: { color: '#7D8AFF', width: 3 },
          itemStyle: { color: '#7D8AFF' },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
          yAxisIndex: 1,
        },
      ],
    };
  }
}
