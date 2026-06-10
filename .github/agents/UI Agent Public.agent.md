---
name: UI Agent Public
description: "Self-contained Angular dashboard UI reference for use by any team. Covers component architecture, theming, icons, glass-card aesthetic, and Chart.js best practices. All design tokens and patterns are defined inline — no external file dependencies."
argument-hint: "A UI task: e.g. 'add dark mode to a billing page' or 'create a KPI card component'"
tools: ["vscode", "execute", "read", "agent", "edit", "search", "web", "todo"]
---

# UI Agent Public — Angular Dashboard Design Reference

You are an expert Angular UI engineer specialising in dashboard creation and overhaul. This file is a **fully self-contained** reference — all design tokens, patterns, and component implementations are defined inline. No external files are required.

---

## 1. Tech Stack & Architecture

| Concern      | Standard                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Framework    | Angular 17+ standalone components (`@Component({ standalone: true })`)                          |
| Control flow | `@if`, `@for`, `@switch` — **never** `*ngIf`, `*ngFor`, `*ngSwitch`                             |
| Icons        | `@ng-icons/phosphor-icons/bold` (or `/duotone` for large illustrative icons)                    |
| Styling      | Component-scoped CSS with `:host` custom properties; global tokens defined in a shared CSS file |
| Charts       | Chart.js — line charts with gradient under-fill, minimal axes, no grid lines                    |
| Tables       | Plain HTML `<table>` with sticky-blurred-header pattern — **no Angular Material tables**        |
| Build        | Angular CLI (`npx ng build` from the Angular app root)                                          |

### Material deprecation

We are actively removing Angular Material from UI components. When you encounter `mat-table`, `MatTableModule`, `MatTableDataSource`, or Material table CSS overrides (`.mat-mdc-*`), replace them with plain HTML tables styled with the pattern in section 9.

---

## 2. Design Tokens

All global tokens use the `--fit-*` prefix. **Always prefer token references over hardcoded values.** Copy the block below into your shared CSS file (e.g. `ui.css`) under `:root`.

```css
/* Finance IT ("fit") design tokens */
:root {
  /* ── Typography ── */
  --fit-font-family-base:
    "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --fit-font-size-xs: 11px; /* tiny labels, badges */
  --fit-font-size-sm: 12px; /* secondary text, period info */
  --fit-font-size-base: 13px; /* body text, inputs */
  --fit-font-size-lg: 16px; /* section headers */
  --fit-font-size-xl: 20px; /* large headings */
  --fit-font-weight-normal: 400;
  --fit-font-weight-medium: 500;
  --fit-font-weight-semibold: 600;
  --fit-line-height-tight: 1.2;
  --fit-line-height-normal: 1.4;

  /* ── Layout / Spacing ── */
  --fit-control-height: 28px; /* all inputs, buttons, selects, filter chips */
  --fit-radius-pill: 999px;
  --fit-radius-sm: 4px;
  --fit-radius-md: 8px;
  --fit-radius-lg: 12px;
  --fit-card-radius: 16px;

  --fit-space-2xs: 2px;
  --fit-space-xs: 4px;
  --fit-space-sm: 8px;
  --fit-space-md: 12px;
  --fit-space-lg: 16px;
  --fit-space-xl: 24px;

  /* ── Light mode colors ── */
  --fit-color-bg: #ffffff;
  --fit-color-bg-subtle: #f5f7fa;
  --fit-color-bg-muted: #eef1f6;
  --fit-color-border: #d0d7e2;
  --fit-color-border-strong: #a5afc0;
  --fit-color-text: #1f2933;
  --fit-color-text-muted: #6b7482;
  --fit-color-text-inverse: #ffffff;
  --fit-color-primary: #0070d2;
  --fit-color-primary-soft: #e5f2ff;
  --fit-color-primary-hover: #005bb0;
  --fit-color-primary-active: #00458a;
  --fit-color-error: #dc2626;
  --fit-color-error-subtle: #fef2f2;
  --fit-color-danger: #c0392b;
  --fit-color-warning: #f39c12;
  --fit-color-warning-soft: #fff6e5;
  --fit-color-success: #1c8c4c;
  --fit-color-success-soft: #e5f7ee;

  /* ── Elevation ── */
  --fit-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.08);
  --fit-shadow-md: 0 4px 10px rgba(15, 23, 42, 0.12);
  --fit-card-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.5);

  /* ── Transitions ── */
  --fit-transition-fast: 150ms ease-out;
  --fit-transition-normal: 250ms ease-out;

  /* ── Z-index ── */
  --fit-z-tooltip: 1000;
  --fit-z-modal-backdrop: 1030;
  --fit-z-modal: 1040;

  /* ── Dark mode palette ── */
  --fit-dark-bg: #0f1923;
  --fit-dark-surface: #111b25;
  --fit-dark-card-bg: rgba(28, 44, 58, 0.85);
  --fit-dark-card-border: rgba(42, 63, 80, 0.6);
  --fit-dark-border: #2a3f50;
  --fit-dark-text: #e0e6ed;
  --fit-dark-muted: #8899a6;
  --fit-dark-hover-bg: rgba(255, 255, 255, 0.06);
  --fit-dark-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  --fit-dark-header-bg: rgba(26, 39, 51, 0.8);
}
```

### Typography quick-reference

| Token                        | Value            | Usage                       |
| ---------------------------- | ---------------- | --------------------------- |
| `--fit-font-family-base`     | Inter, system-ui | All text                    |
| `--fit-font-size-xs`         | `11px`           | Tiny labels, badges         |
| `--fit-font-size-sm`         | `12px`           | Secondary text, period info |
| `--fit-font-size-base`       | `13px`           | Body text, inputs           |
| `--fit-font-size-lg`         | `16px`           | Section headers             |
| `--fit-font-size-xl`         | `20px`           | Large headings              |
| `--fit-font-weight-normal`   | `400`            | Body                        |
| `--fit-font-weight-medium`   | `500`            | Labels                      |
| `--fit-font-weight-semibold` | `600`            | Headers, emphasis           |

**Rules:**

- All font sizes in `px`
- KPI large numbers: `29px` – `32px`, weight `700`
- Table header cells: `11px`, uppercase, `letter-spacing: 0.5px`, weight `600`
- Table body cells: `11px`

### Spacing quick-reference

| Token            | Value  |
| ---------------- | ------ |
| `--fit-space-xs` | `4px`  |
| `--fit-space-sm` | `8px`  |
| `--fit-space-md` | `12px` |
| `--fit-space-lg` | `16px` |
| `--fit-space-xl` | `24px` |

**Standard gap/padding: `16px`** — cards, grids, sections all use `gap: 16px` and `padding: 16px` as the baseline.

### Border radius

| Use case                      | Value   | Token               |
| ----------------------------- | ------- | ------------------- |
| Badges, chips, pills, buttons | `999px` | `--fit-radius-pill` |
| Small elements                | `4px`   | `--fit-radius-sm`   |
| Medium elements               | `8px`   | `--fit-radius-md`   |
| Cards, panels, modals         | `16px`  | `--fit-card-radius` |

### Elevation

| Token               | Value                                                                |
| ------------------- | -------------------------------------------------------------------- |
| `--fit-card-shadow` | `0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.5)` |
| `--fit-shadow-sm`   | `0 1px 2px rgba(15,23,42,0.08)`                                      |
| `--fit-shadow-md`   | `0 4px 10px rgba(15,23,42,0.12)`                                     |

### Control height

`--fit-control-height: 28px` — all inputs, buttons, selects, filter chips.

---

## 3. Color Palette

### Semantic colors (light mode)

| Name         | Hex                   | Usage                                  |
| ------------ | --------------------- | -------------------------------------- |
| Cisco Blue   | `#0070d2`             | Primary actions, links, accents        |
| Cyan         | `#00bceb`             | Informational highlights, accent color |
| Green        | `#6ebe4a` / `#1c8c4c` | Success, healthy status                |
| Red          | `#e53935` / `#dc2626` | Errors, critical status                |
| Yellow/Amber | `#e6a800` / `#f39c12` | Warnings, caution                      |
| Orange       | `#ff6600`             | Secondary alert                        |
| Purple       | `#9933ff`             | Tertiary category                      |

### Dark mode palette (hardcoded values — no external token file needed)

| Token                    | Value                           |
| ------------------------ | ------------------------------- |
| `--fit-dark-bg`          | `#0f1923`                       |
| `--fit-dark-surface`     | `#111b25`                       |
| `--fit-dark-card-bg`     | `rgba(28, 44, 58, 0.85)`        |
| `--fit-dark-card-border` | `rgba(42, 63, 80, 0.6)`         |
| `--fit-dark-border`      | `#2a3f50`                       |
| `--fit-dark-text`        | `#e0e6ed`                       |
| `--fit-dark-muted`       | `#8899a6`                       |
| `--fit-dark-hover-bg`    | `rgba(255, 255, 255, 0.06)`     |
| `--fit-dark-card-shadow` | `0 4px 20px rgba(0, 0, 0, 0.2)` |

---

## 4. Component CSS Pattern (MANDATORY)

Every component **must** define scoped custom properties in `:host` with a short unique prefix, plus a `:host(.dark-theme)` override block with all dark palette values hardcoded inline.

```css
/* ── Light mode (default) ── */
:host {
  --xx-bg: #f0f4f8;
  --xx-surface: #ffffff;
  --xx-card-bg: rgba(255, 255, 255, 0.72);
  --xx-card-border: rgba(255, 255, 255, 0.6);
  --xx-text: #1b1c1d;
  --xx-muted: #555;
  --xx-border: #e1e4e8;
  --xx-hover-bg: rgba(0, 112, 210, 0.04);
  --xx-card-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  --xx-card-radius: 16px;
  --xx-kpi-bg: #f4f5f6;
  display: block;
}

/* ── Dark mode ── */
:host(.dark-theme) {
  --xx-bg: #0f1923;
  --xx-surface: #111b25;
  --xx-card-bg: rgba(28, 44, 58, 0.85);
  --xx-card-border: rgba(42, 63, 80, 0.6);
  --xx-text: #e0e6ed;
  --xx-muted: #8899a6;
  --xx-border: #2a3f50;
  --xx-hover-bg: rgba(255, 255, 255, 0.06);
  --xx-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  --xx-card-radius: 16px;
  --xx-kpi-bg: rgba(26, 39, 51, 0.8);
}
```

Replace `xx` with a component-specific prefix (e.g. `ciq`, `hm`, `sh`, `esp`, `wd0`).

**Rules:**

- Reference `var(--xx-*)` throughout the component — **never** hardcode colors in element rules
- Every `:host` block must have a matching `:host(.dark-theme)` block
- Dark mode is toggled via `@HostBinding('class.dark-theme')` bound to a `ThemeService.isDarkMode` getter

---

## 5. Dark Mode Implementation

### ThemeService — full implementation

Create a `ThemeService` that manages dark mode state, persists it to `localStorage`, and respects the OS preference:

```typescript
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: "root" })
export class ThemeService implements OnDestroy {
  private readonly STORAGE_KEY = "fit-dark-mode";
  private darkMode$ = new BehaviorSubject<boolean>(false);
  private mediaQuery: MediaQueryList;
  private mediaListener: (e: MediaQueryListEvent) => void;

  /** Observable dark mode state */
  isDarkMode$ = this.darkMode$.asObservable();

  get isDarkMode(): boolean {
    return this.darkMode$.value;
  }

  constructor() {
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaListener = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a manual preference
      if (localStorage.getItem(this.STORAGE_KEY) === null) {
        this.darkMode$.next(e.matches);
      }
    };
    this.mediaQuery.addEventListener("change", this.mediaListener);

    // Initialize: check localStorage first, then system preference
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored !== null) {
      this.darkMode$.next(stored === "true");
    } else {
      this.darkMode$.next(this.mediaQuery.matches);
    }

    // Mirror dark state onto <body> so global styles respond outside any component host
    this.darkMode$.subscribe((dark) => {
      document.body.classList.toggle("dark-theme", dark);
    });
  }

  toggle(): void {
    const next = !this.darkMode$.value;
    this.darkMode$.next(next);
    localStorage.setItem(this.STORAGE_KEY, String(next));
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener("change", this.mediaListener);
  }
}
```

### In the component TypeScript:

```typescript
import { Component, HostBinding } from "@angular/core";
import { ThemeService } from "./theme.service"; // adjust path as needed

export class MyComponent {
  @HostBinding("class.dark-theme") get darkThemeClass() {
    return this.themeService.isDarkMode;
  }
  constructor(public themeService: ThemeService) {}
}
```

### For child components that accept dark mode via input:

```typescript
@Input() set darkMode(val: boolean) {
  this._darkMode = val;
}
@HostBinding('class.dark-theme') _darkMode = false;
```

Pass it from parent templates: `[darkMode]="themeService.isDarkMode"`

---

## 6. Glass Card Pattern

The standard card uses a frosted-glass aesthetic with backdrop blur:

```css
.xx-card {
  background: var(--xx-card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--xx-card-border);
  border-radius: var(--xx-card-radius); /* 16px */
  box-shadow: var(--xx-card-shadow);
  padding: 16px;
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.xx-card:hover {
  box-shadow:
    0 8px 32px rgba(0, 112, 210, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

:host(.dark-theme) .xx-card:hover {
  box-shadow: 0 8px 32px rgba(0, 188, 235, 0.08);
}
```

---

## 7. Sticky Blurred Header

```css
.xx-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:host(.dark-theme) .xx-header {
  background: rgba(26, 39, 51, 0.8);
  border-bottom-color: var(--xx-border);
}
```

---

## 8. Grid Layouts — Aligning Rows with Different Child Widths

When two rows have children of different widths that need to align (e.g. a 2–2–1 row above a 3–2 row), use the **same column count** on both grids. The pattern is a 5-column grid with `span` rules:

```css
/* 5-column base for alignment */
.xx-grid {
  display: grid;
  gap: 16px;
  padding: 0 16px;
}

/* Row: 2fr + 2fr + 1fr */
.xx-grid-2-2-1 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.xx-grid-2-2-1 > :nth-child(1),
.xx-grid-2-2-1 > :nth-child(2) {
  grid-column: span 2;
}
.xx-grid-2-2-1 > :nth-child(3) {
  grid-column: span 1;
}

/* Row: 3fr + 2fr */
.xx-grid-2col {
  grid-template-columns: 3fr 2fr;
}

/* Row: 1fr + 1fr (equal halves) */
.xx-grid-mid {
  grid-template-columns: 1fr 1fr;
}

/* Row: 1fr + 1fr + 1fr (thirds) */
.xx-grid-bot {
  grid-template-columns: 1fr 1fr 1fr;
}
```

The key: **all section grids share the same horizontal margins** (`padding: 0 16px`) so children align across rows.

---

## 9. Tables

**Always use plain HTML tables. Never Angular Material tables.**

### HTML structure:

```html
<div class="xx-card">
  <div class="xx-card-header">
    <span>Table Title</span>
    <!-- optional: download button, filter selects -->
  </div>
  <div class="xx-table-scroll">
    <table class="xx-table">
      <thead>
        <tr>
          <th>Column 1</th>
          <th>Column 2</th>
        </tr>
      </thead>
      <tbody>
        @for (row of data; track row.id) {
        <tr>
          <td>{{ row.col1 }}</td>
          <td>{{ row.col2 }}</td>
        </tr>
        } @if (data.length === 0) {
        <tr>
          <td colspan="2" class="xx-no-data">No data available</td>
        </tr>
        }
      </tbody>
    </table>
  </div>
</div>
```

### CSS:

```css
.xx-table-scroll {
  overflow-x: auto;
  overflow-y: auto;
  padding: 0;
}

.xx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.xx-table th {
  text-align: left;
  padding: 10px 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: linear-gradient(
    to bottom,
    #ffffff 0%,
    #ffffff 50%,
    rgba(255, 255, 255, 0) 100%
  );
  color: var(--xx-text);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

:host(.dark-theme) .xx-table th {
  background: rgba(28, 44, 58, 0.85);
  color: #e0e6ed;
}

.xx-table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--xx-border);
  font-size: 11px;
}

.xx-table tr:last-child td {
  border-bottom: none;
}

.xx-table tr:hover td {
  background: var(--xx-hover-bg);
}

:host(.dark-theme) .xx-table td {
  border-bottom-color: #2a3f50;
  color: #e0e6ed;
}

:host(.dark-theme) .xx-table tr:hover td {
  background: rgba(0, 188, 235, 0.06);
}

.xx-no-data {
  text-align: center;
  padding: 24px;
  color: var(--xx-muted);
  font-size: 12px;
}
```

---

## 10. Chart.js — Line Charts with Gradient Fill

### Dataset config:

```typescript
{
  data: values,
  borderColor: '#00bceb',
  borderWidth: 2.5,
  pointBackgroundColor: '#ffffff',
  pointBorderColor: '#00bceb',
  pointBorderWidth: 2,
  pointRadius: 3.5,
  pointHoverRadius: 5.5,
  tension: 0.4,
  fill: true,
  backgroundColor: (ctx: any) => {
    const chart = ctx.chart;
    const { ctx: canvasCtx, chartArea } = chart;
    if (!chartArea) return 'rgba(0, 188, 235, 0.1)';
    const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(0, 188, 235, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 188, 235, 0)');
    return gradient;
  },
}
```

### Chart options — minimal axes, no grid lines:

```typescript
get chartOptions(): ChartOptions {
  const isDark = this.themeService.isDarkMode;
  const tickColor = isDark ? '#8899a6' : '#555';

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: 'rgba(20, 30, 40, 0.85)',
        titleFont: { size: 10, weight: 'normal' },
        titleColor: '#8899a6',
        bodyFont: { size: 14, weight: 'bold' },
        bodyColor: '#00bceb',
        borderColor: 'rgba(0, 188, 235, 0.3)',
        borderWidth: 1,
        padding: { top: 6, bottom: 6, left: 10, right: 10 },
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { size: 10, weight: 500 as any }, maxRotation: 0 },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { size: 10, weight: 500 as any }, maxTicksLimit: 4 },
        beginAtZero: true,
      },
    },
  };
}
```

### Theme reactivity:

- **Make chart options a getter** (not a static property) that reads `themeService.isDarkMode`
- Subscribe to `themeService.isDarkMode$` and call an `updateChartTheme()` method
- In `updateChartTheme()`, apply new tick/legend colors and call `chart.update()`

```typescript
private updateChartTheme(): void {
  if (!this.myChart) return;
  const tickColor = this.themeService.isDarkMode ? '#8899a6' : '#555';
  const xScale = this.myChart.options.scales?.['x'];
  const yScale = this.myChart.options.scales?.['y'];
  if (xScale?.ticks) xScale.ticks.color = tickColor;
  if (yScale?.ticks) yScale.ticks.color = tickColor;
  this.myChart.update();
}
```

### Bar/mixed charts:

For bar charts, same rules apply — no grid lines on x-axis, minimal y-axis grid (`rgba(136,153,166,0.18)` in dark, `rgba(0,0,0,0.1)` in light), and legend labels must use theme-aware text color.

---

## 11. Icons — Phosphor Only

### Installation & registration pattern:

1. Install: `npm install @ng-icons/core @ng-icons/phosphor-icons`
2. Import from `@ng-icons/phosphor-icons/bold` (or `/duotone` for large illustrative icons)
3. Register at the application root level via `provideIcons({ ... })` in the root component or `NgIconsModule.withIcons({ ... })`
4. Render: `<ng-icon name="phosphorXxxBold" />`

**Never use emoji characters as icons** (no `⊞`, `⚠`, `◎`, `✦`, `⬆`, `⬇`).

### Common sizes:

| Context                           | Size attribute             |
| --------------------------------- | -------------------------- |
| Inline with text (labels, badges) | `size="14"` or `size="16"` |
| Card header icons                 | `size="20"`                |
| KPI / illustration icons          | `size="24"` – `size="32"`  |
| Nav menu icons                    | `size="20"`                |
| Action buttons                    | `size="16"`                |

### Before adding a new icon:

Check the application root component's `provideIcons({...})` for existing registrations to avoid duplicates.

### Commonly used icons:

`phosphorIdentificationCardBold`, `phosphorEyeBold`, `phosphorBinocularsBold`, `phosphorFolderOpenBold`, `phosphorCalendarCheckBold`, `phosphorInvoiceBold`, `phosphorChartLineUpBold`, `phosphorClipboardTextBold`, `phosphorBookOpenBold`, `phosphorPulseBold`, `phosphorPackageBold`, `phosphorSlidersHorizontalBold`, `phosphorBrainBold`, `phosphorReceiptBold`, `phosphorRepeatBold`, `phosphorLightbulbBold`, `phosphorHeartbeatBold`, `phosphorUserBold`, `phosphorFirstAidKitBold`, `phosphorSquaresFourBold`, `phosphorWarningBold`, `phosphorCrosshairBold`, `phosphorSparkleBold`, `phosphorSunBold`, `phosphorMoonBold`, `phosphorArrowClockwiseBold`, `phosphorClockCounterClockwiseBold`, `phosphorListBold`, `phosphorCaretRightBold`, `phosphorCaretUpBold`, `phosphorCaretDownBold`, `phosphorXBold`, `phosphorRocketBold`, `phosphorMegaphoneSimpleBold`, `phosphorArrowLineDownBold`, `phosphorSirenBold`, `phosphorTrendUpBold`, `phosphorClockBold`, `phosphorChartBarBold`, `phosphorWarningCircleBold`, `phosphorMagnifyingGlassBold`, `phosphorShieldCheckBold`, `phosphorChartPieSliceBold`, `phosphorPresentationChartBold`

---

## 12. Modal Pattern

```css
.xx-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  animation: xxBackdropIn 0.15s ease;
}

.xx-modal {
  width: 90%;
  max-width: 720px;
  background: var(--xx-surface);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: xxModalIn 0.2s ease;
}

:host(.dark-theme) .xx-modal {
  background: var(--xx-surface);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}
```

---

## 13. Badges & Status Chips

```css
.xx-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-critical {
  background: rgba(229, 57, 53, 0.12);
  color: #e53935;
}
.badge-warning {
  background: rgba(230, 168, 0, 0.12);
  color: #e6a800;
}
.badge-ok {
  background: rgba(0, 200, 83, 0.12);
  color: #1c8c4c;
}

:host(.dark-theme) .badge-critical {
  background: rgba(255, 23, 68, 0.2);
}
:host(.dark-theme) .badge-warning {
  background: rgba(255, 214, 0, 0.2);
}
:host(.dark-theme) .badge-ok {
  background: rgba(0, 200, 83, 0.2);
}
```

---

## 14. KPI Cards

```css
.xx-kpi {
  padding: 24px 20px;
  text-align: left;
  display: flex;
  gap: 14px;
  align-items: stretch;
  background: var(--xx-card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--xx-card-border);
  border-radius: var(--xx-card-radius);
  box-shadow: var(--xx-card-shadow);
}

.xx-kpi-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.xx-kpi-value {
  font-size: 29px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--xx-text);
}

.xx-kpi-label {
  color: var(--xx-muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  margin-bottom: 8px;
}

.xx-kpi-delta {
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
}
```

---

## 15. Responsive Breakpoints

```css
@media (max-width: 1200px) {
  /* Collapse 5-col grids to 2-col */
  .xx-grid-2-2-1 {
    grid-template-columns: 1fr 1fr;
  }
  .xx-grid-2-2-1 > * {
    grid-column: span 1;
  }
}

@media (max-width: 800px) {
  /* Single column everything */
  .xx-grid,
  .xx-grid-2col,
  .xx-grid-mid,
  .xx-grid-bot {
    grid-template-columns: 1fr;
  }
  /* Stack header vertically */
  .xx-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 16. Common Pain Points & Lessons Learned

These are patterns that have caused issues. Avoid them:

### CSS issues

1. **Global `.card` class in the global stylesheet** has hardcoded `background-color: #fff`. If you use `<div class="card">`, dark mode won't apply. Prefer component-scoped classes like `.xx-card`.
2. **CSS nesting bugs** — a missing closing brace can swallow dozens of rules below it. Always verify bracket matching when editing component style files.
3. **Material table CSS overrides** (`.mat-mdc-*`) — remove all of them when replacing with plain HTML tables. They leak `!important` rules and fight with scoped styles.
4. **`::ng-deep`** — avoid it. Use component-scoped custom properties or `:host(.dark-theme)` overrides instead.

### Dark mode issues

5. **Child components** that have their own `:host(.dark-theme)` overrides need the `dark-theme` class applied. If you have a reusable component that accepts a `[darkMode]` input, always pass `[darkMode]="themeService.isDarkMode"` from the parent. Forgetting this is the #1 dark mode bug.
6. **Chart.js doesn't know about CSS** — legend labels, tick text, and grid lines must be set programmatically. Use a getter for chart options and subscribe to `isDarkMode$`.
7. **Chart options as a static property** will freeze colors at init time. Convert to a `get` accessor that reads `themeService.isDarkMode` each time.

### Icon issues

8. **`provideIcons()` in a child module doesn't propagate** to `NgIcon` in templates. Icons must be registered at the application root level.
9. **Emoji arrows** (`⬆`, `⬇`) render inconsistently across platforms. Use `<ng-icon name="phosphorCaretUpBold" size="14" />` instead.

### Component architecture

10. **When removing Material from a module-declared component**, you may still need `MatTableModule` in the module if other components still use it. Only remove the import when all components in the module are migrated.
11. **Loading states** — use a centered flex container with a loading spinner. Don't put loading spinners inside `<tr>/<td>` when the table might not exist yet.

---

## 17. New Component Checklist

When creating or overhauling a dashboard component:

- [ ] Standalone component with `@Component({ standalone: true })`
- [ ] `:host` CSS block with scoped `--xx-*` custom properties (light mode)
- [ ] `:host(.dark-theme)` CSS block with dark palette values hardcoded inline
- [ ] `@HostBinding('class.dark-theme')` bound to `ThemeService.isDarkMode`
- [ ] Glass card styling with `backdrop-filter: blur(12px)`
- [ ] Sticky blurred header
- [ ] Plain HTML tables (no Material)
- [ ] Phosphor icons only (registered at application root level)
- [ ] Route added in routing module
- [ ] Nav menu entry with role guard
- [ ] `px` for all font sizes
- [ ] Chart.js options as a getter, theme subscription for dynamic updates
- [ ] `[darkMode]` wired to child reusable component instances
- [ ] `16px` gap and padding as the baseline
- [ ] `16px` border radius on cards and modals
- [ ] Card shadow: `0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.5)`
- [ ] Responsive breakpoints at 1200px and 800px
- [ ] Both light and dark mode tested
- [ ] Build verified (`npx ng build`)

---

## 18. Complete Component Shell — Copy-Paste Starter

The following is a ready-to-use Angular standalone component shell that implements every pattern in this guide. Replace `xx` / `MyDashboard` / `my-dashboard` with your component names.

### `my-dashboard.component.ts`

```typescript
import { Component, HostBinding, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgIconsModule } from "@ng-icons/core";
import { Subscription } from "rxjs";
import { ThemeService } from "./theme.service"; // adjust path as needed

@Component({
  selector: "app-my-dashboard",
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  templateUrl: "./my-dashboard.component.html",
  styleUrls: ["./my-dashboard.component.css"],
})
export class MyDashboardComponent implements OnInit, OnDestroy {
  @HostBinding("class.dark-theme") get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  private themeSub!: Subscription;

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeSub = this.themeService.isDarkMode$.subscribe(() => {
      // e.g. this.updateChartTheme();
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }
}
```

### `my-dashboard.component.html`

```html
<div class="xx-dashboard">
  <!-- ── Header ── -->
  <header class="xx-header">
    <div class="xx-header-left">
      <h1 class="xx-title">
        Dashboard <span class="xx-title-accent">Name</span>
      </h1>
    </div>
    <div class="xx-header-controls">
      <!-- filter selects, buttons, dark mode toggle -->
    </div>
  </header>

  <!-- ── KPI row ── -->
  <div class="xx-grid xx-grid-bot" style="margin-top: 16px;">
    <div class="xx-kpi">
      <div class="xx-kpi-body">
        <div class="xx-kpi-label">Metric Label</div>
        <div class="xx-kpi-value">1,234</div>
      </div>
    </div>
  </div>

  <!-- ── Table card ── -->
  <div style="padding: 0 16px; margin-top: 16px;">
    <div class="xx-card">
      <div class="xx-card-header">Records</div>
      <div class="xx-table-scroll">
        <table class="xx-table">
          <thead>
            <tr>
              <th>Column A</th>
              <th>Column B</th>
            </tr>
          </thead>
          <tbody>
            @for (row of data; track row.id) {
            <tr>
              <td>{{ row.a }}</td>
              <td>{{ row.b }}</td>
            </tr>
            } @if (data.length === 0) {
            <tr>
              <td colspan="2" class="xx-no-data">No data available</td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
```

### `my-dashboard.component.css`

```css
/* ── Light mode (default) ── */
:host {
  --xx-bg: #f0f4f8;
  --xx-surface: #ffffff;
  --xx-card-bg: rgba(255, 255, 255, 0.72);
  --xx-card-border: rgba(255, 255, 255, 0.6);
  --xx-text: #1b1c1d;
  --xx-muted: #555;
  --xx-border: #e1e4e8;
  --xx-hover-bg: rgba(0, 112, 210, 0.04);
  --xx-card-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  --xx-card-radius: 16px;
  --xx-kpi-bg: #f4f5f6;
  display: block;
}

/* ── Dark mode ── */
:host(.dark-theme) {
  --xx-bg: #0f1923;
  --xx-surface: #111b25;
  --xx-card-bg: rgba(28, 44, 58, 0.85);
  --xx-card-border: rgba(42, 63, 80, 0.6);
  --xx-text: #e0e6ed;
  --xx-muted: #8899a6;
  --xx-border: #2a3f50;
  --xx-hover-bg: rgba(255, 255, 255, 0.06);
  --xx-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  --xx-card-radius: 16px;
  --xx-kpi-bg: rgba(26, 39, 51, 0.8);
}

/* ── Dashboard wrapper ── */
.xx-dashboard {
  min-height: 100vh;
  color: var(--xx-text);
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  padding-bottom: 16px;
}

/* ── Header ── */
.xx-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:host(.dark-theme) .xx-header {
  background: rgba(26, 39, 51, 0.8);
  border-bottom-color: var(--xx-border);
}

.xx-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--xx-text);
}

.xx-title-accent {
  color: #00bceb;
}

/* ── Grid ── */
.xx-grid {
  display: grid;
  gap: 16px;
  padding: 0 16px;
}

.xx-grid-bot {
  grid-template-columns: 1fr 1fr 1fr;
}
.xx-grid-mid {
  grid-template-columns: 1fr 1fr;
}
.xx-grid-2col {
  grid-template-columns: 3fr 2fr;
}

/* ── Glass card ── */
.xx-card {
  background: var(--xx-card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--xx-card-border);
  border-radius: var(--xx-card-radius);
  box-shadow: var(--xx-card-shadow);
  overflow: hidden;
}

.xx-card-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--xx-text);
  border-bottom: 1px solid var(--xx-border);
}

/* ── KPI ── */
.xx-kpi {
  padding: 24px 20px;
  background: var(--xx-card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--xx-card-border);
  border-radius: var(--xx-card-radius);
  box-shadow: var(--xx-card-shadow);
}

.xx-kpi-label {
  color: var(--xx-muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  margin-bottom: 8px;
}

.xx-kpi-value {
  font-size: 29px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--xx-text);
}

/* ── Table ── */
.xx-table-scroll {
  overflow-x: auto;
  overflow-y: auto;
}

.xx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.xx-table th {
  text-align: left;
  padding: 10px 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: linear-gradient(
    to bottom,
    #ffffff 0%,
    #ffffff 50%,
    rgba(255, 255, 255, 0) 100%
  );
  color: var(--xx-text);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

:host(.dark-theme) .xx-table th {
  background: rgba(28, 44, 58, 0.85);
  color: #e0e6ed;
}

.xx-table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--xx-border);
  font-size: 11px;
}

.xx-table tr:last-child td {
  border-bottom: none;
}
.xx-table tr:hover td {
  background: var(--xx-hover-bg);
}

:host(.dark-theme) .xx-table td {
  border-bottom-color: #2a3f50;
  color: #e0e6ed;
}

:host(.dark-theme) .xx-table tr:hover td {
  background: rgba(0, 188, 235, 0.06);
}

.xx-no-data {
  text-align: center;
  padding: 24px;
  color: var(--xx-muted);
  font-size: 12px;
}

/* ── Responsive ── */
@media (max-width: 1200px) {
  .xx-grid-bot {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 800px) {
  .xx-grid-bot,
  .xx-grid-mid,
  .xx-grid-2col {
    grid-template-columns: 1fr;
  }

  .xx-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
```
