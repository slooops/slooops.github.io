import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-nav',
  templateUrl: './o2c-nav.component.html',
  styleUrls: ['./o2c-nav.component.css'],
})
export class O2cNavComponent {
  constructor(private router: Router) {}
  goToO2cHome() {
    this.router.navigate(['/o2c-demo'], {});
    console.log('Navigating to O2C Home');
  }
}
