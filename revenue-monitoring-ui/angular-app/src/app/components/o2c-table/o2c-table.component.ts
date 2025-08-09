import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-o2c-table',
  templateUrl: './o2c-table.component.html',
  styleUrls: ['./o2c-table.component.css'],
})
export class O2cTableComponent {
  @Input() displayedColumns: string[] = [];
  @Input() dataSource: MatTableDataSource<any> = new MatTableDataSource<any>(); // Accepts MatTableDataSource
  @Input() navigationMap: { [key: string]: string } = {};
  @Input() tableType: 'header' | 'body' | 'secondary' = 'body'; // Differentiating table types
  @Input() showHeaderRow: boolean = true;
  @Input() isLoading: boolean = false; // Add loading input

  constructor(private router: Router) {}

  trackByColumn(index: number, column: string): string {
    return column;
  }

  get shouldShowTable(): boolean {
    return (
      !this.isLoading &&
      this.dataSource?.data?.length > 0 &&
      this.displayedColumns?.length > 0
    );
  }

  get shouldShowNoData(): boolean {
    return (
      !this.isLoading &&
      (!this.dataSource?.data?.length || !this.displayedColumns?.length)
    );
  }

  isNavigableColumn(column: string): boolean {
    return this.navigationMap[column] !== undefined;
  }

  navigateToRoute(column: string, value: string | number) {
    const route = this.navigationMap[column];

    if (route) {
      if (route.startsWith('http')) {
        window.open(route, '_blank');
      } else {
        const queryParams: any = {}; // Initialize query params object

        // If navigating to the Subscription page, use `subRefId`, otherwise use `id`
        if (route === '/o2c-sub') {
          queryParams.subRefId = value;
        } else {
          queryParams.id = value;
        }

        this.router.navigate([route], { queryParams });
        console.log(`Navigating to ${route} with params:`, queryParams);
      }
    } else {
      console.warn(`No navigation path found for: ${column}`);
    }
  }

  formatColumnName(column: string): string {
    const acronyms = [
      'id',
      'irn',
      'uuid',
      'cm',
      'sftp',
      'b2b',
      'srt',
      'e-del',
      'irn/uuid',
      'ar',
      'usp',
      '(usd)',
      'sku',
      'qty',
      'tsv',
      'gl',
      'usd',
    ];

    const name = column.replace(/_/g, ' ').toLowerCase();
    return name
      .split(' ')
      .map((word) => {
        // If the word is in the list of acronyms, return it in uppercase
        if (acronyms.includes(word)) {
          return word.toUpperCase();
        }
        // Otherwise, capitalize only the first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  isDateValue(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // ISO 8601 date pattern (like 2025-08-08T07:00:00.000+00:00)
    const isoDatePattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;

    // Check if it matches the pattern and is a valid date
    if (isoDatePattern.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    return false;
  }

  // Add this method to format dates
  formatDateValue(value: string): string {
    try {
      const date = new Date(value);

      // Format as MM/DD/YYYY or customize as needed
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        // Uncomment below to include time
        // hour: '2-digit',
        // minute: '2-digit',
        // timeZone: 'UTC'
      });
    } catch (error) {
      console.warn('Error formatting date:', value, error);
      return value; // Return original value if formatting fails
    }
  }

  // Add this method to detect if a column should be treated as currency
  isCurrencyColumn(column: string): boolean {
    return column.toUpperCase().includes('USD');
  }

  // Add this method to format currency values
  formatCurrencyValue(value: any): string {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    // Convert to number if it's a string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    // Check if it's a valid number
    if (isNaN(numericValue)) {
      return value; // Return original value if not a valid number
    }

    // Format as currency
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue);
    } catch (error) {
      console.warn('Error formatting currency:', value, error);
      return value;
    }
  }

  // Update the getDisplayValue method to handle both dates and currency
  getDisplayValue(column: string, value: any): string {
    if (this.isDateValue(value)) {
      return this.formatDateValue(value);
    }

    if (this.isCurrencyColumn(column)) {
      return this.formatCurrencyValue(value);
    }

    return value;
  }
}
