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
  circumference = 2 * Math.PI * 72;
  dashOffset = this.circumference;

  private colorMap: Record<string, string> = {
    HEALTHY: '#00c853',
    WARNING: '#ffd600',
    CRITICAL: '#ff1744',
    NO_DATA: '#8899a6',
  };

  ngOnChanges(): void {
    this.strokeColor = this.colorMap[this.status] || this.colorMap['NO_DATA'];
    const pct = Math.max(0, Math.min(100, this.score));
    this.dashOffset = this.circumference * (1 - pct / 100);
  }
}
