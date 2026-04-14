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
  @Input() totalIncidents = 0;
  @Input() successPct = 0;
  @Input() errorPct = 0;
  @Input() successCount = 0;
  @Input() errorCount = 0;
  @Input() showMeta = true;

  circumference = 2 * Math.PI * 62;
  successDasharray = `0 ${this.circumference}`;
  errorDasharray = `0 ${this.circumference}`;
  errorDashoffset = 0;
  successLabel = '0';
  errorLabel = '0';

  ngOnChanges(): void {
    const success = this.clampPercent(this.successPct);
    const error = this.clampPercent(this.errorPct);

    this.successLabel = this.formatPercent(success);
    this.errorLabel = this.formatPercent(error);

    const successLen = (success / 100) * this.circumference;
    const errorLen = (error / 100) * this.circumference;
    this.successDasharray = `${successLen} ${this.circumference - successLen}`;
    this.errorDasharray = `${errorLen} ${this.circumference - errorLen}`;
    this.errorDashoffset = -successLen;
  }

  private clampPercent(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  }

  private formatPercent(value: number): string {
    return Number(value.toFixed(1)).toString();
  }
}
