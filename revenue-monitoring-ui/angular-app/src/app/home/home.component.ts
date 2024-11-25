import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';

// import {
//   AccessorModule,
//   HbrButton,
//   HbrInput,
// } from '@harbor/elements-angular-standalone';
// import {
//   emptyState,
//   magnifyingGlass,
//   info,
//   alertsPositiveLarge,
// } from '@harbor/elements/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(
    private router: Router,
    private http: ApiHttpService,
    private dataService: DataService
  ) {}
  i2cData: any;

  ngOnInit(): void {
    this.getI2CSummary();
    this.getUserId();
  }

  navigateTo(page: string): void {
    this.router.navigate([page]);
  }

  getI2CSummary() {
    this.dataService.getI2CSummary().subscribe((data: any) => {
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

  getUserId() {
    this.dataService.setLoading(true);
    this.homeLoading = true;
    this.dataService.getUserId().subscribe((data) => {
      let username = data['auth_user'];
      this.dataService.setUsername(username);
      this.getUserRoles(username);
    });
  }

  userRoles: any;
  homeLoading: boolean = false;
  getUserRoles(username: string) {
    this.dataService.getRoles(username).subscribe((data) => {
      this.userRoles = data['userRoles'];
      this.dataService.setUserRoles(this.userRoles);
      this.homeLoading = false;
    });
  }
}
