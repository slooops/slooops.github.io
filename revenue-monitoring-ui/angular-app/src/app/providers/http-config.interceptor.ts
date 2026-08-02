import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpClient,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, switchMap, tap } from 'rxjs';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
  private readonly logUrl = '/client-log';

  constructor(
    private auth: AuthenticationService,
    private http: HttpClient,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    // Avoid logging the log API itself
    const skipLogging = req.url.includes(this.logUrl);

    return from(this.auth.getValidToken()).pipe(
      switchMap(() => {
        const token: string = sessionStorage.getItem('accessToken') || '';

        let newReq = req.clone();

        if (!newReq.headers.has('Authorization') && token) {
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

        if (!newReq.headers.has('Accept')) {
          newReq = newReq.clone({
            headers: newReq.headers.set('Accept', 'application/json'),
          });
        }

        return next.handle(newReq).pipe(
          tap({
            next: (event) => {
              if (event instanceof HttpResponse && !skipLogging) {
                this.pushHttpLog(newReq, event.status, Date.now() - startTime);
              }
            },
            error: (error: HttpErrorResponse) => {
              if (!skipLogging) {
                this.pushHttpLog(
                  newReq,
                  error.status || 0,
                  Date.now() - startTime,
                  error.message,
                );
              }
            },
          }),
        );
      }),
    );
  }

  private pushHttpLog(
    req: HttpRequest<any>,
    status: number,
    durationMs: number,
    errorMessage?: string,
  ): void {
    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    let normalizedPath = req.url;
    try {
      const parsed = new URL(req.urlWithParams, window.location.origin);
      normalizedPath = parsed.pathname;
    } catch {
      normalizedPath = req.url.split('?')[0];
    }

    const logPayload = {
      type: 'client-http-log',
      requestId,
      timestamp: new Date().toISOString(),
      sessionId: sessionStorage.getItem('sessionId') || null,
      method: req.method,
      urlPath: normalizedPath,
      status,
      durationMs,
      errorMessage: errorMessage || null,
      host: window.location.host,
      origin: window.location.origin,
      secFetchSite: 'same-origin',
      secFetchMode: 'cors',
      secFetchDest: 'empty',
      contentType: req.headers.get('Content-Type') || 'application/json',
      contentLength:
        req.body != null && !(req.body instanceof FormData)
          ? JSON.stringify(req.body).length
          : null,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
    };

    // Do not subscribe with error handling that affects actual API call
    this.http.post(this.logUrl, logPayload).subscribe({
      error: () => {
        // silently ignore logging failures
      },
    });
  }
}
