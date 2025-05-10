import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-o2c-sub',
  templateUrl: './o2c-sub.component.html',
  styleUrl: './o2c-sub.component.css',
})
export class O2cSubComponent implements OnInit {
  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: -1,
    Invoicing: 2,
    Accounting: 2,
    Cash: 2,
  };

  orderSummaryDisplayedColumns1: string[] = [
    'WEB_ORDER_ID',
    'DEAL_ID',
    'CREATION_DATE',
    'STATUS',
    'PURCHASE_ORDER',
    'ORDER_TOTAL',
    'BILLING_ID',
    'ORDER_ORIGIN',
    'ORDER_BOOKED_DATE',
  ];
  orderSummaryDisplayedColumns2: string[] = [
    'HYBRID_ORDER',
    'ROUTE_TO_MARKET',
    'ORDER_HOLDS',
    'CLOUD_SUB_ORDER_HOLDS',
    'FLOW_STATUS_CODE',
    'PARTNER',
    'END_CUSTOMER',
  ];
  orderSummaryDataSource = new MatTableDataSource<any>();

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    const navState = this.location.getState() as {
      subscriptionData?: any[];
      subscriptionColumns?: string[];
      orderData?: any[];
    };

    if (navState?.subscriptionData) {
      this.subscriptionSummaryDataSource.data = navState.subscriptionData;
      this.subscriptionSummaryDisplayedColumns =
        navState.subscriptionColumns || [];

      this.orderSummaryDataSource.data = navState.orderData || [];
    } else {
      // fallback or redirect
      console.warn('No data passed to o2c-sub, consider redirecting');
    }
  }

  formatColumnName(column: string): string {
    const acronyms = ['id', 'sku', 'qty', 'tsv', 'gl'];
    const name = column.replace(/_/g, ' ').toLowerCase();
    return name
      .split(' ')
      .map((word) => {
        // If the word is in the list of acronyms, return it in uppercase
        if (acronyms.includes(word)) {
          return word.toUpperCase();
        }
        // Otherwise, capitalize only the first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}
