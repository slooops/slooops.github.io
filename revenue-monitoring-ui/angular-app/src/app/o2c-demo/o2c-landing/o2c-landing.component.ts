import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-o2c-landing',
  templateUrl: './o2c-landing.component.html',
  styleUrls: ['./o2c-landing.component.css'],
})
export class O2cLandingComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}

  circleStatus: { [key: string]: number } = {
    Order: 0,
    Subscription: 0,
    Accruals: 0,
    Invoicing: 0,
    AR_Accounting: 0,
  };

  circleSteps: string[] = [];
  searchValue: string = '';
  noResults: boolean = false;

  // Search Mapping (User Input -> Route + QueryParam Name)
  searchMap: { [key: string]: { route: string; paramName: string } } = {
    '4910695': { route: '/o2c-accrual', paramName: 'accrualId' },
    '75947116': { route: '/o2c-order', paramName: 'dealId' },
    Sub1797786: { route: '/o2c-sub', paramName: 'subRefId' },
    Sub1797787: { route: '/o2c-sub', paramName: 'subRefId' },
  };
  searchEntries: MatTableDataSource<any> = new MatTableDataSource([]);

  // General Navigation Mapping (Columns and Circles)
  navigationMap: { [key: string]: string } = {
    SubRefId: '/o2c-sub',

    // Circle Navigation
    Order: '/o2c-order',
    Subscription: '/o2c-sub',
    Accruals: '/o2c-accrual',
    Invoicing: '/o2c-invoicing',
  };

  ngOnInit(): void {
    this.searchEntries = new MatTableDataSource(
      Object.entries(this.searchMap).map(([id, details]) => ({
        id,
        step: this.removeUnderscores(details.route.replace('/o2c-', '')),
        route: details.route,
        paramName: details.paramName,
      }))
    );
    this.route.queryParamMap.subscribe((params) => {
      this.noResults = params.get('noResults') === 'true';
    });
  }

  onSearch(): void {
    const searchKey = this.searchValue.trim();

    if (!searchKey) {
      this.router.navigate(['/o2c-landing']);
      console.log('Navigating to O2C Landing Page');
      return;
    }

    if (this.searchMap[searchKey]) {
      const { route, paramName } = this.searchMap[searchKey];
      this.router.navigate([route], {
        queryParams: { [paramName]: searchKey },
      });
      console.log(`Navigating to ${route} with ${paramName}: ${searchKey}`);
    } else {
      this.router.navigate(['/o2c-landing'], {
        queryParams: { noResults: 'true' },
      });
      console.warn('No matching route found for search:', searchKey);
    }
  }

  navigateToRoute(identifier: string, value: string | number) {
    const route = this.navigationMap[identifier];

    if (!route) {
      console.warn(`No route found for ${identifier}`);
      return;
    }

    if (route.startsWith('http')) {
      window.open(route, '_blank');
    } else {
      const paramName = this.searchMap[value]?.paramName || 'id';
      this.router.navigate([route], {
        queryParams: { [paramName]: value },
      });

      console.log(`Navigating to ${route} with ${paramName}: ${value}`);
    }
  }

  getCircleClass(step: string): string {
    const value = this.circleStatus[step];
    if (value === 2) return 'completed-circle';
    if (value === 1) return 'current-circle';
    return 'uncompleted-circle';
  }

  getSliderBarStyle(index: number): { [key: string]: string } {
    const step = this.circleSteps[index];
    const value = this.circleStatus[step];

    return {
      background:
        value === 1
          ? 'linear-gradient(to right, #16371e43, #08ace4, #16371e43)'
          : '#16371e43',
    };
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }

  onSearchEntryClick(entry: any) {
    this.router.navigate([entry.route], {
      queryParams: { [entry.paramName]: entry.id },
    });
    console.log(
      `Navigating to ${entry.route} with ${entry.paramName}: ${entry.id}`
    );
  }

  onSearchEntryKeyDown(event: KeyboardEvent, entry: any): void {
    // Implement the logic for handling keydown event
    console.log('Key down event:', event, 'Entry:', entry);
  }
}
