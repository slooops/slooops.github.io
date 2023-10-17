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
    this.last_index = this.info.substring(0, 200).lastIndexOf(' ');
    if (this.last_index > 200) this.last_index = 200;
    this.counter = this.last_index;
  }

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
    'During Phase 1, FCC will continue to consolidate automatically at the top of the hour until 6AM when the automatic consolidations are placed ' +
    'on hold. Around 6AM, Phase 1 is expected to complete, and then Phase 2 begins (VT processing). The FCC consolidation is on hold until the ' +
    'completion of Phase 2, when IT triggers a manual consolidation. ' +
    'If the processing completes within 5 minutes of the hour, the data will not be reflected until the following FCC refresh.';

  toggleSkil() {
    if (this.counter < 201) {
      this.counter = this.info.length;
      this.showTxt = 'Show less';
    } else {
      this.counter = this.last_index;
      this.showTxt = 'Show More';
    }
  }

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

  dataSource = [
    {
      Entity: 'US',
      Invoicing: 'Yet to start',
      'Standard AR Posting': 'Yet to start',
      'Custom Revenue Posting': 'Yet to start',
      'Deferrals Posting': 'Yet to start',
      'Intercompany Posting': 'Yet to start',
      Status: 'Yet to start',
      'Loaded into FCC': 'Yet to start',
    },
    {
      Entity: 'UKH',
      Invoicing: '1:33',
      'Standard AR Posting': 'In progress',
      'Custom Revenue Posting': 'Yet to start',
      'Deferrals Posting': 'Yet to start',
      'Intercompany Posting': 'Yet to start',
      Status: 'In progress',
      'Loaded into FCC': 'Yet to start',
    },
    {
      Entity: 'India',
      Invoicing: '1:09',
      'Standard AR Posting': '1:42',
      'Custom Revenue Posting': '1:50',
      'Deferrals Posting': '1:55',
      'Intercompany Posting': 'In Progress',
      Status: 'In Progress',
      'Loaded into FCC': 'Yet to start',
    },
    {
      Entity: 'Brazil',
      Invoicing: '0:55',
      'Standard AR Posting': '1:56',
      'Custom Revenue Posting': '1:56',
      'Deferrals Posting': '1:58',
      'Intercompany Posting': '2:15',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Mexico',
      Invoicing: '1:05',
      'Standard AR Posting': 'N/A',
      'Custom Revenue Posting': 'N/A',
      'Deferrals Posting': '1:17',
      'Intercompany Posting': '1:30',
      Status: 'Completed',
      'Loaded into FCC': 'N/A',
    },
    {
      Entity: 'China Panyu',
      Invoicing: '0:57',
      'Standard AR Posting': '1:50',
      'Custom Revenue Posting': 'N/A',
      'Deferrals Posting': '1:52',
      'Intercompany Posting': '1:55',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Australia',
      Invoicing: '0:53',
      'Standard AR Posting': '1:34',
      'Custom Revenue Posting': '1:34',
      'Deferrals Posting': '1:44',
      'Intercompany Posting': '1:55',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'China',
      Invoicing: '0:53',
      'Standard AR Posting': '1:27',
      'Custom Revenue Posting': '1:27',
      'Deferrals Posting': '1:30',
      'Intercompany Posting': '1:35',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Canada',
      Invoicing: '1:04',
      'Standard AR Posting': '1:40',
      'Custom Revenue Posting': '1:40',
      'Deferrals Posting': '1:45',
      'Intercompany Posting': '1:50',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Japan',
      Invoicing: '0:52',
      'Standard AR Posting': '1:27',
      'Custom Revenue Posting': '1:27',
      'Deferrals Posting': '1:30',
      'Intercompany Posting': '1:35',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Italy',
      Invoicing: '0:54',
      'Standard AR Posting': '1:34',
      'Custom Revenue Posting': '1:34',
      'Deferrals Posting': '1:49',
      'Intercompany Posting': '1:56',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'South Africa',
      Invoicing: '1:06',
      'Standard AR Posting': '1:34',
      'Custom Revenue Posting': '1:34',
      'Deferrals Posting': '1:49',
      'Intercompany Posting': '2:05',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'South Korea',
      Invoicing: '0:54',
      'Standard AR Posting': '1:50',
      'Custom Revenue Posting': '1:50',
      'Deferrals Posting': '1:55',
      'Intercompany Posting': '1:57',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'Germany',
      Invoicing: '1:34',
      'Standard AR Posting': '1:37',
      'Custom Revenue Posting': 'N/A',
      'Deferrals Posting': '1:40',
      'Intercompany Posting': '1:57',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
    {
      Entity: 'NL',
      Invoicing: '0:57',
      'Standard AR Posting': '1:34',
      'Custom Revenue Posting': '1:34',
      'Deferrals Posting': '1:42',
      'Intercompany Posting': '1:48',
      Status: 'Completed',
      'Loaded into FCC': 'Yes',
    },
  ];
}
