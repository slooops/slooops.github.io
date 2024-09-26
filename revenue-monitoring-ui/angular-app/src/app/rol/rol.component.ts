import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';
import { SelectionModel } from '@angular/cdk/collections';
import { AssignDialogComponent } from './assign-dialog/assign-dialog.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-rol',
  templateUrl: './rol.component.html',
  styleUrls: ['./rol.component.css'],
})
export class RolComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  rolSummaryModel: RolErrorSummaryData[];

  rolErrorSummaryData: any;
  rolErrorDisplayedColumns: string[] = [];
  rolErrorColumns: string[] = [];

  dataSource: any;
  rolTransactionData: RolTransactionData[];
  displayedColumns: string[] = [];

  subApplicationMapping = {
    XXCFIR_REV_INTERFACE_ALL: '1. Interface',
    XXCFIR_REVENUE_EXTRACT_ALL: '2. Extraction',
    XXCFIR_REVENUE_DIST_ALL: '3. Distribution',
    XXCFIR_ROL_XLA_SUMMARY: '4. Summarization',
    XLA_AE_HEADERS: '5. SLA',
  };

  totalRecords: number = 0;
  pageSize: number = 20;
  isLoading: boolean = false;
  periodName: string = '';
  periodEnd: string = '';

  constructor(
    private http: ApiHttpService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getRolTransactionData(0, this.pageSize);
    this.getRolErrorSummaryData();
    this.getRolErrorSummaryPeriodStatus();
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
      this.rolErrorColumns = [
        'PERIOD_NAME',
        'APPLICATION_NAME',
        'PROCESS_FLOW',
        'ORG_NAME',
        'AMOUNT',
        'CREATION_DATE',
        'AGING',
        'ASSIGNED_TO',
        'ASSIGNED_DATE',
        'COMMENTS',
        // 'CURRENCY_CODE',
        // 'ERROR_APPLICATION',
      ];
      this.rolErrorDisplayedColumns = ['select', ...this.rolErrorColumns];

      this.rolSummaryModel = this.formatData(data);
      console.log(this.rolSummaryModel);
      this.rolSummaryModel.forEach((row) => {
        row.AGING = this.getAging(row.CREATION_DATE) + ' days';
        const creationDate = new Date(row.CREATION_DATE);
        const month = ('0' + (creationDate.getMonth() + 1)).slice(-2);
        const day = ('0' + creationDate.getDate()).slice(-2);
        const year = creationDate.getFullYear();
        row.CREATION_DATE = `${month}/${day}/${year}`;
        //need to check creation date
      });

      this.rolErrorSummaryData = new MatTableDataSource<RolErrorSummaryData>(
        this.rolSummaryModel
      );
    });
  }

  getRolErrorSummaryPeriodStatus() {
    this.http.get('rol-errors-summary-period-status').subscribe((data: any) => {
      this.periodName = data[0].PERIOD_NAME;
      this.periodEnd = data[0].END_DATE;
      console.log('Rol error summary period status:', data);
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
            'process_STATUS',
            'source',
            'error_MESSAGE',

            // 'currency_CODE',
            // 'custtrxlineid',
            // 'error_APPLICATION',
            // 'intid_TRXNID_CUSTTRXLINE_GROUPID',
            // 'orderlineid',
            // 'ordernumber_CUSTTRXID',
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

  getAging(dateString: string): string {
    const today = new Date();
    const creationDate = new Date(dateString);
    const timeDifference = today.getTime() - creationDate.getTime();

    const agingInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return agingInDays.toString();
  }

  removeColumns(columnsToRemove: string[]) {
    this.displayedColumns = this.displayedColumns.filter(
      (column) => !columnsToRemove.includes(column)
    );
  }

  subAppMapping(key: string): string | undefined {
    return this.subApplicationMapping[key];
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
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  selection = new SelectionModel<any>(true, []);
  selectedData: any;

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.rolErrorSummaryData.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.rolErrorSummaryData.data.forEach((row) =>
          this.selection.select(row)
        );
  }

  onRowClicked(row: any) {
    this.selectedData = row;
  }

  selectedSummaryData: RolErrorSummaryData[] = [];

  viewDetails() {
    this.selectedSummaryData = this.selection.selected;
    console.log('Selected data:', this.selectedSummaryData);
    this.openRowDialog();
  }

  openRowDialog(): void {
    const dialogRef = this.dialog.open(AssignDialogComponent, {
      width: '400px',
      data: this.selectedSummaryData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Dialog result:', result);
      }
    });
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

interface RolErrorSummaryData {
  PERIOD_NAME: string;
  APPLICATION_NAME: string;
  PROCESS_FLOW: string;
  ORG_NAME: string;
  AMOUNT: string;
  AGING: string;
  ASSIGNED_TO: string;
  COMMENTS: string;
  CREATION_DATE: string;
  ASSIGNED_DATE: string;
}
