import {
  Component,
  Input,
  OnChanges,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css'],
})
export class LineChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() points: { label: string; value: number }[] = [];
  @Input() lineColor = '#00bceb';
  @Input() fillColor = '#00bceb';
  @Input() labelInterval = 2;
  @Input() formatLabel: ((raw: string) => string) | null = null;

  // Computed SVG data
  viewBox = '0 0 300 250';
  linePath = '';
  areaPath = '';
  yTicks: { value: number; y: number }[] = [];
  dots: { x: number; y: number; label: string; value: number }[] = [];
  gradientId = `lcFill${Math.random().toString(36).slice(2, 8)}`;

  svgW = 300;
  svgH = 250;
  chartH = 200;
  chartTop = 10;
  pad = 15;

  // Tooltip
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipLabel = '';
  tooltipValue = 0;

  private ro?: ResizeObserver;

  constructor(private elRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.ro = new ResizeObserver(() => this.recalc());
    this.ro.observe(this.elRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  ngOnChanges(): void {
    this.recalc();
  }

  private recalc(): void {
    const el = this.elRef.nativeElement as HTMLElement;
    const w = el.offsetWidth || 300;
    const h = el.offsetHeight || 250;

    // Keep a roughly proportional viewBox with min 200h
    this.svgW = Math.max(w, 200);
    this.svgH = Math.max(h, 150);
    this.chartTop = 10;
    this.chartH = this.svgH - 50 - this.chartTop; // reserve 50 for x-labels, chartTop for top padding
    this.pad = Math.max(15, this.svgW * 0.05);
    this.viewBox = `0 0 ${this.svgW} ${this.svgH}`;

    const n = this.points.length;
    if (n < 2) {
      this.linePath = '';
      this.areaPath = '';
      this.dots = [];
      this.yTicks = [];
      return;
    }

    const maxVal = Math.max(...this.points.map((p) => p.value), 1);
    const step = Math.ceil(maxVal / 3);
    const yMax = step * 3;

    // Y-axis ticks
    this.yTicks = [0, 1, 2, 3].map((i) => ({
      value: step * i,
      y: this.chartTop + this.chartH - (this.chartH * (step * i)) / yMax,
    }));

    // Data points
    const plotW = this.svgW - 2 * this.pad;
    this.dots = this.points.map((p, i) => ({
      x: this.pad + (i / (n - 1)) * plotW,
      y: this.chartTop + this.chartH - (p.value / yMax) * this.chartH,
      label: this.formatLabel ? this.formatLabel(p.label) : p.label,
      value: p.value,
    }));

    // Smooth bezier path
    let line = `M${this.dots[0].x},${this.dots[0].y}`;
    for (let i = 0; i < this.dots.length - 1; i++) {
      const cp = (this.dots[i + 1].x - this.dots[i].x) / 3;
      line += ` C${this.dots[i].x + cp},${this.dots[i].y} ${this.dots[i + 1].x - cp},${this.dots[i + 1].y} ${this.dots[i + 1].x},${this.dots[i + 1].y}`;
    }
    this.linePath = line;
    this.areaPath = `${line} L${this.dots[n - 1].x},${this.chartTop + this.chartH} L${this.dots[0].x},${this.chartTop + this.chartH} Z`;
  }

  shouldShowLabel(index: number): boolean {
    return index % this.labelInterval === 0;
  }

  showTooltip(event: MouseEvent, dot: { label: string; value: number }): void {
    const rect = this.elRef.nativeElement.getBoundingClientRect();
    this.tooltipX = event.clientX - rect.left + 12;
    this.tooltipY = event.clientY - rect.top - 28;
    this.tooltipLabel = dot.label;
    this.tooltipValue = dot.value;
    this.tooltipVisible = true;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }
}
