import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from '../providers/theme.service';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  queryParams?: Record<string, string>;
  roles?: string[];
  disabled?: boolean;
  children?: NavItem[];
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  standalone: true,
  imports: [CommonModule, NgIcon],
})
export class MenuComponent {
  @Input() isAdmin = false;
  @Input() userRoles: string[] = [];
  @Input() currentUrl = '';
  @Output() navigateEvent = new EventEmitter<{
    route: string;
    queryParams?: Record<string, string>;
  }>();

  @HostBinding('class.dark-theme')
  get darkThemeClass(): boolean {
    return this.themeService.isDarkMode;
  }

  constructor(public themeService: ThemeService) {}

  collapsed = true;
  activeDrawer: string | null = null;
  activeFlyout: string | null = null;
  private pendingDrawer: string | null = null;

  navItems: NavItem[] = [
    {
      label: 'Access & Analytics',
      icon: 'phosphorIdentificationCardBold',
      roles: [
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT_ADMIN',
        'MONITORING_OM_ADMIN',
        'MONITORING_WIPS_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
      children: [
        {
          label: 'Identity & Access',
          icon: 'phosphorShieldCheckBold',
          route: '/access-management-and-analytics',
          queryParams: { tab: 'admin' },
          roles: [
            'MONITORING_I2C_ADMIN',
            'MONITORING_GL_AR_ADMIN',
            'MONITORING_AIT_ADMIN',
            'MONITORING_OM_ADMIN',
            'MONITORING_WIPS_ADMIN',
            'MONITORING_REVENUE_ACCOUNTING_ADMIN',
          ],
        },
        {
          label: 'Control Tower Analytics',
          icon: 'phosphorPresentationChartBold',
          route: '/access-management-and-analytics',
          queryParams: { tab: 'analytics' },
          roles: ['ADMIN'],
        },
      ],
    },
    {
      label: 'Operations Dashboard',
      icon: 'phosphorEyeBold',
      route: '/operations-dashboard',
      roles: ['ADMIN'],
    },
    {
      label: 'Continuous Monitoring',
      icon: 'phosphorBinocularsBold',
      roles: [
        'PERIOD_CLOSE',
        'MONITORING_I2C',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_OM',
        'MONITORING_OM_ADMIN',
        'MONITORING_WIPS',
        'MONITORING_WIPS_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
        'ACCOUNT_RECON',
      ],
      children: [
        {
          label: 'Period Close Tracking',
          icon: 'phosphorCalendarCheckBold',
          route: '/period-close-tracking',
          roles: ['PERIOD_CLOSE'],
        },
        {
          label: 'Invoice to Cash',
          icon: 'phosphorInvoiceBold',
          route: '/invoice-to-cash',
          roles: ['MONITORING_I2C', 'MONITORING_I2C_ADMIN'],
          children: [
            {
              label: 'Pre-Invoicing',
              icon: 'phosphorInvoiceBold',
              route: '/invoice-to-cash',
              queryParams: { tab: 'pre-invoicing' },
            },
            {
              label: 'Invoicing',
              icon: 'phosphorInvoiceBold',
              route: '/invoice-to-cash',
              queryParams: { tab: 'invoicing' },
            },
            {
              label: 'Post-Invoicing',
              icon: 'phosphorInvoiceBold',
              route: '/invoice-to-cash',
              queryParams: { tab: 'post-invoicing' },
            },
            {
              label: 'eInvoicing',
              icon: 'phosphorInvoiceBold',
              route: '/invoice-to-cash',
              queryParams: { tab: 'einvoicing' },
            },
            {
              label: 'Fusion',
              icon: 'phosphorInvoiceBold',
              route: '/invoice-to-cash',
              queryParams: { tab: 'fusion' },
            },
            {
              label: 'Credit Check Process',
              icon: 'phosphorInvoiceBold',
              route: '/invoice-to-cash',
              queryParams: { tab: 'credit-check-process' },
            },
          ],
        },
        {
          label: 'Revenue Accounting',
          icon: 'phosphorChartLineUpBold',
          route: '/revenue-accounting',
          roles: [
            'ACCOUNT_RECON',
            'MONITORING_REVENUE_ACCOUNTING',
            'MONITORING_REVENUE_ACCOUNTING_ADMIN',
          ],
          children: [
            {
              label: 'Standard Revenue',
              icon: 'phosphorChartLineUpBold',
              route: '/revenue-accounting',
              queryParams: { tab: 'standard-revenue' },
            },
            {
              label: 'Revenue Orchestration Layer',
              icon: 'phosphorChartLineUpBold',
              route: '/revenue-accounting',
              queryParams: { tab: 'revenue-orchestration-layer' },
            },
            {
              label: 'Accruals',
              icon: 'phosphorChartLineUpBold',
              route: '/revenue-accounting',
              queryParams: { tab: 'accruals' },
            },
            {
              label: 'Meraki',
              icon: 'phosphorChartLineUpBold',
              route: '/revenue-accounting',
              queryParams: { tab: 'meraki' },
              disabled: true,
            },
            {
              label: 'Clearing Account Balance',
              icon: 'phosphorChartLineUpBold',
              route: '/revenue-accounting',
              queryParams: { tab: 'clearing-account-balance' },
            },
          ],
        },
        {
          label: 'General Ledger',
          icon: 'phosphorBookOpenBold',
          route: '/gl-posting',
          roles: ['MONITORING_GL_AR', 'MONITORING_GL_AR_ADMIN'],
          children: [
            {
              label: 'General Ledger',
              icon: 'phosphorBookOpenBold',
              route: '/gl-posting',
              queryParams: { tab: 'general-ledger' },
            },
          ],
        },
        {
          label: 'AIT',
          icon: 'phosphorPulseBold',
          route: '/ait',
          roles: ['MONITORING_AIT', 'MONITORING_AIT_ADMIN'],
          children: [
            {
              label: 'General Ledger',
              icon: 'phosphorPulseBold',
              route: '/ait',
              queryParams: { tab: 'general-ledger' },
            },
          ],
        },
        {
          label: 'Order Management',
          icon: 'phosphorPackageBold',
          route: '/order-management',
          roles: [
            'MONITORING_OM',
            'MONITORING_OM_ADMIN',
            'MONITORING_WIPS',
            'MONITORING_WIPS_ADMIN',
          ],
          children: [
            {
              label: 'Imports',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'imports' },
            },
            {
              label: 'Holds',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'holds' },
            },
            {
              label: 'Bookings',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'bookings' },
            },
            {
              label: 'Workflow',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'workflow' },
            },
            {
              label: 'Processing',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'processing' },
            },
            {
              label: 'Distribution',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'distribution' },
            },
            {
              label: 'Attribution',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'attribution' },
            },
            {
              label: 'Jobs',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'jobs' },
            },
            {
              label: 'DFM',
              icon: 'phosphorPackageBold',
              route: '/order-management',
              queryParams: { tab: 'dfm' },
            },
          ],
        },
        {
          label: 'Operations Controls',
          icon: 'phosphorPackageBold',
          route: '/operations-controls',
          roles: ['ADMIN'],
          children: [
            {
              label: 'Invoice to Cash',
              icon: 'phosphorPackageBold',
              route: '/operations-controls',
              queryParams: { tab: 'invoice-to-cash' },
            },
            {
              label: 'Revenue Accounting',
              icon: 'phosphorPackageBold',
              route: '/operations-controls',
              queryParams: { tab: 'revenue-accounting' },
            },
            {
              label: 'Tax & Customa',
              icon: 'phosphorPackageBold',
              route: '/operations-controls',
              queryParams: { tab: 'tax-and-customs' },
            },
          ],
        },
      ],
    },
    {
      label: 'Business Insights',
      icon: 'phosphorLightbulbBold',
      roles: [
        'LARGE_DEAL',
        'WD0',
        'MIDCLOSE_VOLUMES',
        'ISSUE_RESOLUTION',
        'ISSUE_APPROVAL',
        'SUBSCRIPTION_LIFE_CYCLE',
      ],
      children: [
        {
          label: 'Large Deal Tracker',
          icon: 'phosphorTrendUpBold',
          route: '/business-insights',
          queryParams: { tab: 'app-large-deal' },
          roles: ['ADMIN', 'LARGE_DEAL'],
        },
        {
          label: 'Midclose Status',
          icon: 'phosphorClockBold',
          route: '/business-insights',
          queryParams: { tab: 'app-wd0-status' },
          roles: ['ADMIN', 'WD0'],
        },
        {
          label: 'Midclose Volumes',
          icon: 'phosphorChartBarBold',
          route: '/business-insights',
          queryParams: { tab: 'app-wd0-historical-data' },
          roles: ['ADMIN', 'MIDCLOSE_VOLUMES'],
        },
        {
          label: 'Active Incidents',
          icon: 'phosphorWarningCircleBold',
          route: '/business-insights',
          queryParams: { tab: 'app-issue-reporting' },
          roles: ['ADMIN', 'ISSUE_RESOLUTION', 'ISSUE_APPROVAL'],
        },
        {
          label: 'O2C Insights',
          icon: 'phosphorMagnifyingGlassBold',
          route: '/business-insights',
          queryParams: { tab: 'o2c-insights' },
          roles: ['ADMIN', 'SUBSCRIPTION_LIFE_CYCLE'],
        },
      ],
    },
    {
      label: 'CaseIQ',
      icon: 'phosphorBrainBold',
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
        // {
        //   label: 'CaseIQ Monitoring',
        //   icon: 'phosphorHeartbeatBold',
        //   route: '/caseiq-monitoring',
        //   roles: ['ADMIN', 'CASE_IQ_MONITORING'],
        // },
        {
          label: 'Case IQ',
          icon: 'phosphorBrainBold',
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
          children: [
            {
              label: 'Finance IT',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'finance-it' },
            },
            {
              label: 'OM',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'om' },
            },
            {
              label: 'SM',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'sm' },
            },
            {
              label: 'I2C',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'i2c' },
            },
            {
              label: 'AIT',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'ait' },
            },
            {
              label: 'FPP',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'fpp' },
            },
            {
              label: 'P2P',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'p2p' },
            },
            {
              label: 'Capital',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'capital' },
            },
            {
              label: 'Orchestrator',
              icon: 'phosphorBrainBold',
              route: '/case-iq',
              queryParams: { tab: 'orchestrator' },
              roles: ['ADMIN'],
            },
          ],
        },
        {
          label: 'I2C Case Analyzer',
          icon: 'phosphorReceiptBold',
          route: '/i2c-case-analyzer',
          roles: ['ADMIN'],
        },
        {
          label: 'SBP Case Analyzer',
          icon: 'phosphorRepeatBold',
          route: '/sbp-case-analyzer',
          roles: ['ADMIN'],
        },
      ],
    },
    {
      label: 'I2C Self-Healing',
      icon: 'phosphorFirstAidKitBold',
      route: '/self-healing',
      roles: ['ADMIN'],
    },
    {
      label: 'Control M',
      icon: 'phosphorSirenBold',
      route: '/ctm-alerts',
      roles: ['ADMIN'],
    },
  ];

  toggleDrawer(item: NavItem): void {
    if (!item.children?.length) {
      if (item.route) {
        this.navigateEvent.emit({
          route: item.route,
          queryParams: item.queryParams,
        });
        this.activeDrawer = null;
        this.activeFlyout = null;
      }
      return;
    }

    if (this.activeDrawer === item.label) {
      this.activeDrawer = null;
      this.activeFlyout = null;
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

  navigateTo(child: NavItem): void {
    if (child.children?.length) {
      this.activeFlyout =
        this.activeFlyout === child.label ? null : child.label;
      return;
    }
    if (child.route) {
      this.navigateEvent.emit({
        route: child.route,
        queryParams: child.queryParams,
      });
    }
    this.activeFlyout = null;
    this.activeDrawer = null;
  }

  navigateFromFlyout(item: NavItem): void {
    if (item.route) {
      this.navigateEvent.emit({
        route: item.route,
        queryParams: item.queryParams,
      });
    }
    this.activeFlyout = null;
    this.activeDrawer = null;
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

  isChildActive(child: NavItem): boolean {
    if (!child.route) return false;
    if (!this.currentUrl.includes(child.route)) return false;
    if (child.queryParams) {
      return Object.entries(child.queryParams).every(([key, value]) =>
        this.currentUrl.includes(`${key}=${value}`),
      );
    }
    // If child has no queryParams but other siblings do, only match if URL has no query
    return (
      !this.currentUrl.includes('?') || this.currentUrl.endsWith(child.route)
    );
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
