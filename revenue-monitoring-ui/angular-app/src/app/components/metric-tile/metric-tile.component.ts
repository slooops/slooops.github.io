import { Component, Input, Output, EventEmitter } from '@angular/core';

export type MetricStatus = 'high' | 'medium' | 'low';

@Component({
  selector: 'app-metric-tile',
  templateUrl: './metric-tile.component.html',
  styleUrls: ['./metric-tile.component.css'],
})
export class MetricTileComponent {
  @Input() name: string = '';
  @Input() percentage: number | string = 0;
  @Input() isActive: boolean = false;
  @Input() isAccessible: boolean = true;
  @Output() tileClick = new EventEmitter<string>();

  /**
   * Gets the numeric value for calculations
   * Returns 0 for '-' or non-numeric values
   */
  get numericPercentage(): number {
    if (typeof this.percentage === 'string' && this.percentage === '-') {
      return 0;
    }
    return typeof this.percentage === 'number'
      ? this.percentage
      : parseFloat(this.percentage) || 0;
  }

  /**
   * Gets the display value
   * Returns '-' for missing data or the percentage with % symbol
   */
  get displayValue(): string {
    if (typeof this.percentage === 'string' && this.percentage === '-') {
      return '-';
    }
    return `${this.numericPercentage}%`;
  }

  /**
   * Calculates the status based on percentage
   * Missing data ('-'): Medium (grey)
   * High: 80% and above
   * Medium: 50-79%
   * Low: Below 50%
   */
  get status(): MetricStatus {
    // Handle missing data case first
    if (typeof this.percentage === 'string' && this.percentage === '-') {
      return 'medium';
    }

    const value = this.numericPercentage;
    // if (value >= 80) {
    //   return 'high';
    // } else if (value >= 50) {
    //   return 'medium';
    // } else {
    //   return 'low';
    // }
    return 'high';
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

  get isClickable(): boolean {
    return this.name !== 'Overall' && this.isAccessible;
  }

  onTileClick(): void {
    if (this.isClickable) {
      this.tileClick.emit(this.name);
    }
  }
}
