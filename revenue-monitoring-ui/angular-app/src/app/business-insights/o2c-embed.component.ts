import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';

@Component({
  selector: 'app-o2c-embed',
  standalone: true,
  imports: [CommonModule, LoadingSymbolComponent],
  template: `
    @if (loading) {
      <div class="o2c-embed-wrapper">
        <div class="o2c-status">Loading...</div>
      </div>
    } @else if (error) {
      <div class="o2c-embed-wrapper">
        <div class="o2c-error">
          <span class="o2c-error-icon">⚠️</span>
          <h3>Subscription O2C Insights Unavailable</h3>
          <p>
            The Subscription O2C Insights dashboard is currently unavailable.
            Please try again later or contact control tower team if the issue
            persists.
          </p>
          <button class="o2c-retry-btn" (click)="checkAvailability()">
            Retry
          </button>
        </div>
      </div>
    } @else {
      <div class="o2c-embed-wrapper">
        @if (!iframeLoaded) {
          <div class="o2c-iframe-loading">
            <app-loading-symbol></app-loading-symbol>
          </div>
        }
        <iframe
          class="o2c-embed-frame"
          [class.o2c-embed-frame--hidden]="!iframeLoaded"
          title="O2C Experience"
          loading="lazy"
          [src]="trustedUrl"
          allowfullscreen
          referrerpolicy="no-referrer"
          (load)="onIframeLoad()"
        ></iframe>
      </div>
    }
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

      .o2c-embed-frame--hidden {
        visibility: hidden;
        position: absolute;
      }

      .o2c-iframe-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        flex: 1;
      }

      .o2c-status {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        font-size: 1.1rem;
        color: #6b7c93;
      }

      .o2c-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        gap: 0.5rem;
        color: #4a5568;
        text-align: center;
        padding: 2rem;
      }

      .o2c-error-icon {
        font-size: 2.5rem;
      }

      .o2c-error h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #2d3748;
      }

      .o2c-error p {
        margin: 0;
        font-size: 0.95rem;
        color: #6b7c93;
        max-width: 400px;
      }

      .o2c-retry-btn {
        margin-top: 0.75rem;
        padding: 0.5rem 1.5rem;
        background: #049fd9;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
      }

      .o2c-retry-btn:hover {
        background: #037fb3;
      }
    `,
  ],
})
export class O2cEmbedComponent implements OnInit {
  private readonly o2cUrl = '/o2c/';
  trustedUrl: SafeResourceUrl;
  loading = true;
  error = false;
  iframeLoaded = false;

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
  ) {
    this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.o2cUrl,
    );
  }

  ngOnInit(): void {
    this.checkAvailability();
  }

  checkAvailability(): void {
    this.loading = true;
    this.error = false;
    this.iframeLoaded = false;

    this.http
      .head(this.o2cUrl, { observe: 'response' })
      .pipe(
        catchError(() => {
          this.error = true;
          this.loading = false;
          return of(null);
        }),
      )
      .subscribe((response) => {
        if (response) {
          this.error = false;
        }
        this.loading = false;
      });
  }

  onIframeLoad(): void {
    this.iframeLoaded = true;
  }
}
