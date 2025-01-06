import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { ApiHttpService } from '../providers/http.service';
import { Router } from '@angular/router';
import { DestroyManager } from '../providers/destroy-manager.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  providers: [DestroyManager],
})
export class MenuComponent implements OnInit {
  constructor(
    private dataService: DataService,
    http: ApiHttpService,
    private router: Router,
    private destroyManager: DestroyManager
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
    this.dataService.getUserId(this.destroyManager).subscribe((data) => {
      let username = data['auth_user'];
      this.dataService.setUsername(username);
      this.getUserRoles(username);
    });
  }

  getUserRoles(username: string) {
    this.dataService
      .getRoles(username, this.destroyManager)
      .subscribe((data) => {
        this.userRoles = data['userRoles'];
        console.log(this.userRoles.includes('EXCEPTION_READ_ONLY'));
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
    this.http
      .get('summary-assignment-users', this.destroyManager)
      .subscribe((data) => {
        this.assignmentUsers = data;
        this.dataService.setAssignmentUsers(this.assignmentUsers);
      });
  }
}
