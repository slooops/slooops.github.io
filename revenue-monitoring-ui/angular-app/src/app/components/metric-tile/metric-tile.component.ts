import { Component, Input, Output, EventEmitter } from '@angular/core';

export type MetricStatus = 'high' | 'medium' | 'low';

@Component({
  selector: 'app-metric-tile',
  templateUrl: './metric-tile.component.html',
  styleUrls: ['./metric-tile.component.css'],
})
export class MetricTileComponent {
  @Input() name: string = '';
  @Input() percentage: number = 0;
  @Input() isActive: boolean = false;
  @Output() tileClick = new EventEmitter<string>();

  /**
   * Calculates the status based on percentage
   * High: 80% and above
   * Medium: 50-79%
   * Low: Below 50%
   */
  get status(): MetricStatus {
    if (this.percentage >= 80) {
      return 'high';
    } else if (this.percentage >= 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  getStatusClass(): string {
    switch (this.status) {
      case 'high':
        return 'status-high';
      case 'medium':
        return 'status-medium';
      case 'low':
        return 'status-low';
      default:
        return '';
    }
  }

  onTileClick(): void {
    this.tileClick.emit(this.name);
  }
}
