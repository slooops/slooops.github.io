import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-landing',
  templateUrl: './o2c-landing.component.html',
  styleUrls: ['./o2c-landing.component.css'],
})
export class O2cLandingComponent {
  constructor(private router: Router) {}

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 2,
    Accruals: 2,
    Invoicing: 1,
    AR_Accounting: 0,
  };

  circleSteps: string[] = [];

  searchValue: string = '';

  searchMap: { [key: string]: { route: string; paramName: string } } = {
    '4910695': { route: '/o2c-accrual', paramName: 'accrualId' },
    '75947116': { route: '/o2c-order', paramName: 'dealId' },
    Sub1797786: { route: '/o2c-sub', paramName: 'subRefId' },
    Sub1797787: { route: '/o2c-sub', paramName: 'subRefId' },
  };

  ngOnInit(): void {
    this.circleSteps = Object.keys(this.circleStatus);
  }

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

  navigationMap: { [key: string]: string } = {
    // Column-based navigation
    SubRefId: 'o2c-sub',
    Deal_ID:
      'https://apps.cisco.com/ICW/PDR/ControllerNoAuth/rest/quoting/open?NDc1MTkwMjU1Mg==@NDczOTc3OTkxOA==',
    Order_Additional_Info:
      'https://apps.cisco.com/qtc/viewstat/open.order?flow=nextgen&orderId=&coId=27025774',

    // for cricle nav
    Order: '/o2c-order',
    Subscription: '/o2c-sub',
    Accruals: '/o2c-accrual',
    Invoicing: '/o2c-invoicing',
  };

  navigateToRoute(identifier: string, value: string | number) {
    if (this.navigationMap[identifier].startsWith('http')) {
      window.open(this.navigationMap[identifier], '_blank');
    } else {
      this.router.navigate([this.navigationMap[identifier]], {
        queryParams: { subRefId: value },
      });
    }
  }
}
