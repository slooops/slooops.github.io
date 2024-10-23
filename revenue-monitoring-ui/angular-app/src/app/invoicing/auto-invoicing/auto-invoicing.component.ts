import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-auto-invoicing',
  templateUrl: './auto-invoicing.component.html',
  styleUrl: './auto-invoicing.component.css',
})
export class AutoInvoicingComponent {
  autoInvoicingSummary: AutoInvoicingErrorSummary[];
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;

  summaryDatasource: any;
  constructor(
    private http: ApiHttpService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.getAutoInvoiceErrorSummary();
    this.getAutoInvoiceErrorDetails();
  }

  summaryColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'TRANSACTION_DATE',
    'AGING',
    'ASSIGNED_TO',
    'ASSIGNED_DATE',
    'COMMENTS',
  ];

  summaryDisplayedColumns: string[] = [];

  selection = new SelectionModel<any>(true, []);
  selectedData: any;
  totalSummaryRecords: number = 0;

  getAutoInvoiceErrorSummary() {
    this.http.get('auto-invoice-error-summary').subscribe((data: any) => {
      console.log(data);
      this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
      this.autoInvoicingSummary = this.formatData(data);
      this.autoInvoicingSummary.forEach((row) => {
        row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
      });
      this.originalData = this.autoInvoicingSummary;

      this.summaryDatasource =
        new MatTableDataSource<AutoInvoicingErrorSummary>(
          this.autoInvoicingSummary
        );

      if (this.summaryPaginator) {
        if (this.summaryDatasource.paginator !== this.summaryPaginator) {
          this.summaryDatasource.paginator = this.summaryPaginator;
        }

        this.totalSummaryRecords = this.autoInvoicingSummary.length;

        // setTimeout(() => {
        //   this.paginator.length = this.totalRecords;
        //   this.paginator.pageIndex = pageIndex;
        //   this.paginator.pageSize = pageSize;
        //   this.cdr.detectChanges();
        // });
      }
    });
  }
  originalData: any[] = [];

  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | '' = '';
  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection =
        this.sortDirection === 'desc'
          ? 'asc'
          : this.sortDirection === 'asc'
          ? ''
          : 'desc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }

    if (this.sortDirection === '') {
      this.summaryDatasource.data = [...this.originalData];
    } else {
      this.summaryDatasource.data = [...this.summaryDatasource.data].sort(
        (a, b) => this.compare(a[column], b[column], column)
      );
    }
  }

  compare(a: any, b: any, column: string): number {
    let valueA = a;
    let valueB = b;

    if (column === 'AMOUNT') {
      valueA = parseFloat(a.replace(/[$,]/g, '')) || 0;
      valueB = parseFloat(b.replace(/[$,]/g, '')) || 0;
    } else if (column === 'AGING') {
      valueA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      valueB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    }

    const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    return this.sortDirection === 'asc' ? comparison : -comparison;
  }

  getSortIcon(): string {
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  isSortedColumn(column: string): boolean {
    return this.sortColumn === column && this.sortDirection !== '';
  }

  isEscalated(element: any): boolean {
    return element.AGING > 6;
  }

  getCircleNumber(element: any): any {
    const aging = element.AGING;
    if (aging >= 7 && aging <= 10) {
      return 1;
    } else if (aging >= 11 && aging <= 16) {
      return 2;
    } else if (aging > 16) {
      return 3;
    }
    return 0;
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  formatData(data: any[]): any[] {
    return data.map((row) => {
      const formattedRow = { ...row };
      const amountKey =
        'AMOUNT' in row ? 'AMOUNT' : 'amount' in row ? 'amount' : null;

      if (amountKey) {
        formattedRow[amountKey] = `$${Number(row[amountKey]).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2, // Always show at least two decimal places
            maximumFractionDigits: 2, // Restrict to two decimal places
          }
        )}`;
      }

      return formattedRow;
    });
  }
  selectedRows: any[] = []; // Store all selected rows

  onRowSelectionChange(event: MatCheckboxChange, row: any) {
    this.selection.toggle(row);

    if (event.checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(
        (selectedRow) => selectedRow !== row
      );
    }

    if (this.selectedRows.length > 0) {
      this.getAutoInvoiceErrorDetailsFiltered(this.selectedRows);
    } else {
      this.isFiltered = false;
      this.dataSource = new MatTableDataSource<AutoInvoicingErrorDetails>(
        this.autoInvocingErrorDetails
      );
      this.dataSource.paginator = this.detailsPaginator;
      this.filtereddataSource = null;
      this.detailsPaginator.length = this.totalRecords;
      this.cdr.detectChanges();
    }
  }

  dataSource: any;
  autoInvocingErrorDetails: AutoInvoicingErrorDetails[];
  autoInvocingErrorDetailsFiltered: AutoInvoicingErrorDetails[];

  detailsDisplayedColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'TRANSACTION_DATE',
    'SALES_ORDER',
    'INTERFACE_LINE_ID',
    'ERROR_MESSAGE',
  ];

  isFiltered: boolean = false;
  filtereddataSource: any;
  totalRecords: number = 0;
  isLoading: boolean = false;

  getAutoInvoiceErrorDetails() {
    this.isLoading = true;
    this.isFiltered = false;

    this.http.get('auto-invoice-error-details').subscribe({
      next: (data: any) => {
        this.autoInvocingErrorDetails = data;
        this.autoInvocingErrorDetails = this.formatData(
          this.autoInvocingErrorDetails
        );
        this.autoInvocingErrorDetails.forEach((row) => {
          row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
        });
        this.dataSource = new MatTableDataSource<AutoInvoicingErrorDetails>(
          this.autoInvocingErrorDetails
        );

        if (this.detailsPaginator) {
          if (this.dataSource.paginator !== this.detailsPaginator) {
            this.dataSource.paginator = this.detailsPaginator;
          }

          this.totalRecords = this.autoInvocingErrorDetails.length;

          // setTimeout(() => {
          //   this.paginator.length = this.totalRecords;
          //   this.paginator.pageIndex = pageIndex;
          //   this.paginator.pageSize = pageSize;
          //   this.cdr.detectChanges();
          // });
        }
      },
      error: (err) => {
        console.error('Error fetching data', err);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
  totalRecordsFiltered: number = 0;

  getAutoInvoiceErrorDetailsFiltered(data: any) {
    this.isLoading = true;
    this.isFiltered = true;
    const periodNames = data.map((row) => row.PERIOD_NAME);
    const ouNames = data.map((row) => row.ORG_NAME);
    const appNames = data.map((row) => row.APPLICATION_NAME);
    const transactionDates = data.map((row) => row.TRANSACTION_DATE);

    const pageRequest = {
      periodNames: periodNames.join(','),
      ouNames: ouNames.join(','),
      appNames: appNames.join(','),
    };

    console.log(pageRequest);

    this.http
      .get('auto-invoice-error-details-filtered', { params: pageRequest })
      .subscribe({
        next: (data: any) => {
          this.autoInvocingErrorDetailsFiltered =
            data.autoInvoiceErrorDetailsFiltered;

          this.autoInvocingErrorDetailsFiltered = this.formatData(
            this.autoInvocingErrorDetailsFiltered
          );

          this.autoInvocingErrorDetailsFiltered.forEach((row) => {
            row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
          });

          console.log(this.autoInvocingErrorDetailsFiltered);

          this.filtereddataSource =
            new MatTableDataSource<AutoInvoicingErrorDetails>(
              this.autoInvocingErrorDetailsFiltered
            );

          if (this.detailsPaginator) {
            this.filtereddataSource.paginator = this.detailsPaginator;
            setTimeout(() => {
              this.detailsPaginator.length =
                this.autoInvocingErrorDetailsFiltered.length;
              this.cdr.detectChanges();
            });
          }
        },
        error: (err) => {
          console.error('Error fetching filtered data', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = [
      'name',
      'amount',
      'interface',
      'error',
      'number',
      'total',
      'hold',
      'pending',
      'status',
      'num',
      'year',
      'status',
      'sub',
      'staging',
      'id',
      'line',
    ];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (specialWords.includes(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}

interface AutoInvoicingErrorSummary {
  PERIOD_NAME: string;
  APPLICATION_NAME: string;
  PROCESS_FLOW: string;
  ORG_NAME: string;
  AMOUNT: string;
  AGING: string;
  ASSIGNED_TO: string;
  COMMENTS: string;
  TRANSACTION_DATE: string;
  ASSIGNED_DATE: string;
}

export interface AutoInvoicingErrorDetails {
  AMOUNT: string;
  APPLICATION_NAME: string;
  ERROR_MESSAGE: string;
  INTERFACE_LINE_ID: string;
  ORG_NAME: string;
  PERIOD_NAME: string;
  PROCESS_FLOW: string;
  SALES_ORDER: string;
  TRANSACTION_DATE: string;
}
