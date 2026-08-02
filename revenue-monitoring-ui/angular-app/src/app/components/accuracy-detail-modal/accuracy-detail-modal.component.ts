import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
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
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ThemeService } from 'src/app/providers/theme.service';
import { LoadingSymbolComponent } from 'src/app/loading-symbol/loading-symbol.component';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-accuracy-detail-modal',
  templateUrl: './accuracy-detail-modal.component.html',
  styleUrl: './accuracy-detail-modal.component.css',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    LoadingSymbolComponent,
    NgxEchartsDirective,
  ],
  providers: [provideEchartsCore({ echarts })],
})
export class AccuracyDetailModalComponent implements OnChanges, OnDestroy {
  @Input() teamName = '';
  @Input() teamAccuracy: number | null = null;
  @Input() fiscQtr = '';
  @Output() closeModal = new EventEmitter<void>();

  activeTab: 'category' | 'coreIssue' = 'category';
  categoryData: any[] = [];
  coreIssueData: any[] = [];
  categoryLoading = false;
  coreIssueLoading = false;

  categoryChartOptions: EChartsOption = {};
  coreIssueChartOptions: EChartsOption = {};

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    public themeService: ThemeService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('teamName' in changes && this.teamName) {
      this.fetchData();
    }
  }

  ngOnDestroy(): void {}

  switchTab(tab: 'category' | 'coreIssue'): void {
    this.activeTab = tab;
  }

  private fetchData(): void {
    const base = 'caseiq/charts';
    this.categoryLoading = true;
    this.coreIssueLoading = true;

    const qp = this.fiscQtr
      ? `&fiscQtr=${encodeURIComponent(this.fiscQtr)}`
      : '';

    this.http
      .get(
        `${base}/team-category-accuracy?teamName=${encodeURIComponent(this.teamName)}&lookbackDays=90${qp}`,
        this.destroyManager,
      )
      .subscribe({
        next: (d: any) => {
          this.categoryData = d ?? [];
          this.categoryLoading = false;
          this.buildCategoryChart();
        },
        error: () => {
          this.categoryLoading = false;
        },
      });

    this.http
      .get(
        `${base}/team-core-issue-accuracy?teamName=${encodeURIComponent(this.teamName)}&lookbackDays=90${qp}`,
        this.destroyManager,
      )
      .subscribe({
        next: (d: any) => {
          this.coreIssueData = d ?? [];
          this.coreIssueLoading = false;
          this.buildCoreIssueChart();
        },
        error: () => {
          this.coreIssueLoading = false;
        },
      });
  }

  private buildCategoryChart(): void {
    if (!this.categoryData.length) return;
    const data = this.categoryData;
    const labels = data.map((d: any) => d.CATEGORY ?? 'Unknown');
    const totals = data.map((d: any) => d.TOTAL ?? 0);
    const accuracies = data.map((d: any) => {
      const validated = d.VALIDATED ?? 0;
      const correct = d.CORRECT ?? 0;
      return validated > 0 ? Math.round((correct / validated) * 1000) / 10 : 0;
    });
    const validationRates = data.map((d: any) => {
      const total = d.TOTAL ?? 0;
      const validated = d.VALIDATED ?? 0;
      return total > 0 ? Math.round((validated / total) * 1000) / 10 : 0;
    });
    this.categoryChartOptions = this.buildComboOptions(
      labels,
      totals,
      accuracies,
      validationRates,
    );
  }

  private buildCoreIssueChart(): void {
    if (!this.coreIssueData.length) return;
    const data = this.coreIssueData.slice(0, 10);
    const labels = data.map((d: any) => d.CORE_ISSUE ?? 'Unknown');
    const totals = data.map((d: any) => d.TOTAL ?? 0);
    const accuracies = data.map((d: any) => {
      const validated = d.VALIDATED ?? 0;
      const correct = d.CORRECT ?? 0;
      return validated > 0 ? Math.round((correct / validated) * 1000) / 10 : 0;
    });
    const validationRates = data.map((d: any) => {
      const total = d.TOTAL ?? 0;
      const validated = d.VALIDATED ?? 0;
      return total > 0 ? Math.round((validated / total) * 1000) / 10 : 0;
    });
    this.coreIssueChartOptions = this.buildComboOptions(
      labels,
      totals,
      accuracies,
      validationRates,
    );
  }

  private buildComboOptions(
    labels: string[],
    totals: number[],
    accuracies: number[],
    validationRates: number[],
  ): EChartsOption {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10 },
      },
      grid: { top: 30, right: 60, bottom: 40, left: 120, containLabel: false },
      yAxis: {
        type: 'category',
        data: labels.map((l) =>
          l.length > 28 ? l.substring(0, 26) + '\u2026' : l,
        ),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 10 },
        inverse: true,
      },
      xAxis: [
        {
          type: 'value',
          position: 'bottom',
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { fontSize: 10 },
        },
        {
          type: 'value',
          position: 'top',
          min: 0,
          max: 105,
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: {
            fontSize: 9,
            formatter: (v: number) => (v <= 100 ? v + '%' : ''),
          },
        },
      ],
      series: [
        {
          name: 'Cases',
          type: 'bar',
          data: totals,
          xAxisIndex: 0,
          itemStyle: { color: 'rgba(100, 120, 140, 0.45)', borderRadius: 4 },
          barMaxWidth: 20,
          z: 1,
        },
        {
          name: 'Accuracy Rate',
          type: 'line',
          data: accuracies,
          xAxisIndex: 1,
          lineStyle: { color: '#00bceb', width: 2.5 },
          itemStyle: { color: '#00bceb' },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
          z: 2,
        },
        {
          name: 'Validation Rate',
          type: 'line',
          data: validationRates,
          xAxisIndex: 1,
          lineStyle: { color: '#6ebe4a', width: 2.5, type: 'dashed' },
          itemStyle: { color: '#6ebe4a' },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
          z: 2,
        },
      ],
    };
  }
}
