import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { EspCaseAnalyzerComponent } from './esp-case-analyzer/esp-case-analyzer.component';
import { O2cLandingComponent } from './o2c/o2c-landing/o2c-landing.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';
import { ErrorComponent } from './error/error.component';
import { OplComponent } from './opl/opl.component';
import { MidcloseComponent } from './period-close-tracking/midclose/midclose.component';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { StandardRevenueComponent } from './standard-revenue/standard-revenue.component';
import { AccrualsComponent } from './accruals/accruals.component';
import { AccountReconComponent } from './account-recon/account-recon.component';
import { PreInvoicingComponent } from './pre-invoicing/pre-invoicing.component';
import { PostInvoicingComponent } from './post-invoicing/post-invoicing.component';
import { EinvoicingComponent } from './einvoicing/einvoicing.component';
import { FusionComponent } from './fusion/fusion.component';
import { Wd0DashComponent } from './wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from './wd0-historical-data/wd0-historical-data.component';
import { BusinessInsightsComponent } from './business-insights/business-insights.component';
import { CmsComponent } from './cms/cms.component';
import { CmsSftpDetailsComponent } from './cms/cms-sftp-details/cms-sftp-details.component';
import { O2c360Component } from './o2c/o2c-360/o2c-360.component';
// import { OperationsControlsComponent } from './operations-controls/operations-controls.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { O2cViewAllComponent } from './o2c/o2c-view-all/o2c-view-all.component';
import { SbpEspCaseAnalyzerComponent } from './sbp-esp-case-analyzer/sbp-esp-case-analyzer.component';
import { O2cBillScheduleComponent } from './o2c/o2c-bill-schedule/o2c-bill-schedule.component';
import { O2cBillDetailsComponent } from './o2c/o2c-bill-details/o2c-bill-details.component';
import { O2cTsvComponent } from './o2c/o2c-tsv/o2c-tsv.component';
import { O2cGlComponent } from './o2c/o2c-gl/o2c-gl.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Home',
    },
  },
  {
    path: 'error',
    component: ErrorComponent,
    data: { title: 'Finance IT Control Tower', header: '' },
  },

  {
    path: 'period-close-tracking',
    component: PeriodCloseTrackingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'period-close-tracking-midclose',
    component: MidcloseComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Period Close Tracking',
    },
  },
  {
    path: 'large-deal-tracker',
    component: OrderLifecycleComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Large Deal Tracker',
    },
  },
  {
    path: 'standard-revenue',
    component: StandardRevenueComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Standard Revenue',
    },
  },
  {
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'accruals',
    component: AccrualsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Accruals',
    },
  },
  {
    path: 'accounts',
    component: AccountReconComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Accounts',
    },
  },
  {
    path: 'gl-posting',
    component: GlPostingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  // {
  //   path: 'sbp',
  //   component: SbpComponent,
  //   data: {
  //     title: 'SBP Monitoring',
  //     header: 'Subscription Billing Platform Monitoring',
  //   },
  // },
  {
    path: 'i2c-case-analyzer',
    component: EspCaseAnalyzerComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'ESP Case Manager',
    },
  },
  {
    path: 'sbp-case-analyzer',
    component: SbpEspCaseAnalyzerComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'ESP Case Manager',
    },
  },
  {
    path: 'pre-invoicing',
    component: PreInvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Pre-Invoicing',
    },
  },
  {
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'post-invoicing',
    component: PostInvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Post-Invoicing',
    },
  },
  {
    path: 'einvoicing',
    component: EinvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'EInvoicing',
    },
  },
  {
    path: 'fusion',
    component: FusionComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Fusion',
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
      title: 'Finance IT Control Tower',
      header: 'OPL',
    },
  },
  {
    path: 'order-management',
    component: OrderManagementComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Order Management Monitoring',
    },
  },
  {
    path: 'wd0',
    component: Wd0DashComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Miclose Status',
    },
  },
  {
    path: 'midclose-volumes',
    component: Wd0HistoricalDataComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Midclose Volumes',
    },
  },
  {
    path: 'business-insights',
    component: BusinessInsightsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Business Insights',
    },
  },
  {
    path: 'cms',
    component: CmsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'CMS',
    },
  },
  {
    path: 'cms-sftp-details',
    component: CmsSftpDetailsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'CMS SFTP Details',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
