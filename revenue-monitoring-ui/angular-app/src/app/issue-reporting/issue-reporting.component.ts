import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
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
import { ExportToExcelService } from '../providers/export-to-excel.service';
import { ThemeService } from '../providers/theme.service';
import {
  FilterConfig,
  ActionButtonConfig,
  FilterValues,
} from '../components/filter-button-bar/filter-button-bar.component';
import { SelectOption } from '../ui/types/common.types';
// Imports needed by inline dialog components that remain standalone
import { CommonModule } from '@angular/common';
import { provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-issue-reporting',
  templateUrl: './issue-reporting.component.html',
  styleUrl: './issue-reporting.component.css',
  providers: [DestroyManager],
  standalone: false,
})
export class IssueReportingComponent implements OnInit {
  // Modal state — replaces MatDialog usage
  uploadModalOpen = false;
  summaryModalOpen = false;
  summaryModalData: any[] = [];
  confirmModalOpen = false;
  confirmModalData: { message: string } = { message: '' };
  bulkModalOpen = false;
  bulkModalData: any[] = [];
  statusModalOpen = false;
  statusModalData: any = {};
  private statusModalElement: any = null;

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private authService: AuthenticationService,
    private exportToExcelService: ExportToExcelService,
    public themeService: ThemeService,
  ) {}
  ngOnInit() {
    this.username = this.authService.getUserName();
    this.roles = this.authService.getUserAccessRoles();
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
    incidentNum: new FormControl(''),
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
  incidentNumFilter: string = '';
  isLoading: boolean = false;

  // Filter-button-bar config
  filterConfigs: FilterConfig[] = [];
  filterValues: FilterValues = {
    track: [],
    quarter: [],
    status: [],
    incidentNum: '',
  };
  pageIndex: number = 0;
  pageSize: number = 10;

  get actionButtons(): ActionButtonConfig[] {
    return [
      {
        id: 'approve',
        label: 'Approve',
        variant: 'success',
        visible:
          this.roles.includes('ISSUE_APPROVAL') &&
          this.selection.selected.length === 1,
      },
      {
        id: 'reject',
        label: 'Reject',
        variant: 'danger',
        visible:
          this.roles.includes('ISSUE_APPROVAL') &&
          this.selection.selected.length === 1,
      },
      {
        id: 'bulkApproveReject',
        label: 'Approve / Reject',
        variant: 'primary',
        visible:
          this.roles.includes('ISSUE_APPROVAL') &&
          this.selection.selected.length > 1,
      },
      {
        id: 'viewSummary',
        label: 'View Summary',
        variant: 'secondary',
        visible: true,
      },
      {
        id: 'upload',
        label: 'Upload',
        variant: 'secondary',
        icon: 'phosphorCloudArrowUpBold',
        visible: true,
      },
      {
        id: 'download',
        label: 'Download',
        variant: 'secondary',
        icon: 'phosphorArrowLineDownBold',
        visible: true,
      },
    ];
  }

  onFilterChange(values: FilterValues): void {
    this.filterValues = values;
    this.trackFilter = (values['track'] as string[]) || [];
    this.quarterFilter = (values['quarter'] as string[]) || [];
    this.statusFilter = (values['status'] as string[]) || [];
    this.incidentNumFilter = (values['incidentNum'] as string) || '';
    this.summaryDatasource.filter = JSON.stringify({
      trackFilter: this.trackFilter,
      statusFilter: this.statusFilter,
      quarterFilter: this.quarterFilter,
      incidentNumFilter: this.incidentNumFilter,
    });
    this.pageIndex = 0;
  }

  onFilterClear(): void {
    this.filterValues = { track: [], quarter: [], status: [], incidentNum: '' };
    this.trackFilter = [];
    this.quarterFilter = [];
    this.statusFilter = [];
    this.incidentNumFilter = '';
    this.summaryDatasource.filter = '';
  }

  onActionButtonClick(actionId: string): void {
    switch (actionId) {
      case 'approve':
        this.openDialog('Approve');
        break;
      case 'reject':
        this.openDialog('Reject');
        break;
      case 'bulkApproveReject':
        this.bulkApproveReject();
        break;
      case 'viewSummary':
        this.openSummaryDialog();
        break;
      case 'upload':
        this.uploadFile();
        break;
      case 'download':
        this.exportSummaryData();
        break;
    }
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.paginator) {
      this.paginator.pageIndex = event.pageIndex;
      this.paginator.pageSize = event.pageSize;
      this.paginator.page.emit({
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
        length: this.paginator.length,
      });
    }
  }

  // ── Native paginator helpers ──
  irTotalItems(): number {
    return (
      this.summaryDatasource?.filteredData?.length ??
      this.summaryDatasource?.data?.length ??
      0
    );
  }

  irTotalPages(): number {
    return Math.max(1, Math.ceil(this.irTotalItems() / this.pageSize));
  }

  irPageStart(): number {
    return this.irTotalItems() === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  irPageEnd(): number {
    return Math.min(this.irTotalItems(), (this.pageIndex + 1) * this.pageSize);
  }

  onIrPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.onPageChange({ pageIndex: 0, pageSize: value });
  }

  onIrPrev(): void {
    if (this.pageIndex > 0) {
      this.onPageChange({
        pageIndex: this.pageIndex - 1,
        pageSize: this.pageSize,
      });
    }
  }

  onIrNext(): void {
    if (this.pageIndex < this.irTotalPages() - 1) {
      this.onPageChange({
        pageIndex: this.pageIndex + 1,
        pageSize: this.pageSize,
      });
    }
  }

  statusOps: string[] = ['Open', 'Closed'];
  getIssueReporting() {
    this.isLoading = true;
    this.http
      .get('issue-reporting', this.destroyManager)
      .subscribe((data: any) => {
        if (data.length === 0) {
          this.isLoading = false;
        }
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
          this.summaryData,
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

    // Build filter configs for the filter-button-bar
    this.filterConfigs = [
      {
        id: 'track',
        label: 'Track',
        type: 'multi-select',
        placeholder: 'Select Track',
        options: this.trackOptions.map((t) => ({ label: t, value: t })),
      },
      {
        id: 'quarter',
        label: 'Quarter',
        type: 'multi-select',
        placeholder: 'Select Quarter',
        options: this.quarterOptions.map((q) => ({ label: q, value: q })),
      },
      {
        id: 'status',
        label: 'Status',
        type: 'multi-select',
        placeholder: 'Select Status',
        options: this.statusOptions.map((s) => ({ label: s, value: s })),
      },
      {
        id: 'incidentNum',
        label: 'Incident Number',
        type: 'text',
        placeholder: 'e.g., INC1234',
      },
    ];
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
    const incidentNumMatch =
      data.INCIDENT_NUMBER.toString().indexOf(filters.incidentNumFilter) !== -1;
    return trackMatch && statusMatch && quarterMatch && incidentNumMatch;
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.trackFilter = data['track'];
      this.statusFilter = data['status'];
      this.quarterFilter = data['quarter'];
      this.incidentNumFilter = this.searchForm.get('incidentNum').value;
      this.summaryDatasource.filter = JSON.stringify({
        trackFilter: this.trackFilter,
        statusFilter: this.statusFilter,
        quarterFilter: this.quarterFilter,
        incidentNumFilter: this.incidentNumFilter,
      });
    });
  }

  clearFilters() {
    this.summaryDatasource.filter = '';
    this.searchForm.reset();
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
    this.uploadModalOpen = true;
  }

  onUploadClosed(_result: string | null) {
    this.uploadModalOpen = false;
  }

  toggleSelectAll(event: any): void {
    const checked = event?.target?.checked ?? event?.checked;
    if (checked) {
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
      (row: any) => row.STATUS === 'Closed',
    );
  }

  selection = new SelectionModel<any>(true, []);
  selectedSummaryData: any[] = [];
  isModalOpen: boolean = false;
  selectedRows: any[] = [];
  onRowSelectionChange(event: any, row: any) {
    const checked = event?.target?.checked ?? event?.checked;
    this.selection.toggle(row);
    if (checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(
        (selectedRow) => selectedRow !== row,
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
      /(Issue\s*:|Root Cause\s*:|Business Impact\s*:)/gi,
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
    incidentNumber: any,
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
          part,
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
    this.confirmModalData = { message };
    this.confirmModalOpen = true;
  }

  onConfirmClosed(result: boolean | null) {
    this.confirmModalOpen = false;
    if (result) {
      this.selectedRows.find((row) => {
        this.incidentNumber = row.INCIDENT_NUMBER;
        return row;
      });
      const message = this.confirmModalData.message;
      if (message === 'Approve') {
        this.approveRejectSingleIncident('Approved');
      } else if (message === 'Reject') {
        this.approveRejectSingleIncident('Rejected');
      }
    }
  }

  openSummaryDialog() {
    this.summaryModalData = this.issueSummaryData ?? [];
    this.summaryModalOpen = true;
  }

  onSummaryClosed() {
    this.summaryModalOpen = false;
  }

  openIncidentDetails(data: any) {
    const incidentNumber = data; // Assuming INCIDENT_NUMBER is the unique identifier
    const url = `https://cisco.service-now.com/text_search_exact_match.do?sysparm_search=${incidentNumber}`; // Replace with your desired route or URL
    window.open(url, '_blank');
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
        this.issueSummaryData = [];
        this.getIssueReportingSummary();
        this.cdr.detectChanges();
      });
  }

  bulkApproveReject() {
    if (this.selectedRows.length === 0) {
      alert('Select at least one incident!');
      return;
    }

    this.bulkModalData = this.selectedRows.map((data) => ({
      incidentNumber: data.INCIDENT_NUMBER,
      status: data.IT_APPROVAL,
      approvedBy: this.username,
    }));
    this.bulkModalOpen = true;
  }

  onBulkClosed(result: string | null) {
    this.bulkModalOpen = false;
    if (result) {
      this.selection.clear();
      this.selectedRows = [];
      this.summaryDatasource = null;
      this.getIssueReporting();
      this.issueSummaryData = [];
      this.getIssueReportingSummary();
      this.cdr.detectChanges();
    }
  }

  onStatusChange(element: any) {
    this.statusModalElement = element;
    this.statusModalData = {
      status: element.STATUS,
      incidentNumber: element.INCIDENT_NUMBER,
      approvedBy: this.username,
    };
    this.statusModalOpen = true;
  }

  onStatusClosed(result: boolean | null) {
    this.statusModalOpen = false;
    const element = this.statusModalElement;
    this.statusModalElement = null;
    if (result) {
      this.updateStatus(element);
    } else {
      this.summaryDatasource = null;
      this.getIssueReporting();
      this.cdr.detectChanges();
    }
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
        this.issueSummaryData = [];
        this.getIssueReportingSummary();
        this.cdr.detectChanges();
      });
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    this.exportToExcelService.exportTableToExcel(data, sheetName, filename);
  }

  exportSummaryData(): void {
    this.exportTableToExcel(
      this.summaryData,
      'Active Incidents Summary',
      'active_incidents_summary',
    );
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
  selector: 'app-issue-confirm-dialog',
  template: `
    <div class="confirm-body">
      <b>Please confirm you want to {{ data.message }} this Incident:</b>
    </div>
    <div class="confirm-actions">
      <button
        class="btn"
        [class.approve]="data.message === 'Approve'"
        [class.reject]="data.message === 'Reject'"
        (click)="closeDialog(true)"
      >
        {{ data.message }}
      </button>
      <button class="btn btn-default" (click)="closeDialog(false)">
        Cancel
      </button>
    </div>
  `,
  styles: [
    `
      .confirm-body {
        font-size: 14px;
        color: #1b1c1d;
        text-align: center;
        padding: 16px 20px 8px;
      }
      :host-context(body.dark-theme) .confirm-body {
        color: #e0e6ed;
      }
      .confirm-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 8px 20px 16px;
      }
      .btn {
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid transparent;
        cursor: pointer;
        font-size: 13px;
      }
      .btn-default {
        background-color: #ffffff;
        border-color: #d0d7de;
        color: #1b1c1d;
      }
      :host-context(body.dark-theme) .btn-default {
        background-color: #1a2733;
        border-color: rgba(42, 63, 80, 0.8);
        color: #e0e6ed;
      }
      .approve {
        background-color: #04aa6d;
        color: white;
      }
      .reject {
        background-color: #f44336;
        color: white;
      }
    `,
  ],
  imports: [CommonModule],
  standalone: true,
})
export class DialogBox {
  @Input() data: { message: string } = { message: '' };
  @Output() closed = new EventEmitter<boolean | null>();

  closeDialog(isConfirmed: boolean) {
    this.closed.emit(isConfirmed);
  }
}

@Component({
  selector: 'app-issue-status-dialog',
  template: `
    <div class="status-body">
      <b>Please confirm you want to change the status as {{ data.status }}:</b>
    </div>
    <div class="status-actions">
      <button class="btn openClose" (click)="closeDialog(true)">Confirm</button>
      <button class="btn btn-default" (click)="closeDialog(false)">
        Cancel
      </button>
    </div>
  `,
  styles: [
    `
      .status-body {
        font-size: 14px;
        color: #1b1c1d;
        text-align: center;
        padding: 16px 20px 8px;
      }
      :host-context(body.dark-theme) .status-body {
        color: #e0e6ed;
      }
      .status-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 8px 20px 16px;
      }
      .btn {
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid transparent;
        cursor: pointer;
        font-size: 13px;
      }
      .btn-default {
        background-color: #ffffff;
        border-color: #d0d7de;
        color: #1b1c1d;
      }
      :host-context(body.dark-theme) .btn-default {
        background-color: #1a2733;
        border-color: rgba(42, 63, 80, 0.8);
        color: #e0e6ed;
      }
      .openClose {
        background-color: #185996;
        color: white;
      }
    `,
  ],
  imports: [CommonModule],
  standalone: true,
})
export class StatusDialog {
  @Input() data: any = {};
  @Output() closed = new EventEmitter<boolean | null>();

  closeDialog(isConfirmed: boolean) {
    this.closed.emit(isConfirmed);
  }
}

@Component({
  selector: 'app-issue-summary-dialog',
  template: `
    <div class="summary-header">
      <h5 class="summary-title">Summary</h5>
      <button
        class="summary-close-btn"
        (click)="closeDialog()"
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    <div class="summary-table-wrapper">
      <div class="summary-table-container">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Track</th>
              <th>Count</th>
              <th>Issue Status</th>
              <th>IT Approval</th>
            </tr>
          </thead>
          <tbody>
            @for (row of data; track row) {
              <tr
                [class.bold-row]="
                  row['Track']?.toLowerCase()?.includes('sub total') ||
                  row['Track']?.toLowerCase()?.includes('total')
                "
              >
                <td>{{ row['Track'] }}</td>
                <td>{{ row['Count'] || '' }}</td>
                <td>{{ row['Issue Status'] || '' }}</td>
                <td>{{ row['IT Approval'] || '' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: #ffffff;
        color: #1b1c1d;
      }
      :host-context(body.dark-theme) {
        background: #1a2733;
        color: #e0e6ed;
      }

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px 8px;
        background: transparent;
      }

      .summary-title {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1b1c1d;
      }
      :host-context(body.dark-theme) .summary-title {
        color: #e0e6ed;
      }

      .summary-close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 1rem;
        cursor: pointer;
        border-radius: 6px;
        transition:
          background 150ms,
          color 150ms;
      }

      .summary-close-btn:hover {
        background: rgba(0, 0, 0, 0.06);
        color: #1b1c1d;
      }
      :host-context(body.dark-theme) .summary-close-btn {
        color: #8899a6;
      }
      :host-context(body.dark-theme) .summary-close-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #e0e6ed;
      }

      .summary-table-wrapper {
        padding: 8px 20px 20px;
        background: #ffffff;
      }

      .summary-table-container {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
      }

      .summary-table {
        width: 100%;
        border-collapse: collapse;
      }

      .summary-table thead tr {
        background-color: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
      }

      .summary-table th {
        color: #64748b;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.75rem 1rem;
        white-space: nowrap;
      }

      .summary-table td {
        text-align: left;
        font-size: 0.75rem;
        font-weight: 400;
        padding: 0.625rem 1rem;
        color: #1b1c1d;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
      }

      .summary-table tbody tr:last-child td {
        border-bottom: none;
      }

      .summary-table tbody tr:hover {
        background-color: #f8fafc;
      }

      .bold-row td {
        font-weight: 600;
        background-color: #f9fafb;
      }

      /* Dark mode */
      :host-context(body.dark-theme) .summary-table-wrapper {
        background: #1a2733;
      }
      :host-context(body.dark-theme) .summary-table-container {
        border-color: rgba(42, 63, 80, 0.6);
      }
      :host-context(body.dark-theme) .summary-table thead tr {
        background-color: #1e2d3a;
        border-bottom-color: rgba(42, 63, 80, 0.6);
      }
      :host-context(body.dark-theme) .summary-table th {
        color: #8899a6;
      }
      :host-context(body.dark-theme) .summary-table td {
        color: #e0e6ed;
        border-bottom-color: rgba(42, 63, 80, 0.4);
      }
      :host-context(body.dark-theme) .summary-table tbody tr:hover {
        background-color: #233544;
      }
      :host-context(body.dark-theme) .bold-row td {
        background-color: #1e2d3a;
      }
    `,
  ],
  imports: [CommonModule],
  standalone: true,
})
export class SummaryDialog {
  @Input() data: any[] = [];
  @Output() closed = new EventEmitter<void>();

  closeDialog() {
    this.closed.emit();
  }
}
