import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpService {
  hostUrl: string = 'http://localhost:8080/api/';

  constructor(private http: HttpClient) {}

  public get(url: string, destroyManager: DestroyObservables, options?: any) {
    console.log('GET request to:', this.hostUrl + url);
    return this.http
      .get(this.hostUrl + url, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }

  public post(url: string, data: any, options?: any) {
    return this.http.post(this.hostUrl + url, data, options);
  }

  public put(
    url: string,
    data: any,
    destroyManager: DestroyObservables,
    options?: any
  ) {
    return this.http
      .put(this.hostUrl + url, data, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }

  public delete(
    url: string,
    destroyManager: DestroyObservables,
    options?: any
  ) {
    return this.http
      .delete(this.hostUrl + url, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }
}

@Injectable()
export class DestroyObservables implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  get destroyObservable() {
    return this.destroy$.asObservable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
