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

  userRoles: any;
  ngOnInit(): void {
    this.getUserId();
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
      this.getUserRoles(username);
    });
  }

  getUserRoles(username: string) {
    this.dataService.getRoles(username).subscribe((data) => {
      this.userRoles = data['userRoles'];
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
