import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-column-select',
    templateUrl: './column-select.component.html',
    styleUrls: ['./column-select.component.scss'],
    standalone: false
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
    let columnsToDisplay = [];
    this.displayedColumns.map((column) => {
      if (column.selected) {
        columnsToDisplay.push(column.name);
      }
    });
    this.dialogRef.close(columnsToDisplay);
  }

  save() {
    this.dialogRef.close(this.selectedColumns);
  }

  displayedColumns: {
    name: string;
    displayName: string;
    selected: boolean;
  }[] = [
    { name: 'PROGRAM_NAME', displayName: 'Program Name', selected: true },
    { name: 'ACCOUNT', displayName: 'Account', selected: true },
    {
      name: 'DEAL_ID',
      displayName: 'Deal Id',
      selected: true,
    },
    {
      name: 'DEAL_UPLOAD_DATE',
      displayName: 'Upload Date',
      selected: true,
    },
    {
      name: 'SALES_ORDER',
      displayName: 'Order (#)',
      selected: true,
    },
    {
      name: 'ORDER_VALUE',
      displayName: 'Order Value ($M)',
      selected: true,
    },
    {
      name: 'TOTAL_LINE_COUNT',
      displayName: 'Line Count',
      selected: true,
    },
    {
      name: 'ORDER_STATUS',
      displayName: 'Booking Status',
      selected: true,
    },
    {
      name: 'CONTRACT_NUMBER',
      displayName: 'Order Status',
      selected: true,
    },
    {
      name: 'LINES_ON_HOLD',
      displayName: 'Lines on Hold',
      selected: true,
    },
    {
      name: 'FLEXIBLE_INVOICE_ELIGIBLE',
      displayName: 'Flexible Invoice Eligible',
      selected: true,
    },
    {
      name: 'INVOICE_ELIGIBLE_DATE',
      displayName: 'Invoice Eligible Date (CLO)',
      selected: true,
    },
    {
      name: 'INVOICING_STATUS',
      displayName: 'Invoicing',
      selected: true,
    },
    {
      name: 'INVOICE_LINES',
      displayName: 'Invoice Lines',
      selected: false,
    },
    {
      name: 'INVOICE_DATE',
      displayName: 'Invoice date',
      selected: true,
    },
    {
      name: 'INVOICE_AMOUNT',
      displayName: 'Invoice Amount ($M)',
      selected: true,
    },
    {
      name: 'REV_ACCR_STATUS',
      displayName: 'Revenue Accruals',
      selected: true,
    },
    {
      name: 'GL_POSTING_STATUS',
      displayName: 'GL Posting',
      selected: true,
    },
    {
      name: 'ACCRUALS_EXECUTION_TIME',
      displayName: 'Accruals Execution Time (In Mins)',
      selected: false,
    },
    {
      name: 'FUTURE_INVOICE_RELEASE_DATE',
      displayName: 'Future Invoice Release Date',
      selected: false,
    },
    {
      name: 'TERM_IN_YEARS',
      displayName: 'Term',
      selected: false,
    },
    {
      name: 'BOOK_DATE',
      displayName: 'Book Date',
      selected: true,
    },
    {
      name: 'CLO_COMMENTS',
      displayName: 'Clo Updates',
      selected: true,
    },
    {
      name: 'COMMENTS',
      displayName: 'Comments',
      selected: true,
    },
  ];
}
