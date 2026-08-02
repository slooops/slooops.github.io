import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

@Component({
  selector: 'app-o2c-donut',
  templateUrl: './o2c-donut.component.html',
  styleUrl: './o2c-donut.component.css',
  imports: [CommonModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  standalone: true,
})
export class O2cDonutComponent implements OnChanges, OnDestroy {
  @Input() data: {
    INCIDENT_TYPE: string;
    INCIDENT_COUNT: number;
    INCIDENT_VALUE: number;
  }[] = [];

  @Input() canvasId: string = 'donutCanvas';
  @Input() isLoading?: boolean = false;
  @Input() showCircleBackground?: boolean = true;
  @Input() showLegend?: boolean = true;
  @Input() chartSize?: string = '125px';
  @Input() noDataMessage: string = 'No exceptions found';

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

  hasReceivedData: boolean = false;
  chartOptions: EChartsOption = {};

  private readonly pieColors = [
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['isLoading']) {
      if (this.isLoading) {
        this.hasReceivedData = false;
        return;
      }
      this.hasReceivedData = true;
      if (this.data && this.data.length > 0) {
        this.renderPieChart(this.data, this.canvasId);
      } else {
        this.legendItems = [];
        this.chartOptions = {};
      }
    }
  }

  ngOnDestroy(): void {}

  get showLoadingState(): boolean {
    return this.isLoading;
  }

  get showNoDataState(): boolean {
    return (
      !this.isLoading &&
      this.hasReceivedData &&
      (!this.data || this.data.length === 0)
    );
  }

  get showChartAndLegend(): boolean {
    return (
      !this.isLoading &&
      this.hasReceivedData &&
      this.data &&
      this.data.length > 0
    );
  }

  private formatValueForDonutCenter(amount: number): string {
    let value: string;
    let suffix: string = '';

    if (amount >= 1_000_000_000) {
      // Billions
      const billions = amount / 1_000_000_000;
      if (billions < 10) {
        value = billions.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (billions < 100) {
        value = billions.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = billions.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
      suffix = 'B';
    } else if (amount >= 1_000_000) {
      // Millions
      const millions = amount / 1_000_000;
      if (millions < 10) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (millions < 100) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else if (millions < 1000) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
      suffix = 'M';
    } else if (amount >= 1_000) {
      // Thousands
      const thousands = amount / 1_000;
      if (thousands < 10) {
        value = thousands.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (thousands < 100) {
        value = thousands.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = thousands.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
      suffix = 'K';
    } else {
      // Less than 1,000
      if (amount < 10) {
        value = amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (amount < 100) {
        value = amount.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
      suffix = '';
    }

    return `$${value}${suffix}`;
  }

  renderPieChart(
    data: {
      INCIDENT_TYPE: string;
      INCIDENT_COUNT: number;
      INCIDENT_VALUE: number;
    }[],
    canvasId: string,
  ): void {
    const pieColors = this.pieColors;
    const colors = data.map((_, index) => pieColors[index % pieColors.length]);

    const totalCount = data.reduce((sum, e) => {
      const count = e.INCIDENT_COUNT;
      return sum + (count !== undefined && count !== null ? count : 0);
    }, 0);

    const totalValue = data.reduce(
      (sum, e) => sum + (e.INCIDENT_VALUE || 0),
      0,
    );

    const formattedTotalValue = this.formatValueForDonutCenter(totalValue);
    const formattedTotalCount = totalCount ? `#${totalCount}` : '';

    this.chartOptions = {
      tooltip: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['70%', '100%'],
          avoidLabelOverlap: false,
          silent: true,
          animation: false,
          label: {
            show: true,
            position: 'center',
            formatter: `{value|${formattedTotalValue}}\n{count|${formattedTotalCount}}`,
            rich: {
              value: {
                fontSize: 16,
                fontWeight: 600 as any,
                fontFamily: 'Inter, sans-serif',
                color: '#333',
                lineHeight: 20,
              },
              count: {
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                color: '#666',
                lineHeight: 18,
              },
            },
          },
          labelLine: { show: false },
          itemStyle: { borderWidth: 0 },
          data: data.map((entry, i) => ({
            value: entry.INCIDENT_VALUE,
            name: entry.INCIDENT_TYPE,
            itemStyle: { color: colors[i] },
          })),
        },
      ],
    };

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
  }
}
