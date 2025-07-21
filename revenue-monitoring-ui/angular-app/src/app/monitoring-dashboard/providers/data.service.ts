import { Injectable } from '@angular/core';
import { DestroyObservables, HttpService } from './http.service';
import { Observable } from 'rxjs';
import { DataFormattingService } from './data-formatting.service';

@Injectable({ providedIn: 'root' })
export class MonitoringDataService {
  constructor(
    private http: HttpService,
    private dataFormattingService: DataFormattingService
  ) {}

  getSummary(url: string, destroyManager: DestroyObservables): Observable<any> {
    return this.http.get(url, destroyManager);
  }

  getDetails(url: string, destroyManager: DestroyObservables): Observable<any> {
    return this.http.get(url, destroyManager);
  }

  getFilteredDetails(
    url: string,
    data: any,
    keysForFiltering: any,
    destroyManager: DestroyObservables
  ): Observable<any> {
    const pageRequest = keysForFiltering.reduce((acc, key) => {
      const keyName = this.dataFormattingService.camelCase(key);
      acc[keyName] = data.map((row) => row[key]).join(',');
      return acc;
    }, {});
    return this.http.get(url, destroyManager, { params: pageRequest });
  }
}
