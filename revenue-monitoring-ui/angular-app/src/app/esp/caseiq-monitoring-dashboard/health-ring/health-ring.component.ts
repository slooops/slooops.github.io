import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-health-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-ring.component.html',
  styleUrls: ['./health-ring.component.css'],
})
export class HealthRingComponent implements OnChanges {
  @Input() score = 0;
  @Input() status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA';
  @Input() meta = '';

  strokeColor = '#8899a6';
  gradientStart = '#8899a6';
  gradientEnd = '#8899a6';
  circumference = 2 * Math.PI * 72;
  dashOffset = this.circumference;

  private colorMap: Record<string, [string, string]> = {
    HEALTHY: ['#b6e8a0', '#6ebe4a'],
    WARNING: ['#ffe082', '#e6a800'],
    CRITICAL: ['#ef9a9a', '#e53935'],
    NO_DATA: ['#cfd8dc', '#8899a6'],
  };

  ngOnChanges(): void {
    const [start, end] = this.colorMap[this.status] || this.colorMap['NO_DATA'];
    this.gradientStart = start;
    this.gradientEnd = end;
    this.strokeColor = end;
    const pct = Math.max(0, Math.min(100, this.score));
    this.dashOffset = this.circumference * (1 - pct / 100);
  }
}
