import { Component, Input } from '@angular/core';
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
  @Input() wideColumns: string[] = [];
  @Input() extraWideColumns: string[] = []; // New extra-wide column support
  @Input() navigationMap: { [key: string]: string } = {};
  @Input() tableType: 'header' | 'body' | 'secondary' = 'body'; // Differentiating table types

  constructor(private router: Router) {}

  isWideColumn(column: string): boolean {
    return this.wideColumns.includes(column);
  }

  isExtraWideColumn(column: string): boolean {
    return this.extraWideColumns.includes(column);
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

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}
