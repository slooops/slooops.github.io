import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  loading: boolean = false;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.isLoading().subscribe((loading) => {
      this.loading = loading;
    });
  }
}
