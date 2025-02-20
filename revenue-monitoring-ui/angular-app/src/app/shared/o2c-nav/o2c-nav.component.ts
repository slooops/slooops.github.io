import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-nav',
  templateUrl: './o2c-nav.component.html',
  styleUrls: ['./o2c-nav.component.css'],
})
export class O2cNavComponent {
  constructor(private router: Router) {}

  goToO2cHome() {
    this.router.navigate(['/o2c-landing'], {});
  }

  searchValue: string = ''; // Store input value

  // Mapping search values to their respective pages
  searchMap: { [key: string]: { route: string; paramName: string } } = {
    '4910695': { route: '/o2c-accrual', paramName: 'accrualId' },
    '75947116': { route: '/o2c-order', paramName: 'dealId' },
    Sub1797786: { route: '/o2c-sub', paramName: 'subRefId' },
    Sub1797787: { route: '/o2c-sub', paramName: 'subRefId' },
  };

  onSearch(): void {
    const searchKey = this.searchValue.trim();
    if (this.searchMap[searchKey]) {
      const { route, paramName } = this.searchMap[searchKey];
      this.router.navigate([route], {
        queryParams: { [paramName]: searchKey },
      });
      console.log(`Navigating to ${route} with ${paramName}: ${searchKey}`);
    } else {
      console.warn('No matching route found for search:', searchKey);
    }
  }
}
