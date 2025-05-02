import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

@Component({
  selector: 'app-o2c-360',
  templateUrl: './o2c-360.component.html',
  styleUrl: './o2c-360.component.css',
  providers: [DestroyManager],
})
export class O2c360Component implements OnInit {
  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}
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
}
