import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { MatPaginator } from '@angular/material/paginator';
import { BulkApproveRejectComponent } from './bulk-approve-reject/bulk-approve-reject.component';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';

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
    this.roles = this.authService.getRoles();
    this.getIssueReporting();
    this.getIssueReportingSummary();
  }

  summaryData: any[];
  summaryDatasource: any;
  summaryColumns: string[] = [];
  summaryDisplayedColumns: string[] = [];
  username: string = '';
  roles: string[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  searchForm: FormGroup = new FormGroup({
    track: new FormControl(''),
    quarter: new FormControl(''),
    status: new FormControl(''),
  });

  trackOptions: string[] = [];
  quarterOptions: string[] = [];
  statusOptions: string[] = [];
  trackTemp: string[] = [];
  quarterTemp: string[] = [];
  statusTemp: string[] = [];

  trackFilter: string[] = [];
  quarterFilter: string[] = [];
  statusFilter: string[] = [];

  statusOps: string[] = ['Open', 'Closed'];
  getIssueReporting() {
    this.http
      .get('issue-reporting', this.destroyManager)
      .subscribe((data: any) => {
        this.summaryData = data;
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
        this.filterData();
        this.summaryDatasource.paginator = this.paginator;
        this.summaryDatasource.filterPredicate = this.filterPredicate;
      });
  }

  issueSummaryData: any[] = [];
  getIssueReportingSummary() {
    this.http
      .get('issue-reporting-summary', this.destroyManager)
      .subscribe((data: any) => {
        this.issueSummaryData = data;
      });
  }

  filterData() {
    this.summaryData.forEach((data) => {
      this.trackTemp.push(data.TRACK);
      this.quarterTemp.push(data.QUARTER);
      this.statusTemp.push(data.STATUS);
    });
    this.trackOptions = [...new Set(this.trackTemp)];
    this.quarterOptions = [...new Set(this.quarterTemp)];
    this.statusOptions = [...new Set(this.statusTemp)];
  }

  filterPredicate = (data: any, filter: any) => {
    const filters = JSON.parse(filter);
    const trackMatch =
      filters.trackFilter.length === 0 ||
      filters.trackFilter.includes(data.TRACK);
    const quarterMatch =
      filters.quarterFilter.length === 0 ||
      filters.quarterFilter.includes(data.QUARTER);
    const statusMatch =
      filters.statusFilter.length === 0 ||
      filters.statusFilter.includes(data.STATUS);
    return trackMatch && statusMatch && quarterMatch;
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.trackFilter = data['track'];
      this.statusFilter = data['status'];
      this.quarterFilter = data['quarter'];
      this.summaryDatasource.filter = JSON.stringify({
        trackFilter: this.trackFilter,
        statusFilter: this.statusFilter,
        quarterFilter: this.quarterFilter,
      });
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

  toggleSelectAll(event: any): void {
    if (event.checked) {
      this.selection.select(...this.summaryDatasource.data);
    } else {
      this.selection.clear();
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.summaryDatasource?.data?.length || 0;
    return numSelected === numRows;
  }

  isSomeSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.summaryDatasource?.data?.length || 0;
    return numSelected > 0 && numSelected < numRows;
  }

  areAllRowsApproved(): boolean {
    return this.summaryDatasource?.data?.every(
      (row: any) => row.STATUS === 'Closed'
    );
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

  editingRow: any = null; // Tracks the row being edited
  editingField: string | null = null; // Tracks the specific field being edited

  editField(row: any, field: string): void {
    this.editingRow = row;
    this.editingField = field;
  }

  saveEdit(row: any): void {
    if (this.editingField === 'COMMENTS') {
      this.saveComments(row[this.editingField!], row.INCIDENT_NUMBER);
    } else if (this.editingField === 'FIX_DETAILS') {
      this.saveFixDetails(row[this.editingField!], row.INCIDENT_NUMBER);
    } else if (this.editingField === 'ISSUE_DESCRIPTION') {
      this.splitIssueDescription(row[this.editingField!], row.INCIDENT_NUMBER);
    }
    this.editingRow = null;
    this.editingField = null;
  }

  saveComments(data: any, incidentNumber: any) {
    const body = {
      incidentNumber: incidentNumber,
      username: this.username,
      comments: data,
    };
    this.http
      .post('issue-reporting-comments-update', body, {
        responseType: 'text',
      })
      .subscribe((data: any) => {
        this.summaryDatasource = null;
        this.getIssueReporting();
        this.cdr.detectChanges();
      });
  }

  saveFixDetails(data: any, incidentNumber: any) {
    const body = {
      incidentNumber: incidentNumber,
      username: this.username,
      fixDetails: data,
    };
    this.http
      .post('issue-reporting-fix-details-update', body, {
        responseType: 'text',
      })
      .subscribe((data: any) => {
        this.summaryDatasource = null;
        this.getIssueReporting();
        this.cdr.detectChanges();
      });
  }

  splitIssueDescription(data: any, incidentNumber: any) {
    const parts = data.split(
      /(Issue\s*:|Root Cause\s*:|Business Impact\s*:)/gi
    ); // Split at keywords
    let issue = '';
    let rootCause = '';
    let businessImpact = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part === 'Issue :') {
        issue = parts[i + 1]?.trim() || '';
      } else if (part === 'Root Cause :') {
        rootCause = parts[i + 1]?.trim() || '';
      } else if (part === 'Business Impact :') {
        businessImpact = parts[i + 1]?.trim() || '';
      }
    }
    this.saveIssueDescription(issue, rootCause, businessImpact, incidentNumber);
  }

  saveIssueDescription(
    issue: any,
    rootCause: any,
    businessImpact: any,
    incidentNumber: any
  ) {
    const body = {
      incidentNumber: incidentNumber,
      username: this.username,
      issue: issue,
      rootCause: rootCause,
      businessImpact: businessImpact,
    };

    this.http
      .post('issue-reporting-issue-desc-update', body, {
        responseType: 'text',
      })
      .subscribe((data: any) => {
        this.summaryDatasource = null;
        this.getIssueReporting();
        this.cdr.detectChanges();
      });
  }

  cancelEdit(): void {
    this.editingRow = null;
    this.editingField = null;
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

  formatFixDetails(fixDetails: string): {
    text: string;
    bullet: boolean;
    bold: boolean;
    breakBefore: boolean;
    longTerm: boolean;
  }[] {
    if (!fixDetails) return [];

    return fixDetails
      .split(/(Short term\s*:|Long Term\s*:|•)/gi) // Split at "Short term:", "Long Term:", and "•"
      .filter((part) => part.trim() !== '') // Remove empty parts
      .map((part, index, array) => {
        const isKeyword = /^(Short term|Long Term)\s*:$/i.test(part.trim());
        const longTerm = /Long Term\s*:/.test(part.trim());
        const isBullet = part.trim().startsWith('•');
        const breakBefore = isBullet && array[index - 1]?.trim() !== '•'; // Add a break before keywords or first bullet
        return {
          text: part.trim(),
          bullet: isBullet, // Mark as bullet if it starts with "•"
          bold: isKeyword, // Bold for "Short term:" and "Long Term:"
          breakBefore: breakBefore, // Add a break before keywords or first bullet
          longTerm: longTerm, // Add a double break before "Long Term:"
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

  openSummaryDialog() {
    const dialogRef = this.dialog.open(SummaryDialog, {
      width: '1200px',
      data: this.issueSummaryData,
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
        this.summaryDatasource = null;
        this.getIssueReporting();
        this.cdr.detectChanges();
      });
  }

  bulkApproveReject() {
    if (this.selectedRows.length === 0) {
      alert('Select at least one incident!');
      return;
    }

    const dialogRef = this.dialog.open(BulkApproveRejectComponent, {
      width: '400px',
      data: this.selectedRows.map((data) => ({
        incidentNumber: data.INCIDENT_NUMBER,
        status: data.IT_APPROVAL, // Default empty status
        approvedBy: this.username, // Replace with logged-in user
      })),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Submitted Data:', result);
        this.selection.clear();
        this.selectedRows = [];
        this.summaryDatasource = null;
        this.getIssueReporting();
        this.cdr.detectChanges();
      }
    });
  }

  onStatusChange(element: any) {
    const dialogRef = this.dialog.open(StatusDialog, {
      width: '450px',
      data: {
        status: element.STATUS,
        incidentNumber: element.INCIDENT_NUMBER,
        approvedBy: this.username,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateStatus(element);
      } else {
        this.summaryDatasource = null;
        this.getIssueReporting();
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(element: any) {
    const body = {
      status: element.STATUS,
      incidentNumber: element.INCIDENT_NUMBER,
      username: this.username,
    };

    this.http
      .post('issue-reporting-status-update', body, {
        responseType: 'text',
      })
      .subscribe((data: any) => {
        this.summaryDatasource = null;
        this.getIssueReporting();
        this.cdr.detectChanges();
      });
  }

  exportSummaryData(): void {
    // Create a worksheet from the summary data
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.summaryData
    );

    // Create a new workbook and append the worksheet
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');

    // Write the workbook to an array buffer
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    // Create a Blob from the buffer
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Create a temporary link element and trigger a download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${new Date().getTime()}.xlsx`;
    a.click();

    // Clean up by revoking the object URL
    window.URL.revokeObjectURL(url);
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
      <b>Please confirm you want to {{ data.message }} this Incident:</b>
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

@Component({
  template: `
    <div>
      <b>Please confirm you want to change the status as {{ data.status }}:</b>
    </div>
    <br />
    <div style="text-align: center !important;">
      <button class="btn openClose" (click)="closeDialog(true)">Confirm</button>
      &nbsp;
      <button
        class="btn btn-default"
        style="background-color: white !important;"
        (click)="closeDialog(false)"
      >
        Cancel
      </button>
    </div>
  `,
  styles: [
    `
      .dialog-content {
        font-size: 16px;
        color: #333;
        text-align: center;
      }
      .openClose {
        background-color: #185996 !important;
        color: white !important;
      }
    `,
  ],
})
export class StatusDialog {
  constructor(
    private dialogRef: MatDialogRef<StatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeDialog(isConfirmed: boolean) {
    this.dialogRef.close(isConfirmed);
  }
}

@Component({
  template: `
    <div
      style="display: flex; justify-content: space-between; align-items: center;"
    >
      <h5 style="margin: 0; font-weight: bold">Summary</h5>
      <button
        mat-icon-button
        (click)="closeDialog()"
        aria-label="Close"
        style="margin-left: auto; font-size: 24px; font-weight: bold;"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div>
      <table mat-table [dataSource]="dataSource">
        <!-- Track Column -->
        <ng-container matColumnDef="Track">
          <th mat-header-cell *matHeaderCellDef>Track</th>
          <td mat-cell *matCellDef="let element">{{ element['Track'] }}</td>
        </ng-container>

        <!-- Count Column -->
        <ng-container matColumnDef="Count">
          <th mat-header-cell *matHeaderCellDef>Count</th>
          <td mat-cell *matCellDef="let element">
            {{ element['Count'] || '' }}
          </td>
        </ng-container>

        <!-- Issue Status Column -->
        <ng-container matColumnDef="Issue Status">
          <th mat-header-cell *matHeaderCellDef>Issue Status</th>
          <td mat-cell *matCellDef="let element">
            {{ element['Issue Status'] || '' }}
          </td>
        </ng-container>

        <!-- IT Approval Column -->
        <ng-container matColumnDef="IT Approval">
          <th mat-header-cell *matHeaderCellDef>IT Approval</th>
          <td mat-cell *matCellDef="let element">
            {{ element['IT Approval'] || '' }}
          </td>
        </ng-container>

        <!-- Approved On Column -->
        <ng-container matColumnDef="Approved On">
          <th mat-header-cell *matHeaderCellDef>Approved On</th>
          <td mat-cell *matCellDef="let element">
            {{ element['Approved On'] || '' }}
          </td>
        </ng-container>

        <!-- Issue Description Column -->
        <ng-container matColumnDef="Issue Description">
          <th mat-header-cell *matHeaderCellDef>Issue Description</th>
          <td mat-cell *matCellDef="let element">
            {{ element['Issue Description'] || '' }}
          </td>
        </ng-container>

        <!-- Header and Row Declarations -->
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: displayedColumns"
          [ngClass]="{
            'bold-row':
              row['Track']?.toLowerCase()?.includes('sub total') ||
              row['Track']?.toLowerCase()?.includes('total')
          }"
        ></tr>
      </table>
    </div>
  `,
  styles: [
    `
      table {
        width: 100%;
        border-collapse: separate; /* Allows spacing between cells */
        border-spacing: 0 4px; /* Adds vertical spacing between rows (optional) */
      }

      th.mat-header-cell,
      td.mat-cell {
        padding: 12px 16px; /* Horizontal padding creates gap between columns */
        font-size: 14px;
      }

      th.mat-header-cell {
        white-space: nowrap;
        font-weight: bold;
        background-color: #08ace4;
        color: white;
      }

      td.mat-cell {
        vertical-align: top;
      }

      /* Bold rows for Sub Total and Total */
      tr.bold-row td {
        font-weight: bold;
      }
    `,
  ],
})
export class SummaryDialog {
  displayedColumns: string[] = [
    'Track',
    'Count',
    'Issue Status',
    'IT Approval',
    'Approved On',
    'Issue Description',
  ];
  dataSource: MatTableDataSource<any>;
  constructor(
    private dialogRef: MatDialogRef<StatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('Data:', data);
    this.dataSource = new MatTableDataSource(this.data);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
