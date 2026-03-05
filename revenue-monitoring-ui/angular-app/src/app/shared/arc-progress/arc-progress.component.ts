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
            <span class="arc-value-number">{{ formattedValue }}</span>
            @if (valueSuffix) {
              <span class="arc-value-suffix">{{ valueSuffix }}</span>
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

  /** Maximum value (100% of arc) */
  @Input() max = 100;

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

  /** Suffix for the value (e.g., 'k', 'M', '%') */
  @Input() valueSuffix = '';

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

  /** Calculate the stroke-dashoffset for the current progress */
  get progressOffset(): number {
    if (this.hasNoData) {
      return this.arcLength; // Full offset = no progress shown
    }
    const percentage = Math.min(Math.max(this.value! / this.max, 0), 1);
    const filledLength = percentage * this.arcLength;
    return this.arcLength - filledLength;
  }

  /** Format the value for display */
  get formattedValue(): string {
    if (this.hasNoData) {
      return '—';
    }
    const val = this.value!;
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(1).replace(/\.0$/, '');
    }
    if (val >= 1_000) {
      return (val / 1_000).toFixed(1).replace(/\.0$/, '');
    }
    return val.toString();
  }
}
