import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

interface Row {
  id: string;
  text1: string;
  text2: string;
  children?: Row[];
}

interface OrderSummaryLine {
  order: {
    operating_unit: string;
    web_order_id: string;
    sales_order: string;
    order_creation_date: string;
    order_status: string;
    purchase_order_number: string;
    deal_id: string;
    order_total: string;
    ordered_currency: string;
    price_list: string;
    offer_name: string;
    child_1: {
      submitted_by: string;
      created_by: string;
      billing_id: string;
      partner_name: string;
      end_customer_name: string;
      reseller: string;
      address_details_bill_to: string;
      address_details_end_customer: string;
    };
    child_2: {
      order_origin: string;
      order_booked_date: string;
      hybrid_order: string;
      route_to_market: string;
      order_holds: string;
      cloud_sub_order_holds: string;
    };
  };
}

@Component({
  selector: 'app-o2c-details',
  templateUrl: './o2c-details.component.html',
  styleUrls: ['./o2c-details.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms ease-in-out')),
    ]),
  ],
})
export class O2cDetailsComponent implements OnInit {
  orderId: string | null = null;
  expanded: { [key: string]: boolean } = {};
  rows: Row[] = [];

  orderSummaryLines: OrderSummaryLine[] = [
    {
      order: {
        operating_unit: 'GLOBAL OPERATING UNIT',
        web_order_id: '96635062',
        sales_order: 'SO-987654',
        order_creation_date: '01-Jan-2025',
        order_status: 'Pending Activation',
        purchase_order_number: '9876543',
        deal_id: '12345678',
        order_total: 'USD 12,345.67',
        ordered_currency: 'USD',
        price_list: 'Global Price List EU Availability EUR',
        offer_name: 'NETWORK_ADVANTAGE SECURE_CONNECT',
        child_1: {
          submitted_by: 'Alex Johnson on 01-Jan-2025',
          created_by: 'Alex Johnson on 01-Jan-2025',
          billing_id: '789012345',
          partner_name: 'Tech Solutions Ltd.',
          end_customer_name: 'Innovative Corp.',
          reseller: 'Reseller Group Inc.',
          address_details_bill_to: '1234 Elm Street, Springfield, IL',
          address_details_end_customer: '5678 Oak Avenue, Metropolis, NY',
        },
        child_2: {
          order_origin: 'E-COMMERCE',
          order_booked_date: '02-Jan-2025',
          hybrid_order: 'Y',
          route_to_market: 'DIRECT',
          order_holds: 'None',
          cloud_sub_order_holds: 'None',
        },
      },
    },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.orderId = params.get('orderId');
      console.log('Received order ID:', this.orderId);

      if (this.orderId) {
        this.loadOrderDetails(this.orderId);
      }
    });
  }

  data: {
    DealerID: number;
    Dealer: string;
    Address: string;
    City: string;
    State: string;
    BillingFrequency: string;
    BillingAmount: string;
    ProvisionDetails: string;
    SubscriptionID: string;
    EstimatedSubscriptionStartDate: string;
    Brands: {
      Brand: string;
      Product1: string;
      Product2: string;
    }[];
    isExpanded?: boolean;
  }[] = [
    {
      DealerID: 1,
      Dealer: '12 mon: 15-Mar-2024 to 14-Mar-2025',
      Address: '15-Mar-2024',
      City: '14-Mar-2025',
      State: 'No auto renewal',
      BillingFrequency: 'Prepaid Term',
      BillingAmount: '1,839.73 Prepaid',
      ProvisionDetails: 'Complete',
      SubscriptionID: 'Sub1797786',
      EstimatedSubscriptionStartDate: '15-Mar-2024',
      Brands: [
        {
          Brand: '1.0.1',
          Product1:
            'ETD-ESS-LIC Cisco Email Threat Defense Essential License Magic Key Q12085423390-000',
          Product2: '3,245.00',
        },
        {
          Brand: 'Scenario: Create New',
          Product1: 'Additional Item Info: XAAS',
          Product2: 'Subscription ID: 1797787',
        },
      ],
    },
    {
      DealerID: 1,
      Dealer: '12 mon: 15-Mar-2024 to 14-Mar-2025',
      Address: '15-Mar-2024',
      City: '14-Mar-2025',
      State: 'No auto renewal',
      BillingFrequency: 'Prepaid Term',
      BillingAmount: '1,839.73 Prepaid',
      ProvisionDetails: 'Complete',
      SubscriptionID: 'Sub1797786',
      EstimatedSubscriptionStartDate: '15-Mar-2024',
      Brands: [
        {
          Brand: '1.0.1',
          Product1:
            'ETD-ESS-LIC Cisco Email Threat Defense Essential License Magic Key Q12085423390-000',
          Product2: '3,245.00',
        },
        {
          Brand: 'Scenario: Create New',
          Product1: 'Additional Item Info: XAAS',
          Product2: 'Subscription ID: 1797787',
        },
      ],
    },
  ];

  loadOrderDetails(orderId: string) {
    const orderData = this.orderSummaryLines.find(
      (order) => order.order.web_order_id === orderId
    );

    if (!orderData) {
      console.warn('No order found for ID:', orderId);
      return;
    }

    // Convert to Row structure
    this.rows = [
      {
        id: orderData.order.web_order_id,
        text1: orderData.order.order_status,
        text2: orderData.order.order_total,
        children: [
          {
            id: '1',
            text1: 'Submitted By',
            text2: orderData.order.child_1.submitted_by,
          },
          {
            id: '2',
            text1: 'Billing ID',
            text2: orderData.order.child_1.billing_id,
          },
          {
            id: '3',
            text1: 'Partner Name',
            text2: orderData.order.child_1.partner_name,
          },
          {
            id: '4',
            text1: 'Order Origin',
            text2: orderData.order.child_2.order_origin,
          },
          {
            id: '5',
            text1: 'Order Holds',
            text2: orderData.order.child_2.order_holds,
          },
        ],
      },
    ];
  }

  toggleRow(row: Row) {
    this.expanded[row.id] = !this.expanded[row.id];
  }

  isRowClickable(rowIndex: number): boolean {
    return (
      this.rows[rowIndex].children && this.rows[rowIndex].children.length > 0
    );
  }

  accrualsTotals: { [key: string]: number } = {
    Order: 1, // Completed, 1 is current, 0 is uncompleted
    Subscription: 0,
    Accruals: 0,
    Invoicing: 0,
    AR_Accounting: 0,
  };

  skippedWords: string[] = ['IOL', 'AR', 'ID', 'GL', 'TSV'];

  // Define the steps array with both original keys and formatted labels
  formattedAccrualsSteps = Object.keys(this.accrualsTotals).map((key) => ({
    originalKey: key, // Store the original key for accessing dynamic totals
    label: this.formatLabel(key), // Format for display
    impact: this.accrualsTotals[key] || 'N/A', // Use dynamic data from accrualsTotals
  }));

  formatLabel(label: string): string {
    const acronyms = this.skippedWords || [];

    return label
      .toLowerCase() // Convert to lowercase
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split into words
      .map(
        (word) =>
          acronyms.includes(word.toUpperCase())
            ? word.toUpperCase() // Keep the word in uppercase if it's in skippedWords
            : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }

  getCircleClass(step: any): string {
    const value = this.accrualsTotals[step.originalKey];
    if (value === 2) return 'completed-circle'; // Completed step
    if (value === 1) return 'current-circle'; // Current step
    return 'uncompleted-circle'; // Default for uncompleted steps
  }

  getSliderBarStyle(index: number): { [key: string]: string } {
    const step = this.formattedAccrualsSteps[index];
    const value = this.accrualsTotals[step.originalKey];
    if (value === 1) {
      // Current step
      return {
        background: 'linear-gradient(to right, #16371e43, #08ace4, #16371e43)',
      };
    }
    return { background: '#16371e43' };
  }
}
