import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { ApiHttpService } from '../providers/http.service';
import {
  O2cSearchResult,
  SearchContextService,
} from '../search-context.service';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { BusinessInsightsModule } from './business-insights.module';
import { O2c360Component } from '../o2c/o2c-360/o2c-360.component';

@Component({
  selector: 'app-business-insights',
  templateUrl: './business-insights.component.html',
  styleUrl: './business-insights.component.css',
  imports: [
    CommonModule,
    MatTabsModule,
    BusinessInsightsModule,
    O2c360Component,
  ],
  standalone: true,
})
export class BusinessInsightsComponent implements OnInit {
  constructor(
    private authService: AuthenticationService,
    private menuService: MenuService,
    private searchContextService: SearchContextService,
    private http: ApiHttpService
  ) {}
  roles: string[] = [];
  private userName: string = '';

  ngOnInit() {
    this.roles = this.authService.getRoles();
    this.userName = this.authService.getUserName();
    this.getDefaultTabIndex();

    // Log initial tab visit after tabs are filtered
    setTimeout(() => {
      if (this.filteredTabs.length > 0) {
        this.menuService.updateSubHeader(
          this.filteredTabs[this.selectedIndex]?.label || '',
        );
        this.logTabVisit(this.selectedIndex);
      }
    }, 100);

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
    // Implement menu toggle logic here
  }
  onTabChange(index: number) {
    setTimeout(() => {
      const selectedTab = this.filteredTabs[index];
      this.selectedIndex = index; // Switch to the new tab
      this.menuService.updateSubHeader(selectedTab?.label || '');

      const isO2c = this.filteredTabs[index]?.component === 'app-o2c-360';
      this.searchContextService.setO2cSearchVisible(isO2c);

      // Log tab visit for analytics
      this.logTabVisit(index);
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
    {
      label: 'O2C - 360',
      component: 'app-o2c-360',
      role: ['O360'],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );
  }

  /**
   * Logs a tab visit for analytics.
   * Creates a pseudo-route like "/business-insights/large-deal-tracker"
   * to distinguish tab visits from just the parent page.
   */
  private logTabVisit(tabIndex: number): void {
    const tab = this.filteredTabs[tabIndex];
    if (!tab) return;

    // Convert tab label to URL-friendly slug: "Large Deal Tracker" -> "large-deal-tracker"
    const tabSlug = tab.label.toLowerCase().replace(/\s+/g, '-');
    const pseudoRoute = `/business-insights/${tabSlug}`;

    // Fire-and-forget POST request
    this.http
      .post('log-page-visit', {
        userName: this.userName,
        pageRoute: pseudoRoute,
      })
      .subscribe({
        next: () => {},
        error: (err) =>
          console.debug('Tab analytics log failed (non-critical):', err),
      });
  }
}
