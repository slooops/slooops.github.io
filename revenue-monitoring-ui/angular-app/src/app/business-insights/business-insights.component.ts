import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { ApiHttpService } from '../providers/http.service';
import { SearchContextService } from '../search-context.service';
import { DataService, PeriodStatus } from '../providers/data.service';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { BusinessInsightsModule } from './business-insights.module';
import { O2cEmbedComponent } from './o2c-embed.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-business-insights',
  templateUrl: './business-insights.component.html',
  styleUrl: './business-insights.component.css',
  imports: [
    CommonModule,
    MatTabsModule,
    BusinessInsightsModule,
    O2cEmbedComponent,
  ],
  standalone: true,
})
export class BusinessInsightsComponent implements OnInit, OnDestroy {
  constructor(
    private authService: AuthenticationService,
    private menuService: MenuService,
    private searchContextService: SearchContextService,
    private http: ApiHttpService,
    private dataService: DataService,
    private route: ActivatedRoute,
  ) {}
  roles: string[] = [];
  private userName: string = '';
  periodInfo: PeriodStatus | null = null;
  private destroy$ = new Subject<void>();

  get isO2cTab(): boolean {
    return (
      this.filteredTabs[this.selectedIndex]?.component ===
      'subscription-o2c-insights'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.roles = this.authService.getRoles();
    this.userName = this.authService.getUserName();
    this.getDefaultTabIndex();

    // Select tab from query param (e.g. ?tab=app-large-deal)
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam) {
      const tabIndex = this.filteredTabs.findIndex(
        (t) => t.component === tabParam,
      );
      if (tabIndex >= 0) {
        this.selectedIndex = tabIndex;
      }
    }

    this.dataService.periodStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.periodInfo = status;
      });

    // Set initial subHeader based on the default tab
    setTimeout(() => {
      if (this.filteredTabs.length > 0) {
        // this.menuService.updateSubHeader(
        //   this.filteredTabs[this.selectedIndex]?.label || '',
        // );
        this.logTabVisit(this.selectedIndex);
      }
    }, 100);

    this.searchContextService.searchPayload$.subscribe((payload) => {
      if (!payload) {
        return;
      }

      const o2cTabIndex = this.filteredTabs.findIndex(
        (tab) => tab.component === 'subscription-o2c-insights',
      );
      if (o2cTabIndex >= 0) {
        this.selectedIndex = o2cTabIndex;
        this.onTabChange(o2cTabIndex);
      }
    });
  }

  menuOpen = false;

  toggleMenu() {
    // Implement menu toggle logic here
  }
  onTabChange(index: number) {
    setTimeout(() => {
      const selectedTab = this.filteredTabs[index];
      this.selectedIndex = index; // Switch to the new tab
      // this.menuService.updateSubHeader(selectedTab?.label || '');

      this.searchContextService.setO2cSearchVisible(false);

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
      label: 'Subscription O2C Insights',
      component: 'subscription-o2c-insights',
      role: ['ADMIN'],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role)),
    );
  }

  showGridMenu: boolean = false;

  toggleGridMenu(event: Event): void {
    event.stopPropagation();
    this.showGridMenu = !this.showGridMenu;
  }

  onGridMenuItemClick(index: number): void {
    this.showGridMenu = false;
    this.onTabChange(index);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showGridMenu = false;
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
