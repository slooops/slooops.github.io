import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { Chart } from 'chart.js';
import { CommonModule } from '@angular/common';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';

@Component({
  selector: 'app-o2c-donut',
  templateUrl: './o2c-donut.component.html',
  styleUrl: './o2c-donut.component.css',
  imports: [
    CommonModule,
    // LoadingSymbolComponent
  ],
  standalone: true,
})
export class O2cDonutComponent implements OnChanges, OnDestroy {
  @Input() data: {
    INCIDENT_TYPE: string;
    INCIDENT_COUNT: number;
    INCIDENT_VALUE: number;
  }[] = [];

  @Input() canvasId: string = 'donutCanvas';
  @Input() isLoading?: boolean = false; // Add explicit loading state
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

  private chart: any = null;
  private animationFrame: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['isLoading']) {
      // Use the explicit loading state from parent
      if (this.isLoading) {
        // Still loading - show loading state
        this.hasReceivedData = false;
        return;
      }

      // Not loading anymore - we have final data (empty or populated)
      this.hasReceivedData = true;

      if (this.data && this.data.length > 0) {
        setTimeout(() => {
          this.renderPieChart(this.data, this.canvasId);
        }, 0);
      } else {
        this.legendItems = [];
        this.clearCanvas();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private destroyChart(): void {
    // Cancel any pending animation frames
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Properly destroy Chart.js instance
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Clear canvas context
    this.clearCanvas();
  }

  // Helper method to clear canvas
  private clearCanvas(): void {
    const canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  // Getter for template logic
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
    canvasId: string
  ): void {
    // Destroy existing chart first
    this.destroyChart();

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    const formattedTotalValue = this.formatValueForDonutCenter(totalValue);
    const formattedTotalCount = totalCount ? `#${totalCount}` : '';

    if (ctx) {
      this.chart = new Chart(ctx, {
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
          animation: false,
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
