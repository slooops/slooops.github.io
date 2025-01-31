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
}
