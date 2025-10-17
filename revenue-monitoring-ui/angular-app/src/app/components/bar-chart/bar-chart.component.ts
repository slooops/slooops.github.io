import {
  Component,
  Input,
  OnChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface StackedBarChartDataPoint {
  label: string;
  segments: {
    name: string;
    value: number;
    color?: string;
  }[];
}

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css',
})
export class BarChartComponent implements OnChanges, AfterViewInit {
  @ViewChild('barCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() data: BarChartDataPoint[] | StackedBarChartDataPoint[] = [];
  @Input() canvasId: string = 'barCanvas';
  @Input() isLoading: boolean = false;
  @Input() stacked: boolean = false;
  @Input() chartWidth: number | string = '100%';
  @Input() chartHeight: number | string = 300;
  @Input() noDataMessage: string = 'No data available';
  @Input() labelRotation: number = 0; // Rotation angle in degrees (0 = horizontal, 45 = 45°, 90 = vertical)

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private actualWidth = 0;
  private actualHeight = 0;

  // Color palette similar to donut chart
  private readonly defaultColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#C9CBCF',
    '#4BC0C0',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
  ];

  ngAfterViewInit(): void {
    this.initializeCanvas();
    if (this.data.length > 0) {
      this.drawChart();
    }
  }

  ngOnChanges(): void {
    if (this.canvas && this.ctx) {
      this.drawChart();
    }
  }

  private initializeCanvas(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.canvas.id = this.canvasId;

    // Get the container dimensions for responsive sizing
    const container = this.canvas.parentElement;
    if (container) {
      // Set CSS width/height for responsive behavior
      if (typeof this.chartWidth === 'string') {
        this.canvas.style.width = this.chartWidth;
        this.actualWidth = container.clientWidth || 350;
      } else {
        this.canvas.style.width = this.chartWidth + 'px';
        this.actualWidth = this.chartWidth;
      }

      if (typeof this.chartHeight === 'string') {
        this.canvas.style.height = this.chartHeight;
        this.actualHeight = parseInt(this.chartHeight) || 300;
      } else {
        this.canvas.style.height = this.chartHeight + 'px';
        this.actualHeight = this.chartHeight;
      }
    } else {
      // Fallback values if no container
      this.actualWidth =
        typeof this.chartWidth === 'number' ? this.chartWidth : 350;
      this.actualHeight =
        typeof this.chartHeight === 'number' ? this.chartHeight : 300;
    }

    // Handle high-DPI displays (Retina, etc.)
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set canvas internal dimensions (for drawing) - scaled for high-DPI
    this.canvas.width = this.actualWidth * devicePixelRatio;
    this.canvas.height = this.actualHeight * devicePixelRatio;

    // Scale the canvas back down using CSS to maintain proper display size
    this.canvas.style.width = this.actualWidth + 'px';
    this.canvas.style.height = this.actualHeight + 'px';

    const context = this.canvas.getContext('2d');
    if (context) {
      this.ctx = context;
      // Scale the drawing context to match the device pixel ratio
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }
  }

  private drawChart(): void {
    if (!this.ctx || this.isLoading) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.actualWidth, this.actualHeight);

    if (this.data.length === 0) {
      this.drawNoDataMessage();
      return;
    }

    if (this.stacked) {
      this.drawStackedBarChart();
    } else {
      this.drawSimpleBarChart();
    }
  }

  private drawSimpleBarChart(): void {
    const data = this.data as BarChartDataPoint[];
    const maxValue = Math.max(...data.map((d) => d.value));
    const effectiveRotation = this.shouldRotateLabels();
    const padding = this.calculateDynamicPadding(effectiveRotation);

    const chartArea = {
      x: padding.left,
      y: padding.top,
      width: this.actualWidth - padding.left - padding.right,
      height: this.actualHeight - padding.top - padding.bottom,
    };

    const barWidth = (chartArea.width / data.length) * 0.8;
    const barSpacing = (chartArea.width / data.length) * 0.2;

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartArea.height;
      const x = chartArea.x + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = chartArea.y + chartArea.height - barHeight;

      // Draw bar
      this.ctx.fillStyle =
        item.color || this.defaultColors[index % this.defaultColors.length];
      this.ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      this.ctx.fillStyle = '#333';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);

      // Draw label below bar with rotation
      this.ctx.fillStyle = '#333';
      this.ctx.font = '12px Arial';

      if (effectiveRotation === 0) {
        // No rotation - standard horizontal text
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          item.label,
          x + barWidth / 2,
          chartArea.y + chartArea.height + 20
        );
      } else {
        // Rotated text - adjust text alignment and position based on rotation
        if (effectiveRotation > 0) {
          this.ctx.textAlign = 'left';
        } else {
          this.ctx.textAlign = 'right';
        }

        const labelX = x + barWidth / 2;
        const labelY = chartArea.y + chartArea.height + 15;
        this.drawRotatedText(item.label, labelX, labelY, effectiveRotation);
      }
    });
  }

  private drawStackedBarChart(): void {
    const data = this.data as StackedBarChartDataPoint[];
    const maxValue = Math.max(
      ...data.map((d) =>
        d.segments.reduce((sum, segment) => sum + segment.value, 0)
      )
    );

    const effectiveRotation = this.shouldRotateLabels();
    const padding = this.calculateDynamicPadding(effectiveRotation);

    const chartArea = {
      x: padding.left,
      y: padding.top,
      width: this.actualWidth - padding.left - padding.right,
      height: this.actualHeight - padding.top - padding.bottom,
    };

    const barWidth = (chartArea.width / data.length) * 0.8;
    const barSpacing = (chartArea.width / data.length) * 0.2;

    data.forEach((item, index) => {
      const totalValue = item.segments.reduce(
        (sum, segment) => sum + segment.value,
        0
      );
      const x = chartArea.x + index * (barWidth + barSpacing) + barSpacing / 2;

      let currentY = chartArea.y + chartArea.height;

      // Draw each segment of the stacked bar
      item.segments.forEach((segment, segmentIndex) => {
        const segmentHeight = (segment.value / maxValue) * chartArea.height;
        currentY -= segmentHeight;

        this.ctx.fillStyle =
          segment.color ||
          this.defaultColors[segmentIndex % this.defaultColors.length];
        this.ctx.fillRect(x, currentY, barWidth, segmentHeight);

        // Draw segment value if segment is large enough
        if (segmentHeight > 20) {
          this.ctx.fillStyle = '#fff';
          this.ctx.font = '10px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
            segment.value.toString(),
            x + barWidth / 2,
            currentY + segmentHeight / 2 + 3
          );
        }
      });

      // Draw total value on top of bar
      this.ctx.fillStyle = '#333';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(totalValue.toString(), x + barWidth / 2, currentY - 5);

      // Draw label below bar with rotation
      this.ctx.fillStyle = '#333';
      this.ctx.font = '12px Arial';

      if (effectiveRotation === 0) {
        // No rotation - standard horizontal text
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          item.label,
          x + barWidth / 2,
          chartArea.y + chartArea.height + 20
        );
      } else {
        // Rotated text - adjust text alignment and position based on rotation
        if (effectiveRotation > 0) {
          this.ctx.textAlign = 'left';
        } else {
          this.ctx.textAlign = 'right';
        }

        const labelX = x + barWidth / 2;
        const labelY = chartArea.y + chartArea.height + 15;
        this.drawRotatedText(item.label, labelX, labelY, effectiveRotation);
      }
    });
  }

  private drawNoDataMessage(): void {
    this.ctx.fillStyle = '#666';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.noDataMessage,
      this.actualWidth / 2,
      this.actualHeight / 2
    );
  }

  private drawRotatedText(
    text: string,
    x: number,
    y: number,
    rotation: number
  ): void {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate((rotation * Math.PI) / 180);
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
  }

  private shouldRotateLabels(): number {
    // If labelRotation is explicitly set, use that
    if (this.labelRotation !== 0) {
      return this.labelRotation;
    }

    // Auto-determine rotation based on data density and label length
    const dataCount = this.data.length;
    const availableWidth = this.actualWidth - 80; // Account for padding
    const avgWidthPerBar = availableWidth / dataCount;

    // Estimate average label width (rough calculation)
    const avgLabelLength =
      this.data.reduce(
        (sum, item) =>
          sum +
          (typeof item === 'object' && 'label' in item ? item.label.length : 0),
        0
      ) / dataCount;
    const estimatedLabelWidth = avgLabelLength * 8; // Rough estimate: 8px per character

    // If labels would overlap significantly, rotate them
    if (estimatedLabelWidth > avgWidthPerBar * 0.8) {
      if (dataCount > 8) {
        return 45; // 45-degree rotation for dense data
      } else if (dataCount > 4) {
        return 30; // 30-degree rotation for moderately dense data
      }
    }

    return 0; // No rotation needed
  }

  private calculateDynamicPadding(rotation: number): {
    top: number;
    bottom: number;
    left: number;
    right: number;
  } {
    const basePadding = 40;

    // Calculate additional bottom padding needed for rotated labels
    let bottomPadding = basePadding;

    if (rotation !== 0) {
      // Estimate the longest label length
      const maxLabelLength = Math.max(
        ...this.data.map((item) =>
          typeof item === 'object' && 'label' in item ? item.label.length : 0
        )
      );

      // Calculate approximate label width in pixels
      const labelWidth = maxLabelLength * 8; // 8px per character estimate

      // Calculate how much extra vertical space rotated text needs
      const rotationRadians = (Math.abs(rotation) * Math.PI) / 180;
      const extraHeight = labelWidth * Math.sin(rotationRadians);

      // Add extra padding, with a minimum and maximum
      bottomPadding = Math.max(
        basePadding + extraHeight + 10,
        basePadding + 20
      );
      bottomPadding = Math.min(bottomPadding, basePadding + 60); // Cap at reasonable limit
    }

    return {
      top: basePadding,
      bottom: bottomPadding,
      left: basePadding,
      right: basePadding,
    };
  }
}
