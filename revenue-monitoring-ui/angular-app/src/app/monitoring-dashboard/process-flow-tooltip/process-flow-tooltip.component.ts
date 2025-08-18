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
})
export class ProcessFlowTooltipComponent implements OnInit, OnChanges {
  @Input() processFlowTotals: any[] = [];

  processSteps: any[] = [];
  containerWidth: number = 140; // Base width for a single circle

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

    // Sort by numeric prefix if available
    return [...this.processFlowTotals];
    // .sort((a, b) => {
    //   const aMatch = a.PROCESS_FLOW?.match(/^(\d+)/);
    //   const bMatch = b.PROCESS_FLOW?.match(/^(\d+)/);

    //   if (aMatch && bMatch) {
    //     return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
    //   }

    //   // Fallback to alphabetical sorting
    //   return (a.PROCESS_FLOW || '').localeCompare(b.PROCESS_FLOW || '');
    // });
  }

  calculateContainerWidth(): void {
    const stepCount = this.processSteps.length || 1;
    this.containerWidth = 150 + (stepCount - 1) * 140;
  }

  formatLabel(label: string): string {
    if (!label) return '';

    return label;
    // const formattedLabel = label.replace(/^\d+\s*-\s*/, '');

    // return formattedLabel
    //   .split(' ')
    //   .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    //   .join(' ');
  }

  formatAmount(amount: any): string {
    if (amount === undefined || amount === null) return 'N/A';

    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }
}
