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
export class MenuComponent implements OnInit, AfterViewInit {
  constructor(
    private dataService: DataService,
    http: ApiHttpService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.http = http;
  }

  protected http: ApiHttpService;

  userRoles: String[] = [];
  ngOnInit(): void {
    // this.getUserId();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.userRoles = this.dataService.getUserRoles();
      console.log(this.userRoles);
      this.isAdmin = this.userRoles.includes('ADMIN');
      this.rolesReady = true;
      this.cdr.detectChanges();
    }, 1500);
  }
  isAdmin: boolean = true;
  rolesReady = false;
  errorPath: boolean = true;
  loggedinUser: string;

  // getUserId() {
  //   this.dataService.setLoading(true);
  //   this.http.getUser('/user/data').subscribe((data) => {
  //     let username = data['auth_user'];
  //     this.dataService.setUsername(username);
  //     this.getUserRoles(username);
  //   });
  // }

  // getUserRoles(username: any) {
  //   this.http.post('user-role', username).subscribe((data: any) => {
  //     if (data) {
  //       this.userRoles = data['userRoles'];
  //       this.dataService.setUserRoles(this.userRoles);
  //       this.isAdmin = this.userRoles.includes('ADMIN');
  //       this.rolesReady = true;
  //       let redirectPath = this.redirectPath();
  //       this.errorPath = redirectPath === 'error' ? true : false;
  //     } else {
  //       this.errorPath = true;
  //       this.redirect('error');
  //     }
  //   });
  // }

  checkRole(role: String) {
    return this.rolesReady && this.userRoles.includes(role);
  }
}
