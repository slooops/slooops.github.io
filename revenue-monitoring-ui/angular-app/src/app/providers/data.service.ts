import { Injectable } from '@angular/core';
import { errorDashModel } from '../error-dash/error-dash.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiHttpService } from './http.service';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  selectedErrorData: errorDashModel[] = [];
  allErrorsSelected: boolean = true;
  userRoles: string[] = [];
  username: any;
  assignmentUsers: any;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private periodStatusCache$: Observable<any>;
  private i2csummaryCache$: Observable<any>;
  private largeDealData$: Observable<any>;
  private userRoles$: Observable<any>;
  private userdata$: Observable<any>;

  constructor(private http: ApiHttpService) {}

  private tabData = new Map<
    string,
    BehaviorSubject<{ [key: string]: string }>
  >();

  getUserId() {
    if (!this.userdata$) {
      this.userdata$ = this.http.getUser('/user/name').pipe(shareReplay(1));
    }
    return this.userdata$;
  }

  getMonitoringPeriodStatus(): Observable<any> {
    if (!this.periodStatusCache$) {
      this.periodStatusCache$ = this.http
        .get('monitoring-period-status')
        .pipe(shareReplay(1));
    }
    return this.periodStatusCache$;
  }

  getI2CSummary(): Observable<any> {
    if (!this.i2csummaryCache$) {
      this.i2csummaryCache$ = this.http
        .get('invoice-to-cash-summary')
        .pipe(shareReplay(1));
    }
    return this.i2csummaryCache$;
  }

  getLargeDealData(): Observable<any> {
    if (!this.largeDealData$) {
      this.largeDealData$ = this.http.get('order-status').pipe(shareReplay(1));
    }
    return this.largeDealData$;
  }

  getRoles(username: string): Observable<any> {
    if (!this.userRoles$) {
      this.userRoles$ = this.http
        .get(`user-role?username=${username}`)
        .pipe(shareReplay(1));
    }
    return this.userRoles$;
  }

  setErrorData(errorData: errorDashModel[]) {
    this.selectedErrorData = errorData;
  }

  getErrorData() {
    return this.selectedErrorData;
  }

  setAllErrorsSelected(allErrorsSelected: boolean) {
    this.allErrorsSelected = allErrorsSelected;
  }

  getAllErrorsSelected() {
    return this.allErrorsSelected;
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
