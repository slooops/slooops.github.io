import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CuiPagerModule, CuiTableModule } from '@cisco-ngx/cui-components';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HealthComponent } from './health/health.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContractAssetBalanceComponent } from './contract-asset-balance/contract-asset-balance.component';
import { ExceptionReportComponent } from './exception-report/exception-report.component';
import { DailyMonitoringComponent } from './daily-monitoring/daily-monitoring.component';
import { AppConfigService } from './providers/app-config.service';

export function initConfig(appConfig: AppConfigService) {
  console.log("app module init");
  return () => appConfig.loadConfig();
}

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
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: initConfig,
    deps: [AppConfigService],
    multi:true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
