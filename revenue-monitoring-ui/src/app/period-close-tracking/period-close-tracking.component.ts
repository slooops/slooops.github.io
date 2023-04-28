import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from '../providers/http.service';
import { CuiTableColumnOption, CuiTableOptions } from '@cisco-ngx/cui-components';
import { map } from 'rxjs';
import { MatSelect } from '@angular/material/select';


@Component({
  selector: 'app-period-close-tracking',
  templateUrl: './period-close-tracking.component.html',
  styleUrls: ['./period-close-tracking.component.css']
})
export class PeriodCloseTrackingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
