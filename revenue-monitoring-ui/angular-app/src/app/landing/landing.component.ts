import {
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
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

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
  imports: [CommonModule, NgIcon, ArcProgressComponent, NgxEchartsDirective],
  providers: [
    provideEchartsCore({ echarts }),
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
export class LandingComponent implements OnInit, OnDestroy {
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

  // Context 2: ECharts options
  ctx2WeeklyTeamOption = signal<EChartsOption | null>(null);
  ctx2HourlyOption = signal<EChartsOption | null>(null);
  ctx2TxnFailuresOption = signal<EChartsOption | null>(null);
  ctx2EspCasesOption = signal<EChartsOption | null>(null);
  private ctx2RawTxnFailures: any[] = [];
  private ctx2RawEspCases: any[] = [];
  private ctx2RawIssuesDist: any[] = [];

  // Context 3: Large Deal live data
  private ctx3RawRevSummary: any[] = [];
  private ctx3RawByProgram: any[] = [];
  private ctx3RawByAccount: any[] = [];

  // Context 3: arc dials (driven by live data)
  ctx3Dials = signal<
    {
      label: string;
      value: number;
      max: number;
      colorStart: string;
      colorEnd: string;
      displayFormat: 'PERCENT' | 'COUNT';
    }[]
  >([
    {
      label: 'Overall Completion',
      value: 0,
      max: 100,
      colorStart: '#0070d2',
      colorEnd: '#00bceb',
      displayFormat: 'PERCENT',
    },
    {
      label: 'CCA Program',
      value: 0,
      max: 100,
      colorStart: '#6ebe4a',
      colorEnd: '#00d4aa',
      displayFormat: 'PERCENT',
    },
    {
      label: 'WPA Program',
      value: 0,
      max: 100,
      colorStart: '#9933ff',
      colorEnd: '#ff6600',
      displayFormat: 'PERCENT',
    },
    {
      label: 'Rev Recognition',
      value: 0,
      max: 100,
      colorStart: '#e6a800',
      colorEnd: '#e53935',
      displayFormat: 'PERCENT',
    },
  ]);

  // Context 3: KPIs (driven by live data)
  ctx3Kpis = signal<
    { label: string; value: string; sub: string; color: string }[]
  >([
    { label: 'Total Order Value', value: '--', sub: '', color: '#0070d2' },
    { label: 'Qtr Rev Estimate', value: '--', sub: '', color: '#00bceb' },
    { label: 'Rev Recognized', value: '--', sub: '', color: '#6ebe4a' },
    {
      label: 'Rev Gap',
      value: '--',
      sub: 'Estimate - Recognized',
      color: '#e53935',
    },
    { label: 'Total Deals', value: '--', sub: '', color: '#9933ff' },
    { label: 'Total Orders', value: '--', sub: '', color: '#e6a800' },
  ]);

  // Context 3: chart options
  @ViewChild('ctxStage') ctxStageEl?: ElementRef<HTMLDivElement>;
  ctx3AccountOption = signal<EChartsOption | null>(null);
  ctx3RevenueOption = signal<EChartsOption | null>(null);

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
    this.fetchContext3Data();
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
    // Animate the stage height so card-sections below rise/fall smoothly
    const el = this.ctxStageEl?.nativeElement;
    if (el) {
      el.style.height = el.offsetHeight + 'px';
      el.style.overflow = 'hidden';
    }

    this.activeContext.set(ctx);

    if (el) {
      // Double rAF: first frame lets Angular render the new @if pane,
      // second frame measures the natural content height (works for both
      // expand and shrink) then animates the container to that height.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const pinnedHeight = el.style.height;

          // Momentarily go to auto to read the real content height.
          // No paint occurs between these synchronous assignments.
          el.style.transition = 'none';
          el.style.height = 'auto';
          const targetHeight = el.offsetHeight; // natural height of new content
          el.style.height = pinnedHeight; // restore pinned height

          // Force the browser to commit the restore before we set the transition.
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          el.offsetHeight;

          el.style.transition = 'height 0.45s ease';
          el.style.height = targetHeight + 'px';
          setTimeout(() => {
            el.style.height = '';
            el.style.overflow = '';
            el.style.transition = '';
          }, 450);
        });
      });
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

    // Context 3: Large Deal (data fetched separately in fetchContext3Data)
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

    // CaseIQ metrics — same endpoint as the CaseIQ dashboard
    this.http
      .get('xxcaseiq-metrics', this.destroyManager)
      .subscribe((data: any) => {
        if (!Array.isArray(data)) return;
        // Filter by quarter, then find Finance IT (TEAM_NAME === 'ALL')
        const filtered = qtr
          ? data.filter((m: any) => m?.FISCAL_QTR === qtr)
          : data;
        const financeIT = filtered.find(
          (m: any) => m?.TEAM_NAME?.toUpperCase() === 'ALL',
        );
        if (financeIT) this.parseCtx2KpiData(financeIT);
      });

    // Accuracy — separate endpoint (same as CaseIQ page)
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        if (!Array.isArray(data)) return;
        const filtered = qtr
          ? data.filter((item: any) => item?.Quarter === qtr)
          : data;
        // Finance IT accuracy = average of Total Accuracy across all teams
        let sum = 0;
        let count = 0;
        for (const item of filtered) {
          const acc = Number(item['Total Accuracy']);
          if (Number.isFinite(acc)) {
            sum += acc;
            count++;
          }
        }
        this.ctx2Accuracy.set(
          count > 0 ? Math.round((sum / count) * 100) / 100 : null,
        );
      });

    // Weekly volume by team chart
    this.http
      .get(
        `caseiq/charts/weekly-volume-by-team?fiscQtr=${qtr}`,
        this.destroyManager,
      )
      .subscribe((d: any) => {
        const data = Array.isArray(d) ? d : [];
        this.ctx2WeeklyTeamData.set(data);
        this.ctx2WeeklyTeamOption.set(
          data.length ? this.buildCtx2WeeklyTeamOption(data) : null,
        );
      });

    // Hourly case pattern
    this.http
      .get(
        'caseiq/charts/hourly-case-pattern?lookbackDays=1',
        this.destroyManager,
      )
      .subscribe((d: any) => {
        const data = Array.isArray(d) ? d : [];
        this.ctx2HourlyData.set(data);
        this.ctx2HourlyOption.set(
          data.length ? this.buildCtx2HourlyOption(data) : null,
        );
      });

    // Transaction failures (home endpoint)
    this.http
      .get('landing-page-transaction-failures', this.destroyManager)
      .subscribe((d: any) => {
        this.ctx2RawTxnFailures = Array.isArray(d) ? d : [];
        this.ctx2TxnFailuresLoading.set(false);
        this.ctx2TxnFailuresOption.set(
          this.ctx2RawTxnFailures.length
            ? this.buildCtx2TxnFailuresOption(this.ctx2RawTxnFailures)
            : null,
        );
      });

    // ESP cases (home endpoint)
    this.http
      .get('landing-page-esp-cases', this.destroyManager)
      .subscribe((d: any) => {
        this.ctx2RawEspCases = Array.isArray(d) ? d : [];
        this.ctx2EspCasesLoading.set(false);
        this.ctx2EspCasesOption.set(
          this.ctx2RawEspCases.length
            ? this.buildCtx2EspCasesOption(this.ctx2RawEspCases)
            : null,
        );
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
  private parseCtx2KpiData(financeIT: any): void {
    // financeIT is already the TEAM_NAME='ALL' row filtered by quarter
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

  private buildCtx2WeeklyTeamOption(rows: any[]): EChartsOption {
    const weekMap = new Map<number, Map<string, number>>();
    const teams = new Set<string>();
    for (const row of rows) {
      const week = row.WEEK_NUMBER;
      const team = row.TEAM_NAME;
      if (week == null || !team) continue;
      teams.add(team);
      if (!weekMap.has(week)) weekMap.set(week, new Map());
      weekMap.get(week)?.set(team, row.INCIDENT_COUNT ?? 0);
    }

    const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
    const labels = weeks.map((w) => `Week ${w}`);

    const series = Array.from(teams)
      .filter((t) => t !== 'UNKNOWN')
      .sort((a, b) => a.localeCompare(b))
      .map((team) => {
        const hex = this.ctx2TeamColors[team] ?? '#555555';
        return {
          name: team,
          type: 'line' as const,
          smooth: true,
          data: weeks.map((w) => weekMap.get(w)?.get(team) ?? 0),
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: hex },
          itemStyle: { color: '#f2f6f9', borderColor: hex, borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${hex}40` },
              { offset: 1, color: `${hex}00` },
            ]),
          },
        };
      });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20, 30, 40, 0.9)',
        borderColor: 'rgba(0, 188, 235, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 11 },
      },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10 },
      },
      grid: { left: 8, right: 8, top: 10, bottom: 42, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9, rotate: 45 },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series,
    };
  }

  private buildCtx2HourlyOption(rows: any[]): EChartsOption {
    const hourMap = new Map<number, number>();
    for (const row of rows) {
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

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20, 30, 40, 0.85)',
        borderColor: 'rgba(0, 188, 235, 0.3)',
        borderWidth: 1,
        formatter: (params: any) => {
          const point = Array.isArray(params) ? params[0] : params;
          return `${point?.axisValue ?? ''} UTC<br/>${Number(point?.data ?? 0).toLocaleString()} cases`;
        },
      },
      legend: { show: false },
      grid: { left: 8, right: 8, top: 10, bottom: 24, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#00bceb' },
          itemStyle: {
            color: '#f2f6f9',
            borderColor: '#00bceb',
            borderWidth: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 188, 235, 0.35)' },
              { offset: 1, color: 'rgba(0, 188, 235, 0)' },
            ]),
          },
        },
      ],
    };
  }

  private buildCtx2TxnFailuresOption(rawRows: any[]): EChartsOption {
    // Same parsing as home.component's applyTransactionFailuresQuarterFilter
    const qtr = this.fiscalQuarter() || '';
    const weekMap = new Map<
      string,
      {
        totalIssues: number;
        inProgress: number;
        resolvedOps: number;
        resolvedAgent: number;
      }
    >();
    const filtered = qtr
      ? rawRows.filter((r: any) => r.QUARTER === qtr)
      : rawRows;

    filtered.forEach((item: any) => {
      const weekLabel = `Week ${item.WEEK_NUMBER}`;
      const count = item.COUNT || 0;
      const category = (item.CATEGORY || '').toString().toLowerCase().trim();
      if (!weekMap.has(weekLabel))
        weekMap.set(weekLabel, {
          totalIssues: 0,
          inProgress: 0,
          resolvedOps: 0,
          resolvedAgent: 0,
        });
      const w = weekMap.get(weekLabel)!;
      if (category === 'total issue' || category === 'total issues')
        w.totalIssues = count;
      else if (category === 'in progress') w.inProgress = count;
      else if (category === 'resolved (ops)') w.resolvedOps = count;
      else if (category === 'resolved (agent)') w.resolvedAgent = count;
    });

    const fixedWeeks = Array.from({ length: 13 }, (_, i) => `Week ${i + 1}`);
    const def = {
      totalIssues: 0,
      inProgress: 0,
      resolvedOps: 0,
      resolvedAgent: 0,
    };
    const totalIssues = fixedWeeks.map(
      (w) => (weekMap.get(w) || def).totalIssues,
    );
    const inProgress = fixedWeeks.map(
      (w) => (weekMap.get(w) || def).inProgress,
    );
    const resolvedOps = fixedWeeks.map(
      (w) => (weekMap.get(w) || def).resolvedOps,
    );
    const resolvedAgent = fixedWeeks.map(
      (w) => (weekMap.get(w) || def).resolvedAgent,
    );

    return this.buildCtx2MixedOption(
      fixedWeeks,
      {
        total: totalIssues,
        inProgress,
        resolvedOps,
        resolvedAgent,
      },
      {
        totalLabel: 'Total Issues',
      },
    );
  }

  private buildCtx2EspCasesOption(rawRows: any[]): EChartsOption {
    // Same parsing as home.component's applyEspCasesQuarterFilter
    const qtr = this.fiscalQuarter() || '';
    const weekMap = new Map<
      number,
      {
        totalCases: number;
        resolvedAgent: number;
        resolvedOps: number;
        inProgress: number;
      }
    >();
    const filtered = qtr
      ? rawRows.filter((r: any) => r.FISCAL_QTR === qtr)
      : rawRows;

    filtered.forEach((item: any) => {
      const weekNum = Number(item.WEEK_NUMBER) || 0;
      weekMap.set(weekNum, {
        totalCases: Number(item.TOTAL_CASES) || 0,
        resolvedAgent: Number(item.RESOLVED_AGENT) || 0,
        resolvedOps: Number(item.RESOLVED_OPS) || 0,
        inProgress: Number(item.IN_PROGRESS) || 0,
      });
    });

    const fixedWeeks = Array.from({ length: 13 }, (_, i) => `Week ${i + 1}`);
    const def = {
      totalCases: 0,
      resolvedAgent: 0,
      resolvedOps: 0,
      inProgress: 0,
    };
    const totalCases = fixedWeeks.map(
      (_, i) => (weekMap.get(i + 1) || def).totalCases,
    );
    const resolvedAgent = fixedWeeks.map(
      (_, i) => (weekMap.get(i + 1) || def).resolvedAgent,
    );
    const resolvedOps = fixedWeeks.map(
      (_, i) => (weekMap.get(i + 1) || def).resolvedOps,
    );
    const inProgress = fixedWeeks.map(
      (_, i) => (weekMap.get(i + 1) || def).inProgress,
    );

    return this.buildCtx2MixedOption(
      fixedWeeks,
      {
        total: totalCases,
        inProgress,
        resolvedOps,
        resolvedAgent,
      },
      {
        totalLabel: 'Total Cases',
      },
    );
  }

  private buildCtx2MixedOption(
    labels: string[],
    data: {
      total: number[];
      inProgress: number[];
      resolvedOps: number[];
      resolvedAgent: number[];
    },
    opts: { totalLabel: string },
  ): EChartsOption {
    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#222',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const rows = (params as any[])
            .map((p) => {
              const name = String(p.seriesName).replace(
                /\s*\([\d,]+\)\s*$/,
                '',
              );
              return `${p.marker} ${name}: ${Number(p.value ?? 0).toLocaleString()}`;
            })
            .join('<br/>');
          const title =
            Array.isArray(params) && params[0] ? params[0].axisValue : '';
          return `${title}<br/>${rows}`;
        },
      },
      legend: {
        top: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
        textStyle: { fontSize: 10 },
      },
      grid: { left: 8, right: 8, top: 28, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 9, rotate: 45 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: { fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
      },
      series: [
        {
          name: `${opts.totalLabel} (${sum(data.total).toLocaleString()})`,
          type: 'bar',
          data: data.total,
          barMaxWidth: 18,
          itemStyle: { color: '#909ca8ef', borderRadius: [4, 4, 0, 0] },
          z: 1,
        },
        {
          name: `In Progress (${sum(data.inProgress).toLocaleString()})`,
          type: 'bar',
          data: data.inProgress,
          barMaxWidth: 18,
          itemStyle: { color: '#f39c12', borderRadius: [4, 4, 0, 0] },
          z: 2,
        },
        {
          name: `Resolved (Ops) (${sum(data.resolvedOps).toLocaleString()})`,
          type: 'line',
          data: data.resolvedOps,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#9933ff', width: 2.5 },
          itemStyle: {
            color: '#f2f6f9',
            borderColor: '#9933ff',
            borderWidth: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(153,51,255,0.55)' },
              { offset: 1, color: 'rgba(153,51,255,0)' },
            ]),
          },
          z: 4,
        },
        {
          name: `Resolved (Agent) (${sum(data.resolvedAgent).toLocaleString()})`,
          type: 'line',
          data: data.resolvedAgent,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#6ebe4a', width: 2.5 },
          itemStyle: {
            color: '#f2f6f9',
            borderColor: '#6ebe4a',
            borderWidth: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(110,190,74,0.55)' },
              { offset: 1, color: 'rgba(110,190,74,0)' },
            ]),
          },
          z: 5,
        },
      ],
    };
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
  // Context 3: Large Deal Charts + Data Fetch
  // ========================================================================

  private fetchContext3Data(): void {
    // 1) Revenue Summary (per deal)
    this.http
      .get('order-status-rev-summary', this.destroyManager)
      .subscribe((data: any) => {
        this.ctx3RawRevSummary = Array.isArray(data) ? data : [];
        this.updateCtx3Kpis();
        this.updateCtx3Dials();
        this.ctx3RevenueOption.set(
          this.ctx3RawRevSummary.length
            ? this.buildCtx3RevenueOption(this.ctx3RawRevSummary)
            : null,
        );
      });

    // 2) By Program
    this.http
      .get('order-status-summary', this.destroyManager)
      .subscribe((data: any) => {
        this.ctx3RawByProgram = Array.isArray(data) ? data : [];
        this.updateCtx3Dials();
      });

    // 3) By Account
    this.http
      .get('large-deal-summary-account', this.destroyManager)
      .subscribe((data: any) => {
        this.ctx3RawByAccount = Array.isArray(data) ? data : [];
        this.ctx3AccountOption.set(
          this.ctx3RawByAccount.length
            ? this.buildCtx3AccountOption(this.ctx3RawByAccount)
            : null,
        );
      });
  }

  private updateCtx3Kpis(): void {
    const rows = this.ctx3RawRevSummary;
    if (!rows.length) return;

    const totalValue = rows.reduce((s, r) => s + (r.TOTAL_ORDER_VALUE ?? 0), 0);
    const revEst = rows.reduce(
      (s, r) => s + (r.CURRENT_QTR_REV_ESTIMATE ?? 0),
      0,
    );
    const invRev = rows.reduce(
      (s, r) => s + (r.CURRENT_QTR_INV_GL_REV ?? 0),
      0,
    );
    const accrRev = rows.reduce(
      (s, r) => s + (r.CURRENT_QTR_ACCR_GL_REV ?? 0),
      0,
    );
    const revRecog = rows.reduce(
      (s, r) => s + (r.CURRENT_QTR_REVENUE_RECOG ?? 0),
      0,
    );
    const revGap = revEst - revRecog;
    const dealCount = new Set(rows.map((r) => r.DEAL_ID)).size;
    const orderCount = rows.reduce((s, r) => s + (r.SALES_ORDER_COUNT ?? 0), 0);

    const fmt = (v: number) => {
      if (v >= 1_000_000_000) return '$' + (v / 1_000_000_000).toFixed(1) + 'B';
      if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
      if (v >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K';
      return '$' + v.toFixed(0);
    };

    this.ctx3Kpis.set([
      {
        label: 'Total Order Value',
        value: fmt(totalValue),
        sub: `${dealCount} deals`,
        color: '#0070d2',
      },
      {
        label: 'Qtr Rev Estimate',
        value: fmt(revEst),
        sub: '',
        color: '#00bceb',
      },
      {
        label: 'Rev Recognized',
        value: fmt(revRecog),
        sub: `Inv ${fmt(invRev)} + Accr ${fmt(accrRev)}`,
        color: '#6ebe4a',
      },
      {
        label: 'Rev Gap',
        value: fmt(revGap),
        sub: 'Estimate − Recognized',
        color: '#e53935',
      },
      {
        label: 'Total Deals',
        value: String(dealCount),
        sub: '',
        color: '#9933ff',
      },
      {
        label: 'Total Orders',
        value: String(orderCount),
        sub: '',
        color: '#e6a800',
      },
    ]);
  }

  private updateCtx3Dials(): void {
    const programRows = this.ctx3RawByProgram;
    const revRows = this.ctx3RawRevSummary;

    // Overall completion: weighted by order count
    const totalOrders = programRows.reduce(
      (s, r) => s + (r.ORDER_COUNT ?? 0),
      0,
    );
    const completedOrders = programRows
      .filter((r) => r.STATUS === 'Completed')
      .reduce((s, r) => s + (r.ORDER_COUNT ?? 0), 0);
    const overallPct =
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // CCA completion
    const ccaRows = programRows.filter((r) => r.PROGRAM_NAME === 'CCA');
    const ccaTotal = ccaRows.reduce((s, r) => s + (r.ORDER_COUNT ?? 0), 0);
    const ccaCompleted = ccaRows
      .filter((r) => r.STATUS === 'Completed')
      .reduce((s, r) => s + (r.ORDER_COUNT ?? 0), 0);
    const ccaPct =
      ccaTotal > 0 ? Math.round((ccaCompleted / ccaTotal) * 100) : 0;

    // WPA completion
    const wpaRows = programRows.filter((r) => r.PROGRAM_NAME === 'WPA');
    const wpaTotal = wpaRows.reduce((s, r) => s + (r.ORDER_COUNT ?? 0), 0);
    const wpaCompleted = wpaRows
      .filter((r) => r.STATUS === 'Completed')
      .reduce((s, r) => s + (r.ORDER_COUNT ?? 0), 0);
    const wpaPct =
      wpaTotal > 0 ? Math.round((wpaCompleted / wpaTotal) * 100) : 0;

    // Revenue recognition ratio
    const revEst = revRows.reduce(
      (s, r) => s + (r.CURRENT_QTR_REV_ESTIMATE ?? 0),
      0,
    );
    const revRecog = revRows.reduce(
      (s, r) => s + (r.CURRENT_QTR_REVENUE_RECOG ?? 0),
      0,
    );
    const revPct = revEst > 0 ? Math.round((revRecog / revEst) * 100) : 0;

    this.ctx3Dials.set([
      {
        label: 'Overall Completion',
        value: overallPct,
        max: 100,
        colorStart: '#0070d2',
        colorEnd: '#00bceb',
        displayFormat: 'PERCENT',
      },
      {
        label: 'CCA Program',
        value: ccaPct,
        max: 100,
        colorStart: '#6ebe4a',
        colorEnd: '#00d4aa',
        displayFormat: 'PERCENT',
      },
      {
        label: 'WPA Program',
        value: wpaPct,
        max: 100,
        colorStart: '#9933ff',
        colorEnd: '#ff6600',
        displayFormat: 'PERCENT',
      },
      {
        label: 'Rev Recognition',
        value: revPct,
        max: 100,
        colorStart: '#e6a800',
        colorEnd: '#e53935',
        displayFormat: 'PERCENT',
      },
    ]);
  }

  private buildCtx3AccountOption(rawInput: any[]): EChartsOption {
    const raw = rawInput.filter(
      (r) => !/^(total|sub total)/i.test((r.ACCOUNT ?? '').trim()),
    );
    const accounts = [...new Set(raw.map((r) => r.ACCOUNT))];
    const statuses = [...new Set(raw.map((r) => r.STATUS))].filter(Boolean);
    const statusColors: Record<string, string> = {
      Completed: '#6ebe4a',
      Cancelled: '#e53935',
      'Scheduled For Invoicing': '#e6a800',
      'Yet To Be Provisioned': '#ff6600',
      'Order Not Booked Yet': '#9933ff',
    };

    const series = statuses.map((status) => ({
      name: status,
      type: 'bar' as const,
      stack: 'total',
      data: accounts.map((acc) => {
        const row = raw.find((r) => r.ACCOUNT === acc && r.STATUS === status);
        return row ? row.ORDER_COUNT : 0;
      }),
      barMaxWidth: 24,
      itemStyle: {
        color: statusColors[status] ?? '#8899a6',
        borderRadius: [4, 4, 0, 0],
      },
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(20, 30, 40, 0.9)',
        textStyle: { color: '#fff', fontSize: 11 },
      },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10 },
      },
      grid: { left: 8, right: 8, top: 10, bottom: 38, containLabel: true },
      xAxis: {
        type: 'category',
        data: accounts,
        axisLabel: { fontSize: 9, rotate: 30 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: { fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(128,128,128,0.1)' } },
      },
      series,
    };
  }

  private buildCtx3RevenueOption(data: any[]): EChartsOption {
    // Aggregate revenue by account
    const accountMap = new Map<
      string,
      { value: number; revEst: number; revRecog: number }
    >();
    data.forEach((r) => {
      const key = r.ACCOUNT ?? 'Unknown';
      const existing = accountMap.get(key) ?? {
        value: 0,
        revEst: 0,
        revRecog: 0,
      };
      existing.value += r.TOTAL_ORDER_VALUE ?? 0;
      existing.revEst += r.CURRENT_QTR_REV_ESTIMATE ?? 0;
      existing.revRecog += r.CURRENT_QTR_REVENUE_RECOG ?? 0;
      accountMap.set(key, existing);
    });

    const accounts = [...accountMap.keys()].sort(
      (a, b) => accountMap.get(b)!.value - accountMap.get(a)!.value,
    );
    const values = accounts.map((a) => accountMap.get(a)!.value / 1_000_000); // in $M

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(20, 30, 40, 0.9)',
        textStyle: { color: '#fff', fontSize: 11 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `${p?.name ?? ''}<br/>$${Number(p?.value ?? 0).toFixed(1)}M`;
        },
      },
      grid: { left: 8, right: 8, top: 10, bottom: 22, containLabel: true },
      xAxis: {
        type: 'value',
        min: 0,
        axisLabel: { fontSize: 10, formatter: '${value}M' },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(128,128,128,0.1)' } },
      },
      yAxis: {
        type: 'category',
        data: accounts,
        axisLabel: { fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Order Value ($M)',
          type: 'bar',
          data: values,
          barMaxWidth: 18,
          itemStyle: {
            color: 'rgba(0, 112, 210, 0.7)',
            borderColor: '#0070d2',
            borderWidth: 1,
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
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
