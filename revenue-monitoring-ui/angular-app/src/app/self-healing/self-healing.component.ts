import { Component, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIcon } from '@ng-icons/core';
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
import { ExceptionsComponent } from './exceptions/exceptions.component';
import { ExceptionDetailsComponent } from './exception-details/exception-details.component';
import { ThemeService } from '../providers/theme.service';
import { DataService } from '../providers/data.service';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface KpiCard {
  label: string;
  value: string;
}

interface RecentRun {
  run_id: number;
  record_id: string;
  core_issue_label: string | null;
  category: string | null;
  analysis_mode: string;
  run_status: string;
  review_status: string;
  run_created_at: string;
  session_id: string | null;
  session_status: string | null;
  upstream_contact: string | null;
  follow_up_count: number | null;
  session_created_at: string | null;
  last_activity_at: string | null;
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
  reviewCompleted: number;
  reviewRejected: number;
  analysisCompleted: number;
  analysisFailed: number;
}

@Component({
  selector: 'app-self-healing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    NgxEchartsDirective,
    ExceptionsComponent,
    ExceptionDetailsComponent,
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './self-healing.component.html',
  styleUrls: ['./self-healing.component.css'],
})
export class SelfHealingComponent implements OnInit, OnDestroy {
  private readonly API_URL = 'https://i2c-aria-dev.cisco.com/api/runs';

  constructor(
    private http: HttpClient,
    public themeService: ThemeService,
    private dataService: DataService,
  ) {}

  trendData: TrendPoint[] = [];
  trendLoading = false;
  trendChartOptions: EChartsOption = {};
  categoryChartOptions: EChartsOption = {};

  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.fetchRecentExceptions();
    this.fetchStatsOverview();
    this.fetchTrends();
    this.fetchCategoryModeData();
  }

  ngOnDestroy(): void {}

  @HostBinding('class.dark-theme')
  get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  /* ── Filters ── */
  selectedQuarter = 'Q3-FY26';
  selectedTimeRange = '24h';

  /* ── Menu ── */
  selectedMenuIndex = 0;
  selectedExceptionId: string | null = null;
  exceptionOrigin: 'command-center' | 'exceptions-queue' = 'command-center';

  menuItems = [
    { label: 'Command Center' },
    { label: 'Exceptions' },
    { label: 'Patterns' },
  ];

  openException(id: string): void {
    this.selectedExceptionId = id;
    this.exceptionOrigin = 'command-center';
    this.selectedMenuIndex = 1;
  }

  openExceptionFromQueue(id: string): void {
    this.selectedExceptionId = id;
    this.exceptionOrigin = 'exceptions-queue';
  }

  backFromExceptionDetail(): void {
    if (this.exceptionOrigin === 'command-center') {
      this.selectedExceptionId = null;
      this.selectedMenuIndex = 0;
    } else {
      this.selectedExceptionId = null;
    }
  }

  viewAllExceptions(): void {
    this.selectedExceptionId = null;
    this.selectedMenuIndex = 1;
  }

  goBackToCommandCenter(): void {
    this.selectedMenuIndex = 0;
    this.selectedExceptionId = null;
  }

  /* ── Period Status ── */
  periodStatus: any;

  getErrorSummaryPeriodStatus() {
    this.dataService.periodStatus$.subscribe((data: any) => {
      if (data) {
        this.periodStatus = {
          ...data,
          lastUpdated: new Date().toLocaleString(),
        };
      }
    });
  }

  /* ── KPI Cards ── */
  kpiCards: KpiCard[] = [
    { label: 'Exceptions Analysed', value: '—' },
    { label: 'Under Review', value: '—' },
    { label: 'Auto-Routing Active', value: '—' },
    { label: 'Avg Analysis Time', value: '—' },
    { label: 'Avg Token Usage', value: '—' },
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
            total_tokens_used: number;
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
            },
            { label: 'Under Review', value: t.pending_review.toLocaleString() },
            { label: 'Auto-Routing Active', value: '0' },
            {
              label: 'Avg Analysis Time',
              value: t.avg_response_sec.toLocaleString() + ' sec',
            },
            {
              label: 'Avg Token Usage',
              value:
                t.total_runs > 0
                  ? Math.round(
                      t.total_tokens_used / t.total_runs,
                    ).toLocaleString()
                  : '0',
            },
          ];
        },
        error: () => {},
      });
  }

  /* ── Trends ── */

  private fetchTrends(): void {
    this.trendLoading = true;
    this.http
      .get<any>('https://i2c-aria-dev.cisco.com/api/stats/trends')
      .subscribe({
        next: (res) => {
          const items: any[] = Array.isArray(res) ? res : res.data || [];
          this.trendData = items.map((d: any) => ({
            date: d.date,
            reviewCompleted: 0,
            reviewRejected: 0,
            analysisCompleted: d.completed ?? 0,
            analysisFailed: d.failed ?? 0,
          }));
          this.trendLoading = false;
          this.renderTrendChart();
        },
        error: () => {
          this.trendLoading = false;
        },
      });
  }

  private renderTrendChart(): void {
    if (this.trendData.length < 2) return;
    const labels = this.trendData.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    );

    const seriesConfig = [
      {
        name: 'Analysis Completed',
        key: 'analysisCompleted',
        color: '#0070d2',
      },
      { name: 'Analysis Failed', key: 'analysisFailed', color: '#e53935' },
      { name: 'Review Accepted', key: 'reviewCompleted', color: '#6ebe4a' },
      { name: 'Review Rejected', key: 'reviewRejected', color: '#ff6600' },
    ];

    const series = seriesConfig
      .map((s) => {
        const data = this.trendData.map((d) => (d as any)[s.key] as number);
        const hasData = data.some((v) => v > 0);
        if (!hasData) return null;
        return {
          name: s.name,
          type: 'line' as const,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: s.color },
          itemStyle: { color: s.color },
          areaStyle: { color: s.color, opacity: 0.06 },
          data,
        };
      })
      .filter(Boolean);

    this.trendChartOptions = {
      tooltip: { trigger: 'axis' },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      grid: { top: 20, right: 20, bottom: 50, left: 50 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      },
      series,
    };
  }

  /* ── Category x Mode (stacked bar) ── */
  categoryModeData: { category: string; [mode: string]: string | number }[] =
    [];
  categoryModes: string[] = [];

  private readonly modeColors: Record<string, string> = {
    Agentic: '#0070d2',
    Guided: '#00bceb',
    'Pattren Match': '#9933ff',
  };

  private fetchCategoryModeData(): void {
    this.http
      .get<any>('https://i2c-aria-dev.cisco.com/api/stats/resolution-modes')
      .subscribe({
        next: (res) => {
          const items: any[] = Array.isArray(res) ? res : res.data || [];
          const categories = [
            ...new Set(items.map((r: any) => r.category)),
          ] as string[];
          const modes = [...new Set(items.map((r: any) => r.mode))] as string[];
          this.categoryModeData = categories.map((cat) => {
            const row: any = { category: cat };
            for (const mode of modes) {
              const match = items.find(
                (r: any) => r.category === cat && r.mode === mode,
              );
              row[mode] = match ? match.count : 0;
            }
            return row;
          });
          this.categoryModes = modes;
          this.renderCategoryChart();
        },
        error: () => {},
      });
  }

  renderCategoryChart(): void {
    if (!this.categoryModeData.length) return;
    const categories = this.categoryModeData.map((r) => r.category as string);

    const series = this.categoryModes.map((mode) => ({
      name: this.formatStatus(mode),
      type: 'bar' as const,
      stack: 'total',
      barMaxWidth: 48,
      itemStyle: {
        color: this.modeColors[mode] || '#888',
        borderRadius: [4, 4, 0, 0],
      },
      data: this.categoryModeData.map((r) => (r[mode] as number) || 0),
    }));

    this.categoryChartOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      grid: { top: 20, right: 20, bottom: 50, left: 50 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      },
      series,
    };
  }

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
    this.selectedMenuIndex = 2;
  }

  loadMorePatterns(): void {
    this.patternsDisplayCount += 6;
  }

  getSuccessBarColor(rate: number): string {
    if (rate >= 80) return 'var(--sh-cyan)';
    if (rate >= 60) return 'var(--sh-amber)';
    return 'var(--sh-red)';
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
      }>(`${this.API_URL}/combined?page=1&page_size=8`)
      .subscribe({
        next: (res) => {
          this.recentExceptions = res.data
            .sort(
              (a, b) =>
                new Date(b.run_created_at).getTime() -
                new Date(a.run_created_at).getTime(),
            )
            .slice(0, 8);
          this.recentExceptionsLoading = false;
        },
        error: () => {
          this.recentExceptionsLoading = false;
        },
      });
  }

  formatStatus(status: string): string {
    if (!status) return '\u2014';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getRunStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'sh__run-status--completed';
      case 'RESOLVED':
        return 'sh__run-status--completed';
      case 'running':
        return 'sh__run-status--running';
      case 'failed':
        return 'sh__run-status--failed';
      default:
        return 'sh__run-status--default';
    }
  }

  getReviewStatusClass(status: string): string {
    switch (status) {
      case 'reviewed':
        return 'sh__review--reviewed';
      case 'pending_review':
        return 'sh__review--pending';
      case 'rejected':
        return 'sh__review--rejected';
      default:
        return '';
    }
  }

  getAnalysisModeClass(mode: string): string {
    switch (mode?.toLowerCase()) {
      case 'agentic':
        return 'sh__mode--agent-full';
      case 'guided':
        return 'sh__mode--static';
      case 'pattren match':
      case 'pattern match':
        return 'sh__mode--pattern-match';
      default:
        return '';
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

  formatDateShort(dateStr: string | null): string {
    if (!dateStr) return '\u2014';
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
}
