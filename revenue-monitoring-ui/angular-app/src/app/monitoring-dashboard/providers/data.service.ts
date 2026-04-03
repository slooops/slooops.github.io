import { Injectable, OnDestroy } from '@angular/core';
import { HttpService } from './http.service';
import { Observable, Subject, of } from 'rxjs';
import { DataFormattingService } from './data-formatting.service';
import { catchError, shareReplay, takeUntil, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MonitoringDataService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private cacheExpiryTime = 10 * 60 * 1000; // 10 minutes
  private cacheStore = new Map<
    string,
    { data$: Observable<any>; expiry: number }
  >();

  constructor(
    private http: HttpService,
    private dataFormattingService: DataFormattingService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchWithCache(url: string): Observable<any> {
    const currentTime = Date.now();
    const cachedData = this.cacheStore.get(url);

    if (cachedData && cachedData.expiry > currentTime) {
      return cachedData.data$;
    }

    const data$ = this.http.get(url).pipe(
      shareReplay(1),
      tap(() => {
        this.cacheStore.set(url, {
          data$: data$,
          expiry: currentTime + this.cacheExpiryTime,
        });
      }),
      catchError((error) => {
        console.error(`Error fetching data from ${url}:`, error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    );

    return data$;
  }

  getMonitoringPeriodStatus(): Observable<any> {
    return this.fetchWithCache('monitoring-period-status');
  }

  getAssignableUsers() {
    this.fetchWithCache('summary-assignment-users').subscribe((data) => {
      this.setAssignmentUsers(data);
    });
  }

  assignmentUsers: any;

  setAssignmentUsers(assignmentUsers: any) {
    this.assignmentUsers = assignmentUsers;
  }

  getAssignmentUsers(componentName: string): any {
    if (!this.assignmentUsers || !componentName) {
      return this.assignmentUsers;
    }

    return this.assignmentUsers.filter(
      (user: any) =>
        user.FILTER_KEY === null || user.FILTER_KEY === componentName
    );
  }

  getSummary(url: string): Observable<any> {
    return this.http.get(url);
  }

  getDetails(url: string): Observable<any> {
    return this.http.get(url);
  }

  getFilteredDetails(
    url: string,
    data: any,
    keysForFiltering: any
  ): Observable<any> {
    const pageRequest = keysForFiltering.reduce((acc, key) => {
      const keyName = this.dataFormattingService.camelCase(key);
      acc[keyName] = data.map((row) => row[key]).join(',');
      return acc;
    }, {});
    return this.http.get(url, { params: pageRequest });
  }
}
