import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import {
  O2cSearchResult,
  SearchContextService,
} from '../search-context.service';

@Component({
  selector: 'app-business-insights',
  templateUrl: './business-insights.component.html',
  styleUrl: './business-insights.component.css',
})
export class BusinessInsightsComponent implements OnInit {
  constructor(
    private authService: AuthenticationService,
    private menuService: MenuService,
    private searchContextService: SearchContextService
  ) {}
  roles: string[] = [];

  ngOnInit() {
    this.roles = this.authService.getRoles();
    this.getDefaultTabIndex();

    this.searchContextService.searchPayload$.subscribe((payload) => {
      if (payload) {
        const o2cTabIndex = this.filteredTabs.findIndex(
          (tab) => tab.component === 'app-o2c-360'
        );
        if (o2cTabIndex >= 0) {
          this.selectedIndex = o2cTabIndex;
          this.searchContextService.setO2cSearchVisible(true);
          this.o2cSearchParams = payload; // store it for passing to child
        }
      }
    });
  }

  o2cSearchParams: O2cSearchResult | null = null;
  menuOpen = false;

  toggleMenu() {
    console.log('Burger menu clicked!');
    // Implement menu toggle logic here
  }
  onTabChange(index: number) {
    setTimeout(() => {
      this.selectedIndex = index; // Switch to the new tab
      const newHeader = `Business Insights > ${this.filteredTabs[index]?.label}`;
      this.menuService.updateHeader(newHeader);

      const isO2c = this.filteredTabs[index]?.component === 'app-o2c-360';
      this.searchContextService.setO2cSearchVisible(isO2c);
    }, 50);
  }
  visibleTabs: {
    label: string;
    component: string;
    role: string[];
    disabled?: boolean;
  }[] = [
    {
      label: 'Large Deal Tracker',
      component: 'app-large-deal',
      role: ['ADMIN', 'LARGE_DEAL'],
    },
    {
      label: 'Midclose Status',
      component: 'app-wd0-status',
      role: ['ADMIN', 'WD0'],
    },
    {
      label: 'Midclose Volumes',
      component: 'app-wd0-historical-data',
      role: ['ADMIN', 'MIDCLOSE_VOLUMES'],
    },
    {
      label: 'Active Incidents',
      component: 'app-issue-reporting',
      role: ['ADMIN', 'ISSUE_RESOLUTION', 'ISSUE_APPROVAL'],
    },
    // {
    //   label: 'O2C - 360',
    //   component: 'app-o2c-360',
    //   role: ['ADMIN', 'O360'],
    // },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );
  }
}
