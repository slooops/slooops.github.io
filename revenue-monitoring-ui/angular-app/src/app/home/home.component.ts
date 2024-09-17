import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// import {
//   AccessorModule,
//   HbrButton,
//   HbrInput,
// } from '@harbor/elements-angular-standalone';
// import {
//   emptyState,
//   magnifyingGlass,
//   info,
//   alertsPositiveLarge,
// } from '@harbor/elements/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  navigateTo(page: string): void {
    this.router.navigate([page]);
  }
}
