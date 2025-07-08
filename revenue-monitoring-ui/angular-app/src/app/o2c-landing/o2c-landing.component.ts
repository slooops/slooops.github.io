import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-o2c-landing',
  templateUrl: './o2c-landing.component.html',
  styleUrls: ['./o2c-landing.component.css'],
})
export class O2cLandingComponent implements OnInit {
  searchValue: string = '';
  searchType: string = 'order'; // default

  o2cConnectorData: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  dummyData1 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 4,
    },
    {
      INCIDENT_TYPE: 'Manual Entry',
      INCIDENT_COUNT: 3,
      INCIDENT_VALUE: 2,
    },
    {
      INCIDENT_TYPE: 'Data Entry',
      INCIDENT_COUNT: 2,
      INCIDENT_VALUE: 1.2,
    },
  ];

  dummyData2 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 2.1,
    },
  ];

  dummyData3 = [
    { INCIDENT_TYPE: 'Order Entry', INCIDENT_COUNT: 50, INCIDENT_VALUE: 1.4 },
    { INCIDENT_TYPE: 'Manual Entry', INCIDENT_COUNT: 3, INCIDENT_VALUE: 0.9 },
  ];

  dummyData4 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 2.1,
    },
    {
      INCIDENT_TYPE: 'Manual Entry',
      INCIDENT_COUNT: 3,
      INCIDENT_VALUE: 1.5,
    },
    {
      INCIDENT_TYPE: 'Data Entry',
      INCIDENT_COUNT: 2,
      INCIDENT_VALUE: 0.8,
    },
    {
      INCIDENT_TYPE: 'System Error',
      INCIDENT_COUNT: 1,
      INCIDENT_VALUE: 0.3,
    },
  ];

  dummyData5 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 2.1,
    },
  ];
  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {});

    // Dummy data
  }

  isOpen: boolean[] = Array(7).fill(true);

  toggleAccordion(index: number): void {
    this.isOpen[index] = !this.isOpen[index];
  }

  legendMap: {
    [canvasId: string]: {
      type: string;
      count: number;
      value: number;
      color: string;
    }[];
  } = {};
}
