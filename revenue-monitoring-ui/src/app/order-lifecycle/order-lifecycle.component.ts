import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { DataService } from '../providers/data.service';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-invoice-status',
  templateUrl: './order-lifecycle.component.html',
  styleUrls: ['./order-lifecycle.component.css'],
})
export class OrderLifecycleComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private router: Router,
    private dataService: DataService
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    // this.getInvoiceStatus();
  }

  protected http: ApiHttpService;
  length: number;

  // invoiceStatusData: invoiceStatusModel[];
  // dataSource: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  // getInvoiceStatus() {
  //   this.http.get('invoice-status').subscribe((data: any) => {
  //     this.invoiceStatusData = data;
  //     this.dataSource = new MatTableDataSource<invoiceStatusModel>(
  //       this.invoiceStatusData
  //     );
  //     this.length = this.invoiceStatusData.length;
  //   });
  // }

  displayedColumns: string[] = [
    'OPERATING_UNIT',
    'SALES_ORDER',
    'LINE_ID',
    'TRX_NUMBER',
    'TRX_DATE',
    'CURRENCY',
    'LINE_AMOUNT',
    'TAX_AMOUNT',
    'ORDERED_ITEM',
    'RULE_START_DATE',
    'RULE_END_DATE',
    'TRX_TYPE',
    'PAYMENT_TERM',
    'COLLECTOR_NAME',
    'BILL_TO_CUSTOMER_NAME',
    'STATUS',
    'Accounting',
    'GL_Posting',
  ];

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  setSortAndPaginator() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  dataSource = new MatTableDataSource([
    {
      OPERATING_UNIT: 'CISCO BRAZIL CA OPERATING UNIT',
      SALES_ORDER: '115,904,895',
      LINE_ID: '1,179,190,828',
      TRX_NUMBER: 'None',
      TRX_DATE: 'None',
      CURRENCY: 'BRL',
      LINE_AMOUNT: '766.39',
      TAX_AMOUNT: '0',
      ORDERED_ITEM: 'C9200L-DNA-E-24-3Y',
      RULE_START_DATE: '8/13/23 12:00',
      RULE_END_DATE: '8/12/26 12:00',
      TRX_TYPE: 'None',
      PAYMENT_TERM: 'None',
      COLLECTOR_NAME: 'None',
      BILL_TO_CUSTOMER_NAME: 'None',
      STATUS: 'ORDER NOT INTERFACED TO AR FOR INVOICING',
      Accounting: '',
      'GL Posting': '',
    },
    {
      OPERATING_UNIT: 'CISCO BRAZIL CA OPERATING UNIT',
      SALES_ORDER: '115,904,895',
      LINE_ID: '1,179,190,827',
      TRX_NUMBER: 'None',
      TRX_DATE: 'None',
      CURRENCY: 'BRL',
      LINE_AMOUNT: '552.91',
      TAX_AMOUNT: '0',
      ORDERED_ITEM: 'CON-SNT-C920L24G',
      RULE_START_DATE: '8/13/23 12:00',
      RULE_END_DATE: '8/12/24 12:00',
      TRX_TYPE: 'None',
      PAYMENT_TERM: 'None',
      COLLECTOR_NAME: 'None',
      BILL_TO_CUSTOMER_NAME: 'None',
      STATUS: 'ORDER NOT INTERFACED TO AR FOR INVOICING',
      Accounting: '',
      'GL Posting': '',
    },
    {
      OPERATING_UNIT: 'CISCO BRAZIL CA OPERATING UNIT',
      SALES_ORDER: '115,904,895',
      LINE_ID: '1,179,190,814',
      TRX_NUMBER: '54,193',
      TRX_DATE: '6/29/23 12:00',
      CURRENCY: 'BRL',
      LINE_AMOUNT: '5,580.55',
      TAX_AMOUNT: '568.82',
      ORDERED_ITEM: 'C9200L-24P-4G-E',
      RULE_START_DATE: 'None',
      RULE_END_DATE: 'None',
      TRX_TYPE: 'INVOICE',
      PAYMENT_TERM: '60 NET',
      COLLECTOR_NAME: 'Brasil1',
      BILL_TO_CUSTOMER_NAME: 'PROMONLOGICALIS TECNOL E PARTICIP LTDA',
      STATUS: 'INVOICED',
      Accounting: '',
      'GL Posting': '',
    },
  ]);
}

export interface orderLifecycleModel {
  OPERATING_UNIT: string;
  SALES_ORDER: string;
  LINE_ID: string;
  TRX_NUMBER: string;
  TRX_DATE: string;
  CURRENCY: string;
  LINE_AMOUNT: string;
  TAX_AMOUNT: string;
  ORDERED_ITEM: string;
  RULE_START_DATE: string;
  RULE_END_DATE: string;
  TRX_TYPE: string;
  PAYMENT_TERM: string;
  COLLECTOR_NAME: string;
  BILL_TO_CUSTOMER_NAME: string;
  STATUS: string;
  Accounting: string;
  GL_Posting: string;
}
