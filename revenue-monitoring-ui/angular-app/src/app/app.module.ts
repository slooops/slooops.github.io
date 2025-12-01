import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpConfigInterceptor } from './providers/http-config.interceptor';
import { AuthenticationService } from './providers/authentication.service';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { DataService } from './providers/data.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export function initApp(authService: AuthenticationService) {
  return (): Promise<any> => {
    return authService.getUserId().then(() => {
      return authService.getTokens();
    });
  };
}

@NgModule({
  declarations: [],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AppComponent,
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
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
