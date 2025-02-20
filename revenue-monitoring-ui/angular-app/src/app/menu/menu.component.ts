import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { ApiHttpService } from '../providers/http.service';
import { Router } from '@angular/router';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';

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
    private authService: AuthenticationService
  ) {
    this.http = http;
  }

  protected http: ApiHttpService;

  userRoles: any;
  ngOnInit(): void {
    this.userRoles = this.authService.getRoles();
    this.dataService.setUserRoles(this.userRoles);
    this.isAdmin = this.userRoles.includes('ADMIN');
    this.rolesReady = true;
  }

  isAdmin: boolean = false;
  rolesReady = false;
  loggedinUser: string;

  checkRole(role: String) {
    return this.rolesReady && this.userRoles.includes(role);
  }
}
