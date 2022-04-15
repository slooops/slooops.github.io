import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class ApiHttpService {

  hostUrl: string = '';

  constructor (
    private http: HttpClient, private config: AppConfigService
  ) {
    this.hostUrl = this.config.getApiUrl();
  }

  public getHostUrl(): string {
    return this.hostUrl;
}

  public get(url: string, options?: any) {
    return this.http.get(this.hostUrl + url, options);
  }

  public post(url: string, data: any, options?: any) {
    return this.http.post(this.hostUrl + url, data, options);
  }

  public put(url: string, data: any, options?: any) {
    return this.http.put(this.hostUrl + url, data, options);
  }

  public delete(url: string, options?: any) {
    return this.http.delete(this.hostUrl + url, options);
  }
  
}
