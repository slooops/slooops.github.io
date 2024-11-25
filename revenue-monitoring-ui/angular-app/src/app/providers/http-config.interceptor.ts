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
        let newReq = req.clone();
        if (!newReq.headers.has('Authorization')) {
          if (token) {
            newReq = newReq.clone({
              headers: newReq.headers.set('Authorization', 'Bearer ' + token),
            });
          }
          if (
            !newReq.headers.has('Content-Type') &&
            newReq.url.indexOf('Attachment') === -1 &&
            !(newReq.body instanceof FormData)
          ) {
            newReq = newReq.clone({
              headers: newReq.headers.set('Content-Type', 'application/json'),
            });
          }

          newReq = newReq.clone({
            headers: newReq.headers.set('Accept', 'application/json'),
          });
        }

        return next.handle(newReq);
      })
    );
  }
}
