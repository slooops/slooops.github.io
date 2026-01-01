import { Component, Input } from '@angular/core';
import { SidebarService } from 'src/app/sidebar.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-o2c-sidebar-nav',
    templateUrl: './o2c-sidebar-nav.component.html',
    styleUrls: ['./o2c-sidebar-nav.component.css'],
    imports: [
    CommonModule
  ],
  standalone: true
})
export class O2cSidebarNavComponent {
  constructor(private sidebarService: SidebarService) {}

  collapsed = false;
  activeItem: string = 'Orders';

  @Input() navItems = [
    { label: 'Orders', icon: 'cart-icon', count: 1 },
    { label: 'Subscriptions', icon: 'bookmark-icon', count: 70 },
    { label: 'Invoices', icon: 'receipt-icon', count: 70 },
  ];

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.sidebarService.setSidebarState(!this.collapsed);
  }

  selectItem(label: string) {
    this.activeItem = label;
    this.sidebarService.setActiveItem(label);
  }
}
