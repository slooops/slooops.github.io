import { Component } from '@angular/core';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css',
  providers: [DestroyManager],
})
export class OrderManagementComponent {
  constructor(
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private dataService: DataService,
    private datePipe: DatePipe,
    private authService: AuthenticationService,
    private menuService: MenuService
  ) {
    this.http = http;
  }
  protected http: ApiHttpService;
  summaryDataSource: any;
  detailsDataSource: any;
  selection = new SelectionModel<any>(true, []);
  roles: string[] = [];

  ngOnInit(): void {
    this.roles = this.authService.getRoles();
    this.getErrorSummaryPeriodStatus();
    this.getDefaultTabIndex();
  }

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

  omImportUrls: { [key: string]: string } = {
    summaryUrl: 'om-import-summary',
    detailsUrl: 'om-import-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omImportFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omHoldsUrls: { [key: string]: string } = {
    summaryUrl: 'om-holds-summary',
    detailsUrl: 'om-holds-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omHoldsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omBookingsUrls: { [key: string]: string } = {
    summaryUrl: 'om-bookings-summary',
    detailsUrl: 'om-bookings-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omBookingsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omWorkflowUrls: { [key: string]: string } = {
    summaryUrl: 'om-workflow-summary',
    detailsUrl: 'om-workflow-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omWorkflowFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omProcessingUrls: { [key: string]: string } = {
    summaryUrl: 'om-processing-summary',
    detailsUrl: 'om-processing-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omProcessingFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omDistributionUrls: { [key: string]: string } = {
    summaryUrl: 'om-distribution-summary',
    detailsUrl: 'om-distribution-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omDistributionFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omAttributionUrls: { [key: string]: string } = {
    summaryUrl: 'om-attribution-summary',
    detailsUrl: 'om-attribution-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omAttributionFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omJobsUrls: { [key: string]: string } = {
    summaryUrl: 'om-jobs-summary',
    detailsUrl: 'om-jobs-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omJobsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  periodStatus: any;

  getErrorSummaryPeriodStatus() {
    this.dataService
      .getMonitoringPeriodStatus(this.destroyManager)
      .subscribe((data: any) => {
        this.periodStatus = data;
      });
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  visibleTabs: {
    label: string;
    component: string;
    role: string[];
    disabled?: boolean;
  }[] = [
    {
      label: 'Imports',
      component: 'app-imports',
      role: ['ADMIN'],
    },
    {
      label: 'Holds',
      component: 'app-holds',
      role: ['ADMIN'],
    },
    {
      label: 'Bookings',
      component: 'app-bookings',
      role: ['ADMIN'],
    },
    {
      label: 'Workflow',
      component: 'app-workflow',
      role: ['ADMIN'],
    },
    {
      label: 'Processing',
      component: 'app-processing',
      role: ['ADMIN'],
    },
    {
      label: 'Distribution',
      component: 'app-distribution',
      role: ['ADMIN'],
    },
    {
      label: 'Attribution',
      component: 'app-attribution',
      role: ['ADMIN'],
    },
    {
      label: 'Jobs',
      component: 'app-jobs',
      role: ['ADMIN'],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
    const newHeader = `Order Management > ${this.filteredTabs[index]?.label}`;
    this.menuService.updateHeader(newHeader);
  }
}
