import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { ApiHttpService } from '../providers/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  constructor(
    private dataService: DataService,
    http: ApiHttpService,
    private router: Router
  ) {
    this.http = http;
  }

  protected http: ApiHttpService;

  userRoles: String[] = [];
  ngOnInit(): void {
    this.getUserId();
    this.getUserRoles();
    this.getAssignmentUsers();
  }

  isAdmin: boolean = false;
  rolesReady = false;
  loggedinUser: string;

  getUserId() {
    this.dataService.setLoading(true);
    this.http.getUser('/user/name').subscribe((data) => {
      let username = data['auth_user'];
      this.dataService.setUsername(username);
    });
  }

  getUserRoles() {
    this.http.getUser('/user/data').subscribe((data) => {
      this.userRoles = data['auth_user_roles'];
      this.dataService.setUserRoles(this.userRoles);
      this.isAdmin = this.userRoles.includes('ADMIN');
      this.rolesReady = true;
    });
  }

  checkRole(role: String) {
    return this.rolesReady && this.userRoles.includes(role);
  }

  assignmentUsers: any;

  getAssignmentUsers() {
    this.http.get('summary-assignment-users').subscribe((data) => {
      this.assignmentUsers = data;
      this.dataService.setAssignmentUsers(this.assignmentUsers);
    });
  }
}
