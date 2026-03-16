import { Component, HostListener, OnInit } from '@angular/core';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../providers/authentication.service';
import { DataService } from '../providers/data.service';
import { MenuService } from '../providers/menu.service';
import { Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';

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
  imports: [CommonModule, MonitoringDashboardComponent, NgIcon],
  standalone: true,
})
export class AitComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    protected authService: AuthenticationService,
    private menuService: MenuService,
  ) {
    // Initialize roles and user context in constructor so they're available before template renders
    this.roles = this.authService.getRoles();
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

  aitFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'SOURCE',
      formControlName: 'source',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'CATEGORY',
      formControlName: 'category',
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
    'SOURCE',
    'LEDGER',
    'PERIOD',
    'BATCH_NAME',
    'DATE_CREATED',
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
      controlName: 'period',
      label: 'Period',
      sourceKey: 'PERIOD',
      disabled: true,
    },
    {
      controlName: 'source',
      label: 'Source',
      sourceKey: 'SOURCE',
      disabled: true,
    },
    {
      controlName: 'ledger',
      label: 'Ledger',
      sourceKey: 'LEDGER',
      disabled: true,
    },
    {
      controlName: 'batchName',
      label: 'Batch Name',
      sourceKey: 'BATCH_NAME',
      disabled: true,
    },
    {
      controlName: 'journalEntryName',
      label: 'Journal Entry Name',
      sourceKey: 'JOURNAL_ENTRY_NAME',
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

  aitUrls: { [key: string]: string } = {
    summaryUrl: 'ait-error-summary',
    detailsUrl: 'ait-error-details',
    filteredDetailsUrl: 'ait-details-filtered',
    summaryUpdateUrl: '',
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

  showGridMenu: boolean = false;

  toggleGridMenu(event: Event): void {
    event.stopPropagation();
    this.showGridMenu = !this.showGridMenu;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showGridMenu = false;
  }

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
