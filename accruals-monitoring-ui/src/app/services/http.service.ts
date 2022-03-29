import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class ApiHttpService {

  hostUrl: string = environment.apiHost;

  constructor (
    private http: HttpClient
  ) {}

  public getHostUrl(): string {
    console.log(environment.apiHost);
    return environment.apiHost;
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
