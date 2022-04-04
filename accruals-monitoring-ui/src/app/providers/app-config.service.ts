import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  private config: any;
  private api_url!: string;

  constructor(private http: HttpClient) {}

  loadConfig() {
    this.config = this.http.get("./assets/config/config.json");
    // subscribe((data: any) => {
    //   this.api_url = data.api_url;
    //   console.log(this.config);
    // });    
  }

  getApiUrl () : string {
    console.log('API URL');
    console.log(this.api_url);
    return this.api_url;
  }

  getConfig() {
    console.log(this.config);
    return this.config;
  }

}