import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-rol',
  templateUrl: './rol.component.html',
  styleUrls: ['./rol.component.css'],
})
export class RolComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  rolErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);
  rolErrorDisplayedColumns: string[] = [];

  dataSource: any;
  rolTransactionData: RolTransactionData[];
  displayedColumns: string[] = [];

  totalRecords: number = 0;
  pageSize: number = 20;
  isLoading: boolean = false; // Track loading state

  constructor(private http: ApiHttpService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getRolTransactionData(0, this.pageSize);
    this.getRolErrorSummaryData();
  }

  ngAfterViewInit(): void {
    this.paginator.page.subscribe((event: PageEvent) => {
      this.getRolTransactionData(event.pageIndex, event.pageSize);
    });

    // setTimeout(() => {
    //   if (this.paginator) {
    //     this.dataSource.paginator = this.paginator;
    //     this.cdr.detectChanges(); // Ensure change detection
    //   }
    // });
  }

  getRolErrorSummaryData() {
    this.http.get('rol-errors-summary').subscribe((data: any) => {
      console.log('Rol error summary data:', data);
      this.rolErrorDisplayedColumns = this.rolErrorDisplayedColumns = [
        'PERIOD_YEAR',
        'PERIOD_NUM',
        'APPLICATION_NAME',
        'SUB_APPLICATION',
        'ORG_ID',
        'AMOUNT',
        // 'CURRENCY_CODE',
        // 'ERROR_APPLICATION',
      ];

      this.rolErrorSummaryData.data = this.formatData(data);
    });
  }

  getRolTransactionData(pageIndex: number, pageSize: number) {
    this.isLoading = true;
    const pageRequest = {
      page: pageIndex.toString(),
      size: pageSize.toString(),
    };

    this.http.get('rol-transaction-data', { params: pageRequest }).subscribe({
      next: (data: any) => {
        this.rolTransactionData = data.rolTransactionData;
        console.log('Rol transaction data:', this.rolTransactionData);
        this.totalRecords = data.totalRecords;

        if (this.rolTransactionData.length > 0) {
          // Transaction Data Table Columns Order
          this.displayedColumns = [
            'period_YEAR',
            'period_NUM',
            'application_NAME',
            'sub_APPLICATION',
            'org_ID',
            'amount',

            // 'currency_CODE',
            // 'custtrxlineid',
            // 'error_APPLICATION',
            'error_MESSAGE',
            'intid_TRXNID_CUSTTRXLINE_GROUPID',
            'orderlineid',
            'ordernumber_CUSTTRXID',

            'process_STATUS',
            'source',
          ];
        }

        this.rolTransactionData = this.formatData(this.rolTransactionData);

        this.dataSource = new MatTableDataSource<RolTransactionData>(
          this.rolTransactionData
        );
        if (this.paginator) {
          if (this.dataSource.paginator !== this.paginator) {
            this.dataSource.paginator = this.paginator;
          }

          setTimeout(() => {
            this.paginator.length = this.totalRecords;
            this.paginator.pageIndex = pageIndex;
            this.paginator.pageSize = pageSize;
            this.cdr.detectChanges();
          });
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

  removeColumns(columnsToRemove: string[]) {
    this.displayedColumns = this.displayedColumns.filter(
      (column) => !columnsToRemove.includes(column)
    );
  }

  formatData(data: any[]): any[] {
    return data.map((row) => {
      const formattedRow = { ...row };

      // If the AMOUNT column exists, format it with dollar signs and commas, and ensure two decimal places
      if ('AMOUNT' in row) {
        formattedRow['AMOUNT'] = `$${Number(row['AMOUNT']).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2, // Always show at least two decimal places
            maximumFractionDigits: 2, // Restrict to two decimal places
          }
        )}`;
      } else if ('amount' in row) {
        formattedRow['amount'] = `$${Number(row['amount']).toLocaleString(
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

  // Replace underscores in column headers
  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = ['name', 'num', 'year', 'code', 'org', 'sub', 'unit'];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (specialWords.includes(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return word.length > 4
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word;
      })
      .join(' ');
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

interface RolTransactionData {
  PERIOD_YEAR: string;
  PERIOD_NUM: string;
  ORG_ID: string;
  APPLICATION_NAME: string;
  ERROR_APPLICATION: string;
  SUB_APPLICATION: string;
  SOURCE: string;
  AMOUNT: string;
  CURRENCY_CODE: string;
  INTID_TRXNID_CUSTTRXLINE_GROUPID: string;
  ORDERNUMBER_CUSTTRXID: string;
  CUSTTRXLINEID: string;
  ORDERLINEID: string;
  ERROR_MESSAGE: string;
  PROCESS_STATUS: string;
}
