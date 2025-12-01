import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiHttpService } from '../../providers/http.service';

@Component({
    selector: 'app-o2c-nav',
    templateUrl: './o2c-nav.component.html',
    styleUrls: ['./o2c-nav.component.css'],
    standalone: false
})
export class O2cNavComponent {
  searchValue: string = '';
  searchType: string = 'order'; // default dropdown value
  o2cConnectorData: any[] = [];

  columnMap: { [key: string]: string } = {
    order: 'WEBORDER_ID',
    subscription: 'SUBSCRIPTION_REF_ID',
    invoice: 'TRX_NUMBER',
  };

  constructor(private router: Router, private http: ApiHttpService) {}

  goToO2cHome() {
    this.router.navigate(['/o2c-landing'], {});
  }

  goToO2cOverview() {
    this.router.navigate(['/o2c-landing'], {});
  }

  // Mapping search values to their respective pages
  searchMap: { [key: string]: { route: string; paramName: string } } = {
    '4910695': { route: '/o2c-accrual', paramName: 'accrualId' },
    '75947116': { route: '/o2c-order', paramName: 'dealId' },
    Sub1797786: { route: '/o2c-sub', paramName: 'subRefId' },
    Sub1797787: { route: '/o2c-sub', paramName: 'subRefId' },
  };

  onSearch(): void {
    this.router.navigate(['/o2c-landing'], {
      queryParams: {
        searchValue: this.searchValue,
        // searchType: this.searchType,
      },
    });

    // const trimmedValue = this.searchValue.trim();
    // if (!trimmedValue) return;

    // const columnName = this.columnMap[this.searchType];

    // this.http
    //   .post<any[]>('o2c-connector-search', {
    //     column: columnName,
    //     value: trimmedValue,
    //   })
    //   .subscribe({
    //     next: (data) => {
    //       const orderIds = [
    //         ...new Set(data.map((r) => r.WEBORDER_ID).filter(Boolean)),
    //       ];
    //       const subRefIds = [
    //         ...new Set(data.map((r) => r.SUBSCRIPTION_REF_ID).filter(Boolean)),
    //       ];
    //       const trxNumbers = [
    //         ...new Set(data.map((r) => r.TRX_NUMBER).filter(Boolean)),
    //       ];

    //       this.router.navigate(['/o2c-360'], {
    //         queryParams: {
    //           searchType: this.searchType,
    //           orderId: orderIds[0],
    //           subRefIds: subRefIds.join(','),
    //           invoiceIds: trxNumbers.join(','),
    //         },
    //       });
    //     },
    //     error: (err) => {
    //       console.error('Search failed:', err);
    //     },
    //   });
  }
}
