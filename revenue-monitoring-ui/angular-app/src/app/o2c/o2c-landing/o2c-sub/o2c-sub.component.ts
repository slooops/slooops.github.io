import { Component, OnInit } from '@angular/core';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
    selector: 'app-o2c-sub',
    templateUrl: './o2c-sub.component.html',
    styleUrls: ['./o2c-sub.component.css'],
    standalone: false
})
export class O2cSubComponent implements OnInit {
  selectedTabIndex = 0;

  // Data properties
  donutData: any[] = [];
  cardsData: any[] = [];

  // Derived card data
  orderCard: any = {};
  subscriptionCard: any = {};
  invoiceCard: any = {};
  accountingCard: any = {};
  cashCard: any = {};

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  ngOnInit(): void {
    this.getO2cSubscriptionDonutTotals();
    this.getO2cSubscriptionCards();
  }

  getO2cSubscriptionDonutTotals() {
    this.http
      .get('o2c-subscription-donut-totals', this.destroyManager)
      .subscribe((data: any) => {
        this.donutData = data;
      });
  }

  getO2cSubscriptionCards() {
    this.http
      .get('o2c-subscription-cards', this.destroyManager)
      .subscribe((data: any) => {
        this.cardsData = data;
        this.processCardsData();
      });
  }

  processCardsData() {
    // Process Order card (has two categories)
    const orderEnterToBooked = this.cardsData.find(
      (card) =>
        card.CARD_NAME === 'Order' && card.CATEGORY === 'Enter to Booked'
    );
    const orderBookedToFulfillment = this.cardsData.find(
      (card) =>
        card.CARD_NAME === 'Order' && card.CATEGORY === 'Booked to Fulfillment'
    );

    this.orderCard = {
      count: orderEnterToBooked?.EXCEPTION_COUNT || 0,
      value: orderEnterToBooked?.TOTAL_VALUE || 0,
      countDoubleWide: orderBookedToFulfillment?.EXCEPTION_COUNT || 0,
      valueDoubleWide: orderBookedToFulfillment?.TOTAL_VALUE || 0,
    };

    // Process other cards
    const subscription = this.cardsData.find(
      (card) => card.CARD_NAME === 'Subscription'
    );
    this.subscriptionCard = {
      count: subscription?.EXCEPTION_COUNT || 0,
      value: subscription?.TOTAL_VALUE || 0,
    };

    const invoice = this.cardsData.find((card) => card.CARD_NAME === 'Invoice');
    this.invoiceCard = {
      count: invoice?.EXCEPTION_COUNT || 0,
      value: invoice?.TOTAL_VALUE || 0,
    };

    const accounting = this.cardsData.find(
      (card) => card.CARD_NAME === 'Accounting'
    );
    this.accountingCard = {
      count: accounting?.EXCEPTION_COUNT || 0,
      value: accounting?.TOTAL_VALUE || 0,
    };

    const cash = this.cardsData.find((card) => card.CARD_NAME === 'Cash');
    this.cashCard = {
      count: cash?.EXCEPTION_COUNT || 0,
      value: cash?.TOTAL_VALUE || 0,
    };
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }
}
