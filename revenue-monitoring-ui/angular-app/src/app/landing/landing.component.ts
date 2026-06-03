import {
  AfterViewChecked,
  Component,
  computed,
  ElementRef,
  HostBinding,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
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
  phosphorChartLineUpBold,
} from '@ng-icons/phosphor-icons/bold';
import { AuthenticationService } from '../providers/authentication.service';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ThemeService } from '../providers/theme.service';
import { Chart } from 'chart.js/auto';

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
  hideForRoles?: string[]; // roles that cause this card to be hidden entirely
  disabledForRoles?: string[]; // roles that see the card but cannot click it
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
  trendUnit?: string; // e.g. 'MoM', 'QoQ', 'PQM', 'YoY'
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
      phosphorChartLineUpBold,
    }),
  ],
  templateUrl: './landing.component.html',
  styleUrls: [
    './landing.component.css',
    './landing-context2.css',
    './landing-context3.css',
  ],
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewChecked {
  private destroyManager = new DestroyManager();
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  userName = signal('');
  userRoles = signal<string[]>([]);

  // Context switcher (1=Period Close, 2=CaseIQ, 3=Large Deal)
  activeContext = signal<number>(1);

  // Period info signals
  periodName = signal<string | null>(null);
  periodEndDate = signal<string | null>(null);
  lastUpdated = signal<string>('');
  fiscalQuarter = signal<string | null>(null);
  isQuarterEnd = signal<boolean>(false);

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

  // Context 1: Period Close live data
  entityCount = signal<number>(0);
  precloseCompletionPct = signal<number>(0);
  midcloseCompletionPct = signal<number>(0);
  precloseCategoryStatus = signal<any[]>([]);
  midcloseCategoryStatus = signal<any[]>([]);
  precloseInterfaceLoad = signal<any[]>([]);
  midcloseInterfaceLoad = signal<any[]>([]);

  // Context 2: CaseIQ live data
  caseiqHealth = signal<any>(null);
  caseiqTeamVolumes = signal<any[]>([]);
  caseiqWeeklyTrend = signal<any[]>([]);

  // Context 2: KPI signals
  ctx2Accuracy = signal<number | null>(null);
  ctx2TotalCases = signal<number | null>(null);
  ctx2InProgressAgent = signal<number>(0);
  ctx2InProgressTotal = signal<number>(0);
  ctx2InProgressPct = signal<number>(0);
  ctx2RoutedAgent = signal<number>(0);
  ctx2RoutedTotal = signal<number>(0);
  ctx2RoutedPct = signal<number>(0);
  ctx2CancelledAgent = signal<number>(0);
  ctx2CancelledTotal = signal<number>(0);
  ctx2CancelledPct = signal<number>(0);
  ctx2ServiceAgent = signal<number>(0);
  ctx2ServiceTotal = signal<number>(0);
  ctx2ServicePct = signal<number>(0);
  ctx2OpsRate = signal<number>(0);
  ctx2AgentTotal = signal<number>(0);
  ctx2OpsTotal = signal<number>(0);
  ctx2ServiceIncidents = signal<number>(0);
  ctx2ActiveAgentsDeployed = signal<number>(81);
  ctx2ActiveAgentsTotal = signal<number>(83);
  ctx2ActiveAgentsPct = computed(() =>
    this.ctx2ActiveAgentsTotal() > 0
      ? Math.round(
          (this.ctx2ActiveAgentsDeployed() / this.ctx2ActiveAgentsTotal()) *
            100,
        )
      : 0,
  );

  /** Computed KPI config array for Context 2 strip */
  ctx2Kpis = computed(() => {
    const fmt = (v: number) => v.toLocaleString();
    const pct = (v: number, decimals = 0) => `${v.toFixed(decimals)}%`;

    return [
      {
        title: 'Case Analyzer Accuracy',
        color: 'accent',
        pillWidth: this.ctx2Accuracy() ?? 0,
        pillText:
          this.ctx2TotalCases() != null
            ? `${fmt(this.ctx2TotalCases()!)} cases`
            : '--',
        pctText:
          this.ctx2Accuracy() != null ? pct(this.ctx2Accuracy()!, 1) : '--',
      },
      {
        title: 'In Progress',
        color: 'cyan',
        pillWidth: this.ctx2InProgressPct(),
        pillText: `${fmt(this.ctx2InProgressAgent())} / ${fmt(this.ctx2InProgressTotal())}`,
        pctText: pct(this.ctx2InProgressPct()),
      },
      {
        title: 'Routed Out',
        color: 'purple',
        pillWidth: this.ctx2RoutedPct(),
        pillText: `${fmt(this.ctx2RoutedAgent())} / ${fmt(this.ctx2RoutedTotal())}`,
        pctText: pct(this.ctx2RoutedPct()),
      },
      {
        title: 'Canceled',
        color: 'amber',
        pillWidth: this.ctx2CancelledPct(),
        pillText: `${fmt(this.ctx2CancelledAgent())} / ${fmt(this.ctx2CancelledTotal())}`,
        pctText: pct(this.ctx2CancelledPct()),
      },
      {
        title: 'Service Requests',
        color: 'green',
        pillWidth: this.ctx2ServicePct(),
        pillText: `${fmt(this.ctx2ServiceAgent())} / ${fmt(this.ctx2ServiceTotal())}`,
        pctText: pct(this.ctx2ServicePct()),
      },
      {
        title: 'Agent vs Ops %',
        color: 'cyan',
        pillWidth: this.ctx2OpsRate(),
        pillText: `${fmt(this.ctx2AgentTotal())} / ${fmt(this.ctx2AgentTotal() + this.ctx2OpsTotal())}`,
        pctText: pct(this.ctx2OpsRate(), 1),
      },
      {
        title: 'Service Incidents',
        color: 'red',
        pillWidth: 0,
        pillText: '',
        pctText: '',
        plain: true,
        plainValue: fmt(this.ctx2ServiceIncidents()),
      },
      {
        title: 'Active Agents',
        color: 'accent',
        pillWidth: this.ctx2ActiveAgentsPct(),
        pillText: `${this.ctx2ActiveAgentsDeployed()} / ${this.ctx2ActiveAgentsTotal()}`,
        pctText: pct(this.ctx2ActiveAgentsPct()),
      },
    ];
  });

  // Context 2: Chart data
  ctx2WeeklyTeamData = signal<any[]>([]);
  ctx2HourlyData = signal<any[]>([]);
  ctx2TxnFailuresLoading = signal<boolean>(true);
  ctx2EspCasesLoading = signal<boolean>(true);
  ctx2IssueDistLoading = signal<boolean>(true);
  ctx2DonutSlices = signal<
    { label: string; color: string; dasharray: string; dashoffset: string }[]
  >([]);
  ctx2DonutTotal = signal<number>(0);
  ctx2DonutLegends = signal<{ label: string; color: string; value: number }[]>(
    [],
  );

  // Context 2: Chart instances
  @ViewChild('ctx2WeeklyTeamCanvas')
  ctx2WeeklyTeamCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ctx2HourlyCanvas')
  ctx2HourlyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ctx2TxnFailuresCanvas')
  ctx2TxnFailuresCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ctx2EspCasesCanvas')
  ctx2EspCasesCanvas?: ElementRef<HTMLCanvasElement>;
  private ctx2WeeklyTeamChart: Chart | null = null;
  private ctx2HourlyChart: Chart | null = null;
  private ctx2TxnFailuresChart: Chart | null = null;
  private ctx2EspCasesChart: Chart | null = null;
  private ctx2ChartsBuilt = false;
  private ctx2RawTxnFailures: any[] = [];
  private ctx2RawEspCases: any[] = [];
  private ctx2RawIssuesDist: any[] = [];

  // Context 3: Large Deal live data
  largeDealSummary = signal<any>(null);
  largeDealByStatus = signal<any[]>([]);
  orderCompletion = signal<any[]>([]);

  // Context 3: placeholder arc dials
  ctx3Dials = signal([
    {
      label: 'Pipeline Coverage',
      value: 73,
      max: 100,
      colorStart: '#0070d2',
      colorEnd: '#00bceb',
      displayFormat: 'PERCENT' as const,
    },
    {
      label: 'Commit Accuracy',
      value: 88,
      max: 100,
      colorStart: '#6ebe4a',
      colorEnd: '#00d4aa',
      displayFormat: 'PERCENT' as const,
    },
    {
      label: 'Best Case Attain.',
      value: 61,
      max: 100,
      colorStart: '#9933ff',
      colorEnd: '#ff6600',
      displayFormat: 'PERCENT' as const,
    },
    {
      label: 'Quota Attainment',
      value: 54,
      max: 100,
      colorStart: '#e6a800',
      colorEnd: '#e53935',
      displayFormat: 'PERCENT' as const,
    },
  ]);

  // Context 3: placeholder KPIs
  ctx3Kpis = signal([
    {
      label: 'Total Pipeline',
      value: '$2.4B',
      sub: '+12% QoQ',
      color: '#0070d2',
    },
    { label: 'Commit', value: '$880M', sub: '88% of plan', color: '#6ebe4a' },
    {
      label: 'Large Deals (>$5M)',
      value: '47',
      sub: '12 new',
      color: '#00bceb',
    },
    { label: 'At-Risk Deals', value: '9', sub: '$214M ARR', color: '#e53935' },
    {
      label: 'Avg Deal Cycle',
      value: '38 days',
      sub: '-4d vs PY',
      color: '#9933ff',
    },
    { label: 'Win Rate', value: '62%', sub: 'vs 58% PY', color: '#00d4aa' },
  ]);

  // Context 3: sparkline canvas refs + chart instances
  @ViewChild('ctx3Spark0') ctx3Spark0?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ctx3Spark1') ctx3Spark1?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ctx3Spark2') ctx3Spark2?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ctx3Spark3') ctx3Spark3?: ElementRef<HTMLCanvasElement>;
  private ctx3SparkCharts: (Chart | null)[] = [null, null, null, null];
  private ctx3ChartsBuilt = false;

  // Context 3: sparkline configs (placeholder trends)
  ctx3Sparklines = signal([
    {
      label: 'Pipeline Trend',
      color: '#0070d2',
      data: [1.8, 1.9, 2.0, 2.1, 2.15, 2.3, 2.4],
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    },
    {
      label: 'Commit vs Quota',
      color: '#6ebe4a',
      data: [72, 75, 78, 80, 83, 86, 88],
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
    },
    {
      label: 'Deal Volume',
      color: '#9933ff',
      data: [31, 34, 38, 40, 42, 45, 47],
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    },
    {
      label: 'Win Rate %',
      color: '#00d4aa',
      data: [55, 57, 59, 58, 60, 61, 62],
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
    },
  ]);

  /** IT Operations 360 cards */
  private readonly itOpsAllCards: LandingCard[] = [
    {
      title: 'Operations Dashboard',
      description:
        'Single view of all disruptions across jobs, transactions, and ESP cases.',
      icon: 'phosphorEyeDuotone',
      route: '/operations-dashboard',
      requiredRoles: ['ADMIN'],
      disabledForRoles: ['EXEC_VIEW'],
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
      title: 'Period Close Management',
      description:
        'Real time visibility for on-time close execution through focused monitoring and control.',
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
      title: 'Continuous Monitoring',
      description:
        'Real-time detection of operational and transaction failures.',
      icon: 'phosphorShieldCheckDuotone',
      route: '/invoice-to-cash',
      requiredRoles: [
        'ADMIN',
        'PERIOD_CLOSE',
        'MONITORING_I2C',
        'MONITORING_I2C_ADMIN',
        'ACCOUNT_RECON',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_OM',
        'MONITORING_OM_ADMIN',
        'MONITORING_WIPS',
        'MONITORING_WIPS_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
      ],
      roleRoutes: [
        {
          roles: ['ADMIN', 'MONITORING_I2C', 'MONITORING_I2C_ADMIN'],
          route: '/invoice-to-cash',
        },
        {
          roles: [
            'ADMIN',
            'ACCOUNT_RECON',
            'MONITORING_REVENUE_ACCOUNTING',
            'MONITORING_REVENUE_ACCOUNTING_ADMIN',
          ],
          route: '/revenue-accounting',
        },
        {
          roles: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
          route: '/order-management',
        },
        {
          roles: ['ADMIN', 'MONITORING_GL_AR', 'MONITORING_GL_AR_ADMIN'],
          route: '/gl-posting',
        },
        {
          roles: ['ADMIN', 'MONITORING_WIPS', 'MONITORING_WIPS_ADMIN'],
          route: '/wips',
        },
        {
          roles: ['ADMIN', 'MONITORING_AIT', 'MONITORING_AIT_ADMIN'],
          route: '/ait',
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
      title: 'CaseIQ',
      description:
        'Real-time insights into case resolution with continuous tracking of agent performance.',
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
        'Real-time insights into Order-to-Cash financials with immediate access to invoice and accounting details.',
      icon: 'phosphorPresentationChartDuotone',
      route: '/business-insights',
      queryParams: { tab: 'o2c-insights' },
      requiredRoles: ['ADMIN', 'SUBSCRIPTION_LIFE_CYCLE'],
      disabledForRoles: ['EXEC_VIEW'],
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
    if (roles.includes('EXEC_VIEW')) return false;
    // IT user if they have any role that's NOT in business roles
    return roles.some((role) => !this.BUSINESS_ROLES.includes(role));
  });

  /** Check if user has the EXEC_VIEW persona (sees both columns, some cards disabled/hidden) */
  private isExecView = computed(() => {
    const roles = this.userRoles();
    if (roles.includes('ADMIN')) return false;
    return roles.includes('EXEC_VIEW');
  });

  // Organize cards into columns based on user role type
  cardColumns = computed(() => {
    const itCards = this.itOpsCards();
    const finCards = this.finBizOpsCards();

    const columns: { header: string; cards: LandingCard[] }[] = [];

    // Admin and Exec View see both columns
    if (this.isAdmin() || this.isExecView()) {
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

  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private http: ApiHttpService,
    public themeService: ThemeService,
  ) {
    this.userName.set(this.authService.getUserName());

    // In the constructor, replace:
    this.userRoles.set(this.authService.getUserAccessRoles());

    // With one of these to test:

    // 1. ADMIN - sees both columns
    // this.userRoles.set(['ADMIN']);

    // 2. Business user - sees only Finance Biz Ops 360
    // this.userRoles.set(['LARGE_DEAL', 'WD0']);

    // 3. IT user - sees only IT Operations 360
    // this.userRoles.set(['EXCEPTION_ADMIN', 'GL_POSTING']);

    // 4. Mixed (has both business + IT roles) - currently shows IT Ops only
    // this.userRoles.set(['LARGE_DEAL', 'EXCEPTION_ADMIN']);

    // this.userRoles.set(['EXEC_VIEW']);
  }

  ngOnInit(): void {
    this.fetchMetrics();
    this.fetchContextData();
    this.fetchContext2Data();
    this.refreshInterval = setInterval(() => {
      this.fetchMetrics();
      this.fetchContextData();
    }, this.REFRESH_INTERVAL_MS);
  }

  private fetchMetrics(): void {
    this.http
      .get('dashboard-metrics', this.destroyManager)
      .subscribe((metrics: any) => {
        this.parseMetrics(metrics as DashboardMetric[]);
      });
  }

  /** Switch the active cockpit context */
  setContext(ctx: number): void {
    this.activeContext.set(ctx);
    if (ctx === 2) {
      this.ctx2ChartsBuilt = false;
    }
    if (ctx === 3) {
      this.ctx3ChartsBuilt = false;
      // destroy so they rebuild fresh when canvases remount
      this.ctx3SparkCharts.forEach((c) => c?.destroy());
      this.ctx3SparkCharts = [null, null, null, null];
    }
  }

  ngAfterViewChecked(): void {
    if (this.activeContext() === 2 && !this.ctx2ChartsBuilt) {
      this.buildCtx2Charts();
    }
    if (this.activeContext() === 3 && !this.ctx3ChartsBuilt) {
      this.buildCtx3Sparklines();
    }
  }

  /** Fetch live context data from the context engine endpoint */
  private fetchContextData(): void {
    this.http
      .get('landing-context', this.destroyManager)
      .subscribe((response: any) => {
        this.parseContextResponse(response);
      });
  }

  /** Parse the combined context engine response */
  private parseContextResponse(response: any): void {
    // Period info (shared)
    if (response.periodInfo) {
      const pi = response.periodInfo;
      this.periodName.set(pi.periodName ?? null);
      this.periodEndDate.set(pi.periodEndDate ?? null);
      this.lastUpdated.set(pi.lastUpdated ?? '');
      this.fiscalQuarter.set(pi.fiscalQuarter ?? null);
      this.isQuarterEnd.set(pi.isQuarterEnd ?? false);
    }

    // Context 1: Period Close
    if (response.context1) {
      const c1 = response.context1;
      this.entityCount.set(c1.entityCount ?? 0);

      // Overall progress
      if (c1.progress) {
        const preclose = c1.progress['PRECLOSE'];
        const midclose = c1.progress['MIDCLOSE'];
        this.precloseCompletionPct.set(
          preclose ? Number(preclose['COMPLETION_PCT'] ?? 0) : 0,
        );
        this.midcloseCompletionPct.set(
          midclose ? Number(midclose['COMPLETION_PCT'] ?? 0) : 0,
        );
      }

      // Category status for arc dials
      if (c1.categoryStatus) {
        this.precloseCategoryStatus.set(c1.categoryStatus['PRECLOSE'] ?? []);
        this.midcloseCategoryStatus.set(c1.categoryStatus['MIDCLOSE'] ?? []);
      }

      // Interface load
      if (c1.interfaceLoad) {
        this.precloseInterfaceLoad.set(c1.interfaceLoad['PRECLOSE'] ?? []);
        this.midcloseInterfaceLoad.set(c1.interfaceLoad['MIDCLOSE'] ?? []);
      }

      // Build live dials from category status
      this.buildPeriodCloseDials();
      this.buildInterfaceLoadStats();
    }

    // Context 2: CaseIQ
    if (response.context2) {
      const c2 = response.context2;
      this.caseiqHealth.set(c2.health ?? null);
      this.caseiqTeamVolumes.set(c2.teamVolumes ?? []);
      this.caseiqWeeklyTrend.set(c2.weeklyTrend ?? []);
    }

    // Context 3: Large Deal
    if (response.context3) {
      const c3 = response.context3;
      this.largeDealSummary.set(c3.summary ?? null);
      this.largeDealByStatus.set(c3.byStatus ?? []);
      this.orderCompletion.set(c3.orderCompletion ?? []);
    }
  }

  /** Build preclose/midclose arc dials from live category completion data */
  private buildPeriodCloseDials(): void {
    const dialConfig = {
      size: 90,
      strokeWidth: 8,
      colorStart: '#00d084',
      colorEnd: '#00bceb',
    };

    const categoryLabels: Record<string, string> = {
      ELIGIBLE_FOR_INVOICING: 'Invoicing',
      INVOICING: 'Invoicing',
      ACCOUNTING: 'AR Accounting',
      INTERCOMPANY: 'Intercompany',
      DEFERRALS: 'Deferrals',
      GL_POSTING: 'GL Posting',
    };

    // Use a subset for the 4-dial display (matching original: Invoicing, AR, Intercompany, GL)
    const displayCategories = [
      'INVOICING',
      'ACCOUNTING',
      'INTERCOMPANY',
      'GL_POSTING',
    ];

    const buildDials = (categories: any[]): DialMetric[] => {
      return displayCategories
        .map((cat) => {
          const row = categories.find((c: any) => c['CATEGORY'] === cat);
          if (!row) return null;
          const total =
            Number(row['TOTAL_OUS'] ?? 0) - Number(row['NA_OUS'] ?? 0);
          const completed = Number(row['COMPLETED_OUS'] ?? 0);
          return {
            value: completed,
            max: total,
            label: categoryLabels[cat] ?? cat,
            displayFormat: 'COUNT' as const,
            ...dialConfig,
          };
        })
        .filter(Boolean) as DialMetric[];
    };

    this.itOpsDials.set(buildDials(this.precloseCategoryStatus()));
    this.finOpsDials.set(buildDials(this.midcloseCategoryStatus()));

    // Update bars with live completion percentage
    this.itOpsBar.set({
      value: this.precloseCompletionPct(),
      label: 'Pre-Close Progress',
    });
    this.finOpsBar.set({
      value: this.midcloseCompletionPct(),
      label: 'Mid-Close Progress',
    });
  }

  /** Build interface load volume stats from live data */
  private buildInterfaceLoadStats(): void {
    const stats: StatMetric[] = [];
    const preclose = this.precloseInterfaceLoad();
    const midclose = this.midcloseInterfaceLoad();

    const buildStatRow = (rows: any[], closeLabel: string): void => {
      for (const row of rows) {
        const lineType = row['LINE_TYPE'];
        const count = Number(row['LINE_COUNT'] ?? 0);
        const mom = row['MOM_PERCENTAGE'];
        const pqm = row['PQM_PERCENTAGE'];
        const qoq = row['QOQ_PERCENTAGE'];
        const yoy = row['YOY_PERCENTAGE'];

        // Pick the most relevant trend based on period position
        let trendPct: number | null = null;
        let trendDir: 'UP' | 'DOWN' | null = null;
        let trendUnit = 'MoM';

        if (this.isQuarterEnd()) {
          const pct = qoq ?? yoy;
          trendUnit = qoq != null ? 'QoQ' : 'YoY';
          if (pct != null) {
            trendPct = Math.abs(Number(pct));
            trendDir = Number(pct) >= 0 ? 'UP' : 'DOWN';
          }
        } else {
          const pct = mom ?? pqm;
          trendUnit = mom != null ? 'MoM' : 'PQM';
          if (pct != null) {
            trendPct = Math.abs(Number(pct));
            trendDir = Number(pct) >= 0 ? 'UP' : 'DOWN';
          }
        }

        stats.push({
          value: this.formatValue(count, null),
          label: `${closeLabel} ${lineType === 'SERVICE' ? 'Service' : 'Product'}`,
          subtitle: null,
          trendPercent: trendPct,
          trendDirection: trendDir,
          trendUnit,
        });
      }
    };

    buildStatRow(preclose, 'Pre-Close');
    buildStatRow(midclose, 'Mid-Close');

    this.volumeStats.set(stats);
  }

  // ========================================================================
  // Context 2: CaseIQ Data + Charts
  // ========================================================================

  /** Fetch all Context 2 data (CaseIQ KPIs + Home charts) */
  private fetchContext2Data(): void {
    const qtr = this.fiscalQuarter() || 'Q4FY26';

    // CaseIQ summary metrics (for KPIs)
    this.http
      .get(`caseiq/summary?fiscQtr=${qtr}`, this.destroyManager)
      .subscribe((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          this.parseCtx2KpiData(data);
        }
      });

    // Weekly volume by team chart
    this.http
      .get(
        `caseiq/charts/weekly-volume-by-team?fiscQtr=${qtr}`,
        this.destroyManager,
      )
      .subscribe((d: any) => {
        this.ctx2WeeklyTeamData.set(Array.isArray(d) ? d : []);
        this.ctx2ChartsBuilt = false;
      });

    // Hourly case pattern
    this.http
      .get(
        'caseiq/charts/hourly-case-pattern?lookbackDays=1',
        this.destroyManager,
      )
      .subscribe((d: any) => {
        this.ctx2HourlyData.set(Array.isArray(d) ? d : []);
        this.ctx2ChartsBuilt = false;
      });

    // Transaction failures (home endpoint)
    this.http
      .get('landing-page-transaction-failures', this.destroyManager)
      .subscribe((d: any) => {
        this.ctx2RawTxnFailures = Array.isArray(d) ? d : [];
        this.ctx2TxnFailuresLoading.set(false);
        this.ctx2ChartsBuilt = false;
      });

    // ESP cases (home endpoint)
    this.http
      .get('landing-page-esp-cases', this.destroyManager)
      .subscribe((d: any) => {
        this.ctx2RawEspCases = Array.isArray(d) ? d : [];
        this.ctx2EspCasesLoading.set(false);
        this.ctx2ChartsBuilt = false;
      });

    // Issue distribution (home endpoint)
    this.http
      .get('landing-page-issues-distribution', this.destroyManager)
      .subscribe((d: any) => {
        this.ctx2RawIssuesDist = Array.isArray(d) ? d : [];
        this.ctx2IssueDistLoading.set(false);
        this.buildCtx2Donut();
      });
  }

  /** Parse CaseIQ summary data into KPI signals */
  private parseCtx2KpiData(data: any[]): void {
    // Find Finance IT section
    const financeIT = data.find((r: any) =>
      (r.SECTION_NAME || '').toLowerCase().includes('finance it'),
    );
    if (!financeIT) return;

    // Accuracy
    const accuracy = financeIT.ACCURACY_PCT ?? financeIT.SUCCESS_RATE_PCT;
    this.ctx2Accuracy.set(accuracy != null ? Number(accuracy) : null);
    this.ctx2TotalCases.set(
      financeIT.TOTAL_CASES != null ? Number(financeIT.TOTAL_CASES) : null,
    );

    // In Progress
    const ipAgent = Number(financeIT.IN_PROGRESS_AGENT ?? 0);
    const ipOps = Number(financeIT.IN_PROGRESS_OPS ?? 0);
    const ipTotal = ipAgent + ipOps;
    this.ctx2InProgressAgent.set(ipAgent);
    this.ctx2InProgressTotal.set(ipTotal);
    this.ctx2InProgressPct.set(
      ipTotal > 0 ? Math.round((ipAgent / ipTotal) * 100) : 0,
    );

    // Routed Out
    const routedAgent = Number(
      financeIT.RECOMMENDED_ROUTE_OUT ?? financeIT.RECOMMENDED_ROUTED_OUT ?? 0,
    );
    const routedOps = Number(
      financeIT.NOT_RECOMMENDED_ROUTE_OUT ??
        financeIT.NOT_RECOMMENDED_ROUTED_OUT ??
        0,
    );
    const routedTotal = routedAgent + routedOps;
    this.ctx2RoutedAgent.set(routedAgent);
    this.ctx2RoutedTotal.set(routedTotal);
    this.ctx2RoutedPct.set(
      routedTotal > 0 ? Math.round((routedAgent / routedTotal) * 100) : 0,
    );

    // Cancelled
    const cancelledAgent = Number(financeIT.RECOMMENDED_CANCELLED ?? 0);
    const cancelledOps = Number(financeIT.NOT_RECOMMENDED_CANCELLED ?? 0);
    const cancelledTotal = cancelledAgent + cancelledOps;
    this.ctx2CancelledAgent.set(cancelledAgent);
    this.ctx2CancelledTotal.set(cancelledTotal);
    this.ctx2CancelledPct.set(
      cancelledTotal > 0
        ? Math.round((cancelledAgent / cancelledTotal) * 100)
        : 0,
    );

    // Service Requests
    const svcAgent = Number(financeIT.RESOLVED_AGENT ?? 0);
    const svcOps = Number(financeIT.RESOLVED_OPS ?? 0);
    const svcTotal = svcAgent + svcOps;
    this.ctx2ServiceAgent.set(svcAgent);
    this.ctx2ServiceTotal.set(svcTotal);
    this.ctx2ServicePct.set(
      svcTotal > 0 ? Math.round((svcAgent / svcTotal) * 100) : 0,
    );

    // Agent vs Ops
    const agentCases = ipAgent + routedAgent + cancelledAgent + svcAgent;
    const opsCases = ipOps + routedOps + cancelledOps + svcOps;
    const totalCasesAll = agentCases + opsCases;
    this.ctx2AgentTotal.set(agentCases);
    this.ctx2OpsTotal.set(opsCases);
    this.ctx2OpsRate.set(
      totalCasesAll > 0
        ? Math.round((agentCases / totalCasesAll) * 1000) / 10
        : 0,
    );

    // Service Incidents
    this.ctx2ServiceIncidents.set(Number(financeIT.SERVICE_INCIDENTS ?? 0));
  }

  /** Build all Context 2 Chart.js charts */
  private buildCtx2Charts(): void {
    let anyBuilt = false;

    // Weekly Team chart
    if (
      this.ctx2WeeklyTeamCanvas?.nativeElement &&
      this.ctx2WeeklyTeamData().length > 0 &&
      !this.ctx2WeeklyTeamChart
    ) {
      this.buildCtx2WeeklyTeamChart();
      anyBuilt = true;
    }

    // Hourly chart
    if (
      this.ctx2HourlyCanvas?.nativeElement &&
      this.ctx2HourlyData().length > 0 &&
      !this.ctx2HourlyChart
    ) {
      this.buildCtx2HourlyChart();
      anyBuilt = true;
    }

    // Transaction Failures chart
    if (
      this.ctx2TxnFailuresCanvas?.nativeElement &&
      this.ctx2RawTxnFailures.length > 0 &&
      !this.ctx2TxnFailuresChart
    ) {
      this.buildCtx2TxnFailuresChart();
      anyBuilt = true;
    }

    // ESP Cases chart
    if (
      this.ctx2EspCasesCanvas?.nativeElement &&
      this.ctx2RawEspCases.length > 0 &&
      !this.ctx2EspCasesChart
    ) {
      this.buildCtx2EspCasesChart();
      anyBuilt = true;
    }

    if (anyBuilt || (this.ctx2WeeklyTeamChart && this.ctx2HourlyChart)) {
      this.ctx2ChartsBuilt = true;
    }
  }

  private readonly ctx2TeamColors: Record<string, string> = {
    'Finance IT': '#0070d2',
    OM: '#00bceb',
    SM: '#6ebe4a',
    I2C: '#9933ff',
    AIT: '#ff6600',
    FPP: '#e6a800',
    P2P: '#e53935',
    CAPITAL: '#00d4aa',
  };

  private buildCtx2WeeklyTeamChart(): void {
    const canvas = this.ctx2WeeklyTeamCanvas?.nativeElement;
    if (!canvas) return;

    const weekMap = new Map<number, Map<string, number>>();
    const teams = new Set<string>();
    for (const row of this.ctx2WeeklyTeamData()) {
      const week = row.WEEK_NUMBER;
      const team = row.TEAM_NAME;
      if (week == null || !team) continue;
      teams.add(team);
      if (!weekMap.has(week)) weekMap.set(week, new Map());
      weekMap.get(week)?.set(team, row.INCIDENT_COUNT ?? 0);
    }

    const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
    const labels = weeks.map((w) => `Week ${w}`);

    const datasets = Array.from(teams)
      .filter((t) => t !== 'UNKNOWN')
      .sort((a, b) => a.localeCompare(b))
      .map((team) => {
        const hex = this.ctx2TeamColors[team] ?? '#555555';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return {
          label: team,
          data: weeks.map((w) => weekMap.get(w)?.get(team) ?? 0),
          borderColor: hex,
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return `rgba(${r}, ${g}, ${b}, 0.1)`;
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            return gradient;
          },
          borderWidth: 2.5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: hex,
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5.5,
          tension: 0.4,
          fill: true,
        };
      });

    this.ctx2WeeklyTeamChart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 10 }, padding: 12 },
          },
          tooltip: {
            backgroundColor: 'rgba(20, 30, 40, 0.9)',
            titleFont: { size: 10 },
            bodyFont: { size: 11 },
            borderColor: 'rgba(0, 188, 235, 0.3)',
            borderWidth: 1,
            cornerRadius: 10,
            padding: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
            },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, maxTicksLimit: 5 },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private buildCtx2HourlyChart(): void {
    const canvas = this.ctx2HourlyCanvas?.nativeElement;
    if (!canvas) return;

    const hourMap = new Map<number, number>();
    for (const row of this.ctx2HourlyData()) {
      hourMap.set(row.HOUR_OF_DAY, row.CASE_COUNT);
    }
    const currentHour = new Date().getHours();
    const hours = Array.from(
      { length: 12 },
      (_, i) => (currentHour - 11 + i + 24) % 24,
    );
    const values = hours.map((h) => hourMap.get(h) ?? 0);
    const labels = hours.map((h) => {
      const suffix = h >= 12 ? 'pm' : 'am';
      let display = h % 12;
      if (display === 0) display = 12;
      return `${display}${suffix}`;
    });

    this.ctx2HourlyChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#00bceb',
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#00bceb',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5.5,
            tension: 0.4,
            fill: true,
            backgroundColor: (ctx: any) => {
              const chart = ctx.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(0, 188, 235, 0.1)';
              const gradient = canvasCtx.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom,
              );
              gradient.addColorStop(0, 'rgba(0, 188, 235, 0.35)');
              gradient.addColorStop(1, 'rgba(0, 188, 235, 0)');
              return gradient;
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20, 30, 40, 0.85)',
            borderColor: 'rgba(0, 188, 235, 0.3)',
            borderWidth: 1,
            cornerRadius: 10,
            displayColors: false,
            callbacks: {
              title: (items) =>
                items[0]?.label ? `${items[0].label} UTC` : '',
              label: (item) => item.parsed.y.toLocaleString() + ' cases',
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
            },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, maxTicksLimit: 5 },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private buildCtx2TxnFailuresChart(): void {
    const canvas = this.ctx2TxnFailuresCanvas?.nativeElement;
    if (!canvas || this.ctx2RawTxnFailures.length === 0) return;

    const qtr = this.fiscalQuarter() || '';
    const filtered = qtr
      ? this.ctx2RawTxnFailures.filter((r: any) => r.QUARTER === qtr)
      : this.ctx2RawTxnFailures;

    const labels = filtered.map((r: any) => r.PERIOD_NAME || r.WEEK || '');
    const values = filtered.map((r: any) => r.FAILURE_COUNT ?? r.COUNT ?? 0);

    this.ctx2TxnFailuresChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: 'rgba(229, 57, 53, 0.7)',
            borderColor: '#e53935',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 9 }, maxRotation: 45 },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 } },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private buildCtx2EspCasesChart(): void {
    const canvas = this.ctx2EspCasesCanvas?.nativeElement;
    if (!canvas || this.ctx2RawEspCases.length === 0) return;

    const qtr = this.fiscalQuarter() || '';
    const filtered = qtr
      ? this.ctx2RawEspCases.filter(
          (r: any) => (r.FISCAL_QTR || r.QUARTER) === qtr,
        )
      : this.ctx2RawEspCases;

    const labels = filtered.map((r: any) => r.PERIOD_NAME || r.WEEK || '');
    const values = filtered.map((r: any) => r.CASE_COUNT ?? r.COUNT ?? 0);

    this.ctx2EspCasesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: 'rgba(0, 188, 235, 0.6)',
            borderColor: '#00bceb',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 9 }, maxRotation: 45 },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 } },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /** Build issue distribution donut data */
  private buildCtx2Donut(): void {
    if (this.ctx2RawIssuesDist.length === 0) return;

    const total = this.ctx2RawIssuesDist.reduce(
      (sum: number, r: any) => sum + Number(r.COUNT ?? r.ISSUE_COUNT ?? 0),
      0,
    );
    this.ctx2DonutTotal.set(total);

    const colors = [
      '#6ebe4a',
      '#00bceb',
      '#0070d2',
      '#9933ff',
      '#ff6600',
      '#e53935',
    ];
    const circumference = 2 * Math.PI * 16; // r=16

    let offset = 0;
    const slices: {
      label: string;
      color: string;
      dasharray: string;
      dashoffset: string;
    }[] = [];
    const legends: { label: string; color: string; value: number }[] = [];

    for (let i = 0; i < this.ctx2RawIssuesDist.length; i++) {
      const row = this.ctx2RawIssuesDist[i];
      const count = Number(row.COUNT ?? row.ISSUE_COUNT ?? 0);
      const pct = total > 0 ? (count / total) * 100 : 0;
      const segmentLen = (pct / 100) * circumference;
      const color = colors[i % colors.length];

      slices.push({
        label: row.ASSIGNEE || row.LABEL || `Segment ${i + 1}`,
        color,
        dasharray: `${segmentLen} ${circumference - segmentLen}`,
        dashoffset: `${-offset}`,
      });

      legends.push({
        label: row.ASSIGNEE || row.LABEL || `Segment ${i + 1}`,
        color,
        value: Math.round(pct),
      });

      offset += segmentLen;
    }

    this.ctx2DonutSlices.set(slices);
    this.ctx2DonutLegends.set(legends);
  }

  // ========================================================================
  // Context 3: Large Deal Sparklines
  // ========================================================================

  private buildCtx3Sparklines(): void {
    const canvases = [
      this.ctx3Spark0,
      this.ctx3Spark1,
      this.ctx3Spark2,
      this.ctx3Spark3,
    ];
    const configs = this.ctx3Sparklines();
    let anyBuilt = false;

    canvases.forEach((ref, i) => {
      if (!ref?.nativeElement || this.ctx3SparkCharts[i]) return;
      const cfg = configs[i];
      if (!cfg) return;

      const hex = cfg.color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      this.ctx3SparkCharts[i] = new Chart(ref.nativeElement, {
        type: 'line',
        data: {
          labels: cfg.labels,
          datasets: [
            {
              data: cfg.data,
              borderColor: hex,
              borderWidth: 2,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: hex,
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.4,
              fill: true,
              backgroundColor: (ctx: any) => {
                const chart = ctx.chart;
                const { ctx: canvasCtx, chartArea } = chart;
                if (!chartArea) return `rgba(${r}, ${g}, ${b}, 0.1)`;
                const grad = canvasCtx.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom,
                );
                grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
                grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                return grad;
              },
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(20, 30, 40, 0.85)',
              borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              titleFont: { size: 10 },
              bodyFont: { size: 11 },
            },
          },
          scales: {
            x: { display: false },
            y: { display: false, beginAtZero: false },
          },
        },
      });
      anyBuilt = true;
    });

    if (anyBuilt) this.ctx3ChartsBuilt = true;
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.ctx2WeeklyTeamChart?.destroy();
    this.ctx2HourlyChart?.destroy();
    this.ctx2TxnFailuresChart?.destroy();
    this.ctx2EspCasesChart?.destroy();
    this.ctx3SparkCharts.forEach((c) => c?.destroy());
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
    // ADMIN overrides everything — never disabled or blocked
    if (roles.includes('ADMIN')) {
      return true;
    }
    // Explicitly disabled for this role — show greyed out
    if (card.disabledForRoles?.some((r) => roles.includes(r))) {
      return false;
    }
    if (!card.requiredRoles?.length) {
      return true;
    }
    if (!roles.length) {
      return true;
    }
    if (roles.includes('ADMIN')) {
      return true;
    }
    // EXEC_VIEW is a pass-through — can access anything not explicitly disabled
    if (roles.includes('EXEC_VIEW')) {
      return true;
    }
    return card.requiredRoles.some((role) => roles.includes(role));
  }

  private filterByRole(cards: LandingCard[]): LandingCard[] {
    const roles = this.userRoles();
    // ADMIN sees all cards regardless of hideForRoles
    if (roles.includes('ADMIN')) {
      return cards;
    }
    return cards.filter(
      (card) => !card.hideForRoles?.some((role) => roles.includes(role)),
    );
  }
}
