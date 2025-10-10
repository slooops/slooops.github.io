import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {
  StackedBarChartDataPoint,
  BarChartDataPoint,
} from 'src/app/components/bar-chart/bar-chart.component';

@Component({
  selector: 'app-caseiq',
  templateUrl: './caseiq.component.html',
  styleUrl: './caseiq.component.css',
})
export class CaseiqComponent {
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
        { name: 'Validated', value: 78, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 12, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Accounting',
      segments: [
        { name: 'Validated', value: 156, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 23, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Cash Apps',
      segments: [
        { name: 'Validated', value: 92, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 37, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Credit & Collections',
      segments: [
        { name: 'Validated', value: 234, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 58, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Order to Cash',
      segments: [
        { name: 'Validated', value: 187, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 41, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Invoicing',
      segments: [
        { name: 'Validated', value: 145, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 67, color: '#E5E5E5' },
      ],
    },
    {
      label: 'VT Customs',
      segments: [
        { name: 'Validated', value: 89, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 6, color: '#E5E5E5' },
      ],
    },
  ];

  // I2C Simple Chart Data - Monthly totals
  i2cSimpleChartData: BarChartDataPoint[] = [
    { label: 'E-Invoicing - Esker', value: 247, color: '#E5E5E5' },
    { label: 'E-Invoicing - Sovos', value: 189, color: '#E5E5E5' },
    { label: 'E-Invoicing - Synchro', value: 312, color: '#E5E5E5' },
    { label: 'E-Invoicing - IRN', value: 156, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 423, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 178, color: '#E5E5E5' },
    { label: 'Invoice Enquiry Tax', value: 267, color: '#E5E5E5' },
    { label: 'Invoice Aging', value: 134, color: '#E5E5E5' },
    { label: 'Invoice Delivery - Email', value: 298, color: '#E5E5E5' },
    { label: 'Invoice Delivery B2B', value: 345, color: '#E5E5E5' },
    { label: 'Invoice Not Generated', value: 87, color: '#E5E5E5' },
    { label: 'Post Invoice Dispute', value: 203, color: '#E5E5E5' },
    { label: 'Receipts', value: 456, color: '#E5E5E5' },
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
