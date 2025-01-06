import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { Subject, takeUntil } from 'rxjs';
import { DestroyManager } from './destroy-manager.service';

@Injectable({ providedIn: 'root' })
export class ApiHttpService {
  hostUrl: string = '';

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.hostUrl = this.config.getApiUrl();
  }

  public getHostUrl(): string {
    return this.hostUrl;
  }

  public get(url: string, destroyManager: DestroyManager, options?: any) {
    return this.http
      .get(this.hostUrl + url, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }

  public post(
    url: string,
    data: any,
    destroyManager: DestroyManager,
    options?: any
  ) {
    return this.http
      .post(this.hostUrl + url, data, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }

  public put(
    url: string,
    data: any,
    destroyManager: DestroyManager,
    options?: any
  ) {
    return this.http
      .put(this.hostUrl + url, data, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }

  public delete(url: string, destroyManager: DestroyManager, options?: any) {
    return this.http
      .delete(this.hostUrl + url, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }

  public getUser(url: string, destroyManager: DestroyManager, options?: any) {
    return this.http
      .get(url, options)
      .pipe(takeUntil(destroyManager.destroyObservable));
  }
}
