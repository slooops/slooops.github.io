import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { CmsModalComponent } from './cms-modal/cms-modal.component';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ExportToExcelService } from '../providers/export-to-excel.service';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.css'],
  providers: [DestroyManager],
})
export class CmsComponent implements OnInit {
  protected http: ApiHttpService;
  //refreshInterval = 300000; //ms
  isModalOpen = false;
  isOverflowing = false;
  sftpRefresh: string;
  apiStatusRefresh: string;

  @ViewChild('scrollableContainer') scrollableContainer!: ElementRef; // Ref to the scrollable div

  collectionsErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource(
    []
  );
  reconciliationErrorExtract: MatTableDataSource<any> = new MatTableDataSource(
    []
  );
  latestRequestStatus: MatTableDataSource<any> = new MatTableDataSource([]);

  interfaceErrors: MatTableDataSource<any> = new MatTableDataSource([]);
  unpostedSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);
  receiptErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);

  apiStatus: any[] = [];
  sftpStatus: any[] = [];
  ctmStatus: any[] = [];
  ctmDetails: any[] = [];
  boomiStatus: any[] = [];
  boomiDetails: any[] = [];
  boomiStatusFromHr: any[] = [];
  boomiDetailsFromHr: any[] = [];

  extractCount: number;
  totalReconciliationError: number;
  appCoreMismatchErrorCount: number;

  interfaceErrorCount: number;
  unpostedAmount: {
    value: string;
    isMillions: boolean;
    isRounded: boolean;
  } | null = null;
  unappliedAmount: {
    value: string;
    isMillions: boolean;
    isRounded: boolean;
  } | null = null;

  colorMapping: { [key: string]: string } = {
    BLUE: '#049fd9',
    RED: '#ef2828',
    YELLOW: '#efc920',
    GREEN: '#12e370',
  };

  collectionsErrorSummaryDisplayedColumns: string[] = ['EXTRACT_TYPE', 'COUNT'];
  reconciliationErrorExtractDisplayedColumns: string[] = [
    'EXTRACT_NAME',
    'TOTAL_MISMATCH_COUNT',
  ];

  latestRequestStatusDisplayedColumns: string[] = [
    'EXTRACT_NAME',
    // 'FILE_NAME',
    // 'FILE_REC_COUNT',
    'SOURCE_TYPE',
    'STATUS',
    // 'STG_REC_COUNT',
    // 'TOTAL_ELIGIBLE_REC_COUNT',
  ];

  interfaceErrorsDisplayedColumns: string[] = ['OPERATING_UNIT', 'TOTAL'];
  unpostedSummaryDisplayedColumns: string[] = [
    'OPERATING_UNIT',
    'NO_OF_PAYMENTS',
    'REMITTANCE_AMOUNT_USD',
  ];
  receiptErrorSummaryDisplayedColumns: string[] = [
    'ORG_ID',
    'BAI2_FILE_NAME',
    'DEPOSIT_DATE',
    'RECEIPT_DATE',
    'RECEIPT_AMOUNT',
  ];

  //for the latest request status modal
  extractDetailsDisplayedColumns: string[] = [
    'BOOMI_STATUS',
    'CTM_STATUS',
    'EXTRACT_NAME',
    'FILE_NAME',
    'FILE_REC_COUNT',
    'HRC_COUNT',
    'REQUEST_ID',
    'STG_REC_COUNT',
    'TOTAL_ELIGIBLE_REC_COUNT',
  ];

  constructor(
    http: ApiHttpService,
    public dialog: MatDialog,
    private destroyManager: DestroyManager,
    private exportToExcelService: ExportToExcelService
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    this.checkOverflow();
    this.getUnpostedSummary();
    this.getCtmStatus();
    this.getCtmDetails();
    this.getBoomiStatus();
    this.getBoomiDetails();
    this.getExtractCount();
    this.getUnpostedAmount();
    this.getInterfaceErrorCount();
    this.getCollectionsErrorSummary();
    this.getLatestRequestStatus();
    this.getInterfaceErrors();
    this.getApiStatus();
    this.getBoomiStatusFromHr();
    this.getBoomiDetailsFromHr();
    this.getUnappliedErrorSummary();
    this.getTotalUnappliedAmount();
    this.getTotalReconciliationError();
    this.getAppCoreMismatchErrorCount();
    this.getSftpStatus();
    this.refreshFileStatus();
    this.getReconciliationErrorExtract();
  }

  // collections widgets
  getExtractCount() {
    this.getEndpointData('extractCount').subscribe((data: any) => {
      this.extractCount = data[0].TOTAL_DML_ERRORS;
    });
  }

  getTotalReconciliationError() {
    this.getEndpointData('totalReconciliationError').subscribe((data: any) => {
      this.totalReconciliationError = data[0].RECONCILIATION_ERROR;
    });
  }

  getAppCoreMismatchErrorCount() {
    this.getEndpointData('coreAppLayerErrorCount').subscribe((data: any) => {
      this.appCoreMismatchErrorCount = data[0].MISMATCH;
    });
  }

  // collections tables
  // this is extract status apparently?
  getCollectionsErrorSummary() {
    this.getEndpointData('collectionsErrorSummary').subscribe((data: any) => {
      if (data && Array.isArray(data)) {
        // Rename the column 'COUNT(*)' to 'COUNT'
        const mappedData = data.map((item: any) => ({
          COUNT: item['COUNT(*)'],
          EXTRACT_TYPE: item.EXTRACT_TYPE,
        }));
        this.collectionsErrorSummaryData.data = mappedData;
      } else {
        this.collectionsErrorSummaryData.data = [];
      }
    });
  }

  getReconciliationErrorExtract() {
    this.getEndpointData('reconErrCountExtract').subscribe((data: any) => {
      this.reconciliationErrorExtract.data = data;
    });
  }

  getLatestRequestStatus() {
    this.getEndpointData('latestRequestStatus').subscribe((data: any) => {
      this.latestRequestStatus.data = data;
    });
  }

  //cash app widgets
  getInterfaceErrorCount() {
    this.getEndpointData('interfaceErrorCountInXHrs').subscribe((data: any) => {
      this.interfaceErrorCount = data[0]?.INTERFACE_ERROR_COUNT;
    });
  }

  getTotalUnappliedAmount() {
    this.getEndpointData('totalUnappliedAmount').subscribe((data: any) => {
      const amount = data[0]?.UNAPPLIED_AMOUNT;
      this.unappliedAmount = amount ? this.formatAmount(amount) : null;
    });
  }

  getUnpostedAmount() {
    this.getEndpointData('unpostedTotalAmount').subscribe((data: any) => {
      const amount = data[0]?.TOTAL_UNPOSTED_AMOUNT;
      this.unpostedAmount = amount ? this.formatAmount(amount) : null;
    });
  }

  //cash app tables
  getInterfaceErrors() {
    this.getEndpointData('interfaceErrors').subscribe((data: any) => {
      this.interfaceErrors.data = data;
    });
  }

  getUnpostedSummary() {
    // this.unpostedSummaryLoading = true;
    this.getEndpointData('unpostedSummary').subscribe((data: any) => {
      this.unpostedSummaryData.data = data;
    });
  }

  getUnappliedErrorSummary() {
    this.getEndpointData('unappliedErrorSummary').subscribe((data: any) => {
      this.receiptErrorSummaryData.data = data;
    });
  }

  // top bar app status and api status
  getApiStatus() {
    this.apiStatusRefresh = `Last Updated: ...`;
    this.getEndpointData('apiStatus').subscribe((data: any) => {
      this.apiStatus = data;
      this.apiStatusRefresh = `Last Updated: ${new Date().toLocaleString()}`;
    });
  }

  getSftpStatus() {
    this.sftpRefresh = `Last Updated: ...`;

    this.getEndpointData('sftpStatus').subscribe(
      (data: any) => {
        this.sftpStatus = this.processData(data);
        this.sftpRefresh = `Last Updated: ${new Date().toLocaleString()}`;
      },
      (error) => {
        console.error('Error loading SFTP status:', error);
      }
    );
  }

  getCtmStatus() {
    this.getEndpointData('ctmStatus').subscribe((data: any) => {
      this.ctmStatus = data;
    });
  }

  getCtmDetails() {
    this.getEndpointData('ctmDetails').subscribe((data: any) => {
      this.ctmDetails = data;
    });
  }

  getBoomiStatus() {
    this.getEndpointData('boomiStatus').subscribe((data: any) => {
      this.boomiStatus = data;
    });
  }

  getBoomiDetails() {
    this.getEndpointData('boomiDetails').subscribe((data: any) => {
      this.boomiDetails = data;
    });
  }

  getBoomiStatusFromHr() {
    this.getEndpointData('boomiStatusFromHr').subscribe((data: any) => {
      this.boomiStatusFromHr = data;
    });
  }

  getBoomiDetailsFromHr() {
    this.getEndpointData('boomiDetailsFromHr').subscribe((data: any) => {
      this.boomiDetailsFromHr = data;
    });
  }

  getColorCode(colorName: string): string {
    return this.colorMapping[colorName] || '#6993a2a1'; // Default to offline color if not found
  }

  getEndpointData(queryParam: string): Observable<any> {
    let uniqueId = Date.now();
    //let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;
    let endpoint = 'cms/getdata';
    let url = `${endpoint}?query=${queryParam}`;
    //let url = `${endpoint}`;

    return this.http.get(url, this.destroyManager);

    // const polling$ = interval(this.refreshInterval).pipe(
    //   startWith(0), // Emit initial value immediately
    //   switchMap(() => this.http.get(url))
    // );
    // return polling$;
  }

  refreshFileStatus() {
    this.getSftpStatus();
  }

  refreshApiStatus() {
    this.getApiStatus();
  }

  getLastUpdate(extractName: string): string {
    const ctmUpdate =
      this.ctmDetails.find((item) => item.EXTRACT_NAME === extractName)
        ?.LAST_UPDATE_DATE || 'N/A';
    const boomiUpdate =
      this.boomiDetails.find((item) => item.EXTRACT_NAME === extractName)
        ?.LAST_UPDATE_DATE || 'N/A';
    // Use the more recent update
    return new Date(ctmUpdate) > new Date(boomiUpdate)
      ? ctmUpdate
      : boomiUpdate;
  }

  getStatus(extractName: string): string {
    const ctmStatus =
      this.ctmDetails.find((item) => item.EXTRACT_NAME === extractName)
        ?.STATUS || 'N/A';
    const boomiStatus =
      this.boomiDetails.find((item) => item.EXTRACT_NAME === extractName)
        ?.STATUS || 'N/A';
    // Prefer CTM status, if it exists, otherwise use Boomi status
    return ctmStatus !== 'N/A' ? ctmStatus : boomiStatus;
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    this.exportToExcelService.exportTableToExcel(data, sheetName, filename);
  }

  openFullTableModal() {
    this.dialog.open(CmsModalComponent, {
      width: '80%',
      data: this.latestRequestStatus.data,
    });
  }

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = [
      'data',
      'file',
      'no',
      'unit',
      'cash',
      'citi',
      'tech',
      'home',
      'non',
      'apps',
    ];

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

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isHighRadiusModalOpen = false;
    this.isHighRadiusToCG1ModalOpen = false;
  }

  isHighRadiusModalOpen = false;
  isHighRadiusToCG1ModalOpen = false;

  openHighRadiusModal() {
    this.isHighRadiusModalOpen = true;
  }

  openHighRadiusToCG1Modal() {
    this.isHighRadiusToCG1ModalOpen = true;
  }

  processData(data: any[]): any[] {
    return data[0]?.['SFTP Status']?.CiscoSFTPUnprocessedFiles || [];
  }

  formatAmount(amount: number): {
    value: string;
    isMillions: boolean;
    isRounded: boolean;
  } {
    let value: string;
    let isMillions = false;
    let isRounded = false;

    if (amount >= 1_000_000) {
      isMillions = true;
      const millions = amount / 1_000_000;
      if (millions < 10) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (millions < 100) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else if (millions < 1000) {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 1 });
      } else {
        value = millions.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
    } else {
      // Logic for amounts less than 1 million
      if (amount < 10_000) {
        value = amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
      } else {
        isRounded = true;
        value = amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
    }

    return { value, isMillions, isRounded };
  }

  formatToPST(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  @HostListener('window:resize', [])
  onResize() {
    this.checkOverflow();
  }

  checkOverflow() {
    if (this.scrollableContainer && this.scrollableContainer.nativeElement) {
      const element = this.scrollableContainer.nativeElement;
      this.isOverflowing = element.scrollWidth > element.clientWidth;
    }
  }

  navigateToDetails(extractType: string): void {
    const url = `/cms-details?extractType=${encodeURIComponent(extractType)}`;
    window.open(url, '_blank');
  }

  openDetailsPage(directory: string, extract: string, unprocessedFiles: any[]) {
    const dataToPass = unprocessedFiles.map((f) => ({
      ...f,
      directory,
      extract,
    }));

    localStorage.setItem('sftpDetails', JSON.stringify(dataToPass));

    window.open('/cms-sftp-details', '_blank');
  }
}
