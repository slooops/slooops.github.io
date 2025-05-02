import { Component } from '@angular/core';

@Component({
  selector: 'app-o2c-360',
  templateUrl: './o2c-360.component.html',
  styleUrls: ['./o2c-360.component.css'],
})
export class O2c360Component {
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

  toggleAccordion(section: 'subscription' | 'invoice') {
    this.expanded[section] = !this.expanded[section];
  }
}
