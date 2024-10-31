import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { Wd0DashComponent } from './wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from './wd0-historical-data/wd0-historical-data.component';
import { HomeComponent } from './home/home.component';
import { CmsComponent } from './cms/cms.component';
import { CmsDetailsComponent } from './cms/cms-details/cms-details.component';
import { CmsSftpDetailsComponent } from './cms/cms-sftp-details/cms-sftp-details.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { EspCaseAnalyzerComponent } from './esp-case-analyzer/esp-case-analyzer.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/large-deal-tracker',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Operations Control Tower',
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
      title: 'Period Close Tracking',
      header: 'Period Close Tracking',
    },
  },
  // {
  //   path: 'period-close-tracking-midclose',
  //   component: MidcloseComponent,
  //   data: {
  //     title: 'Period Close Tracking - Mid Close',
  //     header: 'Period Close Tracking',
  //   },
  // },
  // {
  //   path: 'error-dash',
  //   component: ErrorDashComponent,
  //   // children: [{ path: 'detail-view', component: DetailViewComponent }],
  //   data: {
  //     title: 'Operations Control Tower',
  //     header: 'Operations Control Tower',
  //   },
  // },
  // {
  //   path: 'detail-view',
  //   component: DetailViewComponent,
  //   data: {
  //     title: 'Operations Control Tower',
  //     header: 'Operations Control Tower',
  //   },
  // },
  {
    path: 'large-deal-tracker',
    component: OrderLifecycleComponent,
    data: {
      title: 'Large Deal Processing Tracker',
      header: 'Large Deal Processing Tracker',
    },
  },
  // {
  //   path: 'invoice-tracker',
  //   component: InvoiceTrackerComponent,
  //   data: { title: 'Home', header: 'Home' },
  // },
  {
    path: 'wd0-dash',
    component: Wd0DashComponent,
    data: {
      title: 'WD+0 Mid Close Status',
      header: 'WD+0 Mid Close Status',
    },
  },
  {
    path: 'mid-close-volumes',
    component: Wd0HistoricalDataComponent,
    data: {
      title: 'WD+0 Mid Close Volumes',
      header: 'WD+0 Mid Close Volumes',
    },
  },
  // {
  //   path: 'revenue-accruals',
  //   component: RevenueAccrualsComponent,
  //   data: {
  //     title: 'Revenue Accruals Dashboard',
  //     header: 'Revenue Accruals Dashboard',
  //   },
  // },
  {
    path: 'cms',
    component: CmsComponent,
    data: {
      title: 'CMS Dashboard',
      header: 'CMS Dashboard',
    },
  },
  {
    path: 'cms-details',
    component: CmsDetailsComponent,
    data: {
      title: 'CMS Monitoring',
      header: 'CMS Monitoring',
    },
  },
  {
    path: 'cms-sftp-details',
    component: CmsSftpDetailsComponent,
    data: {
      title: 'CMS Monitoring SFTP Details',
      header: 'CMS Monitoring SFTP Details',
    },
  },
  {
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Revenue Accounting',
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
      title: 'ESP Case Analyzer Dashboard',
      header: 'ESP Case Analyzer Dashboard',
    },
  },
  {
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Invoice to Cash',
      header: 'Invoice to Cash',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
