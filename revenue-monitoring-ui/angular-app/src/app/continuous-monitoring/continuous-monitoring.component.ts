import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { MenuService } from '../providers/menu.service';

@Component({
  selector: 'app-continuous-monitoring',
  templateUrl: './continuous-monitoring.component.html',
  styleUrl: './continuous-monitoring.component.css',
})
export class ContinuousMonitoringComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private menuService: MenuService
  ) {}
  ngOnInit(): void {
    this.menuService.updateMenuItems([
      {
        category: 'Period Close Tracking',
        items: [
          {
            label: 'Pre close',
            route: '/period-close-tracking-preclose',
            role: ['ADMIN', 'PERIOD_CLOSE'],
          },
          {
            label: 'Mid close',
            route: '/period-close-tracking-midclose',
            role: ['ADMIN', 'PERIOD_CLOSE'],
          },
        ],
      },
      {
        category: 'Invoice to Cash',
        items: [
          {
            label: 'Pre Invoicing',
            route: '/pre-invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Invoicing',
            route: '/invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Post Invoicing',
            route: '/post-invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'eInvoicing',
            route: '/einvoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Fusion',
            route: '/fusion',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
        ],
      },
      {
        category: 'Revenue Accounting',
        items: [
          {
            label: 'Standard Revenue',
            route: '/standard-revenue',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Rol',
            route: '/rol',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Accruals',
            route: '/accruals',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Accounts',
            route: '/accounts',
            role: ['ADMIN', 'ACCOUNT_RECON'],
          },
        ],
      },
      {
        category: 'GL Posting',
        items: [
          {
            label: 'General Ledger',
            route: '/general-ledger',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
        ],
      },
      // {
      //   category: 'Operations Controls',
      //   items: [
      //     {
      //       label: 'Invoice to Cash',
      //       route: '',
      //       role: ['ADMIN'],
      //     },
      //     {
      //       label: 'Revenue',
      //       route: '',
      //       role: ['ADMIN'],
      //     },
      //   ],
      // },
    ]);
  }
}
