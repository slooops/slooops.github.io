import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SidebarService } from '../sidebar.service';

@Component({
  selector: 'app-o2c-360',
  templateUrl: './o2c-360.component.html',
  styleUrls: ['./o2c-360.component.css'],
  providers: [DestroyManager],
})
export class O2c360Component implements OnInit {
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

  orderSummaryDisplayedColumns: string[] = [];
  orderSummaryDataSource = new MatTableDataSource<any>();

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

  subscriptionLinesDisplayedColumns: string[] = [];
  subscriptionLinesDataSource = new MatTableDataSource<any>();

  invoiceSummaryDisplayedColumns: string[] = [];
  invoiceSummaryDataSource = new MatTableDataSource<any>();

  invoiceLinesDisplayedColumns: string[] = [];
  invoiceLinesDataSource = new MatTableDataSource<any>();

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private sidebarService: SidebarService
  ) {}

  sidebarExpanded = true;

  ngOnInit(): void {
    this.sidebarService.isExpanded$.subscribe((isExpanded) => {
      this.sidebarExpanded = isExpanded;
    });

    this.http
      .get('order-summary', this.destroyManager, {
        responseType: 'json',
      })
      .subscribe((data: any) => {
        console.log('Order Summary:', data);

        this.orderSummaryDisplayedColumns = Object.keys(data[0]);
        this.orderSummaryDataSource = new MatTableDataSource(data);
      });

    this.http
      .get('subscription-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Subscription Summary:', data);

        this.subscriptionSummaryDisplayedColumns = Object.keys(data[0]);
        this.subscriptionSummaryDisplayedColumns = this.removeColumns(
          this.subscriptionSummaryDisplayedColumns,
          ['EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE']
        );

        console.log(
          'Subscription Summary Columns:',
          this.subscriptionSummaryDisplayedColumns
        );
        this.subscriptionSummaryDataSource = new MatTableDataSource(data);
      });

    this.http
      .get('subscription-line-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Subscription Lines:', data);

        this.subscriptionLinesDisplayedColumns = Object.keys(data[0]);
        this.subscriptionLinesDataSource = new MatTableDataSource(data);
      });

    this.http
      .get('invoice-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Invoice Summary:', data);

        this.invoiceSummaryDisplayedColumns = [
          'TRX_NUMBER',
          'TRX_CLASS',
          'TRX_STATUS',
          'TRX_DATE',
          'DUE_DATE',
          'STATUS',
          'AMOUNT_DUE_ORIGINAL',
          'AMOUNT_DUE_REMAINING',
          'BILL_NUMBER',
          'OTHER_DETAILS',
        ];
        this.invoiceSummaryDataSource = new MatTableDataSource(data);
      });

    this.http
      .get('invoice-line-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Invoice Lines:', data);

        this.invoiceLinesDisplayedColumns = Object.keys(data[0]);
        this.invoiceLinesDataSource = new MatTableDataSource(data);
      });
  }

  formatColumnName(column: string): string {
    const acronyms = ['id', 'sql', 'api', 'url'];
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

  removeColumns(columns: string[], columnsToRemove: string[]): string[] {
    return columns.filter((column) => !columnsToRemove.includes(column));
  }

  toggleAccordion(section: 'subscription' | 'invoice') {
    this.expanded[section] = !this.expanded[section];
  }

  get invoiceContainerWidth(): string {
    if (!this.expanded.invoice) return '100%';
    return this.sidebarExpanded ? 'calc(100% - 255px)' : 'calc(100% - 71px)';
  }
}
