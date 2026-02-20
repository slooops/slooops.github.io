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
  value: number;
  max: number;
  suffix?: string; // e.g., 'k', 'M', '%'
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
  DISPLAY_FORMAT: 'COUNT' | 'COUNT_K' | 'CURRENCY_M' | 'PERCENT';
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
  max: number;
  label: string;
  suffix: string;
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

  // Dashboard metrics signals
  itOpsDials = signal<DialMetric[]>([]);
  finOpsDials = signal<DialMetric[]>([]);
  itOpsBar = signal<BarMetric | null>(null);
  finOpsBar = signal<BarMetric | null>(null);
  volumeStats = signal<StatMetric[]>([]);
  largeDealStats = signal<StatMetric[]>([]);

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
        'ORDER_MANAGEMENT',
        'WIPS',
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
          roles: ['ADMIN', 'ORDER_MANAGEMENT'],
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
          roles: ['ADMIN', 'WIPS'],
          route: '/wips',
        },
      ],
      variant: 'soft-glow',
      arcData: {
        value: 298000,
        max: 350000,
        suffix: 'k',
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
      variant: 'gradient-bg-1',
      arcData: {
        value: 87,
        max: 100,
        suffix: '%',
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
      variant: 'glass',
      arcData: {
        value: 42,
        max: 50,
        suffix: '',
        subtitle: 'Active Alerts',
        colorStart: '#ff9000',
        colorEnd: '#ff007f',
      },
    },
    {
      title: 'Self-Healing',
      description:
        'AI-enabled intelligent analysis and automated remediation to accelerate issue resolution.',
      icon: 'phosphorBrainDuotone',
      route: null,
      requiredRoles: ['ADMIN'],
      variant: 'inner-glow',
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
      requiredRoles: ['ADMIN', 'LARGE_DEAL'],
      variant: 'soft-glow',
      arcData: {
        value: 1250000,
        max: 2000000,
        suffix: 'M',
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
      route: '/wd0',
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
      variant: 'gradient-bg-2',
      arcData: {
        value: 73,
        max: 100,
        suffix: '%',
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
      route: '/midclose-volumes',
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
      variant: 'gradient-bg-3',
      arcData: {
        value: 156000,
        max: 200000,
        suffix: 'k',
        subtitle: 'Forecast',
        colorStart: '#ff007f',
        colorEnd: '#9933ff',
      },
    },
    {
      title: 'O2C Financials Visibility',
      description:
        'Real-time Order-to-Cash insights with immediate access to invoice and accounting details.',
      icon: 'phosphorPresentationChartDuotone',
      route: null,
      externalUrl: 'https://subscription-ai.cisco.com/',
      requiredRoles: ['ADMIN'],
      variant: 'soft-glow',
      arcData: {
        value: 94,
        max: 100,
        suffix: '%',
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

  itOpsCards = computed(() => this.filterByRole(this.itOpsAllCards));
  finBizOpsCards = computed(() => this.filterByRole(this.finBizOpsAllCards));

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

    // IT Ops Dials - with specific styling per dial
    const itDialConfigs = [
      { size: 72, strokeWidth: 6, colorStart: '#00d084', colorEnd: '#00bceb' },
      {
        size: 120,
        strokeWidth: 12,
        colorStart: '#ff9000',
        colorEnd: '#ff007f',
      },
      { size: 100, strokeWidth: 8, colorStart: '#00bceb', colorEnd: '#0070d2' },
    ];
    this.itOpsDials.set(
      bySection('IT_OPS_DIALS').map((m, i) => ({
        value: m.METRIC_VALUE,
        max: m.METRIC_TOTAL ?? 100,
        label: m.LABEL,
        suffix: this.getSuffix(m.DISPLAY_FORMAT),
        ...itDialConfigs[i],
      })),
    );

    // Finance Ops Dials
    const finDialConfigs = [
      { size: 100, strokeWidth: 8, colorStart: '#ff007f', colorEnd: '#9933ff' },
      {
        size: 120,
        strokeWidth: 12,
        colorStart: '#00bceb',
        colorEnd: '#9933ff',
      },
      { size: 72, strokeWidth: 6, colorStart: '#ffd000', colorEnd: '#ff9000' },
    ];
    this.finOpsDials.set(
      bySection('FINANCE_OPS_DIALS').map((m, i) => ({
        value: m.METRIC_VALUE,
        max: m.METRIC_TOTAL ?? 100,
        label: m.LABEL,
        suffix: this.getSuffix(m.DISPLAY_FORMAT),
        ...finDialConfigs[i],
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
  }

  /** Get suffix for arc progress based on display format */
  private getSuffix(format: string): string {
    switch (format) {
      case 'CURRENCY_M':
        return 'M';
      case 'COUNT_K':
        return 'k';
      case 'PERCENT':
        return '%';
      default:
        return '';
    }
  }

  /** Format value based on display format */
  private formatValue(value: number, format: string): string {
    switch (format) {
      case 'CURRENCY_M':
        return `$${value.toFixed(value % 1 === 0 ? 0 : 1)}M`;
      case 'COUNT_K':
        return `${(value / 1000).toFixed(1)}k`;
      case 'PERCENT':
        return `${value}%`;
      default:
        return value.toString();
    }
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
      this.router.navigate([route]);
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
