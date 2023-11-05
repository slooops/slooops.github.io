import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
  constructor(private auth: AuthenticationService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return from(this.auth.getValidToken()).pipe(
      switchMap((inf) => {
        const token: string = sessionStorage.getItem('accessToken') || '';
        console.log(req.headers);

        if (!req.headers.has('Authorization')) {
          if (token) {
            req = req.clone({
              headers: req.headers.set('Authorization', 'Bearer ' + token),
            });
          }
          if (
            !req.headers.has('Content-Type') &&
            req.url.indexOf('Attachment') === -1 &&
            !(req.body instanceof FormData)
          ) {
            req = req.clone({
              headers: req.headers.set('Content-Type', 'application/json'),
            });
          }

          req = req.clone({
            headers: req.headers.set('Accept', 'application/json'),
          });
        }

        return next.handle(req);
      })
    );
  }
}
