import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { DestroyManager } from '../providers/destroy-manager.service';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthenticationService } from '../providers/authentication.service';
import { DataService } from '../providers/data.service';
import { ApiHttpService } from '../providers/http.service';
import { MenuService } from '../providers/menu.service';
import { provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import { Validators } from '@angular/forms';

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
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [CommonModule, MatTabsModule, MonitoringDashboardComponent],
  standalone: true,
})
export class WipsComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private dataService: DataService,
    protected authService: AuthenticationService,
  ) {
    this.http = http;
    this.roles = this.authService.getRoles();
    this.userContextData = {
      username: this.authService.getUserName(),
      userId: this.authService.getUserID(),
      roles: this.roles,
      apiUrl: this.authService.getHostUrl(),
      assignmentUsersFilterKey: 'ORDER_MANAGEMENT',
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

  periodStatus: any;

  ngOnInit(): void {
    this.dataService.periodStatus$.subscribe((data: any) => {
      if (data) {
        this.periodStatus = {
          ...data,
          lastUpdated: new Date().toLocaleString(),
        };
      }
    });
  }

  wipsUrls: { [key: string]: string } = {
    summaryUrl: 'wips-summary',
    detailsUrl: 'wips-details',
    filteredDetailsUrl: 'wips-jobs-details-filtered',
    summaryUpdateUrl: 'wips-summary-update',
    webexMessageUrl: 'send-message-wips',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  showGridMenu: boolean = false;

  toggleGridMenu(event: Event): void {
    event.stopPropagation();
    this.showGridMenu = !this.showGridMenu;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showGridMenu = false;
  }

  wipsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'sub_category',
      formControlName: 'subCategory',
      type: 'select',
      subAppMapping: false,
    },
  ];

  fieldConfig = [
    {
      controlName: 'timeStamp',
      label: 'Timestamp',
      sourceKey: 'timestamp',
      disabled: true,
    },
    {
      controlName: 'scneario',
      label: 'Scenario',
      sourceKey: 'scenario',
      disabled: true,
    },
    {
      controlName: 'dataSource',
      label: 'Data Source',
      sourceKey: 'data_source',
      disabled: true,
    },
    {
      controlName: 'totalCount',
      label: 'Total Count',
      sourceKey: 'total_count',
      disabled: true,
    },
    {
      controlName: 'assignedTo',
      label: 'Assigned To',
      sourceKey: 'assigned_to',
      disabled: 'dynamic',
      validators: [Validators.required],
    },
    {
      controlName: 'status',
      label: 'Status',
      sourceKey: 'status',
      options: [
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Closed', label: 'Closed' },
      ],
      validators: [Validators.required],
    },
    { controlName: 'comments', label: 'Comments', sourceKey: 'comments' },
  ];
}
