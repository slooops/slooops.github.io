import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
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
  loggedinUser: string;

  getUserId() {
    this.dataService.setLoading(true);
    this.http.getUser('/user/data').subscribe((data) => {
      let username = data['auth_user'];
      this.dataService.setUsername(username);
      this.getUserRoles(username);
    });
  }

  getUserRoles(username: any) {
    this.http.post('user-role', username).subscribe((data: any) => {
      if (data) {
        this.userRoles = data['userRoles'];
        this.dataService.setUserRoles(this.userRoles);
        this.isAdmin = this.userRoles.includes('ADMIN');
        this.rolesReady = true;
      } else {
      }
    });
  }

  checkRole(role: String) {
    return this.rolesReady && this.userRoles.includes(role);
  }
}
