import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor ( ) {}
  title = 'Revenue Accruals Dashboard';
  inline = true;
  alignment: 'left' | 'right' | 'center' = 'right';
  tabIndex = 0;
}
