import { Component, OnInit, ViewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorEnvelopeSimpleBold } from '@ng-icons/phosphor-icons/bold';
import { ScorecardComponent } from '../scorecard/scorecard.component';
import { ExecutiveSummaryComponent } from '../executive-summary/executive-summary.component';
import { SdlcExecUpdateComponent } from '../sdlc-updates/sdlc-exec-update.component';
import { SdlcComponentAdoptionComponent } from '../sdlc-updates/sdlc-component-adoption.component';

@Component({
  selector: 'app-performance-hub',
  standalone: true,
  imports: [
    NgIcon,
    ScorecardComponent,
    ExecutiveSummaryComponent,
    SdlcExecUpdateComponent,
    SdlcComponentAdoptionComponent,
  ],
  providers: [provideIcons({ phosphorEnvelopeSimpleBold })],
  templateUrl: './performance-hub.component.html',
  styleUrls: ['./performance-hub.component.css'],
})
export class PerformanceHubComponent implements OnInit {
  activeTab = 0;
  toastMessage = '';
  private bannerDataUris: Record<number, string> = {};

  @ViewChild(ExecutiveSummaryComponent) execSummary?: ExecutiveSummaryComponent;
  @ViewChild(ScorecardComponent) scorecard?: ScorecardComponent;
  @ViewChild(SdlcExecUpdateComponent) sdlcExec?: SdlcExecUpdateComponent;
  @ViewChild(SdlcComponentAdoptionComponent)
  sdlcAdopt?: SdlcComponentAdoptionComponent;

  ngOnInit(): void {
    const bannerFiles: Record<number, string> = {
      0: 'assets/ai-sdlc-email-banner.png',
      1: 'assets/sprint-email-banner.png',
    };
    for (const [tab, path] of Object.entries(bannerFiles)) {
      fetch(path)
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            }),
        )
        .then((dataUri) => (this.bannerDataUris[+tab] = dataUri));
    }
  }

  private buildBannerHtml(): string {
    const dataUri = this.bannerDataUris[this.activeTab];
    if (!dataUri) return '';
    const alt =
      this.activeTab === 0
        ? 'Cisco - AI in Software Development for Finance'
        : 'Cisco - SDLC Sprint Updates';
    return (
      `<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
      `<td style="padding:0;border:none;font-size:0;line-height:0;">` +
      `<img src="${dataUri}" width="1800" style="display:block;width:100%;max-width:1200px;height:auto;border:0;" alt="${alt}" />` +
      `</td></tr></table>`
    );
  }

  async exportCombined(): Promise<void> {
    let body = this.buildBannerHtml();
    let plain = '';

    if (this.activeTab === 0) {
      if (this.execSummary) {
        body += this.execSummary.buildEmailHtml();
        plain += this.execSummary.buildPlainText();
      }
      if (this.scorecard) {
        body += '<br><br>' + this.scorecard.buildEmailHtml();
        plain += '\n\n' + this.scorecard.buildPlainText();
      }
    } else {
      if (this.sdlcExec) {
        body += this.sdlcExec.buildEmailHtml();
        plain += this.sdlcExec.buildPlainText();
      }
      if (this.sdlcAdopt) {
        body += '<br><br>' + this.sdlcAdopt.buildEmailHtml();
        plain += '\n\n' + this.sdlcAdopt.buildPlainText();
      }
    }

    // Wrap in full HTML document — Outlook strips clipboard fragments without it
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">` +
      `<head><meta charset="utf-8">` +
      `<!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->` +
      `</head><body style="margin:0;padding:0;">` +
      body +
      `</body></html>`;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(plain);
    }

    const subject = encodeURIComponent(
      this.activeTab === 0 ? 'AI in SDLC Summary' : 'SDLC Sprint Updates',
    );
    window.open(`mailto:?subject=${subject}`, '_self');
    this.showToast('Both tables copied — paste into your email body (Cmd+V)');
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => (this.toastMessage = ''), 5000);
  }
}
