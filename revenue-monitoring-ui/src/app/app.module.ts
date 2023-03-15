import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import {
  CuiPagerModule,
  CuiTableModule,
  CuiFilterModule,
  CuiTabsNavModule,
  CuiModalModule,
  CuiLoaderModule,
  CuiInputModule,
} from '@cisco-ngx/cui-components';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpConfigInterceptor } from './providers/http-config.interceptor';
import { AuthenticationService } from './providers/authentication.service';
import { FormsModule } from '@angular/forms';
import { StandardArExceptionsComponent } from './standard-ar-exceptions/standard-ar-exceptions.component';
import { TsvExceptionsTopSkuComponent } from './tsv-exceptions-top-sku/tsv-exceptions-top-sku.component';
import { TsvExceptionsSubSkuComponent } from './tsv-exceptions-sub-sku/tsv-exceptions-sub-sku.component';

export function initApp(authService: AuthenticationService) {
  return (): Promise<any> => {
    return authService.getTokens();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    StandardArExceptionsComponent,
    TsvExceptionsTopSkuComponent,
    TsvExceptionsSubSkuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    CuiTableModule,
    CuiPagerModule,
    CuiFilterModule,
    CuiTabsNavModule,
    CuiModalModule,
    CuiLoaderModule,
    CuiInputModule,
    NgChartsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AuthenticationService],
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
