import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MockHomeDataService {
  constructor() {}

  // Mock data matching the screenshot
  private mockData = {
    charts: {
      transactionFailures: {
        weeks: [
          'WEEK 1',
          'WEEK 2',
          'WEEK 3',
          'WEEK 4',
          'WEEK 5',
          'WEEK 6',
          'WEEK 7',
          'WEEK 8',
          'WEEK 9',
          'WEEK 10',
          'WEEK 11',
          'WEEK 12',
          'WEEK 13',
        ],
        aiAgent: [40, 35, 42, 38, 45, 50, 48, 44, 40, 42, 45, 48, 42],
        supportTeam: [35, 30, 38, 32, 40, 45, 42, 38, 35, 38, 40, 42, 38],
        inProgress: [25, 20, 28, 22, 30, 35, 32, 28, 25, 28, 30, 32, 28],
        resolvedAgent: [15, 12, 18, 14, 20, 25, 22, 18, 15, 18, 20, 22, 18],
        resolvedTeam: [8, 6, 10, 8, 12, 15, 13, 10, 8, 10, 12, 13, 10],
      },
      espCases: {
        weeks: [
          'WEEK 1',
          'WEEK 2',
          'WEEK 3',
          'WEEK 4',
          'WEEK 5',
          'WEEK 6',
          'WEEK 7',
          'WEEK 8',
          'WEEK 9',
          'WEEK 10',
          'WEEK 11',
          'WEEK 12',
          'WEEK 13',
        ],
        aiAgent: [45, 40, 48, 42, 50, 55, 52, 48, 45, 48, 50, 52, 48],
        supportTeam: [38, 35, 42, 36, 45, 50, 46, 42, 38, 42, 45, 46, 42],
        inProgress: [28, 25, 32, 26, 35, 40, 36, 32, 28, 32, 35, 36, 32],
        resolvedAgent: [18, 15, 22, 18, 25, 30, 26, 22, 18, 22, 25, 26, 22],
        resolvedTeam: [10, 8, 14, 10, 16, 20, 16, 14, 10, 14, 16, 16, 14],
      },
      issueDistribution: {
        aiAgent: 48,
        human: 15,
        unassigned: 5,
        other: 32,
      },
    },
    issuesList: [
      {
        id: '6789012345',
        applicationName: 'Subscription',
        functionalArea: 'Pre-invoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'Adithya Iyer',
        status: 'Open',
      },
      {
        id: '1234567890',
        applicationName: 'Subscription',
        functionalArea: 'Pre -invoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'Adithya Iyer',
        status: 'In Progress',
      },
      {
        id: '8876543210',
        applicationName: 'ESP',
        functionalArea: 'Pre-invoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'AI Agent',
        status: 'Unassigned',
      },
      {
        id: '4567891234',
        applicationName: 'Subscription',
        functionalArea: 'Invoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'AI Agent',
        status: 'In Progress',
      },
      {
        id: '3216548970',
        applicationName: 'ESP',
        functionalArea: 'eInvoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'AI Agent',
        status: 'In Progress',
      },
      {
        id: '7890123456',
        applicationName: 'Subscription',
        functionalArea: 'Invoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'AI Agent',
        status: 'In Progress',
      },
      {
        id: '2345678901',
        applicationName: 'ESP',
        functionalArea: 'Invoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'Chandan Runga',
        status: 'Open',
      },
      {
        id: '6078901234',
        applicationName: 'ESP',
        functionalArea: 'eInvoicing',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'Chandan Runga',
        status: 'Open',
      },
      {
        id: '8901234567',
        applicationName: 'ESP',
        functionalArea: 'Issue ID',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'Chandan Runga',
        status: 'In Progress',
        hasAlert: true,
      },
      {
        id: '3456789012',
        applicationName: 'Subscription',
        functionalArea: 'Issue ID',
        issueDescription: 'Lorem ipsum sit mato',
        amount: '$32,717,356.29',
        lastUpdatedDate: '09/08/2025',
        aging: '5 days',
        assignedTo: 'Assign to',
        status: 'Unassigned',
        hasAlert: true,
      },
    ],
  };

  /**
   * Simulates HTTP GET request for dashboard data
   * Returns observable with 500ms delay to mimic network call
   */
  getDashboardData(): Observable<any> {
    // Inject dynamic pagination info (defaults)
    const totalResults = this.mockData.issuesList.length;
    return of({
      ...this.mockData,
      pagination: {
        totalResults,
        currentPage: 1,
        rowsPerPage: 10,
      },
    }).pipe(delay(500));
  }

  // /**
  //  * Get KPI metrics
  //  */
  // getKPIMetrics(): Observable<any> {
  //   return of(this.mockData.kpis).pipe(delay(300));
  // }

  /**
   * Get chart data
   */
  getChartData(): Observable<any> {
    return of(this.mockData.charts).pipe(delay(300));
  }

  /**
   * Get issues list with pagination
   */
  getIssuesList(page: number = 1, pageSize: number = 10): Observable<any> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedIssues = this.mockData.issuesList.slice(
      startIndex,
      endIndex
    );

    const totalResults = this.mockData.issuesList.length;
    return of({
      issues: paginatedIssues,
      totalResults,
      currentPage: page,
      rowsPerPage: pageSize,
    }).pipe(delay(300));
  }
}
