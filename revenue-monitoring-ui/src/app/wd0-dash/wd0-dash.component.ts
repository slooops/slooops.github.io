import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-wd0-dash',
  templateUrl: './wd0-dash.component.html',
  styleUrls: ['./wd0-dash.component.css'],
})
export class Wd0DashComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  scrollToID(HTMLID: string): void {
    document.getElementById(HTMLID).scrollIntoView();
  }
}
