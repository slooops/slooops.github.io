import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

@Component({
    selector: 'app-process-flow-tooltip',
    templateUrl: './process-flow-tooltip.component.html',
    styleUrl: './process-flow-tooltip.component.css',
    standalone: false
})
export class ProcessFlowTooltipComponent implements OnInit, OnChanges {
  @Input() processFlowTotals: any[] = [];

  processSteps: any[] = [];
  containerWidth: number = 140;

  constructor() {}

  ngOnInit() {
    this.processSteps = this.sortProcessSteps();
    this.calculateContainerWidth();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['processFlowTotals']) {
      this.processSteps = this.sortProcessSteps();
      this.calculateContainerWidth();
    }
  }

  sortProcessSteps(): any[] {
    if (!this.processFlowTotals || !Array.isArray(this.processFlowTotals)) {
      return [];
    }
    return [...this.processFlowTotals];
  }

  calculateContainerWidth(): void {
    const stepCount = this.processSteps.length || 1;
    this.containerWidth = 150 + (stepCount - 1) * 140;
  }

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
