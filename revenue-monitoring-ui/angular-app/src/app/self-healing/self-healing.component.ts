import {
  Component,
  HostBinding,
  HostListener,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIcon } from '@ng-icons/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ExceptionsComponent } from './exceptions/exceptions.component';
import { ExceptionDetailsComponent } from './exception-details/exception-details.component';
import { SessionsComponent } from './sessions/sessions.component';

Chart.register(...registerables);

interface MenuItem {
  label: string;
  icon: string;
  active?: boolean;
}

interface ActionLog {
  title: string;
  subtitle: string;
  color: 'amber' | 'primary' | 'primary-light';
}

interface KpiCard {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
  bars: number[];
}

interface Session {
  id: string;
  category: string;
  issueType: string;
  status: string;
  statusClass: string;
}

interface CategorySlice {
  label: string;
  percent: number;
  color: string;
  colorEnd: string;
  offset: number;
}

interface CategoryRow {
  category: string;
  analyzed: number;
  reviewed: number;
  underReview: number;
  rate: string;
}

interface RecentRun {
  run_id: number;
  record_id: string;
  core_issue_label: string | null;
  category: string | null;
  analysis_mode: string;
  run_status: string;
  review_status: string;
  created_at: string;
}

interface PatternRow {
  id: string;
  title: string;
  errorSnippet: string;
  confidence: 'HIGH' | 'MED';
  successRate: number;
  seenCount: number;
  category: string;
}

interface TrendPoint {
  date: string;
  total: number;
  completed: number;
  failed: number;
}

interface ResolutionMode {
  mode: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-self-healing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    ExceptionsComponent,
    ExceptionDetailsComponent,
    SessionsComponent,
  ],
  templateUrl: './self-healing.component.html',
  styleUrls: ['./self-healing.component.css'],
})
export class SelfHealingComponent implements OnInit, OnDestroy {
  private readonly API_URL = 'https://i2c-aria-dev.cisco.com/api/runs';

  @ViewChild('trendCanvas') trendCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modesCanvas') modesCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas')
  categoryCanvasRef!: ElementRef<HTMLCanvasElement>;

  private trendChart: Chart | null = null;
  private modesChart: Chart | null = null;
  private categoryChart: Chart | null = null;

  constructor(private http: HttpClient) {}

  /* ── Chart data ── */
  trendData: TrendPoint[] = [];
  trendLoading = false;
  resolutionModes: ResolutionMode[] = [];
  resolutionLoading = false;

  ngOnInit(): void {
    this.fetchRecentExceptions();
    this.fetchRecentSessions();
    this.fetchStatsOverview();
    this.fetchTrends();
    this.fetchResolutionModes();
    // Category data is static — render after view initializes
    setTimeout(() => this.renderCategoryChart(), 0);
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
    this.modesChart?.destroy();
    this.categoryChart?.destroy();
  }

  /* ── Dark Mode ── */
  isDarkMode = false;

  @HostBinding('class.dark-theme')
  get darkThemeClass() {
    return this.isDarkMode;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  /* ── Menu ── */
  showGridMenu = false;
  selectedMenuIndex = 0;
  selectedExceptionId: string | null = null;
  exceptionOrigin: 'command-center' | 'exceptions-queue' = 'command-center';

  menuItems: MenuItem[] = [
    { label: 'Command Center', icon: 'phosphorSquaresFourBold' },
    { label: 'Exceptions', icon: 'phosphorWarningBold' },
    { label: 'Sessions', icon: 'phosphorCrosshairBold' },
    { label: 'Patterns', icon: 'phosphorSparkleBold' },
  ];

  toggleGridMenu(event: Event): void {
    event.stopPropagation();
    this.showGridMenu = !this.showGridMenu;
  }

  onGridMenuItemClick(index: number): void {
    this.showGridMenu = false;
    this.selectedMenuIndex = index;
    this.selectedExceptionId = null;
    if (index === 0) {
      this.rerenderAllCharts();
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showGridMenu = false;
  }

  /* Navigate to exception detail from command center */
  openException(id: string): void {
    this.selectedExceptionId = id;
    this.exceptionOrigin = 'command-center';
    this.selectedMenuIndex = 1;
  }

  /* Navigate to exception detail from exceptions queue */
  openExceptionFromQueue(id: string): void {
    this.selectedExceptionId = id;
    this.exceptionOrigin = 'exceptions-queue';
  }

  /* Back from exception detail — return to origin */
  backFromExceptionDetail(): void {
    if (this.exceptionOrigin === 'command-center') {
      this.selectedExceptionId = null;
      this.selectedMenuIndex = 0;
      this.rerenderAllCharts();
    } else {
      this.selectedExceptionId = null;
    }
  }

  /* Navigate to full exceptions list */
  viewAllExceptions(): void {
    this.selectedExceptionId = null;
    this.selectedMenuIndex = 1;
  }

  /* Back arrow in header — return to command center */
  goBackToCommandCenter(): void {
    this.selectedMenuIndex = 0;
    this.selectedExceptionId = null;
    this.rerenderAllCharts();
  }

  backToQueue(): void {
    this.selectedExceptionId = null;
  }

  /** Re-renders all charts after the command center view is restored. */
  private rerenderAllCharts(): void {
    setTimeout(() => {
      this.renderTrendChart();
      this.renderModesChart();
      this.renderCategoryChart();
    }, 0);
  }

  /* ── Log History Overlay ── */
  showLogHistory = false;

  toggleLogHistory(): void {
    this.showLogHistory = !this.showLogHistory;
  }

  /* ── System Health Ring ── */
  healthTotalExceptions = 1284;
  healthResolvedPct = 96.3;
  healthPendingPct = 3.7;
  healthResolvedCount = 1237;
  healthPendingCount = 47;

  private readonly ringCircumference = 2 * Math.PI * 62; // ~389.56

  get reviewedDasharray(): string {
    const len = (this.healthResolvedPct / 100) * this.ringCircumference;
    return `${len} ${this.ringCircumference - len}`;
  }

  get pendingDasharray(): string {
    const len = (this.healthPendingPct / 100) * this.ringCircumference;
    return `${len} ${this.ringCircumference - len}`;
  }

  get pendingDashoffset(): number {
    return -(this.healthResolvedPct / 100) * this.ringCircumference;
  }

  /* ── Hero ── */
  systemHealth = '99.9%';
  systemDescription =
    'System is performing within optimal parameters. 1,240 nodes are active and synchronized across global regions.';

  /* ── Period Status ── */
  periodStatus = {
    periodName: 'APR-26',
    periodEndDate: '04/25/2026',
    lastUpdated: new Date().toLocaleString(),
  };

  /* ── Action Logs ── */
  actionLogs: ActionLog[] = [
    {
      title: 'Memory leak suppressed in Cluster-A7',
      subtitle: '2 minutes ago • Automated Fix',
      color: 'amber',
    },
    {
      title: 'New session #SES-94821-X initiated',
      subtitle: '5 minutes ago • Inbound Request',
      color: 'primary',
    },
    {
      title: 'Global Sync complete across 12 nodes',
      subtitle: '12 minutes ago • Scheduled Task',
      color: 'primary-light',
    },
  ];

  /* ── KPI Cards ── */
  kpiCards: KpiCard[] = [
    { label: 'Exceptions Analysed', value: '—', bars: [40, 60, 30, 80] },
    {
      label: 'Under Review',
      value: '—',
      highlight: true,
      highlightColor: 'amber',
      bars: [80, 50, 60, 30],
    },
    { label: 'Reviewed', value: '—', bars: [20, 40, 70, 90] },
    { label: 'Auto-Routing Active', value: '—', bars: [40, 40, 40, 40] },
    { label: 'Avg Analysis Time', value: '—', bars: [60, 40, 20, 15] },
  ];

  private fetchStatsOverview(): void {
    this.http
      .get<{
        data: {
          totals: {
            total_runs: number;
            pending_review: number;
            reviewed: number;
            avg_response_sec: string;
          };
        };
      }>('https://i2c-aria-dev.cisco.com/api/stats/overview')
      .subscribe({
        next: (res) => {
          const t = res.data.totals;
          this.kpiCards = [
            {
              label: 'Exceptions Analysed',
              value: t.total_runs.toLocaleString(),
              bars: [40, 60, 30, 80],
            },
            {
              label: 'Under Review',
              value: t.pending_review.toLocaleString(),
              highlight: true,
              highlightColor: 'amber',
              bars: [80, 50, 60, 30],
            },
            {
              label: 'Reviewed',
              value: t.reviewed.toLocaleString(),
              bars: [20, 40, 70, 90],
            },
            {
              label: 'Auto-Routing Active',
              value: '—',
              bars: [40, 40, 40, 40],
            },
            { label: 'Avg Analysis Time', value: '—', bars: [60, 40, 20, 15] },
          ];
        },
        error: () => {},
      });
  }

  /* ── Trends ── */
  private fetchTrends(): void {
    this.trendLoading = true;
    this.http
      .get<{
        data: TrendPoint[];
      }>('https://i2c-aria-dev.cisco.com/api/stats/trends?period=30d')
      .subscribe({
        next: (res) => {
          this.trendData = (res.data || []).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          this.trendLoading = false;
          setTimeout(() => this.renderTrendChart(), 0);
        },
        error: () => {
          this.trendLoading = false;
        },
      });
  }

  private renderTrendChart(): void {
    if (!this.trendCanvasRef || this.trendData.length < 2) return;
    this.trendChart?.destroy();
    const labels = this.trendData.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    );
    this.trendChart = new Chart(this.trendCanvasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total',
            data: this.trendData.map((d) => d.total),
            borderColor: '#0070d2',
            backgroundColor: 'rgba(0, 112, 210, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#0070d2',
            borderWidth: 2,
          },
          {
            label: 'Completed',
            data: this.trendData.map((d) => d.completed),
            borderColor: '#6ebe4a',
            backgroundColor: 'rgba(110, 190, 74, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#6ebe4a',
            borderWidth: 2,
          },
          {
            label: 'Failed',
            data: this.trendData.map((d) => d.failed),
            borderColor: '#e53935',
            backgroundColor: 'rgba(229, 57, 53, 0.05)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#e53935',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { usePointStyle: true, padding: 16, font: { size: 11 } },
          },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { font: { size: 10 } },
          },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
      },
    });
  }

  /* ── Resolution Modes ── */
  private fetchResolutionModes(): void {
    this.resolutionLoading = true;
    this.http
      .get<{
        data: ResolutionMode[];
      }>('https://i2c-aria-dev.cisco.com/api/stats/resolution-modes')
      .subscribe({
        next: (res) => {
          this.resolutionModes = res.data || [];
          this.resolutionLoading = false;
          setTimeout(() => this.renderModesChart(), 0);
        },
        error: () => {
          this.resolutionLoading = false;
        },
      });
  }

  private renderModesChart(): void {
    if (!this.modesCanvasRef || !this.resolutionModes.length) return;
    this.modesChart?.destroy();
    const colors = ['#0070d2', '#00bceb', '#9933ff', '#6ebe4a', '#e6a800'];
    const labels = this.resolutionModes.map((m) =>
      m.mode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    );
    this.modesChart = new Chart(this.modesCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Count',
            data: this.resolutionModes.map((m) => m.count),
            backgroundColor: this.resolutionModes.map(
              (_, i) => colors[i % colors.length],
            ),
            borderRadius: 6,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const m = this.resolutionModes[ctx.dataIndex];
                return `${m.count} (${m.percentage}%)`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  /* ── Donut Chart ── */
  donutTotal = '1.2k';
  categorySlices: CategorySlice[] = [
    {
      label: 'Revenue',
      percent: 41,
      color: '#00bceb',
      colorEnd: '#33d4f5',
      offset: 0,
    },
    {
      label: 'Billing',
      percent: 21,
      color: '#ff9000',
      colorEnd: '#ffb04d',
      offset: -45,
    },
    {
      label: 'Attribution',
      percent: 26,
      color: '#87e15d',
      colorEnd: '#a8ec85',
      offset: -70,
    },
  ];

  /* ── Exceptions by Category Table ── */
  categoryTableData: CategoryRow[] = [
    {
      category: 'Revenue',
      analyzed: 527,
      reviewed: 507,
      underReview: 20,
      rate: '96.2%',
    },
    {
      category: 'Billing',
      analyzed: 424,
      reviewed: 411,
      underReview: 13,
      rate: '96.9%',
    },
    {
      category: 'Attribution',
      analyzed: 333,
      reviewed: 319,
      underReview: 14,
      rate: '95.8%',
    },
  ];

  /* ── Category Stacked Bar Chart ── */
  renderCategoryChart(): void {
    if (!this.categoryCanvasRef || !this.categoryTableData.length) return;
    this.categoryChart?.destroy();
    const labels = this.categoryTableData.map((r) => r.category);
    this.categoryChart = new Chart(this.categoryCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Reviewed',
            data: this.categoryTableData.map((r) => r.reviewed),
            backgroundColor: '#6ebe4a',
            borderRadius: 4,
            maxBarThickness: 48,
          },
          {
            label: 'Under Review',
            data: this.categoryTableData.map((r) => r.underReview),
            backgroundColor: '#e6a800',
            borderRadius: 4,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { usePointStyle: true, padding: 16, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const row = this.categoryTableData[ctx.dataIndex];
                const val = ctx.raw as number;
                const pct =
                  row.analyzed > 0
                    ? ((val / row.analyzed) * 100).toFixed(1)
                    : '0';
                return `${ctx.dataset.label}: ${val} (${pct}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  /* ── Active Sessions ── */
  sessions: Session[] = [
    {
      id: '#SES-94821-X',
      category: 'Revenue',
      issueType: 'Auth Failure',
      status: 'AWAITING_UPSTREAM',
      statusClass: 'status--awaiting',
    },
    {
      id: '#SES-94825-B',
      category: 'Billing',
      issueType: 'Duplicate Invoice',
      status: 'PENDING',
      statusClass: 'status--pending',
    },
    {
      id: '#SES-94830-L',
      category: 'Attribution',
      issueType: 'Token Expiry',
      status: 'PENDING',
      statusClass: 'status--pending',
    },
    {
      id: '#SES-94832-M',
      category: 'Revenue',
      issueType: 'Gateway Timeout',
      status: 'FAILED',
      statusClass: 'status--failed',
    },
  ];

  /* ── Patterns ── */
  patternSearch = '';
  patternConfidenceFilter = 'all';
  patternCategoryFilter = 'all';
  patternsDisplayCount = 6;

  allPatterns: PatternRow[] = [
    {
      id: 'PTRN-88219',
      title: 'Socket Hangup Exception',
      errorSnippet: 'Error: ETIMEDOUT at TCPConnectWrap.afterCo...',
      confidence: 'HIGH',
      successRate: 94,
      seenCount: 1242,
      category: 'Network',
    },
    {
      id: 'PTRN-44912',
      title: 'SQL Transaction Deadlock',
      errorSnippet: 'Transaction (Process ID 72) was deadlocked...',
      confidence: 'MED',
      successRate: 68,
      seenCount: 452,
      category: 'Database',
    },
    {
      id: 'PTRN-12093',
      title: 'Memory Leak Warning',
      errorSnippet: 'Heap usage near limit: 94.2% [2048mb / 217...',
      confidence: 'HIGH',
      successRate: 82,
      seenCount: 89,
      category: 'Infrastructure',
    },
    {
      id: 'PTRN-55100',
      title: 'Invalid API Key Signature',
      errorSnippet: '401 Unauthorized: The request signature do...',
      confidence: 'HIGH',
      successRate: 99,
      seenCount: 2104,
      category: 'Auth',
    },
    {
      id: 'PTRN-99023',
      title: 'Permission Denied (S3)',
      errorSnippet: 'AccessDenied: User is not authorized to pe...',
      confidence: 'MED',
      successRate: 41,
      seenCount: 312,
      category: 'Auth',
    },
    {
      id: 'PTRN-00122',
      title: 'Worker Process Crash',
      errorSnippet: 'FATAL ERROR: Ineffective mark-compacts nea...',
      confidence: 'HIGH',
      successRate: 76,
      seenCount: 156,
      category: 'Infrastructure',
    },
    {
      id: 'PTRN-33401',
      title: 'Rate Limit Exceeded',
      errorSnippet: '429 Too Many Requests: Rate limit exceeded ...',
      confidence: 'HIGH',
      successRate: 91,
      seenCount: 834,
      category: 'Network',
    },
    {
      id: 'PTRN-77012',
      title: 'Certificate Expiry Warning',
      errorSnippet: 'SSL: CERTIFICATE_VERIFY_FAILED cert expire...',
      confidence: 'MED',
      successRate: 55,
      seenCount: 67,
      category: 'Network',
    },
  ];

  get recentPatterns(): PatternRow[] {
    return this.allPatterns.slice(0, 4);
  }

  get filteredPatterns(): PatternRow[] {
    let patterns = this.allPatterns;
    if (this.patternSearch) {
      const q = this.patternSearch.toLowerCase();
      patterns = patterns.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.errorSnippet.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    if (this.patternConfidenceFilter !== 'all') {
      patterns = patterns.filter(
        (p) => p.confidence === this.patternConfidenceFilter,
      );
    }
    if (this.patternCategoryFilter !== 'all') {
      patterns = patterns.filter(
        (p) => p.category === this.patternCategoryFilter,
      );
    }
    return patterns.slice(0, this.patternsDisplayCount);
  }

  get patternCategories(): string[] {
    return [...new Set(this.allPatterns.map((p) => p.category))];
  }

  viewAllPatterns(): void {
    this.selectedMenuIndex = 3;
  }

  openPatternDetail(id: string): void {
    /* Navigate to patterns full view */
    this.selectedMenuIndex = 3;
  }

  loadMorePatterns(): void {
    this.patternsDisplayCount += 6;
  }

  getSuccessBarColor(rate: number): string {
    if (rate >= 80) return 'var(--sh-cyan)';
    if (rate >= 60) return 'var(--sh-amber)';
    return 'var(--sh-red)';
  }

  /* ── Recent Sessions ── */
  recentSessions: {
    session_id: string;
    upstream_contact: string;
    session_status: string;
    follow_up_count: number;
    updated_at: string;
  }[] = [];
  recentSessionsLoading = false;

  private fetchRecentSessions(): void {
    this.recentSessionsLoading = true;
    this.http
      .get<{
        data: any[];
        meta: any;
      }>('https://i2c-aria-dev.cisco.com/api/sessions?page=1&page_size=10')
      .subscribe({
        next: (res) => {
          this.recentSessions = (res.data || [])
            .sort(
              (a, b) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime(),
            )
            .slice(0, 4);
          this.recentSessionsLoading = false;
        },
        error: () => {
          this.recentSessionsLoading = false;
        },
      });
  }

  stripDomain(email: string): string {
    if (!email) return '—';
    return email.replace(/@cisco\.com$/i, '');
  }

  getSessionStatusClass(status: string): string {
    switch (status) {
      case 'resolved':
        return 'sh__session-status--resolved';
      case 'awaiting_upstream':
        return 'sh__session-status--awaiting';
      case 'in_progress':
        return 'sh__session-status--progress';
      case 'closed':
        return 'sh__session-status--closed';
      default:
        return 'sh__run-status--default';
    }
  }

  /* ── Exceptions Table ── */
  recentExceptions: RecentRun[] = [];
  recentExceptionsLoading = false;

  private fetchRecentExceptions(): void {
    this.recentExceptionsLoading = true;
    this.http
      .get<{
        data: RecentRun[];
        meta: any;
      }>(`${this.API_URL}?page=1&page_size=4`)
      .subscribe({
        next: (res) => {
          this.recentExceptions = res.data
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(0, 4);
          this.recentExceptionsLoading = false;
        },
        error: () => {
          this.recentExceptionsLoading = false;
        },
      });
  }

  formatStatus(status: string): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getRunStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'sh__run-status--completed';
      case 'running':
        return 'sh__run-status--running';
      case 'failed':
        return 'sh__run-status--failed';
      default:
        return 'sh__run-status--default';
    }
  }

  formatTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
}
