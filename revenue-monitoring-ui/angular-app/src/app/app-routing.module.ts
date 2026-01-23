import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { EspCaseAnalyzerComponent } from './esp/esp-case-analyzer/esp-case-analyzer.component';
import { O2cLandingComponent } from './o2c/o2c-landing/o2c-landing.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';
import { ErrorComponent } from './error/error.component';
import { OplComponent } from './opl/opl.component';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { Wd0DashComponent } from './wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from './wd0-historical-data/wd0-historical-data.component';
import { BusinessInsightsComponent } from './business-insights/business-insights.component';
import { CmsComponent } from './cms/cms.component';
import { CmsSftpDetailsComponent } from './cms/cms-sftp-details/cms-sftp-details.component';
import { O2c360Component } from './o2c/o2c-360/o2c-360.component';
// import { OperationsControlsComponent } from './operations-controls/operations-controls.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { O2cViewAllComponent } from './o2c/o2c-view-all/o2c-view-all.component';
import { SbpEspCaseAnalyzerComponent } from './esp/sbp-esp-case-analyzer/sbp-esp-case-analyzer.component';
import { O2cBillScheduleComponent } from './o2c/o2c-bill-schedule/o2c-bill-schedule.component';
import { O2cBillDetailsComponent } from './o2c/o2c-bill-details/o2c-bill-details.component';
import { O2cTsvComponent } from './o2c/o2c-tsv/o2c-tsv.component';
import { O2cGlComponent } from './o2c/o2c-gl/o2c-gl.component';
import { OperationsControlsComponent } from './operations-controls/operations-controls.component';
import { EspHomeComponent } from './esp/esp-home/esp-home.component';
import { RoleBasedRedirectGuard } from './guards/role-based-redirect.guard';
import { AdminComponent } from './admin/admin.component';
import { WipsComponent } from './wips/wips.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [RoleBasedRedirectGuard],
    children: [],
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Home',
    },
  },
  {
    path: 'error',
    component: ErrorComponent,
    data: { title: 'Finance-IT Control Tower', header: '' },
  },

  {
    path: 'period-close-tracking',
    component: PeriodCloseTrackingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'large-deal-tracker',
    component: OrderLifecycleComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Large Deal Tracker',
    },
  },
  {
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'gl-posting',
    component: GlPostingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'i2c-case-analyzer',
    component: EspCaseAnalyzerComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'ESP Case Manager',
    },
  },
  {
    path: 'case-iq',
    component: EspHomeComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'ESP Case Manager',
    },
  },
  {
    path: 'sbp-case-analyzer',
    component: SbpEspCaseAnalyzerComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'ESP Case Manager',
    },
  },
  {
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'o2c-landing',
    component: O2cLandingComponent,
    data: { title: 'O2C Home', header: 'O2C Home', hideNavbar: true },
  },
  {
    path: 'o2c-360',
    component: O2c360Component,
    data: { title: 'O2C 360', header: 'O2C 360', hideNavbar: true },
  },

  {
    path: 'o2c-view-all',
    component: O2cViewAllComponent,
    data: { title: 'O2C 360', header: 'O2C 360', hideNavbar: true },
  },
  {
    path: 'o2c-bill-schedule',
    component: O2cBillScheduleComponent,
    data: {
      title: 'O2C Bill Schedule',
      header: 'O2C Bill Schedule',
      hideNavbar: true,
    },
  },
  {
    path: 'o2c-bill-details',
    component: O2cBillDetailsComponent,
    data: {
      title: 'O2C Bill Details',
      header: 'O2C Bill Details',
      hideNavbar: true,
    },
  },
  {
    path: 'o2c-gl',
    component: O2cGlComponent,
    data: { title: 'O2C GL', header: 'O2C GL', hideNavbar: true },
  },
  {
    path: 'o2c-tsv',
    component: O2cTsvComponent,
    data: { title: 'O2C TSV', header: 'O2C TSV', hideNavbar: true },
  },
  // {
  //   path: 'gl-posting',
  //   component: GlPostingComponent,
  //   data: {
  //     title: 'Operations Control Tower',
  //     header: 'GL Posting',
  //   },
  // },
  {
    path: 'opl',
    component: OplComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'OPL',
    },
  },
  {
    path: 'order-management',
    component: OrderManagementComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Order Management Monitoring',
    },
  },
  {
    path: 'wips',
    component: WipsComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'WIPS',
    },
  },
  {
    path: 'wd0',
    component: Wd0DashComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Miclose Status',
    },
  },
  {
    path: 'midclose-volumes',
    component: Wd0HistoricalDataComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Midclose Volumes',
    },
  },
  {
    path: 'business-insights',
    component: BusinessInsightsComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Business Insights',
    },
  },
  {
    path: 'cms',
    component: CmsComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'CMS',
    },
  },
  {
    path: 'cms-sftp-details',
    component: CmsSftpDetailsComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'CMS SFTP Details',
    },
  },
  {
    path: 'operations-controls',
    component: OperationsControlsComponent,
    data: {
      title: 'Finance-IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  // {
  //   path: 'admin',
  //   component: AdminComponent,
  //   data: {
  //     title: 'Admin',
  //     header: 'Admin',
  //   },
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
