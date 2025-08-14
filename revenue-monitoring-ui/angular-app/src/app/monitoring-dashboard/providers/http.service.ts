import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntil } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpService {
  // hostUrl: string = 'http://localhost:8080/api/';
  hostUrl: string = 'https://operations-control-tower-stg-api.cisco.com/api/';
  // hostUrl: string = 'https://operations-control-tower-api.cisco.com/api/';

  constructor(private http: HttpClient) {}

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
