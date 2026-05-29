import { Component, HostBinding, OnInit } from '@angular/core';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ThemeService } from '../providers/theme.service';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../providers/authentication.service';
import { DataService } from '../providers/data.service';
import { MenuService } from '../providers/menu.service';
import { Validators } from '@angular/forms';
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
  selector: 'app-ait',
  templateUrl: './ait.component.html',
  styleUrls: ['./ait.component.css'],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [CommonModule, MonitoringDashboardComponent, MenuMiniComponent],
  standalone: true,
})
export class AitComponent implements OnInit {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    protected authService: AuthenticationService,
    private menuService: MenuService,
    public themeService: ThemeService,
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
    this.getDefaultTabIndex();
  }

  visibleTabs: {
    label: string;
    component: string;
    role: string[];
  }[] = [
    {
      label: 'General Ledger',
      component: 'app-general-ledger',
      role: [
        'ADMIN',
        'MONITORING_I2C',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string }[] = [];

  glSubTabs: string[] = ['Interface', 'GL/FA Jobs', 'Unposted'];
  glSubIndex: number = 0;

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role)),
    );
  }

  onGridMenuItemClick(index: number): void {
    this.onTabChange(index);
  }

  aitFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'USER_JE_SOURCE_NAME',
      formControlName: 'userJeSourceName',
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
      formControlName: 'batchName',
      columnName: 'BATCH_NAME',
      type: 'text',
      subAppMapping: false,
    },
  ];

  glFaFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'CTM_STATUS',
      formControlName: 'ctmStatus',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'JOB_TYPE',
      formControlName: 'jobType',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'p2rCode',
      columnName: 'P2R_CODE',
      type: 'text',
      subAppMapping: false,
    },
  ];

  glUnpostedFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'USER_JE_SOURCE_NAME',
      formControlName: 'userJeSourceName',
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
      formControlName: 'batchName',
      columnName: 'BATCH_NAME',
      type: 'text',
      subAppMapping: false,
    },
  ];

  aitKeysToMap: string[] = [
    'USER_JE_SOURCE_NAME',
    'LEDGER_NAME',
    'PERIOD_NAME',
    'BATCH_NAME',
    'DATE_CREATED',
  ];

  glFaKeysToMap: string[] = ['JOB_DATE', 'MODULE', 'CTM_FOLDER', 'CTM_STATUS'];
  glUnpostedKeysToMap: string[] = [
    'USER_JE_SOURCE_NAME',
    'LEDGER_NAME',
    'PERIOD_NAME',
    'BATCH_NAME',
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
      controlName: 'userJeSourceName',
      label: 'User JE Source Name',
      sourceKey: 'USER_JE_SOURCE_NAME',
      disabled: true,
    },
    {
      controlName: 'ledgerName',
      label: 'Ledger Name',
      sourceKey: 'LEDGER_NAME',
      disabled: true,
    },
    {
      controlName: 'batchName',
      label: 'Batch Name',
      sourceKey: 'BATCH_NAME',
      disabled: true,
    },
    {
      controlName: 'reference4',
      label: 'Reference4',
      sourceKey: 'REFERENCE4',
      disabled: true,
    },
    {
      controlName: 'ageing',
      label: 'Ageing',
      sourceKey: 'AGEING',
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

  glFafieldConfig = [
    {
      controlName: 'jobDate',
      label: 'Job Date',
      sourceKey: 'JOB_DATE',
      disabled: true,
    },
    {
      controlName: 'module',
      label: 'Module',
      sourceKey: 'MODULE',
      disabled: true,
    },
    {
      controlName: 'ctmFolder',
      label: 'CTM Folder',
      sourceKey: 'CTM_FOLDER',
      disabled: true,
    },
    {
      controlName: 'ctmStatus',
      label: 'CTM Status',
      sourceKey: 'CTM_STATUS',
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

  glUnpostedFieldConfig = [
    {
      controlName: 'periodName',
      label: 'Period Name',
      sourceKey: 'PERIOD_NAME',
      disabled: true,
    },
    {
      controlName: 'userJeSourceName',
      label: 'User JE Source Name',
      sourceKey: 'USER_JE_SOURCE_NAME',
      disabled: true,
    },
    {
      controlName: 'ledgerName',
      label: 'Ledger Name',
      sourceKey: 'LEDGER_NAME',
      disabled: true,
    },
    {
      controlName: 'batchName',
      label: 'Batch Name',
      sourceKey: 'BATCH_NAME',
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

  aitUrls: { [key: string]: string } = {
    summaryUrl: 'ait-error-summary',
    detailsUrl: 'ait-error-details',
    filteredDetailsUrl: 'ait-details-filtered',
    summaryUpdateUrl: 'ait-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  glFaJobsUrls: { [key: string]: string } = {
    summaryUrl: 'gl-fa-jobs-summary',
    detailsUrl: 'gl-fa-jobs-details',
    filteredDetailsUrl: 'gl-fa-details-filtered',
    summaryUpdateUrl: 'gl-fa-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  glUnpostedUrls: { [key: string]: string } = {
    summaryUrl: 'gl-unposted-error-summary',
    detailsUrl: 'gl-unposted-error-details',
    filteredDetailsUrl: 'gl-unposted-details-filtered',
    summaryUpdateUrl: 'gl-unposted-summary-update',
    webexMessageUrl: '',
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

  get menuItems(): MenuMiniItem[] {
    return this.filteredTabs.map((t) => ({ label: t.label }));
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
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
