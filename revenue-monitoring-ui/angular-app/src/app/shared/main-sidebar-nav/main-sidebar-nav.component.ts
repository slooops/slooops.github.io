import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles?: string[];
  children?: NavItem[];
}

@Component({
  selector: 'app-main-sidebar-nav',
  templateUrl: './main-sidebar-nav.component.html',
  styleUrls: ['./main-sidebar-nav.component.css'],
  standalone: true,
  imports: [CommonModule, NgIcon],
})
export class MainSidebarNavComponent {
  @Input() isAdmin = false;
  @Input() userRoles: string[] = [];
  @Input() currentUrl = '';
  @Output() navigateEvent = new EventEmitter<string>();

  collapsed = false;
  activeDrawer: string | null = null;
  private pendingDrawer: string | null = null;

  navItems: NavItem[] = [
    {
      label: 'Access & Analytics',
      icon: 'phosphorIdentificationCardDuotone',
      route: '/access-management-and-analytics',
      roles: [
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_ADMIN',
        'MONITORING_AIT_ADMIN',
        'MONITORING_OM_ADMIN',
        'MONITORING_WIPS_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
        'EXCEPTION_ADMIN',
      ],
    },
    {
      label: 'Operations Dashboard',
      icon: 'phosphorEyeDuotone',
      route: '/operations-dashboard',
      roles: ['ADMIN'],
    },
    {
      label: 'Continuous Monitoring',
      icon: 'phosphorBinocularsDuotone',
      roles: [
        'PERIOD_CLOSE',
        'MONITORING_I2C',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL',
        'MONITORING_GL_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_OM',
        'MONITORING_OM_ADMIN',
        'MONITORING_WIPS',
        'MONITORING_WIPS_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
        'MONITORING_OPS_CONTROLS_I2C',
        'MONITORING_OPS_CONTROLS_GTC',
        'MONITORING_OPS_CONTROLS_REVENUE',
        'EXCEPTION_ADMIN',
        'EXCEPTION_READ_ONLY',
        'ACCOUNT_RECON',
        'OPERATION_CTRL',
      ],
      children: [
        {
          label: 'Period Close Tracking',
          icon: 'phosphorCalendarCheckDuotone',
          route: '/period-close-tracking',
          roles: ['PERIOD_CLOSE'],
        },
        {
          label: 'Invoice to Cash',
          icon: 'phosphorInvoiceDuotone',
          route: '/invoice-to-cash',
          roles: [
            'EXCEPTION_ADMIN',
            'EXCEPTION_READ_ONLY',
            'MONITORING_I2C',
            'MONITORING_I2C_ADMIN',
          ],
        },
        {
          label: 'Revenue Accounting',
          icon: 'phosphorChartLineUpDuotone',
          route: '/revenue-accounting',
          roles: [
            'EXCEPTION_ADMIN',
            'EXCEPTION_READ_ONLY',
            'ACCOUNT_RECON',
            'MONITORING_REVENUE_ACCOUNTING',
            'MONITORING_REVENUE_ACCOUNTING_ADMIN',
          ],
        },
        {
          label: 'General Ledger',
          icon: 'phosphorBookOpenDuotone',
          route: '/gl-posting',
          roles: ['MONITORING_GL', 'MONITORING_GL_ADMIN'],
        },
        {
          label: 'AIT',
          icon: 'phosphorPulseDuotone',
          route: '/ait',
          roles: ['MONITORING_AIT', 'MONITORING_AIT_ADMIN'],
        },
        {
          label: 'Order Management',
          icon: 'phosphorPackageDuotone',
          route: '/order-management',
          roles: ['MONITORING_OM', 'MONITORING_OM_ADMIN'],
        },
      ],
    },
    {
      label: 'Business Insights',
      icon: 'phosphorLightbulbDuotone',
      route: '/business-insights',
      roles: ['LARGE_DEAL', 'WD0', 'MIDCLOSE_VOLUMES', 'ISSUE_RESOLUTION'],
    },
    {
      label: 'ESP Case Manager',
      icon: 'phosphorFolderOpenDuotone',
      roles: [
        'CASE_IQ_MANAGER',
        'CASE_IQ_OM',
        'CASE_IQ_SBP',
        'CASE_IQ_I2C',
        'CASE_IQ_AIT',
        'CASE_IQ_FPP',
        'CASE_IQ_P2P',
        'CASE_IQ_CAPITAL',
        'CASE_IQ_FINANCE_IT',
      ],
      children: [
        {
          label: 'CaseIQ Monitoring',
          icon: 'phosphorHeartbeatDuotone',
          route: '/caseiq-monitoring',
          roles: ['ADMIN', 'CASE_IQ_MONITORING'],
        },
        {
          label: 'Case IQ',
          icon: 'phosphorBrainDuotone',
          route: '/case-iq',
          roles: [
            'CASE_IQ_MANAGER',
            'CASE_IQ_OM',
            'CASE_IQ_SBP',
            'CASE_IQ_I2C',
            'CASE_IQ_AIT',
            'CASE_IQ_FPP',
            'CASE_IQ_P2P',
            'CASE_IQ_CAPITAL',
          ],
        },
        {
          label: 'I2C Case Analyzer',
          icon: 'phosphorReceiptDuotone',
          route: '/i2c-case-analyzer',
          roles: ['ADMIN'],
        },
        {
          label: 'SBP Case Analyzer',
          icon: 'phosphorRepeatDuotone',
          route: '/sbp-case-analyzer',
          roles: ['ADMIN'],
        },
      ],
    },
    {
      label: 'I2C Self-Healing',
      icon: 'phosphorFirstAidKitDuotone',
      route: '/self-healing',
      roles: ['ADMIN'],
    },
  ];

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.activeDrawer = null;
    }
  }

  toggleDrawer(item: NavItem): void {
    if (!item.children?.length) {
      if (item.route) {
        this.navigateEvent.emit(item.route);
        this.activeDrawer = null;
        this.collapsed = true;
      }
      return;
    }

    if (this.activeDrawer === item.label) {
      this.activeDrawer = null;
    } else if (this.activeDrawer) {
      // Close current, wait for animation, then open new
      this.pendingDrawer = item.label;
      this.activeDrawer = null;
      setTimeout(() => {
        this.activeDrawer = this.pendingDrawer;
        this.pendingDrawer = null;
      }, 250);
    } else {
      this.activeDrawer = item.label;
    }
  }

  navigateTo(route: string): void {
    this.navigateEvent.emit(route);
    this.activeDrawer = null;
    this.collapsed = true;
  }

  isVisible(item: NavItem): boolean {
    if (this.isAdmin) return true;
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((role) => this.userRoles.includes(role));
  }

  isRouteActive(route?: string): boolean {
    if (!route) return false;
    return this.currentUrl.includes(route);
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some(
      (child) => child.route && this.currentUrl.includes(child.route),
    );
  }

  getVisibleChildren(item: NavItem): NavItem[] {
    if (!item.children) return [];
    return item.children.filter((child) => this.isVisible(child));
  }
}
