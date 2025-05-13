import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpConfigInterceptor } from './providers/http-config.interceptor';
import { AuthenticationService } from './providers/authentication.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MenuComponent } from './menu/menu.component';
import { PrecloseComponent } from './period-close-tracking/preclose/preclose.component';
import { MidcloseComponent } from './period-close-tracking/midclose/midclose.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoadingSymbolComponent } from './loading-symbol/loading-symbol.component';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { TruncatePipe } from './shared/truncate.pipe';
import { Wd0DashComponent } from './wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from './wd0-historical-data/wd0-historical-data.component';
import { TitleCaseWithExceptionsPipe } from './title-case-with-exceptions.pipe';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { OrderLifecycleSummaryComponent } from './order-lifecycle/order-lifecycle-summary/order-lifecycle-summary.component';
import { OrderLifecycleUploadComponent } from './order-lifecycle/order-lifecycle-upload/order-lifecycle-upload.component';
import { OrderLifecycleRevSummaryComponent } from './order-lifecycle/order-lifecycle-rev-summary/order-lifecycle-rev-summary.component';
import { DataService } from './providers/data.service';
import { HomeComponent } from './home/home.component';
import { ErrorComponent } from './error/error.component';
import { ColumnSelectComponent } from './order-lifecycle/column-select/column-select.component';
import { CloUpdatesComponent } from './order-lifecycle/clo-updates/clo-updates.component';
import { FormatNumberPipe } from './format-number.pipe';
import { CmsComponent } from './cms/cms.component';
import { ToolTipRendererDirective } from './tool-tip-renderer.directive';
import { CustomToolTipComponent } from './cms/custom-tool-tip/custom-tool-tip.component';
import { CmsDetailsComponent } from './cms/cms-details/cms-details.component';
import { CmsModalComponent } from './cms/cms-modal/cms-modal.component';
import { CmsSftpDetailsComponent } from './cms/cms-sftp-details/cms-sftp-details.component';
import { SbpComponent } from './sbp/sbp.component';
import { LoadingSymbolSmallComponent } from './loading-symbol-small/loading-symbol-small.component';
import { EspCaseAnalyzerComponent } from './esp-case-analyzer/esp-case-analyzer.component';
import { HelpDataComponent } from './help-data/help-data.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { MonitoringDashboardComponent } from './monitoring-dashboard/monitoring-dashboard.component';
import { UserAssignmentComponent } from './monitoring-dashboard/user-assignment/user-assignment.component';
import { ProcessFlowTooltipComponent } from './monitoring-dashboard/process-flow-tooltip/process-flow-tooltip.component';
import { MatStepperModule } from '@angular/material/stepper';
import { O2cDemoComponent } from './o2c-demo/o2c-demo.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';
import { CommonModule } from '@angular/common';
import { O2cDetailsComponent } from './o2c-demo/o2c-details/o2c-details.component';
import { O2cInvoicingComponent } from './o2c-demo/o2c-invoicing/o2c-invoicing.component';
import { O2cOrderComponent } from './o2c-demo/o2c-order/o2c-order.component';
// import { O2cSubComponent } from './o2c-demo/o2c-sub/o2c-sub.component';
import { O2cAccrualComponent } from './o2c-demo/o2c-accrual/o2c-accrual.component';
import { O2cNavComponent } from './shared/o2c-nav/o2c-nav.component';
import { O2cTableComponent } from './components/o2c-table/o2c-table.component';
import { O2cLandingComponent } from './o2c-landing/o2c-landing.component';
import { O2cProcessFlowComponent } from './components/o2c-process-flow/o2c-process-flow.component';
import { O2cOverviewComponent } from './o2c-demo/o2c-overview/o2c-overview.component';
import { TableComponent } from './components/table/table.component';
import { OplComponent } from './opl/opl.component';
import { AccountReconComponent } from './account-recon/account-recon.component';
import { AccrualsComponent } from './accruals/accruals.component';
import { StandardRevenueComponent } from './standard-revenue/standard-revenue.component';
import { PreInvoicingComponent } from './pre-invoicing/pre-invoicing.component';
import { PostInvoicingComponent } from './post-invoicing/post-invoicing.component';
import { EinvoicingComponent } from './einvoicing/einvoicing.component';
import { FusionComponent } from './fusion/fusion.component';
import { BusinessInsightsComponent } from './business-insights/business-insights.component';
import { ContinuousMonitoringComponent } from './continuous-monitoring/continuous-monitoring.component';
import {
  DialogBox,
  IssueReportingComponent,
  StatusDialog,
  SummaryDialog,
} from './issue-reporting/issue-reporting.component';
import { IssueUploadComponent } from './issue-reporting/issue-upload/issue-upload.component';
import { BulkApproveRejectComponent } from './issue-reporting/bulk-approve-reject/bulk-approve-reject.component';
import { TableModalComponent } from './components/table-modal/table-modal.component';
import { O2c360Component } from './o2c-360/o2c-360.component';
import { O2cSidebarNavComponent } from './shared/o2c-sidebar-nav/o2c-sidebar-nav.component';
import { OperationsControlsComponent } from './operations-controls/operations-controls.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { O2cInvoiceComponent } from './o2c-invoice/o2c-invoice.component';
import { O2cViewAllComponent } from './o2c-view-all/o2c-view-all.component';
import { ModalComponent } from './components/modal/modal.component';

export function initApp(authService: AuthenticationService) {
  return (): Promise<any> => {
    return authService.getTokens().then(() => {
      return authService.getUserId();
    });
  };
}

@NgModule({
  declarations: [
    AppComponent,
    PeriodCloseTrackingComponent,
    MenuComponent,
    PrecloseComponent,
    MidcloseComponent,
    LoadingSymbolComponent,
    OrderLifecycleComponent,
    TruncatePipe,
    Wd0DashComponent,
    Wd0HistoricalDataComponent,
    TitleCaseWithExceptionsPipe,
    OrderLifecycleSummaryComponent,
    OrderLifecycleUploadComponent,
    OrderLifecycleRevSummaryComponent,
    HomeComponent,
    ErrorComponent,
    ColumnSelectComponent,
    CloUpdatesComponent,
    FormatNumberPipe,
    CmsComponent,
    ToolTipRendererDirective,
    CustomToolTipComponent,
    CmsDetailsComponent,
    CmsModalComponent,
    CmsSftpDetailsComponent,
    SbpComponent,
    LoadingSymbolSmallComponent,
    EspCaseAnalyzerComponent,
    HelpDataComponent,
    InvoicingComponent,
    CustomRevenueComponent,
    MonitoringDashboardComponent,
    UserAssignmentComponent,
    ProcessFlowTooltipComponent,
    O2cDemoComponent,
    GlPostingComponent,
    O2cDetailsComponent,
    O2cOrderComponent,
    O2cAccrualComponent,
    O2cInvoicingComponent,
    O2cNavComponent,
    O2cTableComponent,
    O2cLandingComponent,
    O2cProcessFlowComponent,
    O2cOverviewComponent,
    TableComponent,
    OplComponent,
    AccountReconComponent,
    AccrualsComponent,
    StandardRevenueComponent,
    PreInvoicingComponent,
    PostInvoicingComponent,
    EinvoicingComponent,
    FusionComponent,
    BusinessInsightsComponent,
    ContinuousMonitoringComponent,
    IssueReportingComponent,
    DialogBox,
    IssueUploadComponent,
    BulkApproveRejectComponent,
    TableModalComponent,
    StatusDialog,
    SummaryDialog,
    O2c360Component,
    O2cSidebarNavComponent,
    OperationsControlsComponent,
    OrderManagementComponent,
    O2cInvoiceComponent,
    O2cViewAllComponent,
    ModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgChartsModule,
    MatProgressBarModule,
    FontAwesomeModule,
    MatTabsModule,
    BrowserAnimationsModule,
    MatSelectModule,
    ReactiveFormsModule,
    NgbModule,
    NgCircleProgressModule.forRoot({
      radius: 20,
      outerStrokeWidth: 4,
      innerStrokeWidth: 0,
      animationDuration: 300,
      showSubtitle: false,
      titleFontSize: '14',
    }),
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FontAwesomeModule,
    MatStepperModule,
    CommonModule,
    MatDialogModule,
  ],
  providers: [
    DatePipe,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AuthenticationService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpConfigInterceptor,
      multi: true,
    },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } },
    {
      provide: MatDialogRef,
      useValue: {},
    },
    DataService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
