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
import { Chart } from 'chart.js/auto';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ThemeService } from 'src/app/providers/theme.service';
import { LoadingSymbolComponent } from 'src/app/loading-symbol/loading-symbol.component';

@Component({
  selector: 'app-accuracy-detail-modal',
  templateUrl: './accuracy-detail-modal.component.html',
  styleUrl: './accuracy-detail-modal.component.css',
  standalone: true,
  imports: [CommonModule, ModalComponent, LoadingSymbolComponent],
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

  private categoryChart: any = null;
  private coreIssueChart: any = null;

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

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  switchTab(tab: 'category' | 'coreIssue'): void {
    this.activeTab = tab;
    setTimeout(() => this.buildActiveChart(), 50);
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
          if (this.activeTab === 'category') {
            setTimeout(() => this.buildCategoryChart(), 50);
          }
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
          if (this.activeTab === 'coreIssue') {
            setTimeout(() => this.buildCoreIssueChart(), 50);
          }
        },
        error: () => {
          this.coreIssueLoading = false;
        },
      });
  }

  private buildActiveChart(): void {
    if (this.activeTab === 'category') {
      this.buildCategoryChart();
    } else {
      this.buildCoreIssueChart();
    }
  }

  private destroyCharts(): void {
    this.categoryChart?.destroy();
    this.categoryChart = null;
    this.coreIssueChart?.destroy();
    this.coreIssueChart = null;
  }

  private buildCategoryChart(): void {
    this.categoryChart?.destroy();
    const canvas = document.getElementById(
      'modal-category-chart',
    ) as HTMLCanvasElement;
    if (!canvas || !this.categoryData.length) return;

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

    this.categoryChart = this.buildComboChart(
      canvas,
      labels,
      totals,
      accuracies,
      validationRates,
    );
  }

  private buildCoreIssueChart(): void {
    this.coreIssueChart?.destroy();
    const canvas = document.getElementById(
      'modal-core-issue-chart',
    ) as HTMLCanvasElement;
    if (!canvas || !this.coreIssueData.length) return;

    // Take only the top 10 by case count (data is already sorted by total DESC)
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

    this.coreIssueChart = this.buildComboChart(
      canvas,
      labels,
      totals,
      accuracies,
      validationRates,
    );
  }

  private buildComboChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    totals: number[],
    accuracies: number[],
    validationRates: number[] = [],
  ): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line' as const,
            label: 'Accuracy Rate',
            data: accuracies,
            borderColor: '#00bceb',
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#00bceb',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5.5,
            tension: 0.4,
            fill: true,
            backgroundColor: (ctx: any) => {
              const chart = ctx.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(0, 188, 235, 0.1)';
              const gradient = canvasCtx.createLinearGradient(
                chartArea.left,
                0,
                chartArea.right,
                0,
              );
              gradient.addColorStop(0, 'rgba(0, 188, 235, 0)');
              gradient.addColorStop(1, 'rgba(0, 188, 235, 0.35)');
              return gradient;
            },
            xAxisID: 'xAccuracy',
            indexAxis: 'y' as const,
            order: 0,
          },
          {
            type: 'line' as const,
            label: 'Validation Rate',
            data: validationRates,
            borderColor: '#6ebe4a',
            borderWidth: 2.5,
            borderDash: [5, 3],
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#6ebe4a',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5.5,
            tension: 0.4,
            fill: false,
            xAxisID: 'xAccuracy',
            indexAxis: 'y' as const,
            order: 0,
          },
          {
            type: 'bar' as const,
            label: 'Cases',
            data: totals,
            backgroundColor: 'rgba(100, 120, 140, 0.45)',
            hoverBackgroundColor: 'rgba(100, 120, 140, 0.65)',
            borderWidth: 0,
            borderRadius: 4,
            xAxisID: 'x',
            order: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 6, bottom: 6, left: 6, right: 6 } },
        interaction: { intersect: false, mode: 'nearest', axis: 'y' },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
              font: { size: 10 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(20, 30, 40, 0.9)',
            titleFont: { size: 11 },
            bodyFont: { size: 12 },
            borderColor: 'rgba(0, 188, 235, 0.3)',
            borderWidth: 1,
            cornerRadius: 10,
            padding: 10,
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 0) return `Accuracy: ${ctx.parsed.x}%`;
                if (ctx.datasetIndex === 1)
                  return `Validation: ${ctx.parsed.x}%`;
                return `Cases: ${ctx.parsed.x.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            position: 'bottom',
            grid: { display: false },
            ticks: { font: { size: 10 }, maxTicksLimit: 6 },
            border: { display: false },
          },
          xAccuracy: {
            position: 'top',
            min: 0,
            max: 105,
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              callback: (val) => ((val as number) <= 100 ? val + '%' : ''),
              maxTicksLimit: 6,
              stepSize: 25,
            },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              callback: function (_value, index) {
                const lbl = labels[index] ?? '';
                return lbl.length > 28 ? lbl.substring(0, 26) + '…' : lbl;
              },
            },
            border: { display: false },
          },
        },
      },
    });
  }
}
