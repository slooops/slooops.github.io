import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { EspCaseAnalyzerComponent } from './esp/esp-case-analyzer/esp-case-analyzer.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';
import { ErrorComponent } from './error/error.component';
import { BusinessInsightsComponent } from './business-insights/business-insights.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { SbpEspCaseAnalyzerComponent } from './esp/sbp-esp-case-analyzer/sbp-esp-case-analyzer.component';
import { EspHomeComponent } from './esp/esp-home/esp-home.component';
import { RoleBasedRedirectGuard } from './guards/role-based-redirect.guard';
import { AdminComponent } from './admin/admin.component';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard.component';
import { LandingComponent } from './landing/landing.component';
import { ScorecardHistoryComponent } from './scorecard/scorecard-history/scorecard-history.component';
import { ExecutiveSummaryHistoryComponent } from './executive-summary/executive-summary-history/executive-summary-history.component';
import { PerformanceHubComponent } from './performance-hub/performance-hub.component';
import { AitComponent } from './ait/ait.component';
import { SdlcExecHistoryComponent } from './sdlc-updates/sdlc-exec-history/sdlc-exec-history.component';
import { SdlcAdoptHistoryComponent } from './sdlc-updates/sdlc-adopt-history/sdlc-adopt-history.component';
import { CaseiqMonitoringDashboardComponent } from './esp/caseiq-monitoring-dashboard/caseiq-monitoring-dashboard.component';
import { ExecutiveSummaryComponent } from './executive-summary/executive-summary.component';
import { SprintUpdatesPageComponent } from './sdlc-updates/sprint-updates-page.component';
import { SelfHealingComponent } from './self-healing/self-healing.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [RoleBasedRedirectGuard],
    children: [],
  },
  {
    path: 'home',
    component: LandingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      // hideNavbar: true,
    },
  },
  {
    path: 'operations-dashboard',
    component: HomeComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Operations Dashboard',
    },
  },
  {
    path: 'error',
    component: ErrorComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
    },
  },

  {
    path: 'period-close-tracking',
    component: PeriodCloseTrackingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > Period Close Tracking',
    },
  },
  // {
  //   path: 'large-deal-tracker',
  //   component: OrderLifecycleComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'Finance-IT Control Tower',
  //     subHeader: 'Business Insights > Large Deal Tracker',
  //   },
  // },
  {
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > Revenue Accounting',
    },
  },
  {
    path: 'gl-posting',
    component: GlPostingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > General Ledger',
    },
  },
  {
    path: 'i2c-case-analyzer',
    component: EspCaseAnalyzerComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > I2C Case Analyzer',
    },
  },
  {
    path: 'case-iq',
    component: EspHomeComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > Case IQ',
    },
  },
  {
    path: 'sbp-case-analyzer',
    component: SbpEspCaseAnalyzerComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > SBP Case Analyzer',
    },
  },
  {
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > Invoice to Cash',
    },
  },
  // {
  //   path: 'o2c-landing',
  //   component: O2cLandingComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'O2C Home',
  //     showO2cSearch: true,
  //   },
  // },
  // {
  //   path: 'o2c-360',
  //   component: O2c360Component,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'O2C 360',
  //     showO2cSearch: true,
  //   },
  // },

  // {
  //   path: 'o2c-view-all',
  //   component: O2cViewAllComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'O2C 360',
  //     showO2cSearch: true,
  //   },
  // },
  // {
  //   path: 'o2c-bill-schedule',
  //   component: O2cBillScheduleComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'O2C Bill Schedule',
  //     showO2cSearch: true,
  //   },
  // },
  // {
  //   path: 'o2c-bill-details',
  //   component: O2cBillDetailsComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'O2C Bill Details',
  //     showO2cSearch: true,
  //   },
  // },
  // {
  //   path: 'o2c-gl',
  //   component: O2cGlComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'O2C GL',
  //     showO2cSearch: true,
  //   },
  // },
  // {
  //   path: 'o2c-tsv',
  //   component: O2cTsvComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'O2C TSV',
  //     showO2cSearch: true,
  //   },
  // },
  // // {
  // //   path: 'gl-posting',
  // //   component: GlPostingComponent,
  // //   data: {
  // //     title: 'Operations Control Tower',
  // //     header: 'GL Posting',
  // //   },
  // // },
  // {
  //   path: 'opl',
  //   component: OplComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'OPL',
  //   },
  // },
  {
    path: 'order-management',
    component: OrderManagementComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > Order Management',
    },
  },
  // {
  //   path: 'wips',
  //   component: WipsComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'Continuous Monitoring',
  //     subHeader: 'WIPS',
  //   },
  // },
  // {
  //   path: 'wd0',
  //   component: Wd0DashComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'Finance-IT Control Tower',
  //     subHeader: 'Miclose Status',
  //   },
  // },
  // {
  //   path: 'midclose-volumes',
  //   component: Wd0HistoricalDataComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'Finance-IT Control Tower',
  //     subHeader: 'Midclose Volumes',
  //   },
  // },
  {
    path: 'business-insights',
    component: BusinessInsightsComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Business Insights',
    },
  },
  // {
  //   path: 'cms',
  //   component: CmsComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'CMS',
  //   },
  // },
  // {
  //   path: 'cms-sftp-details',
  //   component: CmsSftpDetailsComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'CMS SFTP Details',
  //   },
  // },
  // {
  //   path: 'operations-controls',
  //   component: OperationsControlsComponent,
  //   data: {
  //     title: 'Finance-IT Control Tower',
  //     header: 'Finance-IT Control Tower',
  //     subHeader: 'Continuous Monitoring > Operations Controls',
  //   },
  // },
  {
    path: 'access-management-and-analytics',
    component: AdminComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Access Management & Analytics',
    },
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Analytics ',
    },
  },
  {
    path: 'scorecard',
    component: PerformanceHubComponent,
    data: {
      title: 'AI in SDLC performance Dashboard',
      header: 'AI in SDLC performance Dashboard',
    },
  },
  {
    path: 'scorecard/history',
    component: ScorecardHistoryComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Scorecard History',
    },
  },
  {
    path: 'executive-summary/history',
    component: ExecutiveSummaryHistoryComponent,
    data: {
      title: 'AI in SDLC Performance Dashboard',
      header: 'Executive Summary History',
    },
  },
  {
    path: 'sdlc-exec/history',
    component: SdlcExecHistoryComponent,
    data: {
      title: 'AI in SDLC Performance Dashboard',
      header: 'SDLC Execution Update History',
    },
  },
  {
    path: 'sdlc-adopt/history',
    component: SdlcAdoptHistoryComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'SDLC Component Adoption History',
    },
  },
  {
    path: 'ait',
    component: AitComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > AIT',
    },
  },
  {
    path: 'caseiq-monitoring',
    component: CaseiqMonitoringDashboardComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > CaseIQ Monitoring',
    },
  },
  {
    path: 'ai-in-sdlc',
    component: ExecutiveSummaryComponent,
    data: {
      title: 'AI in SDLC Performance Dashboard',
      header: 'AI in SDLC Performance Dashboard',
    },
  },
  {
    path: 'sprint-updates',
    component: SprintUpdatesPageComponent,
    data: {
      title: 'AI in SDLC Performance Dashboard',
      header: 'AI in SDLC Performance Dashboard',
    },
  },
  {
    path: 'self-healing',
    component: SelfHealingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > I2C Self-Healing Bot',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
