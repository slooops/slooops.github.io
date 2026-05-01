import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import {
  MenuMiniComponent,
  MenuMiniItem,
} from '../shared/menu-mini/menu-mini.component';

export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

@Component({
  selector: 'app-gl-posting',
  templateUrl: './gl-posting.component.html',
  styleUrl: './gl-posting.component.css',
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [CommonModule, MonitoringDashboardComponent, MenuMiniComponent],
  standalone: true,
})
export class GlPostingComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    protected authService: AuthenticationService,
    private menuService: MenuService,
  ) {
    // Initialize roles and user context in constructor so they're available before template renders
    this.roles = this.authService.getUserAccessRoles();
    this.userContextData = {
      username: this.authService.getUserName(),
      userId: this.authService.getUserID(),
      roles: this.roles,
      apiUrl: this.authService.getHostUrl(),
      assignmentUsersFilterKey: 'I2C',
    };
  }
  roles: string[] = [];
  userContextData: UserContext;

  ngOnInit() {
    this.getErrorSummaryPeriodStatus();
  }

  glFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'LEDGER_NAME',
      formControlName: 'ledgerName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'glBatchName',
      columnName: 'GL_BATCH_NAME',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'accountSeg',
      columnName: 'ACCOUNT_SEG',
      type: 'text',
      subAppMapping: false,
    },
  ];

  glKeysToMap: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'LEDGER_NAME',
    'GL_BATCH_NAME',
    'TRANSACTION_DATE',
  ];

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

  fieldConfig = [
    {
      controlName: 'periodName',
      label: 'Period Name',
      sourceKey: 'PERIOD_NAME',
      disabled: true,
    },
    {
      controlName: 'appName',
      label: 'Application Name',
      sourceKey: 'APPLICATION_NAME',
      disabled: true,
    },
    {
      controlName: 'processFlow',
      label: 'Process Flow',
      sourceKey: 'PROCESS_FLOW',
      disabled: true,
    },
    {
      controlName: 'orgName',
      label: 'Ledger Name',
      sourceKey: 'LEDGER_NAME',
      disabled: true,
    },
    {
      controlName: 'creationDate',
      label: 'Transaction Date',
      sourceKey: 'TRANSACTION_DATE',
      disabled: true,
    },
    {
      controlName: 'aging',
      label: 'Aging',
      sourceKey: 'AGING',
      disabled: true,
    },
    {
      controlName: 'assignedTo',
      label: 'Assigned To',
      sourceKey: 'ASSIGNED_TO',
      disabled: 'dynamic',
      validators: [Validators.required],
    },
    { controlName: 'comments', label: 'Comments', sourceKey: 'COMMENTS' },
  ];

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  glUrls: { [key: string]: string } = {
    summaryUrl: 'gl-error-summary',
    detailsUrl: 'gl-error-details',
    filteredDetailsUrl: 'gl-details-filtered',
    summaryUpdateUrl: 'gl-summary-update',
    webexMessageUrl: 'send-message-gl',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  formatLabel(label: string): string {
    const acronyms = this.skippedWords || [];

    return label
      .toLowerCase() // Convert to lowercase
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split into words
      .map(
        (word) =>
          acronyms.includes(word.toUpperCase())
            ? word.toUpperCase() // Keep the word in uppercase if it's in skippedWords
            : word.charAt(0).toUpperCase() + word.slice(1), // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }

  periodStatus: any;

  menuItems: MenuMiniItem[] = [{ label: 'General Ledger' }];

  onTabChange(index: number) {
    // Update last updated timestamp on tab switch
    if (this.periodStatus) {
      this.periodStatus = {
        ...this.periodStatus,
        lastUpdated: new Date().toLocaleString(),
      };
    }
  }

  getErrorSummaryPeriodStatus() {
    this.dataService.periodStatus$.subscribe((data: any) => {
      if (data) {
        this.periodStatus = {
          ...data,
          lastUpdated: new Date().toLocaleString(),
        };
      }
    });
  }
}
