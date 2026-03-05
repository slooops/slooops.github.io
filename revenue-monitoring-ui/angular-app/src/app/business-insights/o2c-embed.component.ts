import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-o2c-embed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="o2c-embed-wrapper">
      <iframe
        class="o2c-embed-frame"
        title="O2C Experience"
        loading="lazy"
        [src]="trustedUrl"
        allowfullscreen
        referrerpolicy="no-referrer"
      ></iframe>
    </div>
  `,
  styles: [
    `
      .o2c-embed-wrapper {
        width: 100%;
        height: calc(100vh - 50px);
        display: flex;
        overflow: hidden;
      }

      .o2c-embed-frame {
        border: 0;
        width: 100%;
        flex: 1;
        background: #fff;
      }
    `,
  ],
})
export class O2cEmbedComponent {
  private readonly o2cUrl = '/o2c/';
  trustedUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.o2cUrl,
    );
  }
}
