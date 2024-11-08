import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-accruals',
  templateUrl: './accruals.component.html',
  styleUrl: './accruals.component.css',
})
export class AccrualsComponent implements OnInit {
  constructor(private http: ApiHttpService) {}

  ngOnInit() {
    console.log('AccrualsComponent initialized');
    this.getAccrualsSummary();
    this.getAccrualsDetails();
  }

  getAccrualsSummary(): void {
    console.log('Making HTTP GET request to accruals-summary');
    this.http.get('accruals-summary').subscribe(
      (data: any) => {
        console.log('HTTP GET request successful');
        console.log('accrualsSummary:', data);
      },
      (error: any) => {
        console.error('HTTP GET request failed', error);
      },
      () => {
        console.log('HTTP GET request completed');
      }
    );
  }

  getAccrualsDetails(): void {
    console.log('Making HTTP GET request to accruals-details');
    this.http.get('accruals-details').subscribe((data: any) => {
      console.log('accrualsDetails:', data);
    });
  }
}
