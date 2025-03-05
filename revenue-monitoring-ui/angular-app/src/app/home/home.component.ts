import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { th } from 'date-fns/locale';
import { AuthenticationService } from '../providers/authentication.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DestroyManager],
})
export class HomeComponent implements OnInit {
  constructor(
    private router: Router,
    private http: ApiHttpService,
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService
  ) {}
  i2cData: any;
  homeLoading: boolean = true;
  userRoles: any;
  ngOnInit(): void {
    this.getI2CSummary();
    // this.getUserId();
    this.userRoles = this.authService.getRoles();
    this.homeLoading = false;
  }

  navigateTo(page: string): void {
    this.router.navigate([page]);
  }

  getI2CSummary() {
    this.dataService
      .getI2CSummary(this.destroyManager)
      .subscribe((data: any) => {
        this.i2cData = data;
      });
  }

  formatData(data): any[] {
    let formattedAmount;
    formattedAmount = `$${Number(data).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

    return formattedAmount;
  }

  // getUserId() {
  //   this.dataService.setLoading(true);
  //   this.homeLoading = true;
  //   this.dataService.getUserId(this.destroyManager).subscribe((data) => {
  //     let username = data['auth_user'];
  //     this.dataService.setUsername(username);
  //     this.getUserRoles(username);
  //   });
  // }

  // getUserRoles(username: string) {
  //   this.dataService
  //     .getRoles(username, this.destroyManager)
  //     .subscribe((data) => {
  //       this.userRoles = data['userRoles'];
  //       this.dataService.setUserRoles(this.userRoles);
  //       this.homeLoading = false;
  //     });
  // }
}
