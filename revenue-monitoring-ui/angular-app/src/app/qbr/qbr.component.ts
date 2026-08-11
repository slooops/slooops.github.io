import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCheckBold,
  phosphorLinkBold,
  phosphorInfoBold,
} from '@ng-icons/phosphor-icons/bold';

import { CaseiqComponent } from '../esp/esp-home/caseiq/caseiq.component';

/**
 * QBR (Quarterly Business Review) view.
 *
 * Mirrors the "CaseIQ Metrics — Measure. Monitor. Improve." executive slide.
 * Extends {@link CaseiqComponent} so all Oracle fetches, view-state, and
 * derived getters (accuracy, Finance-IT aggregation, exec p80/p90, coverage
 * gap) work verbatim — this class only exposes slide-shaped helpers on top
 * and pairs with its own template.
 *
 * Not linked from the main menu; reached only via the `/qbr` route.
 */
@Component({
  selector: 'app-qbr',
  templateUrl: './qbr.component.html',
  styleUrl: './qbr.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIcon],
  providers: [
    provideIcons({
      phosphorCheckBold,
      phosphorLinkBold,
      phosphorInfoBold,
    }),
  ],
})
export class QbrComponent extends CaseiqComponent implements OnInit {
  /** Fiscal quarter this slide reflects. */
  readonly qbrQuarter = 'Q4FY26';

  /** Static Q4FY26 target thresholds shown in the top-right callout box. */
  readonly targets = [
    { label: 'Case Analyzer Accuracy', threshold: '>= 80%' },
    { label: '%age of service requests resolved', threshold: '>= 50%' },
    { label: '%age of route out recommended', threshold: '>= 50%' },
    { label: '%age of cancel cases recommended', threshold: '>= 30%' },
  ];

  /** Static "Next steps" bullets from the slide's footer callout. */
  readonly nextSteps = [
    'Transition from API-based resolution to Tool / Functional Agent resolution to achieve full agentic capability.',
    'Touchless case resolution and MTTR tracking will be implemented alongside functional agent(s) enablement.',
    'Roadmap to be finalized by 5/29',
  ];

  /**
   * QBR is not hosted by `EspHomeComponent`, so the parent's `@Input`
   * pipeline never fires. Hydrate the quarter + metrics directly, then let
   * the parent's `ngAfterViewInit` fire the monitoring/exec fetches.
   */
  ngOnInit(): void {
    this.selectedQuarter = this.qbrQuarter;

    this.http
      .get('xxcaseiq-metrics', this.destroyManager)
      .subscribe((data: any) => {
        this.caseIqMetrics = Array.isArray(data) ? data : [];
        this.rebuildSections();
      });
  }

  // ── Case Analyzer column ─────────────────────────────────────────────────

  /** Total Cases figure shown top-left ("5,398" on the slide). */
  qbrTotalCases(): number | null {
    return this.getTotalCasesFromAccuracy('Finance IT');
  }

  /** Accuracy percentage shown top-left ("94%" on the slide). */
  qbrAccuracyPct(): number | null {
    return this.getAccuracyForSection('Finance IT');
  }

  /** Cases not picked by CaseIQ (ESP Datamart lead-time delays). */
  qbrNotPicked(): number {
    return this.execCoverageGapData.reduce(
      (sum: number, row: any) =>
        sum + (Number(this.execCol(row, 'INCIDENT_COUNT')) || 0),
      0,
    );
  }

  /** Cases not analyzed due to Conv-Bot timeout — no data source yet. */
  qbrNotAnalyzed(): string {
    return 'need data';
  }

  // ── Resolution column ────────────────────────────────────────────────────

  /** Slide "Resolution" metric tiles — Route Out, Cancelled, Service Request, Total. */
  qbrResolutionTiles(): Array<{
    label: string;
    agent: number;
    total: number;
    pct: number;
    highlight?: boolean;
  }> {
    const fit = this.getFinanceITRow();
    const buckets: Array<{
      label: string;
      metric: 'routed' | 'cancelled' | 'service';
    }> = [
      { label: 'Route Out', metric: 'routed' },
      { label: 'Cancelled', metric: 'cancelled' },
      { label: 'Service Request', metric: 'service' },
    ];

    const tiles = buckets.map(({ label, metric }) => {
      const agent = Number(fit?.[metric]?.agent ?? 0);
      const total = this.getSumMetricTotal(metric);
      return {
        label,
        agent,
        total,
        pct: total ? (agent / total) * 100 : 0,
        highlight: false,
      };
    });

    const agentSum = tiles.reduce((s, t) => s + t.agent, 0);
    const totalSum = tiles.reduce((s, t) => s + t.total, 0);
    tiles.push({
      label: 'Total Cases',
      agent: agentSum,
      total: totalSum,
      pct: totalSum ? (agentSum / totalSum) * 100 : 0,
      highlight: true,
    });

    return tiles;
  }

  /** Response time in HOURS (p80 / p90) — slide shows "1.2 / 1.8 hrs". */
  qbrResponseTimeHrs(): { p80: number | null; p90: number | null } {
    const min80 = this.computeWeightedResponseMinutes('P80');
    const min90 = this.computeWeightedResponseMinutes('P90');
    return {
      p80: min80 != null ? min80 / 60 : null,
      p90: min90 != null ? min90 / 60 : null,
    };
  }

  // ── Not-processed-by-CaseIQ column ───────────────────────────────────────

  /** Backlog figure — no data source in the current views yet. */
  qbrBacklog(): string {
    return 'need data';
  }

  /** Total service incidents — summed across the component rows. */
  qbrServiceIncidents(): number {
    return this.getSummaryRows().reduce(
      (sum, r) => sum + (r.serviceIncidents ?? 0),
      0,
    );
  }

  // ── Formatting helpers ───────────────────────────────────────────────────

  fmtInt(n: number | null | undefined): string {
    return n == null || !Number.isFinite(n) ? '--' : n.toLocaleString();
  }

  fmtPct(n: number | null | undefined, digits = 0): string {
    return n == null || !Number.isFinite(n) ? '--' : `${n.toFixed(digits)}%`;
  }

  fmtHrs(n: number | null | undefined): string {
    return n == null || !Number.isFinite(n) ? '--' : n.toFixed(1);
  }
}
