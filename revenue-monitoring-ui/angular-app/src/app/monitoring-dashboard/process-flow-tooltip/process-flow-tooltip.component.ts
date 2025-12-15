import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-process-flow-tooltip',
  templateUrl: './process-flow-tooltip.component.html',
  styleUrl: './process-flow-tooltip.component.css',
})
export class ProcessFlowTooltipComponent {
  processFlowTotals = input<any[]>([]);

  processSteps = computed(() => {
    const totals = this.processFlowTotals();
    if (!totals || !Array.isArray(totals)) {
      return [];
    }
    return [...totals];
  });

  containerWidth = computed(() => {
    const stepCount = this.processSteps().length || 1;
    return 150 + (stepCount - 1) * 140;
  });

  formatLabel(label: string): string {
    if (!label) return '';

    return label;
  }

  formatAmount(amount: any): string {
    if (amount === undefined || amount === null) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }
}
