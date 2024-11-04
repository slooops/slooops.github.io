import { Injectable } from '@angular/core';
import { errorDashModel } from '../error-dash/error-dash.component';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ApiHttpService } from './http.service';

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

  private tab1Totals = new BehaviorSubject<{
    [key: string]: string | number;
  } | null>(null);
  private tab2Totals = new BehaviorSubject<{
    [key: string]: string | number;
  } | null>(null);
  private tab3Totals = new BehaviorSubject<{
    [key: string]: string | number;
  } | null>(null);
  totalImpactData$: Observable<any>;

  constructor(private http: ApiHttpService) {
    this.totalImpactData$ = combineLatest([
      this.tab1Totals,
      this.tab2Totals,
      this.tab3Totals,
    ]).pipe(
      map(([tab1, tab2, tab3]) => ({
        tab1Totals: tab1,
        tab2Totals: tab2,
        tab3Totals: tab3,
      }))
    );
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

  // getUserId(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this.http.getUser('/user/data').subscribe(
  //       (data: any) => {
  //         let username = data['auth_user'];
  //         console.log('data', data);
  //         resolve(username);
  //       },
  //       (error) => reject(error)
  //     );
  //   });
  // }

  // getRolesForUser(username: any): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this.http.post('user-role', username).subscribe(
  //       (data: any) => {
  //         console.log('roles', data);
  //         this.userRoles = data['userRoles'];
  //         this.setUserRoles(this.userRoles);
  //         resolve();
  //       },
  //       (error) => reject(error)
  //     );
  //   });
  // }

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

  setTab1Data(data: { [key: string]: string | number }): void {
    this.tab1Totals.next(data);
  }

  setTab2Data(data: { [key: string]: string | number }): void {
    this.tab2Totals.next(data);
  }

  setTab3Data(data: { [key: string]: string | number }): void {
    this.tab3Totals.next(data);
  }
}
