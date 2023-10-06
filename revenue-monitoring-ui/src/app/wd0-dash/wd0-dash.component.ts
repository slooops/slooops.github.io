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
    //for read more/less section
    this.last_index = this.info.substring(0, 150).lastIndexOf(' ');
    if (this.last_index > 150) this.last_index = 150;
    this.counter = this.last_index;
  }

  //to display data in table
  templateObject = Object;

  //for read more/less section
  last_index = 150;
  counter = 150;
  firstCount = 150;
  showTxt = 'Show More';

  info =
    'Final auto-invoicing run on CG1PRD: All countries start processing concurrently and in the following sequence: ' +
    '1. Invoicing,  2. Receivables Posting,  3. Revenue Posting in NGCCRM (Next Generation Commit Compliance and Revenue Management, Deferred revenue posting) and JEs in CFNPRD. ' +
    "Each country processes independently of one another. Given the higher volume of transactions, US 020 is typically last to complete the 'Buy/Sell AR Close' phase. " +
    'All Posting are on CFNPRD. ' +
    'During Phase 1, FCC will continue to consolidate automatically at the top of the hour until 6AM when the automatic consolidations are placed ' +
    'on hold. Around 6AM, Phase 1 is expected to complete, and then Phase 2 begins (VT processing). The FCC consolidation is on hold until the ' +
    'completion of Phase 2, when IT triggers a manual consolidation.' +
    '*If the processing completes within 5 minutes of the hour, the data will not be reflected until the following FCC refresh.';

  toggleSkil() {
    if (this.counter < 151) {
      this.counter = this.info.length;
      this.showTxt = 'Show less';
    } else {
      this.counter = this.last_index;
      this.showTxt = 'Show More';
    }
  }

  showCommentSave: boolean = false;

  updateComments() {}

  displayedColumns: string[] = [
    'Entity',
    'Invoicing',
    'Receivables Posting',
    'Revenue Posting',
    'Intercompany Posting',
    'Status',
    '*Loaded into FCC',
  ];

  dataSource = [
    {
      Entity: 'US',
      Invoicing: '-',
      'Receivables Posting': '-',
      'Revenue Posting': '-',
      'Intercompany Posting': '-',
      Status: 'Yet to start',
      '*Loaded into FCC': '-',
    },
    {
      Entity: 'UKH',
      Invoicing: '1:33',
      'Receivables Posting': '-',
      'Revenue Posting': '-',
      'Intercompany Posting': '-',
      Status: 'In Progress',
      '*Loaded into FCC': '-',
    },
    {
      Entity: 'India',
      Invoicing: '1:09',
      'Receivables Posting': '1:42',
      'Revenue Posting': '1:50',
      'Intercompany Posting': '1:55',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Brazil',
      Invoicing: '0:55',
      'Receivables Posting': '1:56',
      'Revenue Posting': '1:56',
      'Intercompany Posting': '2:15',
      Status: 'Delayed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Mexico',
      Invoicing: '1:05',
      'Receivables Posting': 'N/A',
      'Revenue Posting': 'N/A',
      'Intercompany Posting': '1:30',
      Status: 'Completed',
      '*Loaded into FCC': 'N/A',
    },
    {
      Entity: 'China Panyu',
      Invoicing: '0:57',
      'Receivables Posting': '1:50',
      'Revenue Posting': 'N/A',
      'Intercompany Posting': '1:55',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Australia',
      Invoicing: '0:53',
      'Receivables Posting': '1:34',
      'Revenue Posting': '1:34',
      'Intercompany Posting': '1:55',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'China',
      Invoicing: '0:53',
      'Receivables Posting': '1:27',
      'Revenue Posting': '1:27',
      'Intercompany Posting': '1:35',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Canada',
      Invoicing: '1:04',
      'Receivables Posting': '1:40',
      'Revenue Posting': '1:40',
      'Intercompany Posting': '1:50',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Japan',
      Invoicing: '0:52',
      'Receivables Posting': '1:27',
      'Revenue Posting': '1:27',
      'Intercompany Posting': '1:35',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Italy',
      Invoicing: '0:54',
      'Receivables Posting': '1:34',
      'Revenue Posting': '1:34',
      'Intercompany Posting': '1:56',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'South Africa',
      Invoicing: '1:06',
      'Receivables Posting': '1:34',
      'Revenue Posting': '1:34',
      'Intercompany Posting': '2:05',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'South Korea',
      Invoicing: '0:54',
      'Receivables Posting': '1:50',
      'Revenue Posting': '1:50',
      'Intercompany Posting': '1:57',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Germany',
      Invoicing: '1:34',
      'Receivables Posting': '1:37',
      'Revenue Posting': 'N/A',
      'Intercompany Posting': '1:57',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
    {
      Entity: 'NL',
      Invoicing: '0:57',
      'Receivables Posting': '1:34',
      'Revenue Posting': '1:34',
      'Intercompany Posting': '1:48',
      Status: 'Completed',
      '*Loaded into FCC': 'Yes',
    },
  ];
}
