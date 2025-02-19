import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { ApiHttpService } from './http.service';
import { catchError, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { DestroyManager } from './destroy-manager.service';

@Injectable({
  providedIn: 'root',
})
export class DataService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private cacheExpiryTime = 10 * 60 * 1000;

  allErrorsSelected: boolean = true;
  userRoles: any;
  username: any;
  assignmentUsers: any;

  constructor(private http: ApiHttpService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingSubject.complete();
  }

  private cacheStore = new Map<
    string,
    { data$: Observable<any>; expiry: number }
  >();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private tabData = new Map<
    string,
    BehaviorSubject<{ [key: string]: string }>
  >();

  private fetchWithCache(
    url: string,
    destroyManager: DestroyManager
  ): Observable<any> {
    const currentTime = Date.now();
    const cachedData = this.cacheStore.get(url);
    if (cachedData && cachedData.expiry > currentTime) {
      return cachedData.data$;
    }
    const data$ = this.http.get(url, destroyManager).pipe(
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

  getMonitoringPeriodStatus(destroyManager: DestroyManager): Observable<any> {
    return this.fetchWithCache('monitoring-period-status', destroyManager);
  }

  getI2CSummary(destroyManager: DestroyManager): Observable<any> {
    return this.fetchWithCache('invoice-to-cash-summary', destroyManager);
  }

  getLargeDealData(destroyManager: DestroyManager): Observable<any> {
    return this.fetchWithCache('order-status', destroyManager);
  }

  getUserRoles() {
    return this.userRoles;
  }

  setUserRoles(userRoles: any) {
    this.userRoles = userRoles;
  }

  setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  isLoading() {
    return this.loadingSubject.asObservable();
  }

  setUsername(username: any) {
    this.username = username;
  }

  getUsername() {
    return this.username;
  }

  setAssignmentUsers(assignmentUsers: any) {
    this.assignmentUsers = assignmentUsers;
  }

  getAssignmentUsers() {
    return this.assignmentUsers;
  }

  private ensureTabData(tabName: string) {
    if (!this.tabData.has(tabName)) {
      this.tabData.set(
        tabName,
        new BehaviorSubject<{ [key: string]: string }>({})
      );
    }
  }

  setTabData(tabName: string, totals: { [key: string]: string }) {
    this.ensureTabData(tabName);
    this.tabData.get(tabName)?.next(totals);
  }

  getTabData(tabName: string): Observable<{ [key: string]: string }> {
    this.ensureTabData(tabName);
    return this.tabData.get(tabName)!.asObservable();
  }
}
