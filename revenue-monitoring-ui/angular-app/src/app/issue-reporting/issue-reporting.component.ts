import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { AuthenticationService } from '../providers/authentication.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { IssueUploadComponent } from './issue-upload/issue-upload.component';

@Component({
  selector: 'app-issue-reporting',
  templateUrl: './issue-reporting.component.html',
  styleUrl: './issue-reporting.component.css',
})
export class IssueReportingComponent implements OnInit {
  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private authService: AuthenticationService
  ) {}
  ngOnInit() {
    this.username = this.authService.getUserName();
    this.getIssueReporting();
  }

  summaryData: any[];
  summaryDatasource: any;
  summaryColumns: string[] = [];
  summaryDisplayedColumns: string[] = [];
  username: string = '';

  getIssueReporting() {
    this.http
      .get('issue-reporting', this.destroyManager)
      .subscribe((data: any) => {
        this.summaryData = data;
        console.log(data);
        if (this.summaryData.length > 0) {
          this.summaryColumns = Object.keys(this.summaryData[0]);
        }
        this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
        this.summaryData.forEach((row) => {
          row.START_DATE = this.dateTransform(row.START_DATE);
          row.REPORTED_DATE = this.dateTransform(row.REPORTED_DATE);
        });
        this.summaryDatasource = new MatTableDataSource<IssueReportingModel>(
          this.summaryData
        );
      });
  }
  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }
  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  uploadFile() {
    const dialogRef = this.dialog.open(IssueUploadComponent, {
      width: '400px',
    });
  }

  selection = new SelectionModel<any>(true, []);
  selectedSummaryData: any[] = [];
  isModalOpen: boolean = false;
  selectedRows: any[] = [];
  onRowSelectionChange(event: MatCheckboxChange, row: any) {
    this.selection.toggle(row);
    if (event.checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(
        (selectedRow) => selectedRow !== row
      );
    }
  }

  resetSelection() {
    this.selection.clear();
    this.selectedRows = [];
    this.cdr.detectChanges();
  }

  formatIssueDescription(description: string): {
    text: string;
    bold: boolean;
    breakBefore: boolean;
    breakAfter: boolean;
  }[] {
    if (!description) return [];

    return description
      .split(/(Issue\s*:|Root Cause\s*:|Business Impact\s*:)/gi) // Split at keywords
      .filter((part) => part.trim() !== '') // Remove empty parts
      .map((part, index, array) => {
        const isKeyword = /^(Issue|Root Cause|Business Impact)\s*:$/i.test(
          part
        );
        return {
          text: part.trim(),
          bold: isKeyword, // Bold only for the keywords
          breakBefore: index > 0 && isKeyword, // Break before "Root Cause:" and "Business Impact:"
          breakAfter: isKeyword, // Break after "Issue:", "Root Cause:", and "Business Impact:"
        };
      });
  }

  openDialog(message: string) {
    const dialogRef = this.dialog.open(DialogBox, {
      width: '400px',
      data: { message }, // Pass data to dialog
    });

    // Receive data when dialog is closed
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedRows.find((row) => {
          this.incidentNumber = row.INCIDENT_NUMBER;
          return row;
        });
        if (message === 'Approve') {
          this.approveRejectSingleIncident('Approved');
        } else if (message === 'Reject') {
          this.approveRejectSingleIncident('Rejected');
        }
      }
    });
  }

  incidentNumber: any;

  approveRejectSingleIncident(message: string) {
    const body = {
      incidentNumber: this.incidentNumber,
      username: this.username,
      approvalStatus: message,
    };
    this.http
      .post('issue-reporting-approval', body, {
        responseType: 'text',
      })
      .subscribe((data: any) => {
        this.selection.clear();
        this.selectedRows = [];
        this.cdr.detectChanges();
      });
  }
}

export interface IssueReportingModel {
  TRACK: string;
  ISSUE: string;
  ROOT_CAUSE: string;
  BUSINESS_IMPACT: string;
  FIX_DETAILS: string;
  INCIDENT_NUMBER: string;
  ISSUE_STARTED: string; // Consider using Date if it's a date field
  ISSUE_REPORTED_ON: string; // Consider using Date if it's a date field
  ISSUE_REPORTED_BY: string;
  QUARTER: string;
  PERIOD_NAME: string;
  PRIORITY: string;
  CODE_FIX: string;
  PDF_REQUIRED: string; // Assuming this is a boolean field
  BUSINESS_APROVAL: string; // Assuming this is a boolean field
  IT_APPROVAL: string; // Assuming this is a boolean field
  APPROVAL_COMMENTS: string;
  PERIOD_CLOSE_IMPACTING: string; // Assuming this is a boolean field
  UPLOADED_BY: string;
  EOC_INCIDENT: string;
  UPLOADED_DATE: string; // Consider using Date if it's a date field
  ASSIGNED_TO: string;
  SEQUENCE_NUMBER: string;
  ISSUE_STATUS: string;
}

@Component({
  template: `
    <mat-dialog-content>
      <b>Please confirm you want to approve this Incident:</b>
    </mat-dialog-content>
    <mat-dialog-actions style="justify-content: center !important;">
      <button
        class="btn"
        [class.approve]="data.message === 'Approve'"
        [class.reject]="data.message === 'Reject'"
        (click)="closeDialog(true)"
      >
        {{ data.message }}
      </button>
      <button
        class="btn btn-default"
        style="background-color: white !important;"
        (click)="closeDialog(false)"
      >
        Cancel
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        font-size: 16px;
        color: #333;
        text-align: center;
      }
      .approve {
        background-color: #04aa6d !important;
        color: white !important;
      }
      .reject {
        background-color: #f44336 !important;
        color: white !important;
      }
    `,
  ],
})
export class DialogBox {
  constructor(
    private dialogRef: MatDialogRef<DialogBox>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  closeDialog(isConfirmed: boolean) {
    this.dialogRef.close(isConfirmed);
  }
}
