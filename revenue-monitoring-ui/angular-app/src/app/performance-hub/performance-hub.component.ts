import { Component, ViewChild } from '@angular/core';
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
export class PerformanceHubComponent {
  activeTab = 0;
  toastMessage = '';

  @ViewChild(ExecutiveSummaryComponent) execSummary?: ExecutiveSummaryComponent;
  @ViewChild(ScorecardComponent) scorecard?: ScorecardComponent;
  @ViewChild(SdlcExecUpdateComponent) sdlcExec?: SdlcExecUpdateComponent;
  @ViewChild(SdlcComponentAdoptionComponent)
  sdlcAdopt?: SdlcComponentAdoptionComponent;

  async exportCombined(): Promise<void> {
    let html = '';
    let plain = '';

    if (this.activeTab === 0) {
      if (this.execSummary) {
        html += this.execSummary.buildEmailHtml();
        plain += this.execSummary.buildPlainText();
      }
      if (this.scorecard) {
        html += '<br><br>' + this.scorecard.buildEmailHtml();
        plain += '\n\n' + this.scorecard.buildPlainText();
      }
    } else {
      if (this.sdlcExec) {
        html += this.sdlcExec.buildEmailHtml();
        plain += this.sdlcExec.buildPlainText();
      }
      if (this.sdlcAdopt) {
        html += '<br><br>' + this.sdlcAdopt.buildEmailHtml();
        plain += '\n\n' + this.sdlcAdopt.buildPlainText();
      }
    }

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
