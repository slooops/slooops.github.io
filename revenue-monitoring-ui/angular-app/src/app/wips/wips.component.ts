import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { DestroyManager } from '../providers/destroy-manager.service';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthenticationService } from '../providers/authentication.service';
import { DataService } from '../providers/data.service';
import { ApiHttpService } from '../providers/http.service';
import { MenuService } from '../providers/menu.service';

export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

@Component({
  selector: 'app-wips',
  templateUrl: './wips.component.html',
  styleUrls: ['./wips.component.css'],
  providers: [DestroyManager],
  imports: [CommonModule, MatTabsModule, MonitoringDashboardComponent],
  standalone: true,
})
export class WipsComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private dataService: DataService,
    private datePipe: DatePipe,
    protected authService: AuthenticationService,
    private menuService: MenuService
  ) {
    this.http = http;
    this.roles = this.authService.getRoles();
    this.userContextData = {
      username: this.authService.getUserName(),
      userId: this.authService.getUserID(),
      roles: this.roles,
      apiUrl: this.authService.getHostUrl(),
      assignmentUsersFilterKey: '',
    };
  }
  protected http: ApiHttpService;
  summaryDataSource: any;
  detailsDataSource: any;
  selection = new SelectionModel<any>(true, []);
  roles: string[] = [];
  userContextData: UserContext;

  specialWords: string[] = [
    'name',
    'amount',
    'interface',
    'error',
    'number',
    'total',
    'hold',
    'pending',
    'status',
    'num',
    'year',
    'status',
    'sub',
    'staging',
    'id',
    'line',
  ];

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  ngOnInit(): void {}

  wipsUrls: { [key: string]: string } = {
    summaryUrl: 'wips-summary',
    detailsUrl: 'wips-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  wipsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [];
}
