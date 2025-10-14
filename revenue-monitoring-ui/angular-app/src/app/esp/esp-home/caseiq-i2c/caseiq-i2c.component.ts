import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import {
  StackedBarChartDataPoint,
  BarChartDataPoint,
} from 'src/app/components/bar-chart/bar-chart.component';

interface I2CAccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-i2c',
  templateUrl: './caseiq-i2c.component.html',
  styleUrl: './caseiq-i2c.component.css',
})
export class CaseiqI2cComponent implements OnInit {
  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager
  ) {}

  // I2C specific metrics from API
  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';

  ngOnInit(): void {
    this.getVwI2cCategoryMatchStatus();
    this.getVwI2cCoreIssueMatchStatus();
    this.getXxcaseiqValidatedCasesAccuracyV();
  }

  getVwI2cCategoryMatchStatus() {
    this.http
      .get('vw-i2c-category-match-status', this.destroyManager)
      .subscribe((data: any) => {
        console.log('vwI2cCategoryMatchStatus:', data);
      });
  }

  getVwI2cCoreIssueMatchStatus() {
    this.http
      .get('vw-i2c-core-issue-match-status', this.destroyManager)
      .subscribe((data: any) => {
        console.log('vwI2cCoreIssueMatchStatus:', data);
      });
  }

  getXxcaseiqValidatedCasesAccuracyV() {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqValidatedCasesAccuracyV:', data);
        this.updateI2CMetrics(data);
      });
  }

  /**
   * Updates I2C metrics from API data
   * Finds the I2C team data and sets the component properties
   */
  private updateI2CMetrics(apiData: I2CAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const i2cData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toUpperCase() === 'I2C'
      );

      if (i2cData) {
        this.categoryAccuracy = Math.round(i2cData.CATEGORY * 100) / 100;
        this.coreIssueAccuracy = Math.round(i2cData.CORE_ISSUE * 100) / 100;
        this.totalCases = i2cData.TOTAL_VALIDATED_CASES;
      } else {
        // No I2C data found, keep defaults
        this.categoryAccuracy = '-';
        this.coreIssueAccuracy = '-';
        this.totalCases = '-';
      }
    }
  }

  i2cChartData: StackedBarChartDataPoint[] = [
    {
      label: 'Access Management',
      segments: [
        { name: 'Validated', value: 412, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 28, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Accounting',
      segments: [
        { name: 'Validated', value: 267, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 53, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Cash Apps',
      segments: [
        { name: 'Validated', value: 534, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 19, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Credit & Collections',
      segments: [
        { name: 'Validated', value: 189, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 87, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Order to Cash',
      segments: [
        { name: 'Validated', value: 678, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 14, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Invoicing',
      segments: [
        { name: 'Validated', value: 298, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 72, color: '#E5E5E5' },
      ],
    },
    {
      label: 'VT Customs',
      segments: [
        { name: 'Validated', value: 456, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 9, color: '#E5E5E5' },
      ],
    },
  ];

  i2cSimpleChartData: BarChartDataPoint[] = [
    { label: 'E-Invoicing - Esker', value: 892, color: '#E5E5E5' },
    { label: 'E-Invoicing - Sovos', value: 156, color: '#E5E5E5' },
    { label: 'E-Invoicing - Synchro', value: 723, color: '#E5E5E5' },
    { label: 'E-Invoicing - IRN', value: 345, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 567, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 234, color: '#E5E5E5' },
    { label: 'Invoice Enquiry Tax', value: 678, color: '#E5E5E5' },
    { label: 'Invoice Aging', value: 123, color: '#E5E5E5' },
    { label: 'Invoice Delivery - Email', value: 789, color: '#E5E5E5' },
    { label: 'Invoice Delivery B2B', value: 456, color: '#E5E5E5' },
    { label: 'Invoice Not Generated', value: 234, color: '#E5E5E5' },
    { label: 'Post Invoice Dispute', value: 567, color: '#E5E5E5' },
    { label: 'Receipts', value: 890, color: '#E5E5E5' },
  ];

  i2cTableData = new MatTableDataSource([
    {
      'Incident Number': 'INC0012345',
      'Impacted Service': 'Indirect Tax - Global',
      'Case Description': 'Rebill invoice not yet generated',
      Category: 'Pre-Invoicing',
      'Category Actual': 'Tax Inquiry',
      'Core Issue': 'Process Gap',
      'Core Actual': 'Process Gap',
    },
    {
      'Incident Number': 'INC0012346',
      'Impacted Service': 'Order Management - Global',
      'Case Description': 'Credit memo not processed',
      Category: 'Order to Cash',
      'Category Actual': 'Credit Memo',
      'Core Issue': 'Training',
      'Core Actual': 'Training',
    },
    {
      'Incident Number': 'INC0012347',
      'Impacted Service': 'Cash Application - APAC',
      'Case Description': 'Payment not applied to invoice',
      Category: 'Invoicing',
      'Category Actual': 'Payment Application',
      'Core Issue': 'System Issue',
      'Core Actual': 'System Issue',
    },
    {
      'Incident Number': 'INC0012348',
      'Impacted Service': 'Credit & Collections - EMEA',
      'Case Description': 'Customer dispute unresolved',
      Category: 'Order to Cash',
      'Category Actual': 'Dispute Management',
      'Core Issue': 'Customer Issue',
      'Core Actual': 'Customer Issue',
    },
    {
      'Incident Number': 'INC0012345',
      'Impacted Service': 'Indirect Tax - Global',
      'Case Description': 'Rebill invoice not yet generated',
      Category: 'Pre-Invoicing',
      'Category Actual': 'Tax Inquiry',
      'Core Issue': 'Process Gap',
      'Core Actual': 'Process Gap',
    },
    {
      'Incident Number': 'INC0012346',
      'Impacted Service': 'Order Management - Global',
      'Case Description': 'Credit memo not processed',
      Category: 'Order to Cash',
      'Category Actual': 'Credit Memo',
      'Core Issue': 'Training',
      'Core Actual': 'Training',
    },
    {
      'Incident Number': 'INC0012347',
      'Impacted Service': 'Cash Application - APAC',
      'Case Description': 'Payment not applied to invoice',
      Category: 'Invoicing',
      'Category Actual': 'Payment Application',
      'Core Issue': 'System Issue',
      'Core Actual': 'System Issue',
    },
    {
      'Incident Number': 'INC0012348',
      'Impacted Service': 'Credit & Collections - EMEA',
      'Case Description': 'Customer dispute unresolved',
      Category: 'Order to Cash',
      'Category Actual': 'Dispute Management',
      'Core Issue': 'Customer Issue',
      'Core Actual': 'Customer Issue',
    },
  ]);

  i2cTableColumns = [
    'Incident Number',
    'Impacted Service',
    'Case Description',
    'Category',
    'Category Actual',
    'Core Issue',
    'Core Actual',
  ];
}
