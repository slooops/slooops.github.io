import { Component, Input, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-process-flow-tooltip',
  templateUrl: './process-flow-tooltip.component.html',
  styleUrl: './process-flow-tooltip.component.css',
})
export class ProcessFlowTooltipComponent {
  @Input() totals$: Observable<{ [key: string]: number }>; // Combined totals observable
  totals: { [key: string]: number } = {}; // This will hold the actual totals once they are fetched
  objectKeys = Object.keys; // Helper to access object keys dynamically

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totals$']) {
      this.totals$.subscribe((data) => {
        this.totals = data; // Update the totals once they are fetched
      });
    }
  }

  // Helper method to access any of the totals (pre, auto, post)
  getTotal(key: string): number | string {
    return this.totals[key] || 'N/A';
  }
}
