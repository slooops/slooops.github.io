import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.css'],
})
export class CmsComponent implements OnInit {
  protected http: ApiHttpService;
  //refreshInterval = 300000; //ms

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getUnPostedSummary();
    //this.getUnPostedDetails(); //query taking time to execute
    this.getReceiptErrorSummary();
    //this.getReceiptErrorDetails(); //query taking time to execute
    this.getCtmStatus();
    this.getCtmDetails();
    this.getBoomiStatus();
    this.getBoomiDetails();
  }

  getUnPostedSummary() {
    //cms/getdata?query=unpostedSummary
    this.getEndpointData('unpostedSummary').subscribe((data: any) => {
      console.log(data);
    });
  }

  getUnPostedDetails() {
    this.getEndpointData('unpostedDetails').subscribe((data: any) => {
      console.log(data);
    });
  }

  getReceiptErrorSummary() {
    this.getEndpointData('receiptErrorSummary').subscribe((data: any) => {
      console.log(data);
    });
  }

  getReceiptErrorDetails() {
    this.getEndpointData('receiptErrorDetails').subscribe((data: any) => {
      console.log(data);
    });
  }

  getCtmStatus() {
    this.getEndpointData('ctmStatus').subscribe((data: any) => {
      console.log(data);
    });
  }

  getCtmDetails() {
    this.getEndpointData('ctmDetails').subscribe((data: any) => {
      console.log(data);
    });
  }

  getBoomiStatus() {
    this.getEndpointData('boomiStatus').subscribe((data: any) => {
      console.log(data);
    });
  }

  getBoomiDetails() {
    this.getEndpointData('boomiDetails').subscribe((data: any) => {
      console.log(data);
    });
  }

  getEndpointData(queryParam: string): Observable<any> {
    let uniqueId = Date.now();
    //let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;
    let endpoint = 'cms/getdata';
    let url = `${endpoint}?query=${queryParam}`;
    //let url = `${endpoint}`;

    return this.http.get(url);

    // const polling$ = interval(this.refreshInterval).pipe(
    //   startWith(0), // Emit initial value immediately
    //   switchMap(() => this.http.get(url))
    // );
    // return polling$;
  }
}
