import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';

@Component({
  selector: 'app-business-insights',
  templateUrl: './business-insights.component.html',
  styleUrl: './business-insights.component.css',
})
export class BusinessInsightsComponent implements OnInit {
  constructor(
    private authService: AuthenticationService,
    private menuService: MenuService
  ) {}
  roles: string[] = [];

  ngOnInit() {
    this.roles = this.authService.getRoles();
    this.getDefaultTabIndex();
  }

  menuOpen = false;

  toggleMenu() {
    console.log('Burger menu clicked!');
    // Implement menu toggle logic here
  }
  onTabChange(index: number) {
    this.selectedIndex = index;
    const newHeader = `Continuous Monitoring > ${this.filteredTabs[index]?.label}`;
    console.log('🔹 Tab changed, updating header:', newHeader);
    this.menuService.updateHeader(newHeader);
  }
  visibleTabs: { label: string; component: string; role: string[] }[] = [
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
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );
  }
}
