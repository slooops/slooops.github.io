import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HttpService {
  hostUrl: string = '';

  constructor(private http: HttpClient) {}

  setHostUrl(hostUrl: string): void {
    if (hostUrl) {
      this.hostUrl = hostUrl;
    }
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
