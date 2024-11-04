import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';

@Component({
  selector: 'app-custom-revenue',
  templateUrl: './custom-revenue.component.html',
  styleUrl: './custom-revenue.component.css',
})
export class CustomRevenueComponent implements OnInit {
  constructor(private http: ApiHttpService, private dataService: DataService) {}
  ngOnInit(): void {}
}
