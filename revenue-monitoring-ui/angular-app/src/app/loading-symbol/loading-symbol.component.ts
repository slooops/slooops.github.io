import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-symbol',
  templateUrl: './loading-symbol.component.html',
  styleUrls: ['./loading-symbol.component.css'],
  standalone: true,
  host: { 'data-component': 'loading-symbol' }, // Prevents ID collision warning
})
export class LoadingSymbolComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
