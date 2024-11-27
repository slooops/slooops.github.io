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
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
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
import { RolComponent } from './custom-revenue/rol/rol.component';
import { CmsSftpDetailsComponent } from './cms/cms-sftp-details/cms-sftp-details.component';
import { SbpComponent } from './sbp/sbp.component';
import { LoadingSymbolSmallComponent } from './loading-symbol-small/loading-symbol-small.component';
import { EspCaseAnalyzerComponent } from './esp-case-analyzer/esp-case-analyzer.component';
import { AssignDialogComponent } from './custom-revenue/rol/assign-dialog/assign-dialog.component';
import { HelpDataComponent } from './help-data/help-data.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { AutoInvoicingComponent } from './invoicing/auto-invoicing/auto-invoicing.component';
import { PreInvoicingComponent } from './invoicing/pre-invoicing/pre-invoicing.component';
import { AssignUserComponent } from './invoicing/assign-user/assign-user.component';
import { AutoInvoicingRealComponent } from './invoicing/auto-invoicing-real/auto-invoicing-real.component';
import { MonitoringDashboardComponent } from './monitoring-dashboard/monitoring-dashboard.component';
import { UserAssignmentComponent } from './monitoring-dashboard/user-assignment/user-assignment.component';
import { ProcessFlowTooltipComponent } from './monitoring-dashboard/process-flow-tooltip/process-flow-tooltip.component';
import { AccrualsComponent } from './custom-revenue/accruals/accruals.component';
import { MatStepperModule } from '@angular/material/stepper';
import { O2cDemoComponent } from './o2c-demo/o2c-demo.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';

export function initApp(authService: AuthenticationService) {
  return (): Promise<any> => {
    return authService.getTokens();
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
    RolComponent,
    CmsSftpDetailsComponent,
    SbpComponent,
    LoadingSymbolSmallComponent,
    EspCaseAnalyzerComponent,
    AssignDialogComponent,
    HelpDataComponent,
    InvoicingComponent,
    CustomRevenueComponent,
    AutoInvoicingComponent,
    PreInvoicingComponent,
    AssignUserComponent,
    MonitoringDashboardComponent,
    UserAssignmentComponent,
    ProcessFlowTooltipComponent,
    AccrualsComponent,
    O2cDemoComponent,
    GlPostingComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    // CuiTableModule,
    // CuiPagerModule,
    // CuiFilterModule,
    // CuiTabsNavModule,
    // CuiModalModule,
    // CuiLoaderModule,
    // CuiInputModule,
    NgChartsModule,
    // CuiProgressbarModule,
    // CngSortModule,
    // CngTableModule,
    // CngTabsModule,
    // CngProgressbarModule,
    MatProgressBarModule,
    FontAwesomeModule,
    MatTabsModule,
    AutoInvoicingRealComponent,
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
export class AppModule {
  constructor(library: FaIconLibrary) {
    // library.addIconPacks("fas");
  }
}
