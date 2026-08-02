import { Component, Input, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ArcProgressComponent
 *
 * A customizable semi-circle arc progress indicator with gradient coloring.
 * Displays a value with an animated arc that fills based on percentage.
 *
 * Features:
 * - Configurable arc span (default 270° leaving bottom-left empty)
 * - Dual-color gradient stroke (light top → dark bottom)
 * - Formatted value display with optional suffix (k, M, etc.)
 * - Customizable size and stroke width
 * - Graceful handling of null/undefined values (shows track only)
 */
@Component({
  selector: 'app-arc-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="arc-progress" [style.width.px]="size" [style.height.px]="size">
      <svg
        [attr.viewBox]="'0 0 ' + size + ' ' + size"
        [attr.width]="size"
        [attr.height]="size"
      >
        <defs>
          <!-- Gradient for the arc stroke -->
          <linearGradient [id]="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" [attr.stop-color]="colorStart" />
            <stop offset="100%" [attr.stop-color]="colorEnd" />
          </linearGradient>
        </defs>

        <!-- Background track (shown when explicitly enabled OR when no data) -->
        @if (shouldShowTrack) {
          <circle
            class="arc-track"
            [class.arc-track--no-data]="hasNoData"
            [attr.cx]="center"
            [attr.cy]="center"
            [attr.r]="radius"
            fill="none"
            [attr.stroke]="effectiveTrackColor"
            [attr.stroke-width]="strokeWidth"
            [attr.stroke-dasharray]="arcLength + ' ' + circumference"
            [attr.stroke-dashoffset]="0"
            stroke-linecap="round"
            [attr.transform]="
              'rotate(' + startAngle + ' ' + center + ' ' + center + ')'
            "
          />
        }

        <!-- Progress arc (only shown when we have data) -->
        @if (!hasNoData) {
          <circle
            class="arc-progress-bar"
            [attr.cx]="center"
            [attr.cy]="center"
            [attr.r]="radius"
            fill="none"
            [attr.stroke]="'url(#' + gradientId + ')'"
            [attr.stroke-width]="strokeWidth"
            [attr.stroke-dasharray]="arcLength + ' ' + circumference"
            [attr.stroke-dashoffset]="progressOffset"
            stroke-linecap="round"
            [attr.transform]="
              'rotate(' + startAngle + ' ' + center + ' ' + center + ')'
            "
          />
        }
      </svg>

      <!-- Value display -->
      @if (showValue) {
        <div class="arc-value" [class.arc-value--no-data]="hasNoData">
          @if (hasNoData) {
            <span class="arc-value-number arc-value-number--no-data">—</span>
          } @else {
            @if (isCurrency) {
              <span class="arc-value-prefix">$</span>
            }
            <span class="arc-value-number">{{ formattedValue }}</span>
            @if (computedSuffix) {
              <span class="arc-value-suffix">{{ computedSuffix }}</span>
            }
            @if (showTotal && max !== null) {
              <span class="arc-value-total">/{{ formattedMax }}</span>
            }
          }
        </div>
      }
      @if (subtitle) {
        <div class="arc-subtitle">{{ subtitle }}</div>
      }
    </div>
  `,
  styles: [
    `
      .arc-progress {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .arc-progress svg {
        transform: scaleX(-1); /* Flip to make arc go clockwise visually */
      }

      .arc-track {
        opacity: 0.15;
      }

      .arc-track--no-data {
        opacity: 0.25;
      }

      .arc-progress-bar {
        transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arc-value {
        position: absolute;
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 2px;
      }

      .arc-value--no-data {
        opacity: 0.5;
      }

      .arc-value-number {
        font-size: 1.25rem;
        font-weight: 900;
        color: var(--landing-text, #1b1c1d);
        line-height: 1;
      }

      .arc-value-number--no-data {
        font-size: 1.5rem;
        color: var(--landing-text-muted, #9f9f9f);
      }

      .arc-value-suffix {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--landing-text-muted, #555);
      }

      .arc-value-prefix {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--landing-text-muted, #555);
      }

      .arc-value-total {
        font-size: 0.6rem;
        font-weight: 500;
        color: var(--landing-text-muted, #aaa);
        align-self: flex-end;
        padding-bottom: 1px;
        margin-left: 1px;
      }

      .arc-subtitle {
        position: absolute;
        bottom: 4px;
        right: 50%;
        /* transform: translateX(50%); */
        white-space: nowrap;
        text-align: right;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--landing-text-muted, #555);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    `,
  ],
})
export class ArcProgressComponent {
  /** Current value to display (null = no data available) */
  @Input() value: number | null = null;

  /** Maximum value (100% of arc). If null, arc renders at ~80% as decorative. */
  @Input() max: number | null = 100;

  /** Default fill percentage when max is null (open-ended metric) */
  @Input() openEndedFillPercent = 0.91;

  /**
   * Display format from backend. Controls how value is formatted:
   * - null/empty: Auto-scale (K/M/B), $ prefix if value >= 1M
   * - 'PERCENT': Show value as-is with % suffix, no $
   * - 'CURRENCY_M': Auto-scale + always show $ prefix
   * - 'COUNT', 'COUNT_K': Auto-scale, no $ prefix
   */
  @Input() displayFormat:
    | 'COUNT'
    | 'COUNT_K'
    | 'CURRENCY_M'
    | 'PERCENT'
    | ''
    | null
    | undefined;

  /** Size of the component in pixels */
  @Input() size = 80;

  /** Width of the arc stroke */
  @Input() strokeWidth = 8;

  /** Start color of gradient (top of arc) */
  @Input() colorStart = '#00bceb';

  /** End color of gradient (bottom of arc) */
  @Input() colorEnd = '#ff007f';

  /** Arc span in degrees (270 = 3/4 circle) */
  @Input() arcDegrees = 270;

  /** Show the background track (default false, but always shown when no data) */
  @Input() showTrack = false;

  /** Track color */
  @Input() trackColor = '#acacac';

  /** Track color to use when showing no-data state */
  @Input() noDataTrackColor = '#cccccc';

  /** Show the value in the center */
  @Input() showValue = true;

  /** Show the max/total alongside the value as "value/total" */
  @Input() showTotal = false;

  /** Subtitle text displayed below the value, right-aligned extending left */
  @Input() subtitle = '';

  /** Unique ID for the gradient (needed when multiple instances) */
  gradientId = `arc-gradient-${Math.random().toString(36).substr(2, 9)}`;

  /** Check if we have no data to display */
  get hasNoData(): boolean {
    return this.value === null || this.value === undefined;
  }

  /** Determine if track should be shown */
  get shouldShowTrack(): boolean {
    return this.showTrack || this.hasNoData;
  }

  /** Get effective track color based on data state */
  get effectiveTrackColor(): string {
    return this.hasNoData ? this.noDataTrackColor : this.trackColor;
  }

  get center(): number {
    return this.size / 2;
  }

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  /** Length of the visible arc based on arcDegrees */
  get arcLength(): number {
    return (this.arcDegrees / 360) * this.circumference;
  }

  /** Starting angle to position the gap at bottom-left (180° to 270°) */
  get startAngle(): number {
    // Position arc to start at ~270° (bottom) and end at ~180° (left)
    // Gap spans from 180° to 270° leaving bottom-left quadrant empty
    return 115;
  }

  /** Check if this is an open-ended metric (no max defined) */
  get isOpenEnded(): boolean {
    return this.max === null || this.max === undefined;
  }

  /** Calculate the stroke-dashoffset for the current progress */
  get progressOffset(): number {
    if (this.hasNoData) {
      return this.arcLength; // Full offset = no progress shown
    }
    // Open-ended metrics render at fixed percentage (decorative)
    if (this.isOpenEnded) {
      const filledLength = this.openEndedFillPercent * this.arcLength;
      return this.arcLength - filledLength;
    }
    const percentage = Math.min(Math.max(this.value! / this.max!, 0), 1);
    const filledLength = percentage * this.arcLength;
    return this.arcLength - filledLength;
  }

  /** Check if this is a currency format (should show $ prefix) */
  get isCurrency(): boolean {
    if (this.hasNoData) return false;

    // CURRENCY_M explicitly requests $ prefix
    if (this.displayFormat === 'CURRENCY_M') return true;

    // Auto-scale mode (null/empty): $ prefix for values >= 1M
    const format = this.displayFormat as string | null | undefined;
    if (!format) {
      return this.value! >= 1_000_000;
    }

    // COUNT, COUNT_K, PERCENT: no $ prefix
    return false;
  }

  /** Compute suffix dynamically based on value magnitude */
  get computedSuffix(): string {
    if (this.hasNoData) return '';

    // PERCENT: always use % suffix, no scaling
    if (this.displayFormat === 'PERCENT') {
      return '%';
    }

    // All other formats: auto-scale suffix based on magnitude
    const val = this.value!;
    if (val >= 1_000_000_000) return 'B';
    if (val >= 1_000_000) return 'M';
    if (val >= 1_000) return 'K';
    return '';
  }

  /** Format the max/total for display alongside the value */
  get formattedMax(): string {
    if (this.max === null || this.max === undefined) return '';
    const val = this.max;
    if (val >= 1_000_000_000)
      return this.formatWithPrecision(val / 1_000_000_000) + 'B';
    if (val >= 1_000_000)
      return this.formatWithPrecision(val / 1_000_000) + 'M';
    if (val >= 1_000) return this.formatWithPrecision(val / 1_000) + 'K';
    return this.formatWithPrecision(val);
  }

  /** Format the value for display (auto-scales for all non-PERCENT formats) */
  get formattedValue(): string {
    if (this.hasNoData) {
      return '—';
    }
    const val = this.value!;

    // PERCENT: show value as-is (no scaling)
    if (this.displayFormat === 'PERCENT') {
      if (val % 1 === 0) return val.toString();
      return val.toFixed(1).replace(/\.0$/, '');
    }

    // All other formats: auto-scale based on magnitude
    if (val >= 1_000_000_000) {
      return this.formatWithPrecision(val / 1_000_000_000);
    }
    if (val >= 1_000_000) {
      return this.formatWithPrecision(val / 1_000_000);
    }
    if (val >= 1_000) {
      return this.formatWithPrecision(val / 1_000);
    }

    // Small values
    return this.formatWithPrecision(val);
  }

  /** Format number with appropriate precision based on magnitude */
  private formatWithPrecision(num: number): string {
    if (num < 10) {
      return num
        .toLocaleString('en-US', { maximumFractionDigits: 2 })
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');
    }
    if (num < 100) {
      return num
        .toLocaleString('en-US', { maximumFractionDigits: 1 })
        .replace(/\.0$/, '');
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}
