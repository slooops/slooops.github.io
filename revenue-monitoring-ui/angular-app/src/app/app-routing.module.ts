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
import { AitComponent } from './ait/ait.component';
import { CaseiqMonitoringDashboardComponent } from './esp/caseiq-monitoring-dashboard/caseiq-monitoring-dashboard.component';
import { CtmAlertsDashboardComponent } from './ctm-alerts/ctm-alerts-dashboard.component';
import { SelfHealingComponent } from './self-healing/self-healing.component';
import { ExceptionDetailsComponent } from './self-healing/exception-details/exception-details.component';

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
      supportsDarkMode: true,
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
      supportsDarkMode: true,
    },
  },
  {
    path: 'case-iq',
    component: EspHomeComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > Case IQ',
      supportsDarkMode: true,
    },
  },
  {
    path: 'sbp-case-analyzer',
    component: SbpEspCaseAnalyzerComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > SBP Case Analyzer',
      supportsDarkMode: true,
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
    path: 'ait',
    component: AitComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > Accounting, Investment & Treasury',
    },
  },
  {
    path: 'caseiq-monitoring',
    component: CaseiqMonitoringDashboardComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > CaseIQ Monitoring',
      supportsDarkMode: true,
    },
  },

  {
    path: 'exception-details/by-record/:id',
    component: ExceptionDetailsComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > Exception Details',
      supportsDarkMode: true,
    },
  },
  {
    path: 'self-healing',
    component: SelfHealingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'Continuous Monitoring > Self-Healing Dashboard',
      supportsDarkMode: true,
    },
  },
  {
    path: 'caseiq',
    component: EspHomeComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'ESP Case Manager > Case IQ',
    },
  },
  {
    path: 'ctm-alerts',
    component: CtmAlertsDashboardComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Finance-IT Control Tower',
      subHeader: 'CTM AI Alerts Dashboard',
      supportsDarkMode: true,
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
