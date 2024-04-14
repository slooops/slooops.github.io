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
  }
  isAdmin: boolean = true;
  rolesReady = false;
  errorPath: boolean = true;
  loggedinUser: string;

  getUserId() {
    this.dataService.setLoading(true);
    this.http.getUser('/user/data').subscribe((data) => {
      console.log(data['auth_user']);
      console.log('internal method ' + JSON.stringify(data));
    });
    this.http
      .get('user-id', {
        responseType: 'text',
      })
      .subscribe((data) => {
        console.log(data);
        let username = data;
        this.dataService.setUsername(username);
        this.getUserRoles(username);
      });
  }

  getUserRoles(username: any) {
    this.http.post('user-role', username).subscribe((data: any) => {
      this.userRoles = data['userRoles'];
      this.dataService.setUserRoles(this.userRoles);
      this.isAdmin = this.userRoles.includes('ADMIN');
      this.rolesReady = true;
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
