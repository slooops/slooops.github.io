import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ArcProgressComponent } from '../shared/arc-progress/arc-progress.component';
import {
  phosphorShieldCheckDuotone,
  phosphorCalendarCheckDuotone,
  phosphorEyeDuotone,
  phosphorBrainDuotone,
  phosphorMoneyDuotone,
  phosphorChartLineUpDuotone,
  phosphorPresentationChartDuotone,
  phosphorGaugeDuotone,
  phosphorRocketLaunchDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import {
  phosphorSparkleBold,
  phosphorCaretRightBold,
} from '@ng-icons/phosphor-icons/bold';
import { AuthenticationService } from '../providers/authentication.service';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

interface RoleRouteMap {
  roles: string[];
  route: string;
}

/**
 * Card visual variants inspired by Cisco design system:
 * - gradient-border: Rainbow gradient border effect
 * - gradient-bg-1/2/3: SVG gradient backgrounds
 * - glass: Frosted glass effect with backdrop blur
 * - inner-glow: Soft inner glow shadow
 * - soft-glow: Outer glow halo effect
 * - default: Standard card style
 */
export type CardVariant =
  | 'gradient-border'
  | 'gradient-bg-1'
  | 'gradient-bg-2'
  | 'gradient-bg-3'
  | 'glass'
  | 'inner-glow'
  | 'soft-glow'
  | 'default';

/** Arc progress data for displaying metrics on cards */
export interface ArcData {
  metricKey: string; // Key to match with backend data
  value: number | null; // null = no data yet
  max: number | null; // null = open-ended
  displayFormat?: 'COUNT' | 'COUNT_K' | 'CURRENCY_M' | 'PERCENT' | '' | null;
  subtitle?: string; // e.g., 'Transactions', 'Completion'
  colorStart?: string;
  colorEnd?: string;
}

export interface LandingCard {
  title: string;
  description: string;
  icon: string;
  route: string | null; // null = dead link (feature not yet built)
  externalUrl?: string; // opens in new tab instead of router navigation
  queryParams?: Record<string, string>; // optional query params for navigation
  requiredRoles: string[];
  fullWidth?: boolean;
  roleRoutes?: RoleRouteMap[];
  variant?: CardVariant; // Visual style variant
  arcData?: ArcData; // Optional arc progress indicator
}

/** Raw metric from backend API */
export interface DashboardMetric {
  METRIC_KEY: string;
  METRIC_VALUE: number;
  METRIC_TOTAL: number | null;
  TREND_PERCENT: number | null;
  TREND_DIRECTION: 'UP' | 'DOWN' | null;
  DISPLAY_FORMAT: 'COUNT' | 'COUNT_K' | 'CURRENCY_M' | 'PERCENT' | '' | null;
  SECTION: string;
  DISPLAY_ORDER: number;
  LABEL: string;
  SUBTITLE: string | null;
  NOTES: string | null;
  LAST_UPDATED: string;
}

/** Parsed dial metric for arc progress components */
export interface DialMetric {
  value: number;
  max: number | null; // null = open-ended (renders at ~80%)
  label: string;
  displayFormat: 'COUNT' | 'COUNT_K' | 'CURRENCY_M' | 'PERCENT' | '' | null;
  size: number;
  strokeWidth: number;
  colorStart: string;
  colorEnd: string;
}

/** Parsed bar metric for health bar components */
export interface BarMetric {
  value: number;
  label: string;
}

/** Parsed stat metric for stat blocks */
export interface StatMetric {
  value: string; // Formatted value string
  label: string;
  subtitle: string | null;
  trendPercent: number | null;
  trendDirection: 'UP' | 'DOWN' | null;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, NgIcon, ArcProgressComponent],
  providers: [
    provideIcons({
      phosphorShieldCheckDuotone,
      phosphorCalendarCheckDuotone,
      phosphorEyeDuotone,
      phosphorBrainDuotone,
      phosphorMoneyDuotone,
      phosphorChartLineUpDuotone,
      phosphorPresentationChartDuotone,
      phosphorGaugeDuotone,
      phosphorRocketLaunchDuotone,
      phosphorSparkleBold,
      phosphorCaretRightBold,
    }),
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit, OnDestroy {
  private destroyManager = new DestroyManager();
  userName = signal('');
  userRoles = signal<string[]>([]);

  // Period info signals
  periodName = signal<string | null>(null);
  periodEndDate = signal<string | null>(null);
  lastUpdated = signal<string>('');

  // Dashboard metrics signals
  itOpsDials = signal<DialMetric[]>([]);
  finOpsDials = signal<DialMetric[]>([]);
  itOpsBar = signal<BarMetric | null>(null);
  finOpsBar = signal<BarMetric | null>(null);
  volumeStats = signal<StatMetric[]>([]);
  largeDealStats = signal<StatMetric[]>([]);

  // Card metrics - keyed by metricKey for lookup
  cardMetrics = signal<
    Map<
      string,
      {
        value: number;
        max: number | null;
        displayFormat:
          | 'COUNT'
          | 'COUNT_K'
          | 'CURRENCY_M'
          | 'PERCENT'
          | ''
          | null;
      }
    >
  >(new Map());

  /** IT Operations 360 cards */
  private readonly itOpsAllCards: LandingCard[] = [
    {
      title: 'Continuous Monitoring',
      description:
        'Real-time detection of operational and transaction failures for proactive resolution to prevent business impact.',
      icon: 'phosphorShieldCheckDuotone',
      route: '/invoice-to-cash',
      requiredRoles: [
        'ADMIN',
        'PERIOD_CLOSE',
        'EXCEPTION_ADMIN',
        'EXCEPTION_READ_ONLY',
        'ACCOUNT_RECON',
        'GL_POSTING',
        'OPERATION_CTRL',
        'MONITORING_OM',
        'MONITORING_WIPS',
      ],
      roleRoutes: [
        {
          roles: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          route: '/invoice-to-cash',
        },
        {
          roles: ['ADMIN', 'ACCOUNT_RECON'],
          route: '/revenue-accounting',
        },
        {
          roles: ['ADMIN', 'MONITORING_OM'],
          route: '/order-management',
        },
        {
          roles: ['ADMIN', 'GL_POSTING'],
          route: '/gl-posting',
        },
        {
          roles: ['ADMIN', 'OPERATION_CTRL'],
          route: '/operations-controls',
        },
        {
          roles: ['ADMIN', 'MONITORING_WIPS'],
          route: '/wips',
        },
      ],
      variant: 'soft-glow',
      arcData: {
        metricKey: 'CONTINUOUS_MONITORING',
        value: null, // fetched from backend
        max: null, // fetched from backend
        subtitle: 'Transactions',
        colorStart: '#00bceb',
        colorEnd: '#ff007f',
      },
    },
    {
      title: 'Period Close Management',
      description:
        'Predictable, on-time close execution through focused monitoring and control, providing real-time visibility.',
      icon: 'phosphorCalendarCheckDuotone',
      route: '/period-close-tracking',
      requiredRoles: ['ADMIN', 'PERIOD_CLOSE'],
      variant: 'gradient-bg-2',
      arcData: {
        metricKey: 'PERIOD_CLOSE_MGMT',
        value: null,
        max: null,
        subtitle: 'Complete',
        colorStart: '#0070d2',
        colorEnd: '#00bceb',
      },
    },
    {
      title: 'Operational Visibility',
      description:
        'Single view of all disruptions across jobs, transactions, and ESP cases for effective resource management.',
      icon: 'phosphorEyeDuotone',
      route: '/operational-visibility',
      requiredRoles: ['ADMIN', 'OPERATION_CTRL'],
      variant: 'gradient-bg-1',
      arcData: {
        metricKey: 'OPERATIONAL_VISIBILITY',
        value: null,
        max: null,
        subtitle: 'Active Alerts',
        colorStart: '#ff9000',
        colorEnd: '#ff007f',
      },
    },
    {
      title: 'Case-IQ',
      description:
        'Enterprise Service Platform resolution tracking, showing AI enabled resolutions and insights into case management.',
      icon: 'phosphorBrainDuotone',
      route: '/case-iq',
      requiredRoles: [
        'ADMIN',
        'CASE_IQ_AIT',
        'CASE_IQ_CAPITAL',
        'CASE_IQ_FINANCE_IT',
        'CASE_IQ_FPP',
        'CASE_IQ_12C',
        'CASE_IQ_MANAGER',
        'CASE_IQ_OM',
        'CASE_IQ_P2P',
        'CASE_IQ_SBP',
      ],
      variant: 'glass',
      // No arcData - feature not yet built
    },
  ];

  /** Finance Biz Ops 360 cards */
  private readonly finBizOpsAllCards: LandingCard[] = [
    {
      title: 'Large Deal Tracking',
      description:
        'End-to-end visibility into critical order life cycles during quarter-end across commerce and finance operations.',
      icon: 'phosphorMoneyDuotone',
      route: '/business-insights',
      queryParams: { tab: 'app-large-deal' },
      requiredRoles: ['ADMIN', 'LARGE_DEAL'],
      variant: 'soft-glow',
      arcData: {
        metricKey: 'LARGE_DEAL_TRACKING',
        value: null,
        max: null,
        subtitle: 'Revenue',
        colorStart: '#ffd000',
        colorEnd: '#ff9000',
      },
    },
    {
      title: 'Mid-Close Status',
      description:
        'Track mid-close processing across all entities with real-time completion status and FCC load visibility.',
      icon: 'phosphorGaugeDuotone',
      route: '/business-insights',
      queryParams: { tab: 'app-wd0-status' },
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
      variant: 'gradient-bg-2',
      arcData: {
        metricKey: 'MIDCLOSE_STATUS',
        value: null,
        max: null,
        subtitle: 'Entities',
        colorStart: '#00bceb',
        colorEnd: '#0070d2',
      },
    },
    {
      title: 'Mid-Close Volume Forecasting',
      description:
        'ML-driven predictions of volume spikes or drops to proactively manage period close processing times.',
      icon: 'phosphorChartLineUpDuotone',
      route: '/business-insights',
      queryParams: { tab: 'app-wd0-historical-data' },
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
      variant: 'gradient-bg-3',
      arcData: {
        metricKey: 'MIDCLOSE_FORECAST',
        value: null,
        max: null,
        subtitle: 'Forecast',
        colorStart: '#ff007f',
        colorEnd: '#9933ff',
      },
    },
    {
      title: 'O2C Insights',
      description:
        'Real-time Order-to-Cash insights with immediate access to invoice and accounting details.',
      icon: 'phosphorPresentationChartDuotone',
      route: '/business-insights',
      queryParams: { tab: 'o2c-insights' },
      requiredRoles: ['ADMIN', 'O360'],
      variant: 'soft-glow',
      arcData: {
        metricKey: 'O2C_VISIBILITY',
        value: null,
        max: null,
        subtitle: 'Accuracy',
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
    },
  ];

  /** Business roles - users with these see only Finance Biz Ops 360 */
  private readonly BUSINESS_ROLES = [
    'CLO_UPDATE',
    'DEAL_UPLOAD',
    'LARGE_DEAL',
    'MIDCLOSE_VOLUMES',
    'PERIOD_CLOSE',
    'WD0',
  ];

  itOpsCards = computed(() =>
    this.enrichCardsWithMetrics(this.filterByRole(this.itOpsAllCards)),
  );
  finBizOpsCards = computed(() =>
    this.enrichCardsWithMetrics(this.filterByRole(this.finBizOpsAllCards)),
  );

  /** Merge fetched metrics into card arcData */
  private enrichCardsWithMetrics(cards: LandingCard[]): LandingCard[] {
    const metrics = this.cardMetrics();
    return cards.map((card) => {
      if (!card.arcData) return card;

      const metric = metrics.get(card.arcData.metricKey);
      if (metric) {
        return {
          ...card,
          arcData: {
            ...card.arcData,
            value: metric.value,
            max: metric.max ?? card.arcData.max, // Use fetched max or fallback
            displayFormat: metric.displayFormat,
          },
        };
      }
      // No metric found - keep null value (shows no-data state)
      return card;
    });
  }

  /** Check if user has admin role */
  private isAdmin = computed(() => this.userRoles().includes('ADMIN'));

  /** Check if user has any business role (and is not admin) */
  private isBusinessUser = computed(() => {
    const roles = this.userRoles();
    if (roles.includes('ADMIN')) return false;
    return roles.some((role) => this.BUSINESS_ROLES.includes(role));
  });

  /** Check if user is IT (has roles that aren't business roles and isn't admin) */
  private isItUser = computed(() => {
    const roles = this.userRoles();
    if (roles.includes('ADMIN')) return false;
    // IT user if they have any role that's NOT in business roles
    return roles.some((role) => !this.BUSINESS_ROLES.includes(role));
  });

  // Organize cards into columns based on user role type
  cardColumns = computed(() => {
    const itCards = this.itOpsCards();
    const finCards = this.finBizOpsCards();

    const columns: { header: string; cards: LandingCard[] }[] = [];

    // Admin sees both columns
    if (this.isAdmin()) {
      columns.push({ header: 'IT Operations 360', cards: itCards });
      columns.push({ header: 'Finance Biz Ops 360', cards: finCards });
    }
    // Business users see only Finance Biz Ops 360
    else if (this.isBusinessUser()) {
      columns.push({ header: 'Finance Biz Ops 360', cards: finCards });
    }
    // IT users see only IT Operations 360
    else if (this.isItUser()) {
      columns.push({ header: 'IT Operations 360', cards: itCards });
    }
    // Fallback: show both if no roles (shouldn't happen in practice)
    else {
      columns.push({ header: 'IT Operations 360', cards: itCards });
      columns.push({ header: 'Finance Biz Ops 360', cards: finCards });
    }

    return columns;
  });

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private http: ApiHttpService,
  ) {
    this.userName.set(this.authService.getUserName());

    // In the constructor, replace:
    this.userRoles.set(this.authService.getRoles());

    // With one of these to test:

    // 1. ADMIN - sees both columns
    // this.userRoles.set(['ADMIN']);

    // 2. Business user - sees only Finance Biz Ops 360
    // this.userRoles.set(['LARGE_DEAL', 'WD0']);

    // 3. IT user - sees only IT Operations 360
    // this.userRoles.set(['EXCEPTION_ADMIN', 'GL_POSTING']);

    // 4. Mixed (has both business + IT roles) - currently shows IT Ops only
    // this.userRoles.set(['LARGE_DEAL', 'EXCEPTION_ADMIN']);
  }

  ngOnInit(): void {
    // Fetch all dashboard metrics (including card metrics) from single endpoint
    this.http
      .get('dashboard-metrics', this.destroyManager)
      .subscribe((metrics: any) => {
        console.log('📊 Dashboard Metrics:', metrics);
        this.parseMetrics(metrics as DashboardMetric[]);
      });
  }

  ngOnDestroy(): void {
    this.destroyManager.ngOnDestroy();
  }

  /** Parse raw metrics from API into section-grouped signals */
  private parseMetrics(metrics: DashboardMetric[]): void {
    const bySection = (section: string) =>
      metrics
        .filter((m) => m.SECTION === section)
        .sort((a, b) => a.DISPLAY_ORDER - b.DISPLAY_ORDER);

    // Pre-Close Dials (left panel)
    const preCloseDialConfigs = [
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
    ];
    this.itOpsDials.set(
      bySection('PRECLOSE').map((m, i) => ({
        value: m.METRIC_VALUE,
        max: m.METRIC_TOTAL,
        label: m.LABEL,
        displayFormat: m.DISPLAY_FORMAT,
        ...preCloseDialConfigs[i],
      })),
    );

    // Mid-Close Dials (right panel)
    const midCloseDialConfigs = [
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
      {
        size: 90,
        strokeWidth: 8,
        colorStart: '#00d084',
        colorEnd: '#00bceb',
      },
    ];

    // // Mid-Close Dials (right panel)
    // const midCloseDialConfigs = [
    //   { size: 100, strokeWidth: 9, colorStart: '#00bceb', colorEnd: '#9933ff' },
    //   { size: 100, strokeWidth: 9, colorStart: '#9933ff', colorEnd: '#00d084' },
    //   { size: 100, strokeWidth: 9, colorStart: '#00d084', colorEnd: '#00bceb' },
    //   { size: 100, strokeWidth: 9, colorStart: '#0070d2', colorEnd: '#ff007f' },
    // ];

    this.finOpsDials.set(
      bySection('MIDCLOSE').map((m, i) => ({
        value: m.METRIC_VALUE,
        max: m.METRIC_TOTAL,
        label: m.LABEL,
        displayFormat: m.DISPLAY_FORMAT,
        ...midCloseDialConfigs[i],
      })),
    );

    // Health Bars
    const itBar = bySection('IT_OPS_BAR')[0];
    if (itBar) {
      this.itOpsBar.set({ value: itBar.METRIC_VALUE, label: itBar.LABEL });
    }

    const finBar = bySection('FINANCE_OPS_BAR')[0];
    if (finBar) {
      this.finOpsBar.set({ value: finBar.METRIC_VALUE, label: finBar.LABEL });
    }

    // Volume Stats
    this.volumeStats.set(
      bySection('VOLUMES').map((m) => ({
        value: this.formatValue(m.METRIC_VALUE, m.DISPLAY_FORMAT),
        label: m.LABEL,
        subtitle: m.SUBTITLE,
        trendPercent: m.TREND_PERCENT,
        trendDirection: m.TREND_DIRECTION,
      })),
    );

    // Large Deal Stats
    this.largeDealStats.set(
      bySection('LARGE_DEAL').map((m) => ({
        value: this.formatValue(m.METRIC_VALUE, m.DISPLAY_FORMAT),
        label: m.LABEL,
        subtitle: m.SUBTITLE,
        trendPercent: m.TREND_PERCENT,
        trendDirection: m.TREND_DIRECTION,
      })),
    );

    // Card metrics for arc progress indicators
    this.parseCardMetrics(bySection('CARD_METRICS'));

    // Period info
    const periodInfo = bySection('PERIOD_INFO')[0];
    if (periodInfo) {
      this.periodName.set(periodInfo.LABEL);
      this.periodEndDate.set(periodInfo.SUBTITLE);
    }

    // Set last updated to current timestamp (page load time)
    this.lastUpdated.set(new Date().toLocaleString());
  }

  /** Parse card metrics from API into the cardMetrics signal */
  private parseCardMetrics(metrics: DashboardMetric[]): void {
    const metricsMap = new Map<
      string,
      {
        value: number;
        max: number | null;
        displayFormat:
          | 'COUNT'
          | 'COUNT_K'
          | 'CURRENCY_M'
          | 'PERCENT'
          | ''
          | null;
      }
    >();

    for (const m of metrics) {
      metricsMap.set(m.METRIC_KEY, {
        value: m.METRIC_VALUE,
        max: m.METRIC_TOTAL, // null = open-ended
        displayFormat: m.DISPLAY_FORMAT,
      });
    }

    this.cardMetrics.set(metricsMap);
  }

  /**
   * Format value based on display format with auto-scaling.
   * - PERCENT: shows value as-is with % suffix
   * - CURRENCY_M: always $ prefix, auto-scales K/M/B
   * - COUNT/COUNT_K: no $ prefix, auto-scales K/M/B
   * - null/empty: auto-scales K/M/B, $ prefix if value >= 1M
   */
  private formatValue(
    value: number,
    format: 'COUNT' | 'COUNT_K' | 'CURRENCY_M' | 'PERCENT' | '' | null,
  ): string {
    // PERCENT: show value as-is with % suffix
    if (format === 'PERCENT') {
      if (value % 1 === 0) return `${value}%`;
      return `${value.toFixed(1).replace(/\.0$/, '')}%`;
    }

    // Determine $ prefix
    let prefix = '';
    if (format === 'CURRENCY_M') {
      prefix = '$';
    } else if (!format && value >= 1_000_000) {
      prefix = '$';
    }

    // Auto-scale based on magnitude
    let scaled: number;
    let suffix: string;
    if (value >= 1_000_000_000) {
      scaled = value / 1_000_000_000;
      suffix = 'B';
    } else if (value >= 1_000_000) {
      scaled = value / 1_000_000;
      suffix = 'M';
    } else if (value >= 1_000) {
      scaled = value / 1_000;
      suffix = 'K';
    } else {
      scaled = value;
      suffix = '';
    }

    // Format with appropriate precision
    const formatted = this.formatWithPrecision(scaled);
    return `${prefix}${formatted}${suffix}`;
  }

  /** Format number with appropriate precision based on magnitude */
  private formatWithPrecision(num: number): string {
    if (num < 10) {
      return num
        .toLocaleString('en-US', { maximumFractionDigits: 2 })
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');
    }
    if (num < 100) {
      return num
        .toLocaleString('en-US', { maximumFractionDigits: 1 })
        .replace(/\.0$/, '');
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  onCardClick(card: LandingCard): void {
    if (!this.isCardInteractive(card)) {
      return;
    }

    if (card.externalUrl) {
      window.open(card.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const route = this.resolveCardRoute(card);
    if (route) {
      this.router.navigate([route], {
        queryParams: card.queryParams ?? {},
      });
    }
  }

  private resolveCardRoute(card: LandingCard): string | null {
    if (card.roleRoutes?.length) {
      const roles = this.userRoles();
      for (const mapping of card.roleRoutes) {
        const hasRole = mapping.roles.some((role) => roles.includes(role));
        if (hasRole) {
          return mapping.route;
        }
      }
    }
    if (card.route && this.canAccessCard(card)) {
      return card.route;
    }
    return null;
  }

  isCardInteractive(card: LandingCard): boolean {
    return this.cardHasDestination(card) && this.canAccessCard(card);
  }

  private cardHasDestination(card: LandingCard): boolean {
    return Boolean(card.externalUrl || card.route || card.roleRoutes?.length);
  }

  private canAccessCard(card: LandingCard): boolean {
    const roles = this.userRoles();
    if (!card.requiredRoles?.length) {
      return true;
    }
    if (!roles.length) {
      return true;
    }
    if (roles.includes('ADMIN')) {
      return true;
    }
    return card.requiredRoles.some((role) => roles.includes(role));
  }

  private filterByRole(cards: LandingCard[]): LandingCard[] {
    return cards;
  }
}
