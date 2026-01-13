import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { Chart, registerables } from 'chart.js';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';

Chart.register(...registerables);

interface PageVisitSummary {
  PAGE_ROUTE: string;
  TOTAL_VISITS: number;
  UNIQUE_USERS: number;
}

interface ChartDataset {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

// Helper to normalize keys to uppercase (Oracle returns uppercase)
function normalizeData(data: any[]): PageVisitSummary[] {
  return data.map((item) => ({
    PAGE_ROUTE: item.PAGE_ROUTE || item.page_route || '',
    TOTAL_VISITS: Number(item.TOTAL_VISITS || item.total_visits || 0),
    UNIQUE_USERS: Number(item.UNIQUE_USERS || item.unique_users || 0),
  }));
}

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, LoadingSymbolComponent],
  providers: [DestroyManager],
})
export class AnalyticsDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  isLoading = true;
  summaryData: PageVisitSummary[] = [];

  // Charts
  private continuousMonitoringChart: Chart | null = null;
  private caseIqChart: Chart | null = null;
  private businessInsightsChart: Chart | null = null;
  private topPagesChart: Chart | null = null;
  private uniqueUsersChart: Chart | null = null;

  // Color palettes
  private readonly COLORS = {
    blue: ['#0066cc', '#3399ff', '#66b3ff', '#99ccff', '#cce6ff'],
    green: ['#00aa55', '#33cc77', '#66dd99', '#99eebb', '#ccffdd'],
    purple: ['#6600cc', '#9933ff', '#b366ff', '#cc99ff', '#e6ccff'],
    orange: ['#ff6600', '#ff8833', '#ffaa66', '#ffcc99', '#ffeecc'],
    red: ['#cc0033', '#ff3366', '#ff6699', '#ff99cc', '#ffccdd'],
    cisco: [
      '#049fd9',
      '#00bceb',
      '#64bbe3',
      '#005073',
      '#7f7f7f',
      '#1e4471',
      '#fbab18',
      '#6ebe4a',
    ],
  };

  // Stats
  totalVisits = 0;
  uniqueUsers = 0;
  topPage = '';
  lastUpdated = '';

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  ngOnDestroy(): void {
    // Destroy all charts to prevent memory leaks
    this.destroyAllCharts();
  }

  private destroyAllCharts(): void {
    if (this.continuousMonitoringChart) {
      this.continuousMonitoringChart.destroy();
      this.continuousMonitoringChart = null;
    }
    if (this.caseIqChart) {
      this.caseIqChart.destroy();
      this.caseIqChart = null;
    }
    if (this.businessInsightsChart) {
      this.businessInsightsChart.destroy();
      this.businessInsightsChart = null;
    }
    if (this.topPagesChart) {
      this.topPagesChart.destroy();
      this.topPagesChart = null;
    }
    if (this.uniqueUsersChart) {
      this.uniqueUsersChart.destroy();
      this.uniqueUsersChart = null;
    }
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    console.log('Fetching analytics data from: page-visit-summary');
    this.http.get('page-visit-summary', this.destroyManager).subscribe({
      next: (data: any) => {
        console.log('Raw analytics data received:', data);
        this.summaryData = normalizeData(data as any[]);
        console.log('Normalized data:', this.summaryData);
        this.calculateStats();
        this.lastUpdated = new Date().toLocaleString();

        // Initialize charts after data loads and DOM is ready
        setTimeout(() => {
          this.initializeCharts();
          this.isLoading = false;
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load analytics data:', err);
        this.isLoading = false;
      },
    });
  }

  private calculateStats(): void {
    this.totalVisits = this.summaryData.reduce(
      (sum, item) => sum + Number(item.TOTAL_VISITS),
      0
    );

    // Get unique users from the data (can't just sum since same user might visit multiple pages)
    const userSet = new Set<number>();
    this.summaryData.forEach((item) => userSet.add(Number(item.UNIQUE_USERS)));
    this.uniqueUsers = Math.max(
      ...this.summaryData.map((item) => Number(item.UNIQUE_USERS)),
      0
    );

    if (this.summaryData.length > 0) {
      this.topPage = this.summaryData[0].PAGE_ROUTE;
    }
  }

  private initializeCharts(): void {
    this.destroyAllCharts();
    this.createContinuousMonitoringChart();
    this.createCaseIqChart();
    this.createBusinessInsightsChart();
    this.createTopPagesChart();
    this.createUniqueUsersChart();
  }

  private filterByPrefix(prefix: string): PageVisitSummary[] {
    return this.summaryData.filter((item) =>
      item.PAGE_ROUTE.startsWith(prefix)
    );
  }

  private extractTabName(route: string): string {
    const parts = route.split('/');
    const lastPart = parts[parts.length - 1];
    // Convert slug to title case: "pre-invoicing" -> "Pre Invoicing"
    return lastPart
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private createDonutChart(
    canvasId: string,
    data: PageVisitSummary[],
    title: string,
    colors: string[]
  ): Chart | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas || data.length === 0) return null;

    const labels = data.map((item) => this.extractTabName(item.PAGE_ROUTE));
    const values = data.map((item) => Number(item.TOTAL_VISITS));

    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 11 },
            },
          },
          title: {
            display: true,
            text: title,
            font: { size: 14, weight: 'bold' },
            padding: { bottom: 10 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = values.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} visits (${percentage}%)`;
              },
            },
          },
        },
        cutout: '60%',
      },
    });
  }

  private createContinuousMonitoringChart(): void {
    // Combine all monitoring-related routes
    const invoiceData = this.filterByPrefix('/invoice-to-cash/');
    const revenueData = this.filterByPrefix('/revenue-accounting/');
    const orderData = this.filterByPrefix('/order-management/');
    const opsData = this.filterByPrefix('/operations-controls/');

    // Aggregate by category
    const aggregated: { label: string; visits: number }[] = [
      {
        label: 'Invoice to Cash',
        visits: invoiceData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
      {
        label: 'Revenue Accounting',
        visits: revenueData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
      {
        label: 'Order Management',
        visits: orderData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
      {
        label: 'Operations Controls',
        visits: opsData.reduce((s, i) => s + Number(i.TOTAL_VISITS), 0),
      },
    ].filter((item) => item.visits > 0);

    const canvas = document.getElementById(
      'continuousMonitoringChart'
    ) as HTMLCanvasElement;
    if (!canvas || aggregated.length === 0) return;

    this.continuousMonitoringChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: aggregated.map((i) => i.label),
        datasets: [
          {
            data: aggregated.map((i) => i.visits),
            backgroundColor: this.COLORS.cisco.slice(0, aggregated.length),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, usePointStyle: true, font: { size: 11 } },
          },
          title: {
            display: true,
            text: 'Continuous Monitoring Usage',
            font: { size: 14, weight: 'bold' },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = aggregated.reduce((a, b) => a + b.visits, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} visits (${percentage}%)`;
              },
            },
          },
        },
        cutout: '60%',
      },
    });
  }

  private createCaseIqChart(): void {
    const caseIqData = this.filterByPrefix('/case-iq/');
    this.caseIqChart = this.createDonutChart(
      'caseIqChart',
      caseIqData,
      'Case IQ Team Usage',
      this.COLORS.cisco
    );
  }

  private createBusinessInsightsChart(): void {
    const biData = this.filterByPrefix('/business-insights/');
    this.businessInsightsChart = this.createDonutChart(
      'businessInsightsChart',
      biData,
      'Business Insights Usage',
      this.COLORS.green
    );
  }

  private createTopPagesChart(): void {
    // Get top 10 pages overall
    const topPages = this.summaryData.slice(0, 10).map((item) => ({
      label: this.extractTabName(item.PAGE_ROUTE),
      visits: Number(item.TOTAL_VISITS),
      route: item.PAGE_ROUTE,
    }));

    const canvas = document.getElementById(
      'topPagesChart'
    ) as HTMLCanvasElement;
    if (!canvas || topPages.length === 0) return;

    this.topPagesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: topPages.map((i) => i.label),
        datasets: [
          {
            label: 'Total Visits',
            data: topPages.map((i) => i.visits),
            backgroundColor: this.COLORS.cisco[0],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Top 10 Most Visited Pages',
            font: { size: 14, weight: 'bold' },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { display: false },
          },
          y: {
            grid: { display: false },
          },
        },
      },
    });
  }

  private createUniqueUsersChart(): void {
    // Get pages by unique users
    const byUsers = this.summaryData.slice(0, 8).map((item) => ({
      label: this.extractTabName(item.PAGE_ROUTE),
      users: Number(item.UNIQUE_USERS),
    }));

    const canvas = document.getElementById(
      'uniqueUsersChart'
    ) as HTMLCanvasElement;
    if (!canvas || byUsers.length === 0) return;

    this.uniqueUsersChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: byUsers.map((i) => i.label),
        datasets: [
          {
            label: 'Unique Users',
            data: byUsers.map((i) => i.users),
            backgroundColor: this.COLORS.cisco[1],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Pages by Unique Users',
            font: { size: 14, weight: 'bold' },
          },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#e0e0e0' },
          },
        },
      },
    });
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }
}
