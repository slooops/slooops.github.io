import { Injectable } from '@angular/core';
import { errorDashModel } from '../error-dash/error-dash.component';
import { BehaviorSubject, Observable } from 'rxjs';

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

  private tabData = new Map<
    string,
    BehaviorSubject<{ [key: string]: string }>
  >();

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
