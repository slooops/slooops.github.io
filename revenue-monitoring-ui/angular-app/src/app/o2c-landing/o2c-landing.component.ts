import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-o2c-landing',
  templateUrl: './o2c-landing.component.html',
  styleUrls: ['./o2c-landing.component.css'],
})
export class O2cLandingComponent implements OnInit {
  searchValue: string = '';
  searchType: string = 'order'; // default

  o2cConnectorData: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  ngOnInit(): void {
    this.getO2cConnector();
  }

  private getO2cConnector() {
    this.http
      .get('o2c-connector', this.destroyManager)
      .subscribe((data: any) => {
        this.o2cConnectorData = data;
        console.log('o2cConnector loaded:', data);
      });
  }

  onSearch(): void {
    const trimmedValue = this.searchValue.trim();
    if (!trimmedValue || this.o2cConnectorData.length === 0) return;

    let matchingRows: any[] = [];

    switch (this.searchType) {
      case 'order':
        matchingRows = this.o2cConnectorData.filter(
          (row) => row.WEBORDER_ID === trimmedValue
        );
        break;
      case 'subscription':
        matchingRows = this.o2cConnectorData.filter(
          (row) => row.SUBSCRIPTION_REF_ID === trimmedValue
        );
        break;
      case 'invoice':
        matchingRows = this.o2cConnectorData.filter(
          (row) => row.TRX_NUMBER === trimmedValue
        );
        break;
      default:
        console.warn('Unknown searchType');
        return;
    }

    if (matchingRows.length === 0) {
      console.warn('No results found for search:', trimmedValue);
      return;
    }

    const orderIds = [
      ...new Set(matchingRows.map((r) => r.WEBORDER_ID).filter(Boolean)),
    ];
    const subRefIds = [
      ...new Set(
        matchingRows.map((r) => r.SUBSCRIPTION_REF_ID).filter(Boolean)
      ),
    ];
    const trxNumbers = [
      ...new Set(matchingRows.map((r) => r.TRX_NUMBER).filter(Boolean)),
    ];

    // console.log('Order IDs:', orderIds);
    // console.log('Subscription Ref IDs:', subRefIds);
    // console.log('Invoice (TRX) Numbers:', trxNumbers);

    this.router.navigate(['/o2c-360'], {
      queryParams: {
        orderId: orderIds[0],
        subRefIds: subRefIds.join(','),
        invoiceIds: trxNumbers.join(','),
      },
    });
  }
}
