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
import { O2cSubComponent } from './o2c-demo/o2c-sub/o2c-sub.component';
import { O2cAccrualComponent } from './o2c-demo/o2c-accrual/o2c-accrual.component';
import { O2cLandingComponent } from './o2c-demo/o2c-landing/o2c-landing.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';

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
      title: 'Operations Control Tower',
      header: 'Home',
    },
  },
  // {
  //   path: 'error',
  //   component: ErrorComponent,
  //   data: { title: 'Error', header: '' },
  // },

  {
    path: 'period-close-tracking',
    component: PeriodCloseTrackingComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Period Close Tracking',
    },
  },
  {
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Revenue Accounting',
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
    path: 'case-analyzer',
    component: EspCaseAnalyzerComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'ESP Case Analyzer Dashboard',
    },
  },
  {
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Invoice to Cash',
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
    path: 'o2c-sub',
    component: O2cSubComponent,
    data: {
      title: 'O2C Subscriptions',
      header: 'O2C Subscriptions',
      hideNavbar: true,
    },
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
    path: 'gl-posting',
    component: GlPostingComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'GL Posting',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
