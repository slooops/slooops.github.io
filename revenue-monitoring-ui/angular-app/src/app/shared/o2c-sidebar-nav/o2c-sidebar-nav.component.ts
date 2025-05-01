import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-o2c-sidebar-nav',
  templateUrl: './o2c-sidebar-nav.component.html',
  styleUrls: ['./o2c-sidebar-nav.component.css'],
})
export class O2cSidebarNavComponent {
  collapsed = false;
  activeItem: string = 'Orders';

  @Input() navItems = [
    { label: 'Orders', icon: 'fa fa-shopping-cart', count: 1 },
    { label: 'Subscriptions', icon: 'fa fa-bookmark', count: 70 },
    { label: 'Invoices', icon: 'fa fa-file-invoice', count: 70 },
  ];

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  selectItem(label: string) {
    this.activeItem = label;
    // emit event or navigate here if needed
  }
}
