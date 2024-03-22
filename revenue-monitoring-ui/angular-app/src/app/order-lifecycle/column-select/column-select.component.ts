import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-column-select',
  templateUrl: './column-select.component.html',
  styleUrls: ['./column-select.component.scss'],
})
export class ColumnSelectComponent implements OnInit {
  selectedColumns: string[];
  constructor(
    public dialogRef: MatDialogRef<ColumnSelectComponent>,
    @Inject(MAT_DIALOG_DATA) public injectData: any
  ) {}

  ngOnInit(): void {
    this.selectedColumns = this.injectData;
  }

  logSelectedColumns(event: any) {
    const selectedDisplayNames = event.source.selectedOptions.selected.map(
      (option) => option.value.displayName
    );
    if (selectedDisplayNames.length > 0) {
      this.selectedColumns = [];
      for (const column of this.displayedColumns) {
        if (selectedDisplayNames.includes(column.displayName)) {
          this.selectedColumns.push(column.name);
        }
      }
    } else {
      this.selectedColumns = this.displayedColumns.map((column) => column.name);
    }
  }

  closeDialog() {
    this.dialogRef.close(this.displayedColumns.map((column) => column.name));
  }

  save() {
    this.dialogRef.close(this.selectedColumns);
  }

  displayedColumns: {
    name: string;
    displayName: string;
  }[] = [
    { name: 'PROGRAM_NAME', displayName: 'PROGRAM NAME' },
    { name: 'ACCOUNT', displayName: 'ACCOUNT' },
    {
      name: 'DEAL_ID',
      displayName: 'DEAL ID',
    },
    {
      name: 'DEAL_UPLOAD_DATE',
      displayName: 'DEAL UPLOAD DATE',
    },
    {
      name: 'SALES_ORDER',
      displayName: 'ORDER / SUBSCRIPTION (#)',
    },
    {
      name: 'ORDER_VALUE',
      displayName: 'ORDER VALUE ($M)',
    },
    {
      name: 'TOTAL_LINE_COUNT',
      displayName: 'TOTAL LINE COUNT',
    },
    {
      name: 'ORDER_STATUS',
      displayName: 'BOOKING STATUS',
    },
    {
      name: 'CONTRACT_NUMBER',
      displayName: 'ORDER STATUS',
    },
    {
      name: 'LINES_ON_HOLD',
      displayName: 'LINES ON HOLD',
    },
    {
      name: 'FLEXIBLE_INVOICE_ELIGIBLE',
      displayName: 'FLEXIBLE INVOICE ELIGIBLE',
    },
    {
      name: 'INVOICE_ELIGIBLE_DATE',
      displayName: 'INVOICE ELIGIBLE DATE',
    },
    {
      name: 'INVOICING_STATUS',
      displayName: 'INVOICING',
    },
    {
      name: 'INVOICE_LINES',
      displayName: 'INVOICE LINES',
    },
    {
      name: 'INVOICE_DATE',
      displayName: 'INVOICE DATE',
    },
    {
      name: 'INVOICE_AMOUNT',
      displayName: 'INVOICE AMOUNT ($M)',
    },
    {
      name: 'REV_ACCR_STATUS',
      displayName: 'REVENUE ACCRUALS',
    },
    {
      name: 'GL_POSTING_STATUS',
      displayName: 'GL POSTING',
    },
    {
      name: 'ACCRUALS_EXECUTION_TIME',
      displayName: 'ACCRUALS EXECUTION TIME (IN MINS)',
    },
    {
      name: 'FUTURE_INVOICE_RELEASE_DATE',
      displayName: 'FUTURE INVOICE RELEASE DATE',
    },
    {
      name: 'TERM_IN_YEARS',
      displayName: 'TERM',
    },
    {
      name: 'BOOK_DATE',
      displayName: 'BOOK DATE',
    },
    {
      name: 'CLO_COMMENTS',
      displayName: 'CLO UPDATES',
    },
    {
      name: 'COMMENTS',
      displayName: 'COMMENTS',
    },
  ];
}
