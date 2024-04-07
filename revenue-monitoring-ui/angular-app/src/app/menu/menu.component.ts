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
    setTimeout(() => {
      this.getUserRoles();
    }, 2000);
  }
  isAdmin: boolean = true;
  rolesReady = false;
  errorPath: boolean = true;
  loggedinUser: string;

  getUserRoles() {
    this.dataService.setLoading(true);
    const loggedinUser = {
      loggedinUser: this.loggedinUser,
    };
    this.http.post('user-role', loggedinUser).subscribe((data: any) => {
      console.log(data);
      this.userRoles = data['userRoles'];
      this.loggedinUser = data['username'];
      this.dataService.setUserRoles(this.userRoles);
      this.isAdmin = this.userRoles.includes('ADMIN');
      this.rolesReady = true;
      console.log(this.loggedinUser);
      let redirectPath = this.redirectPath();
      this.errorPath = redirectPath === 'error' ? true : false;
      this.redirect(redirectPath);
    });
  }

  checkRole(role: String) {
    return this.rolesReady && this.userRoles.includes(role);
  }

  redirectPath() {
    if (
      this.userRoles.includes('ADMIN') ||
      this.userRoles.includes('PERIOD_CLOSE')
    ) {
      return 'period-close-tracking-preclose';
    } else {
      if (this.userRoles.includes('LARGE_DEAL')) {
        return 'large-deal-tracker';
      } else {
        if (this.userRoles.includes('WD0')) {
          return 'wd0-dash';
        } else if (this.userRoles.includes('MIDCLOSE_VOLUMES')) {
          return 'mid-close-volumes';
        } else {
          return 'error';
        }
      }
    }
  }

  redirect(navigateString) {
    this.dataService.setLoading(false);
    this.router.navigateByUrl(navigateString);
  }
}
