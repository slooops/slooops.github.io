import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

export interface PeriodInfo {
  periodName: string;
  periodEndDate: string;
  lastUpdated?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HomeDataService {
  constructor(private http: ApiHttpService) {}

  /**
   * Get period information from backend
   * Endpoint returns List<Map<String, Object>> from Spring Boot
   */
  getPeriodInfo(destroyManager: DestroyManager): Observable<PeriodInfo> {
    return this.http.get('landing-page-period-data', destroyManager).pipe(
      map((response: any) => {
        // Backend returns array, take first element
        const data =
          Array.isArray(response) && response.length > 0
            ? response[0]
            : response;

        return {
          periodName: data?.periodName || data?.PERIOD_NAME || '',
          periodEndDate: data?.periodEndDate || data?.PERIOD_END_DATE || '',
          lastUpdated: new Date().toLocaleString(),
        };
      })
    );
  }
}
