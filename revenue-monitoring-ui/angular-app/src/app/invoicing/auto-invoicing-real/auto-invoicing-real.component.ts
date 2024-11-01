import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-auto-invoicing-real',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './auto-invoicing-real.component.html',
  styleUrl: './auto-invoicing-real.component.css',
})
export class AutoInvoicingRealComponent {
  // Define columns for each table
  displayedColumnsForAutoInvoiceErrors: string[] = [
    'operating_unit',
    'error_total',
    'tax_hold',
    'sox_threshold',
    'comments',
  ];

  displayedColumnsForCurrentMonthUnpostedDetails: string[] = [
    'theater',
    'details_about_unposted_items',
    'impacted_amount',
    'poc_working_ist_pst',
    'latest_status',
  ];

  displayedColumnsForPreviousPeriodUnpostedBacklog: string[] = [
    'theater',
    'details_about_unposted_items',
    'impacted_amount',
    'poc_working_ist_pst',
    'latest_status',
  ];

  // prettier-ignore
  dataSourceAutoInvoiceErrors = new MatTableDataSource<any>( [
    { operating_unit: 'Japan (JP)', error_total: '$0', tax_hold: '$0', sox_threshold: '5M', comments: '' },
    { operating_unit: 'Panyu (PY)', error_total: '$193', tax_hold: '$0', sox_threshold: '5M', comments: 'Pending RLVA hold(193)' },
    { operating_unit: 'UKH', error_total: '$454K', tax_hold: '$428K', sox_threshold: '5M', comments: 'Error validation is in progress' },
    { operating_unit: 'Netherlands (NL)', error_total: '$659K', tax_hold: '$659K', sox_threshold: '5M', comments: 'Error validation is in progress' },
    { operating_unit: 'India (IN)', error_total: '$285K', tax_hold: '$5K', sox_threshold: '5M', comments: 'Error validation is in progress' },
    { operating_unit: 'Australia (AU)', error_total: '$5.7K', tax_hold: '$0', sox_threshold: '5M', comments: 'Error validation is in progress' },
    { operating_unit: 'Brazil (BR)', error_total: '$229.8K', tax_hold: '$216K', sox_threshold: '5M', comments: '' },
    { operating_unit: 'China (CN)', error_total: '$0', tax_hold: '$0', sox_threshold: '5M', comments: 'Pending RLVA hold(721K)' },
    { operating_unit: 'USA', error_total: '$161K', tax_hold: '$117K', sox_threshold: '5M', comments: 'Error validation in progress' },
    { operating_unit: 'Russia (RU)', error_total: 'NA', tax_hold: 'NA', sox_threshold: '5M', comments: 'NA' },
    { operating_unit: 'Germany (DE)', error_total: '$0', tax_hold: '$0', sox_threshold: 'Out of Scope', comments: 'Error validation in progress' },
    { operating_unit: 'South Africa (ZA)', error_total: '$0', tax_hold: '$0', sox_threshold: 'Out of Scope', comments: '' },
    { operating_unit: 'BroadSoft (BS)', error_total: '$0', tax_hold: '$0', sox_threshold: 'Out of Scope', comments: '' },
    { operating_unit: 'Mexico (MX)', error_total: '$0', tax_hold: '$0', sox_threshold: 'Out of Scope', comments: 'Error validation in progress' },
    { operating_unit: 'Canada (CA)', error_total: '$16K', tax_hold: '$8.6K', sox_threshold: 'Out of Scope', comments: 'Error validation in progress' },
    { operating_unit: 'Italy (ITL)', error_total: '$7.3K', tax_hold: '$7.3K', sox_threshold: 'Out of Scope', comments: ' ' },
    { operating_unit: 'South Korea (KR)', error_total: '$0', tax_hold: '$0', sox_threshold: 'Out of Scope', comments: ' ' },
    { operating_unit: 'France (FR)', error_total: '$0', tax_hold: '$0', sox_threshold: 'Out of Scope', comments: '' },
    { operating_unit: 'Switzerland (CH)', error_total: '$0', tax_hold: '$0', sox_threshold: 'Out of Scope', comments: '' },
  ]
);

  // prettier-ignore
  dataSourceCurrentMonthUnpostedDetails = new MatTableDataSource<any>([
  { theater: 'US', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'CAN', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'AUS', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'JPN', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'UKH', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'NL', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'ITL', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'IND', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'Brazil', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'Germany', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'Mexico', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'China', details_about_unposted_items: 'We have a few unposted items under Credit Memo and Sales Invoices Category', impacted_amount: 'Credit Memo : -627k, Sales invoice: 545K', poc_working_ist_pst: '', latest_status: 'Working with Oracle SR 3-37838414531' },
  { theater: 'BSFT', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'Russia', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'Korea', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'South Africa', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'France', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  { theater: 'Switzerland', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  ]);

  // prettier-ignore
  dataSourcePreviousPeriodUnpostedBacklog = new MatTableDataSource<any>([
    { theater: 'US', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'CAN', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'AUS', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'JPN', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'UKH', details_about_unposted_items: 'We have 1 unposted Adjustment under Adjustment Category. Adjustment number: 629011959', impacted_amount: '629011959: 20 USD', poc_working_ist_pst: '', latest_status: 'Working with Oracle SR 3-38573021681' },
    { theater: 'NL', details_about_unposted_items: 'We have 1 unposted item under Adjustment Category Adjustment number : 627916823', impacted_amount: '20 USD', poc_working_ist_pst: '', latest_status: 'Working with Oracle SR 3-35850002021' },
    { theater: 'ITL', details_about_unposted_items: 'We have 1 unposted sales invoice under Sales invoice Category. Sales invoice: 4440263551', impacted_amount: '4440263551: 1324.59 USD', poc_working_ist_pst: '', latest_status: 'Working with Oracle SR 3-36852369201' },
    { theater: 'IND', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'Brazil', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'Germany', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'Mexico', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'China', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'BSFT', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'Russia', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'Korea', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'South Africa', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'France', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
    { theater: 'Switzerland', details_about_unposted_items: 'None', impacted_amount: null, poc_working_ist_pst: '', latest_status: '' },
  ]);

  constructor() {}

  ngOnInit() {}

  removeColumns(columnsToRemove: string[]) {
    // this.displayedColumns = this.displayedColumns.filter(   //needs to be genericized to work with all 3 tables if needed
    //   (column) => !columnsToRemove.includes(column)
    // );
  }

  formatData(data: any[]): any[] {
    const columnsToFormat = ['BILL_TOTAL', 'INVOICED']; // List of columns to format

    return data.map((row) => {
      const formattedRow = { ...row };

      columnsToFormat.forEach((column) => {
        if (column in row) {
          formattedRow[column] = `${Number(row[column]).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`;
        }
      });

      return formattedRow;
    });
  }

  // Replace underscores in column headers
  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = ['bill', 'home', 'tech', 'unit'];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (specialWords.includes(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return word.length > 4
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word;
      })
      .join(' ');
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
