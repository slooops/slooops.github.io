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
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
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
import { LoadingSymbolSmallComponent } from './loading-symbol-small/loading-symbol-small.component';
import { EspCaseAnalyzerComponent } from './esp/esp-case-analyzer/esp-case-analyzer.component';
import { HelpDataComponent } from './help-data/help-data.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { MonitoringDashboardComponent } from './monitoring-dashboard/monitoring-dashboard.component';
import { UserAssignmentComponent } from './monitoring-dashboard/user-assignment/user-assignment.component';
import { ProcessFlowTooltipComponent } from './monitoring-dashboard/process-flow-tooltip/process-flow-tooltip.component';
import { MatStepperModule } from '@angular/material/stepper';
import { GlPostingComponent } from './gl-posting/gl-posting.component';
import { CommonModule } from '@angular/common';
import { O2cNavComponent } from './shared/o2c-nav/o2c-nav.component';
import { O2cTableComponent } from './components/o2c-table/o2c-table.component';
import { O2cLandingComponent } from './o2c/o2c-landing/o2c-landing.component';
import { O2cProcessFlowComponent } from './components/o2c-process-flow/o2c-process-flow.component';
import { TableComponent } from './components/table/table.component';
import { OplComponent } from './opl/opl.component';
import { BusinessInsightsComponent } from './business-insights/business-insights.component';
import {
  DialogBox,
  IssueReportingComponent,
  StatusDialog,
  SummaryDialog,
} from './issue-reporting/issue-reporting.component';
import { IssueUploadComponent } from './issue-reporting/issue-upload/issue-upload.component';
import { BulkApproveRejectComponent } from './issue-reporting/bulk-approve-reject/bulk-approve-reject.component';
import { ModalComponent } from './components/modal/modal.component';
import { TableModalComponent } from './components/table-modal/table-modal.component';
import { O2c360Component } from './o2c/o2c-360/o2c-360.component';
import { O2cSidebarNavComponent } from './shared/o2c-sidebar-nav/o2c-sidebar-nav.component';
// import { OperationsControlsComponent } from './operations-controls/operations-controls.component';
import { OrderManagementComponent } from './order-management/order-management.component';
// import { O2cInvoiceComponent } from './o2c-invoice/o2c-invoice.component';
import { O2cViewAllComponent } from './o2c/o2c-view-all/o2c-view-all.component';
import { O2cSearchComponent } from './components/o2c-search/o2c-search.component';
import { O2cDonutComponent } from './components/o2c-donut/o2c-donut.component';
import { SbpEspCaseAnalyzerComponent } from './esp/sbp-esp-case-analyzer/sbp-esp-case-analyzer.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { O2cCardComponent } from './components/o2c-card/o2c-card.component';
import { O2cAccordionComponent } from './components/o2c-accordion/o2c-accordion.component';
import { O2cBillScheduleComponent } from './o2c/o2c-bill-schedule/o2c-bill-schedule.component';
import { O2cBillDetailsComponent } from './o2c/o2c-bill-details/o2c-bill-details.component';
import { TableFilterComponent } from './shared/table-filter/table-filter.component';
import { O2cTsvComponent } from './o2c/o2c-tsv/o2c-tsv.component';
import { O2cGlComponent } from './o2c/o2c-gl/o2c-gl.component';
import { O2cHardwareComponent } from './o2c/o2c-landing/o2c-hardware/o2c-hardware.component';
import { O2cServicesComponent } from './o2c/o2c-landing/o2c-services/o2c-services.component';
import { O2cSubComponent } from './o2c/o2c-landing/o2c-sub/o2c-sub.component';
import { O2cAccountingComponent } from './o2c/o2c-landing/o2c-sub/o2c-accounting/o2c-accounting.component';
import { O2cCashComponent } from './o2c/o2c-landing/o2c-sub/o2c-cash/o2c-cash.component';
import { O2cInvoiceComponent } from './o2c/o2c-landing/o2c-sub/o2c-invoice/o2c-invoice.component';
import { O2cOrderComponent } from './o2c/o2c-landing/o2c-sub/o2c-order/o2c-order.component';
import { O2cSubscriptionComponent } from './o2c/o2c-landing/o2c-sub/o2c-subscription/o2c-subscription.component';
import { O2cToolbarComponent } from './components/o2c-toolbar/o2c-toolbar.component';
import { OperationsControlsComponent } from './operations-controls/operations-controls.component';
import { CardComponent } from './components/card/card.component';
import { EspHomeComponent } from './esp/esp-home/esp-home.component';
import { MetricTileComponent } from './components/metric-tile/metric-tile.component';
import { CaseiqTableComponent } from './components/caseiq-table/caseiq-table.component';
import { CaseiqAitComponent } from './esp/esp-home/caseiq-ait/caseiq-ait.component';
import { CaseiqCapComponent } from './esp/esp-home/caseiq-cap/caseiq-cap.component';
import { CaseiqComponent } from './esp/esp-home/caseiq/caseiq.component';
import { CaseiqFppComponent } from './esp/esp-home/caseiq-fpp/caseiq-fpp.component';
import { CaseiqI2cComponent } from './esp/esp-home/caseiq-i2c/caseiq-i2c.component';
import { CaseiqOmComponent } from './esp/esp-home/caseiq-om/caseiq-om.component';
import { CaseiqP2pComponent } from './esp/esp-home/caseiq-p2p/caseiq-p2p.component';
import { CaseiqSmComponent } from './esp/esp-home/caseiq-sm/caseiq-sm.component';
import { UploadScreenComponent } from './esp/esp-home/upload-screen/upload-screen.component';
import { BarChartjsComponent } from './components/bar-chartjs/bar-chartjs.component';
import { CaseiqI2cExpandDialogComponent } from './esp/esp-home/caseiq-i2c/caseiq-i2c.component';
import { CaseiqOmExpandDialogComponent } from './esp/esp-home/caseiq-om/caseiq-om.component';
import { CaseiqCapExpandDialogComponent } from './esp/esp-home/caseiq-cap/caseiq-cap.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export function initApp(authService: AuthenticationService) {
  return (): Promise<any> => {
    return authService.getUserId().then(() => {
      return authService.getTokens();
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
    BarChartComponent,
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
    LoadingSymbolSmallComponent,
    EspCaseAnalyzerComponent,
    HelpDataComponent,
    InvoicingComponent,
    CustomRevenueComponent,
    MonitoringDashboardComponent,
    UserAssignmentComponent,
    ProcessFlowTooltipComponent,
    GlPostingComponent,
    O2cNavComponent,
    O2cTableComponent,
    O2cLandingComponent,
    O2cProcessFlowComponent,
    TableComponent,
    OplComponent,
    BusinessInsightsComponent,
    IssueReportingComponent,
    DialogBox,
    IssueUploadComponent,
    BulkApproveRejectComponent,
    TableModalComponent,
    ModalComponent,
    StatusDialog,
    SummaryDialog,
    O2c360Component,
    O2cSidebarNavComponent,
    OrderManagementComponent,
    O2cViewAllComponent,
    ModalComponent,
    O2cSearchComponent,
    O2cDonutComponent,
    SbpEspCaseAnalyzerComponent,
    EspHomeComponent,
    MetricTileComponent,
    ChatbotComponent,
    O2cCardComponent,
    O2cBillScheduleComponent,
    O2cBillDetailsComponent,
    TableFilterComponent,
    O2cTsvComponent,
    O2cGlComponent,
    O2cHardwareComponent,
    O2cServicesComponent,
    O2cSubComponent,
    O2cAccountingComponent,
    O2cCashComponent,
    O2cInvoiceComponent,
    O2cOrderComponent,
    O2cSubscriptionComponent,
    OperationsControlsComponent,
    CardComponent,
    CaseiqTableComponent,
    CaseiqAitComponent,
    CaseiqCapComponent,
    CaseiqComponent,
    CaseiqFppComponent,
    CaseiqI2cComponent,
    CaseiqOmComponent,
    CaseiqP2pComponent,
    CaseiqSmComponent,
    UploadScreenComponent,
    BarChartjsComponent,
    // Dialog for expanded CaseIQ I2C charts
    CaseiqI2cExpandDialogComponent,
    // Dialog for expanded CaseIQ OM charts
    CaseiqOmExpandDialogComponent,
    // Dialog for expanded CaseIQ Capital charts
    CaseiqCapExpandDialogComponent,
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
    O2cAccordionComponent,
    O2cToolbarComponent,
    MatSliderModule,
    MatProgressSpinnerModule,
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
    DataService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
