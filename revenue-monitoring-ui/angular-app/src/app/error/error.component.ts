import { Component, HostBinding, OnInit } from '@angular/core';
import { ThemeService } from '../providers/theme.service';

@Component({
  selector: 'app-error',
  template: `
    <div class="image-container">
      <img src="assets/thumbnails/disconnected.svg" alt="Access Restricted" />
    </div>

    <div class="error-page">
      <h1 class="error-title"><b>Access Restricted</b></h1>
      <p class="error-text">
        If you need access to this dashboard, please request it from the Invoice
        to Cash team.
      </p>
    </div>
  `,
  styleUrls: ['./error.component.scss'],
  standalone: true,
  imports: [],
})
export class ErrorComponent implements OnInit {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }
  constructor(public themeService: ThemeService) {}
  ngOnInit(): void {}
}
