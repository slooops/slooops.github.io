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
    { name: 'PROGRAM_NAME', displayName: 'PROGRAM NAME', selected: true },
    { name: 'ACCOUNT', displayName: 'ACCOUNT', selected: true },
    {
      name: 'DEAL_ID',
      displayName: 'DEAL ID',
      selected: true,
    },
    {
      name: 'DEAL_UPLOAD_DATE',
      displayName: 'UPLOAD DATE',
      selected: true,
    },
    {
      name: 'SALES_ORDER',
      displayName: 'ORDER (#)',
      selected: true,
    },
    {
      name: 'ORDER_VALUE',
      displayName: 'ORDER VALUE ($M)',
      selected: true,
    },
    {
      name: 'TOTAL_LINE_COUNT',
      displayName: 'LINE COUNT',
      selected: true,
    },
    {
      name: 'ORDER_STATUS',
      displayName: 'BOOKING STATUS',
      selected: true,
    },
    {
      name: 'CONTRACT_NUMBER',
      displayName: 'ORDER STATUS',
      selected: true,
    },
    {
      name: 'LINES_ON_HOLD',
      displayName: 'LINES ON HOLD',
      selected: true,
    },
    {
      name: 'FLEXIBLE_INVOICE_ELIGIBLE',
      displayName: 'FLEXIBLE INVOICE ELIGIBLE',
      selected: true,
    },
    {
      name: 'INVOICE_ELIGIBLE_DATE',
      displayName: 'INVOICE ELIGIBLE DATE (CLO)',
      selected: true,
    },
    {
      name: 'INVOICING_STATUS',
      displayName: 'INVOICING',
      selected: true,
    },
    {
      name: 'INVOICE_LINES',
      displayName: 'INVOICE LINES',
      selected: false,
    },
    {
      name: 'INVOICE_DATE',
      displayName: 'INVOICE DATE',
      selected: true,
    },
    {
      name: 'INVOICE_AMOUNT',
      displayName: 'INVOICE AMOUNT ($M)',
      selected: true,
    },
    {
      name: 'REV_ACCR_STATUS',
      displayName: 'REVENUE ACCRUALS',
      selected: true,
    },
    {
      name: 'GL_POSTING_STATUS',
      displayName: 'GL POSTING',
      selected: true,
    },
    {
      name: 'ACCRUALS_EXECUTION_TIME',
      displayName: 'ACCRUALS EXECUTION TIME (IN MINS)',
      selected: false,
    },
    {
      name: 'FUTURE_INVOICE_RELEASE_DATE',
      displayName: 'FUTURE INVOICE RELEASE DATE',
      selected: false,
    },
    {
      name: 'TERM_IN_YEARS',
      displayName: 'TERM',
      selected: false,
    },
    {
      name: 'BOOK_DATE',
      displayName: 'BOOK DATE',
      selected: true,
    },
    {
      name: 'CLO_COMMENTS',
      displayName: 'CLO UPDATES',
      selected: true,
    },
    {
      name: 'COMMENTS',
      displayName: 'COMMENTS',
      selected: true,
    },
  ];
}
