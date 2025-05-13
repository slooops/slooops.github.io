import { Injectable } from '@angular/core';

declare var require: any;
var configJson: any = require('../../assets/config/config.json');

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  constructor() {}

  getApiUrl(): string {
    return configJson.api_url;
  }
}
