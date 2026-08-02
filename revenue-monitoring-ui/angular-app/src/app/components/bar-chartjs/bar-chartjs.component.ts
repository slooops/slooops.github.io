import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  standalone: true,
})
export class BarChartjsComponent implements OnChanges {
  @Input() data: StackedBarChartDataPoint[] = [];
  @Input() canvasId: string = 'barChartJS';
  @Input() isLoading: boolean = false;
  @Input() chartHeight: number = 300;
  @Input() titleCaseLabels: boolean = true;

  chartOptions: EChartsOption = {};

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['isLoading']) {
      if (!this.isLoading && this.data && this.data.length > 0) {
        this.createChart();
      }
    }
  }

  private createChart(): void {
    if (this.isLoading || !this.data || this.data.length === 0) return;

    const segmentNames = new Set<string>();
    this.data.forEach((item) => {
      item.segments.forEach((segment) => segmentNames.add(segment.name));
    });

    const series = Array.from(segmentNames).map((segmentName, idx) => {
      let segmentColor = '#cccccc';
      let total = 0;
      const dataPoints = this.data.map((item) => {
        const segment = item.segments.find((s) => s.name === segmentName);
        const value = segment ? segment.value : 0;
        total += value;
        if (segment?.color) segmentColor = segment.color;
        return value;
      });

      // Determine if this is the last (top) series for showing totals
      const isLastSeries = idx === Array.from(segmentNames).length - 1;

      return {
        name: `${total} ${this.toTitleCase(segmentName)}`,
        type: 'bar' as const,
        stack: 'total',
        itemStyle: { color: segmentColor },
        label: {
          show: true,
          position: 'inside' as const,
          color: '#fff',
          fontWeight: 'bold' as any,
          fontSize: 10,
          formatter: (params: any) => (params.value >= 5 ? params.value : ''),
        },
        data: dataPoints,
      };
    });

    this.chartOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { top: 30, right: 10, bottom: 40, left: 10, containLabel: true },
      xAxis: {
        type: 'category',
        data: this.data.map((item) => this.toTitleCase(item.label)),
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        show: false,
        splitLine: { show: false },
      },
      series,
    };
  }

  private toTitleCase(text: string): string {
    if (!this.titleCaseLabels) return text;
    return text
      .split(' ')
      .map((word) => {
        const matchingException = this.titleCaseExceptions.find(
          (exception) => exception.toLowerCase() === word.toLowerCase(),
        );
        if (matchingException) return matchingException;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
