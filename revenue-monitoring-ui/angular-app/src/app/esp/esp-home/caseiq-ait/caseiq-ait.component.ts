import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {
  StackedBarChartDataPoint,
  BarChartDataPoint,
} from 'src/app/components/bar-chart/bar-chart.component';

@Component({
  selector: 'app-caseiq-ait',
  templateUrl: './caseiq-ait.component.html',
  styleUrl: './caseiq-ait.component.css',
})
export class CaseiqAitComponent {
  metricTiles = [
    { name: 'Overall', percentage: 83 },
    { name: 'AIT', percentage: 80 },
    { name: 'Capital', percentage: 80 },
    { name: 'FPP', percentage: 23 },
    { name: 'I2C', percentage: 89 },
    { name: 'OM', percentage: 35 },
    { name: 'P2P', percentage: 82 },
    { name: 'SM', percentage: 89 },
  ];

  // I2C Chart Data - Similar to the screenshot
  i2cChartData: StackedBarChartDataPoint[] = [
    {
      label: 'Access Management',
      segments: [
        { name: 'Validated', value: 64, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 19, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Accounting',
      segments: [
        { name: 'Validated', value: 142, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 31, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Cash Apps',
      segments: [
        { name: 'Validated', value: 73, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 48, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Credit & Collections',
      segments: [
        { name: 'Validated', value: 198, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 72, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Order to Cash',
      segments: [
        { name: 'Validated', value: 267, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 34, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Invoicing',
      segments: [
        { name: 'Validated', value: 89, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 56, color: '#E5E5E5' },
      ],
    },
    {
      label: 'VT Customs',
      segments: [
        { name: 'Validated', value: 123, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 14, color: '#E5E5E5' },
      ],
    },
  ];

  // I2C Simple Chart Data - Monthly totals
  i2cSimpleChartData: BarChartDataPoint[] = [
    { label: 'E-Invoicing - Esker', value: 167, color: '#E5E5E5' },
    { label: 'E-Invoicing - Sovos', value: 298, color: '#E5E5E5' },
    { label: 'E-Invoicing - Synchro', value: 234, color: '#E5E5E5' },
    { label: 'E-Invoicing - IRN', value: 387, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 145, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 512, color: '#E5E5E5' },
    { label: 'Invoice Enquiry Tax', value: 78, color: '#E5E5E5' },
    { label: 'Invoice Aging', value: 623, color: '#E5E5E5' },
    { label: 'Invoice Delivery - Email', value: 356, color: '#E5E5E5' },
    { label: 'Invoice Delivery B2B', value: 289, color: '#E5E5E5' },
    { label: 'Invoice Not Generated', value: 134, color: '#E5E5E5' },
    { label: 'Post Invoice Dispute', value: 445, color: '#E5E5E5' },
    { label: 'Receipts', value: 267, color: '#E5E5E5' },
  ];

  // Table data combining chart information
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
