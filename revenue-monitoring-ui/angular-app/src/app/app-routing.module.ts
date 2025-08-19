import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { EspCaseAnalyzerComponent } from './esp-case-analyzer/esp-case-analyzer.component';
import { O2cDemoComponent } from './o2c-demo/o2c-demo.component';
import { O2cDetailsComponent } from './o2c-demo/o2c-details/o2c-details.component';
import { O2cInvoicingComponent } from './o2c-demo/o2c-invoicing/o2c-invoicing.component';
import { O2cOrderComponent } from './o2c-demo/o2c-order/o2c-order.component';
import { O2cAccrualComponent } from './o2c-demo/o2c-accrual/o2c-accrual.component';
import { O2cLandingComponent } from './o2c-landing/o2c-landing.component';
import { O2cOverviewComponent } from './o2c-demo/o2c-overview/o2c-overview.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';
import { ErrorComponent } from './error/error.component';
import { OplComponent } from './opl/opl.component';
import { MidcloseComponent } from './period-close-tracking/midclose/midclose.component';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { Wd0DashComponent } from './wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from './wd0-historical-data/wd0-historical-data.component';
import { BusinessInsightsComponent } from './business-insights/business-insights.component';
import { CmsComponent } from './cms/cms.component';
import { CmsSftpDetailsComponent } from './cms/cms-sftp-details/cms-sftp-details.component';
import { O2c360Component } from './o2c-360/o2c-360.component';
// import { OperationsControlsComponent } from './operations-controls/operations-controls.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { O2cViewAllComponent } from './o2c-view-all/o2c-view-all.component';
import { SbpEspCaseAnalyzerComponent } from './sbp-esp-case-analyzer/sbp-esp-case-analyzer.component';
import { OperationsControlsComponent } from './operations-controls/operations-controls.component';

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
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
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
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'o2c-demo',
    component: O2cDemoComponent,
    data: {
      title: 'O2C Demo',
      header: 'O2C Demo',
      hideNavbar: true,
    },
  },
  {
    path: 'o2c-details',
    component: O2cDetailsComponent,
    data: { title: 'O2C Details', header: 'O2C Details', hideNavbar: true },
  },
  {
    path: 'o2c-order',
    component: O2cOrderComponent,
    data: { title: 'O2C Orders', header: 'O2C Orders', hideNavbar: true },
  },

  {
    path: 'o2c-accrual',
    component: O2cAccrualComponent,
    data: { title: 'O2C Accrual', header: 'O2C Accruals', hideNavbar: true },
  },
  {
    path: 'o2c-invoicing',
    component: O2cInvoicingComponent,
    data: { title: 'O2C Invoicing', header: 'O2C Invoicing', hideNavbar: true },
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
    path: 'o2c-overview',
    component: O2cOverviewComponent,
    data: {
      title: 'O2C Overview',
      header: 'O2C Overview',
      hideNavbar: true,
    },
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
  {
    path: 'operations-controls',
    component: OperationsControlsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
