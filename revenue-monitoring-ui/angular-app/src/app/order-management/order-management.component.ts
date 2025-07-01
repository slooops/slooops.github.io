import { Component } from '@angular/core';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { Validators } from '@angular/forms';

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
      controlName: 'database',
      label: 'Database',
      sourceKey: 'database',
      disabled: true,
    },
    {
      controlName: 'totalCount',
      label: 'Total Count',
      sourceKey: 'total_count',
      disabled: true,
    },
    {
      controlName: 'aging',
      label: 'Aging',
      sourceKey: 'aging',
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

  omImportUrls: { [key: string]: string } = {
    summaryUrl: 'om-import-summary',
    detailsUrl: 'om-import-details',
    filteredDetailsUrl: 'om-import-details-filtered',
    summaryUpdateUrl: 'om-import-summary-update',
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
    filteredDetailsUrl: 'om-holds-details-filtered',
    summaryUpdateUrl: 'om-holds-summary-update',
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
    filteredDetailsUrl: 'om-bookings-details-filtered',
    summaryUpdateUrl: 'om-bookings-summary-update',
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
    filteredDetailsUrl: 'om-workflow-details-filtered',
    summaryUpdateUrl: 'om-workflow-summary-update',
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
    filteredDetailsUrl: 'om-processing-details-filtered',
    summaryUpdateUrl: 'om-processing-summary-update',
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
    filteredDetailsUrl: 'om-distribution-details-filtered',
    summaryUpdateUrl: 'om-distribution-summary-update',
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
    filteredDetailsUrl: 'om-attribution-details-filtered',
    summaryUpdateUrl: 'om-attribution-summary-update',
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
    filteredDetailsUrl: 'om-jobs-details-filtered',
    summaryUpdateUrl: 'om-jobs-summary-update',
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
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
    },
    {
      label: 'Holds',
      component: 'app-holds',
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
    },
    {
      label: 'Bookings',
      component: 'app-bookings',
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
    },
    {
      label: 'Workflow',
      component: 'app-workflow',
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
    },
    {
      label: 'Processing',
      component: 'app-processing',
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
    },
    {
      label: 'Distribution',
      component: 'app-distribution',
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
    },
    {
      label: 'Attribution',
      component: 'app-attribution',
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
    },
    {
      label: 'Jobs',
      component: 'app-jobs',
      role: ['ADMIN', 'ORDER_MANAGEMENT'],
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
