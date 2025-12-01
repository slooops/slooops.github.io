import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-o2c-card',
    templateUrl: './o2c-card.component.html',
    styleUrl: './o2c-card.component.css',
    standalone: false
})
export class O2cCardComponent {
  @Input() title: string = 'Title';
  @Input() count: number = 0;
  @Input() value: string | number = '0';
  @Input() footer: string = 'Footer Text';

  @Input() countDoubleWide?: number;
  @Input() valueDoubleWide?: string | number;
  @Input() footerDoubleWide?: string;

  get formattedValue(): string {
    return this.formatCardValue(this.value);
  }

  get formattedValueDoubleWide(): string {
    return this.formatCardValue(this.valueDoubleWide);
  }

  private formatCardValue(amount: string | number | undefined): string {
    if (!amount && amount !== 0) return '$0';

    const numericAmount =
      typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '$0';

    let value: string;
    let suffix: string = '';

    if (numericAmount >= 1_000_000_000) {
      // Billions
      const billions = numericAmount / 1_000_000_000;
      if (billions < 10) {
        value = billions.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (billions < 100) {
        value = billions.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = billions.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
      suffix = 'B';
    } else if (numericAmount >= 1_000_000) {
      // Millions
      const millions = numericAmount / 1_000_000;
      if (millions < 10) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (millions < 100) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else if (millions < 1000) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
      suffix = 'M';
    } else if (numericAmount >= 1_000) {
      // Thousands
      const thousands = numericAmount / 1_000;
      if (thousands < 10) {
        value = thousands.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (thousands < 100) {
        value = thousands.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = thousands.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
      suffix = 'K';
    } else {
      // Less than 1,000
      if (numericAmount < 10) {
        value = numericAmount.toLocaleString('en-US', {
          maximumFractionDigits: 2,
        });
      } else if (numericAmount < 100) {
        value = numericAmount.toLocaleString('en-US', {
          maximumFractionDigits: 1,
        });
      } else {
        value = numericAmount.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        });
      }
      suffix = '';
    }

    return `$${value}${suffix}`;
  }
}
