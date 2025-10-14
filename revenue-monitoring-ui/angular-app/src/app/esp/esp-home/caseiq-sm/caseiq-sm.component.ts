import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {
  StackedBarChartDataPoint,
  BarChartDataPoint,
} from 'src/app/components/bar-chart/bar-chart.component';

@Component({
  selector: 'app-caseiq-sm',
  templateUrl: './caseiq-sm.component.html',
  styleUrl: './caseiq-sm.component.css',
})
export class CaseiqSmComponent {
  // I2C Chart Data - Similar to the screenshot
  i2cChartData: StackedBarChartDataPoint[] = [
    {
      label: 'Access Management',
      segments: [
        { name: 'Validated', value: 523, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 45, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Accounting',
      segments: [
        { name: 'Validated', value: 189, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 123, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Cash Apps',
      segments: [
        { name: 'Validated', value: 678, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 67, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Credit & Collections',
      segments: [
        { name: 'Validated', value: 234, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 198, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Order to Cash',
      segments: [
        { name: 'Validated', value: 789, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 89, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Invoicing',
      segments: [
        { name: 'Validated', value: 145, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 267, color: '#E5E5E5' },
      ],
    },
    {
      label: 'VT Customs',
      segments: [
        { name: 'Validated', value: 612, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 34, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Core Issue',
      segments: [
        { name: 'Validated', value: 356, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 78, color: '#E5E5E5' },
      ],
    },
  ];

  // I2C Simple Chart Data - Monthly totals
  i2cSimpleChartData: BarChartDataPoint[] = [
    { label: 'E-Invoicing - Esker', value: 234, color: '#E5E5E5' },
    { label: 'E-Invoicing - Sovos', value: 567, color: '#E5E5E5' },
    { label: 'E-Invoicing - Synchro', value: 89, color: '#E5E5E5' },
    { label: 'E-Invoicing - IRN', value: 678, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 123, color: '#E5E5E5' },
    { label: 'Invoice Amount', value: 345, color: '#E5E5E5' },
    { label: 'Invoice Enquiry Tax', value: 789, color: '#E5E5E5' },
    { label: 'Invoice Aging', value: 156, color: '#E5E5E5' },
    { label: 'Invoice Delivery - Email', value: 423, color: '#E5E5E5' },
    { label: 'Invoice Delivery B2B', value: 267, color: '#E5E5E5' },
    { label: 'Invoice Not Generated', value: 534, color: '#E5E5E5' },
    { label: 'Post Invoice Dispute', value: 198, color: '#E5E5E5' },
    { label: 'Receipts', value: 712, color: '#E5E5E5' },
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
