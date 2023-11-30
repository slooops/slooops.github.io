import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  constructor(private dataService: DataService, http: ApiHttpService) {
    this.http = http;
  }

  protected http: ApiHttpService;

  userRoles: String[] = [];
  ngOnInit(): void {
    this.getUserRoles();
  }
  isAdmin: boolean = false;
  rolesReady = false;

  getUserRoles() {
    this.http.get('user-role').subscribe((data: any) => {
      this.userRoles = data;
      this.dataService.setUserRoles(data);
      this.isAdmin = this.userRoles.includes('admin');
      this.rolesReady = true;
    });
  }

  checkRole(role: String) {
    return this.rolesReady && this.userRoles.includes(role);
  }
}
