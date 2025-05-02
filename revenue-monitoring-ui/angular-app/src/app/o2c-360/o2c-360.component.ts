import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

@Component({
  selector: 'app-o2c-360',
  templateUrl: './o2c-360.component.html',
  styleUrls: ['./o2c-360.component.css'],
  providers: [DestroyManager],
})
export class O2c360Component implements OnInit {
  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  expanded = {
    subscription: false,
    invoice: false,
  };

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: -1,
    Invoicing: 2,
    Accounting: 2,
    Cash: 2,
  };

  navigationMap: { [key: string]: string } = {
    Order: '',
    Subscription: '',
    Invoicing: '',
    Accounting: '',
    Cash: '',
  };

  ngOnInit(): void {
    this.http.get('order-summary', this.destroyManager).subscribe((data) => {
      console.log('Order Summary:', data);
    });
    this.http.get('invoice-summary', this.destroyManager).subscribe((data) => {
      console.log('Invoice Summary:', data);
    });
    this.http
      .get('invoice-line-summary', this.destroyManager)
      .subscribe((data) => {
        console.log('Invoice Line Summary:', data);
      });
    this.http
      .get('subscription-summary', this.destroyManager)
      .subscribe((data) => {
        console.log('Subscription Summary:', data);
      });
    this.http
      .get('subscription-line-summary', this.destroyManager)
      .subscribe((data) => {
        console.log('Subscription Line Summary:', data);
      });
  }

  toggleAccordion(section: 'subscription' | 'invoice') {
    this.expanded[section] = !this.expanded[section];
  }
}
