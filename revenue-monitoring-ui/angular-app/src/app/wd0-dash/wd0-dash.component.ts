import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MenuService } from '../providers/menu.service';

@Component({
    selector: 'app-wd0-dash',
    templateUrl: './wd0-dash.component.html',
    styleUrls: ['./wd0-dash.component.css'],
    providers: [DestroyManager],
    standalone: false
})
export class Wd0DashComponent implements OnInit {
  protected http: ApiHttpService;
  refreshInterval = 300000; //ms
  timeNow: any;
  expectedStartTime: String = '';
  expectedEndTime: String = '';
  actualStartTime: String = '';
  actualEndTime: String = '';
  elimStatConsExpectedEndTime: String = '';
  elimStatConsActualEndTime: String = '';
  periodName: String = '';
  quarter: String = '';
  wd0ArMidCloseTableData: any[] = [];
  expectedStartDate: Date;
  expectedEndDate: Date;
  actualStartDate: Date;
  actualEndDate: Date;

  //to display data in table
  templateObject = Object;

  //for read more/less section
  last_index = 200;
  counter = 200;
  firstCount = 200;
  showTxt = 'Show More';

  info =
    'Final auto-invoicing run on CG1PRD: All countries start processing concurrently and in the following sequence: ' +
    '1. Invoicing,  2. Standard AR Posting,  3. Custom Revenue Posting 4. Deferrals Posting, 5. Intercompany Posting and JEs in CFNPRD. ' +
    "Each country processes independently of one another. Given the higher volume of transactions, US 020 is typically last to complete the 'Buy/Sell AR Close' phase. " +
    'All Posting are on CFNPRD. ' +
    'If the processing completes within 5 minutes of the hour, the data will not be reflected until the following FCC refresh.';

  displayedColumns: string[] = [
    'Entity',
    'Invoicing',
    'Standard AR Posting',
    'Custom Revenue Posting',
    'Deferrals Posting',
    'Intercompany Posting',
    'Status',
    'Loaded into FCC',
  ];

  constructor(
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private menuService: MenuService
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    this.setReadMoreOrLessSection();
    this.getPeriodQuarterStartEndTime();
    this.getCurrentTime();
    this.getWd0ArCloseStatus();
    // this.menuService.updateMenuItems([
    //   {
    //     label: 'Large Deal Tracker',
    //     route: '/large-deal-tracker',
    //     role: ['ADMIN', 'LARGE_DEAL'],
    //   },
    //   {
    //     label: 'WD0',
    //     route: '/wd0',
    //     role: ['ADMIN', 'WD0'],
    //   },
    //   {
    //     label: 'Mid Close Volumes',
    //     route: '/midclose-volumes',
    //     role: ['ADMIN', 'MIDCLOSE_VOLUMES'],
    //   },
    // ]);
  }

  //for read more/less section
  toggleSkil() {
    if (this.counter < 201) {
      this.counter = this.info.length;
      this.showTxt = 'Show less';
    } else {
      this.counter = this.last_index;
      this.showTxt = 'Show More';
    }
  }

  //for read more/less section
  setReadMoreOrLessSection() {
    this.last_index = this.info.substring(0, 200).lastIndexOf(' ');
    if (this.last_index > 200) this.last_index = 200;
    this.counter = this.last_index;
  }

  getCurrentTime() {
    this.getEndpointData('dashboard-current-timestamp').subscribe(
      (data: any) => {
        this.timeNow = new Date(data['timeNow']).toLocaleString('en-us', {
          hour: 'numeric',
          minute: 'numeric',
        });
      }
    );
  }

  getWd0ArCloseStatus() {
    this.getEndpointData('wd0-ar-midclose-status').subscribe((data: any) => {
      this.wd0ArMidCloseTableData = [];

      data.forEach((row) => {
        let arMidCloseDataRowObj = {};
        arMidCloseDataRowObj['Entity'] = row['ENTITY'];
        arMidCloseDataRowObj['Invoicing'] = row['INVOICING_STATUS'];
        arMidCloseDataRowObj['Standard AR Posting'] =
          row['STANDARD_AR_POSTING'];
        arMidCloseDataRowObj['Custom Revenue Posting'] =
          row['CUSTOM_REVENUE_POSTING'];
        arMidCloseDataRowObj['Deferrals Posting'] = row['DEFERALS_POSTING'];
        arMidCloseDataRowObj['Intercompany Posting'] =
          row['INTERCOMPANY_POSTING'];
        arMidCloseDataRowObj['Status'] = row['EXECUTION_STATUS'];
        arMidCloseDataRowObj['Loaded into FCC'] = row['FCC_LOAD_STATUS'];
        this.wd0ArMidCloseTableData.push(arMidCloseDataRowObj);
      });
    });
  }

  getPeriodQuarterStartEndTime() {
    this.getEndpointData('wd0-ar-midclose-header-data').subscribe(
      (data: any) => {
        data.forEach((row) => {
          this.periodName = row['PERIOD_NAME'];
          this.quarter = row['QUARTER'];

          this.expectedStartTime = this.extractTimeFromDate(
            row['EXPECTED_START_TIME']
          );
          this.expectedStartDate = new Date(row['EXPECTED_START_TIME']);

          this.expectedEndTime = this.extractTimeFromDate(
            row['EXPECTED_END_TIME']
          );
          this.expectedEndDate = new Date(row['EXPECTED_END_TIME']);

          this.actualStartTime = this.extractTimeFromDate(
            row['ACTUAL_START_TIME']
          );
          this.actualStartDate = new Date(row['ACTUAL_START_TIME']);

          this.actualEndTime = this.extractTimeFromDate(row['ACTUAL_END_TIME']);
          this.actualEndDate = new Date(row['ACTUAL_END_TIME']);

          this.elimStatConsExpectedEndTime = this.extractTimeFromDate(
            row['ELIM_STAT_CONS_EXPECTED_DATE']
          );
          this.elimStatConsActualEndTime = this.extractTimeFromDate(
            row['ELIM_STAT_CONS_ACTUAL_DATE']
          );
        });
      }
    );
  }

  extractTimeFromDate(date: string) {
    if (null === date) {
      return '-';
    }

    let time = date.split('T')[1].split('.');
    let timeParts = time[0].split(':');
    let hours: string = '';
    let hourFormat: string = '';

    if (0 == parseInt(timeParts[0])) {
      hours = '00';
      hourFormat = 'AM';
    } else if (parseInt(timeParts[0]) < 12) {
      hours = timeParts[0];
      hourFormat = 'AM';
    } else if (parseInt(timeParts[0]) == 12) {
      hours = timeParts[0];
      hourFormat = 'PM';
    } else {
      hours = (parseInt(timeParts[0]) - 12).toString();
      hourFormat = 'PM';
    }
    return `${hours}:${timeParts[1]} ${hourFormat}`;
  }

  getEndpointData(endpoint: string): Observable<any> {
    let uniqueId = Date.now();
    let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;

    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.http.get(cacheBustingUrl, this.destroyManager))
    );
    return polling$;
  }
}
