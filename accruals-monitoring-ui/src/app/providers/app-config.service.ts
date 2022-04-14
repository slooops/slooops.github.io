import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

declare var require: any;
var configJson: any = require('../../assets/config/config.json');

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  constructor(private http: HttpClient) {}

  getApiUrl () : string {
    return configJson.api_url;
  }

  getConfig() {
    return configJson;
  }

}