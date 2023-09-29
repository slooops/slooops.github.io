import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-wd0-dash',
  templateUrl: './wd0-dash.component.html',
  styleUrls: ['./wd0-dash.component.css'],
})
export class Wd0DashComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.getCloseStatus();

    //for read more/less section
    this.last_index = this.info.substring(0, 140).lastIndexOf(' ');
    if (this.last_index > 140) this.last_index = 140;
    this.counter = this.last_index;
  }

  //to display data in table
  templateObject = Object;

  //status filter
  closeDefaultStatus: string[] = ['All'];
  statusList: string[] = [];
  closeStatuses = new FormControl(this.closeDefaultStatus);

  //for read more/less section
  last_index = 140;
  counter = 140;
  firstCount = 140;
  showTxt = 'Show More';

  info =
    'Final auto-invoicing run on CG1PRD: All countries start processing concurrently and in the following sequence: ' +
    '1. Invoicing,  2. Receivables Posting,  3. Revenue Posting in NGCCRM (Next Generation Commit Compliance and Revenue Management, Deferred revenue posting) and JEs in CFNPRD. ' +
    "Each country processes independently of one another. Given the higher volume of transactions, US 020 is typically last to complete the 'Buy/Sell AR Close' phase. " +
    'All Posting are on CFNPRD. ' +
    'During Phase 1, FCC will continue to consolidate automatically at the top of the hour until 6AM when the automatic consolidations are placed ' +
    'on hold. Around 6AM, Phase 1 is expected to complete, and then Phase 2 begins (VT processing). The FCC consolidation is on hold until the ' +
    'completion of Phase 2, when IT triggers a manual consolidation.' +
    '*If the processing completes within 5 minutes of the hour, the data will not be relfected until the following FCC refresh.';

  toggleSkil() {
    if (this.counter < 141) {
      this.counter = this.info.length;
      this.showTxt = 'Show less';
    } else {
      this.counter = this.last_index;
      this.showTxt = 'Show More';
    }
  }

  showCommentSave: boolean = false;
  statusChange() {}

  getCloseStatus() {
    this.statusList = [];
    this.statusList.push('All');
    this.statusList.push('Completed');
    this.statusList.push('Delayed');
    this.statusList.push('In progress');
    this.statusList.push('Yet to start');
    this.statusList.push('N/A');
  }

  updateComments() {}

  phase1DisplayedColumns: string[] = [
    'Entity',
    'Subprocess',
    'Gross Margin Impacting',
    //'Expected Completion',
    'Actual Completion',
    'Status',
    '*Loaded into FCC',
  ];

  testDataSource = [
    {
      Entity: 'India',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:09',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:42',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting (NGCCRM)',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:50',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:55',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'Brazil',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:55',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:56',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:56',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '2:05',
          Status: 'Delayed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    //////////////////////
    {
      Entity: 'Mexico',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:05',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        // {
        //   Subprocess: 'Receivables Posting',
        //   'Gross Margin Impacting': 'Yes',
        //   //'Expected Completion': 'N/A',
        //   'Actual Completion': 'N/A',
        //   Status: 'N/A',
        //   '*Loaded into FCC': 'N/A',
        // },
        // {
        //   Subprocess: 'Revenue Posting',
        //   'Gross Margin Impacting': 'Yes',
        //   //'Expected Completion': 'N/A',
        //   'Actual Completion': 'N/A',
        //   Status: 'N/A',
        //   '*Loaded into FCC': 'N/A',
        // },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:30',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'China Panyu',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:57',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:50',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        // {
        //   Subprocess: 'Revenue Posting',
        //   'Gross Margin Impacting': 'Yes',
        //   //'Expected Completion': 'N/A',
        //   'Actual Completion': 'N/A',
        //   Status: 'N/A',
        //   '*Loaded into FCC': 'N/A',
        // },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:55',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'Australia',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:53',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:40',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'China',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:55',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:27',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:27',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:35',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'Canada',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:04',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:40',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:40',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:50',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'Japan',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:52',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:27',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:27',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:35',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'Italy',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:53',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:56',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'South Africa',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:06',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '2:05',
          Status: 'Delayed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'South Korea',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:54',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:50',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:50',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:57',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'Germany',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        // {
        //   Subprocess: 'Revenue Posting',
        //   'Gross Margin Impacting': 'Yes',
        //   //'Expected Completion': 'N/A',
        //   'Actual Completion': 'N/A',
        //   Status: 'N/A',
        //   '*Loaded into FCC': 'N/A',
        // },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:42',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'NL',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '0:57',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:34',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:48',
          Status: 'Completed',
          '*Loaded into FCC': 'Yes',
        },
      ],
    },
    {
      Entity: 'UKH',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '1:33',
          Status: 'Completed',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '-',
          Status: 'In Progress',
          '*Loaded into FCC': '-',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '-',
          Status: 'Yet to start',
          '*Loaded into FCC': '-',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '-',
          Status: 'Yet to start',
          '*Loaded into FCC': '-',
        },
      ],
    },
    {
      Entity: 'US',
      Values: [
        {
          Subprocess: 'Invoicing',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '-',
          Status: 'Yet to start',
          '*Loaded into FCC': 'N/A',
        },
        {
          Subprocess: 'Receivables Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '-',
          Status: 'Yet to start',
          '*Loaded into FCC': '-',
        },
        {
          Subprocess: 'Revenue Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': '9:25',
          'Actual Completion': '-',
          Status: 'Yet to start',
          '*Loaded into FCC': '-',
        },
        {
          Subprocess: 'Intercompany Posting',
          'Gross Margin Impacting': 'Yes',
          //'Expected Completion': 'N/A',
          'Actual Completion': '-',
          Status: 'Yet to start',
          '*Loaded into FCC': '-',
        },
      ],
    },
  ];

  phase1DataSource = [
    {
      Entity: 'India',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:09',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:42',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting (NGCCRM)',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:50',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    // {
    //   Entity: 'Russia',
    //   Subprocess: 'Invoicing',
    //   'Gross Margin Impacting': 'Yes',
    //    //'Expected Completion': 'N/A',
    //   'Actual Completion': 'N/A',
    //   Status: 'N/A',
    //   '*Loaded into FCC': 'N/A',
    // },
    // {
    //   Entity: '',
    //   Subprocess: 'Receivables Posting',
    //   'Gross Margin Impacting': 'Yes',
    //    //'Expected Completion': 'N/A',
    //   'Actual Completion': 'N/A',
    //   Status: 'N/A',
    //   '*Loaded into FCC': 'N/A',
    // },
    // {
    //   Entity: '',
    //   Subprocess: 'Revenue Posting',
    //   'Gross Margin Impacting': 'Yes',
    //    //'Expected Completion': 'N/A',
    //   'Actual Completion': 'N/A',
    //   Status: 'N/A',
    //   '*Loaded into FCC': 'N/A',
    // },
    {
      Entity: 'Brazil',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:55',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:56',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:56',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Mexico',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:05',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': 'N/A',
      Status: 'N/A',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': 'N/A',
      Status: 'N/A',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: 'China Panyu',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:57',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:50',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': 'N/A',
      Status: 'N/A',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: 'Australia',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:53',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'China',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:55',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:27',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:27',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Canada',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:04',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:40',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:40',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Japan',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:52',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:27',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:27',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Italy',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:53',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'South Africa',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:06',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'South Korea',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:54',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:50',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:50',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Germany',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    // {
    //   Entity: '',
    //   Subprocess: 'Revenue Posting',
    //   'Gross Margin Impacting': 'Yes',
    //   //'Expected Completion': 'N/A',
    //   'Actual Completion': 'N/A',
    //   Status: 'N/A',
    //   '*Loaded into FCC': 'N/A',
    // },
    {
      Entity: 'NL',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '0:57',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:34',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'UKH',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '1:33',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '2:47',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '2:49',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'US',
      Subprocess: 'Invoicing',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '6:10',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: '',
      Subprocess: 'Receivables Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': 'N/A',
      'Actual Completion': '8:18',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: '',
      Subprocess: 'Revenue Posting',
      'Gross Margin Impacting': 'Yes',
      //'Expected Completion': '9:25',
      'Actual Completion': '9:25',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
  ];
}
