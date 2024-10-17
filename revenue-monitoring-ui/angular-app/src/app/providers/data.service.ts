import { Injectable } from '@angular/core';
import { errorDashModel } from '../error-dash/error-dash.component';
import { BehaviorSubject } from 'rxjs';
import { ApiHttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  selectedErrorData: errorDashModel[] = [];
  allErrorsSelected: boolean = true;
  userRoles: string[] = [];
  username: any;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: ApiHttpService) {}

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

  getUserId(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.getUser('/user/data').subscribe(
        (data: any) => {
          let username = data['auth_user'];
          console.log('data', data);
          resolve(username);
        },
        (error) => reject(error)
      );
    });
  }

  getRolesForUser(username: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post('user-role', username).subscribe(
        (data: any) => {
          console.log('roles', data);
          this.userRoles = data['userRoles'];
          this.setUserRoles(this.userRoles);
          resolve();
        },
        (error) => reject(error)
      );
    });
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
}
