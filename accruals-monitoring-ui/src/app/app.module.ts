import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HealthComponent } from './health/health.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContractAssetBalanceComponent } from './contract-asset-balance/contract-asset-balance.component';
import { CuiPagerModule, CuiTableModule } from '@cisco-ngx/cui-components';
import { ExceptionReportComponent } from './exception-report/exception-report.component';
import { DailyMonitoringComponent } from './daily-monitoring/daily-monitoring.component';

@NgModule({
  declarations: [
    AppComponent,
    HealthComponent,
    DashboardComponent,
    ContractAssetBalanceComponent,
    ExceptionReportComponent,
    DailyMonitoringComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CuiTableModule,
    CuiPagerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
