# Rev Ops Monitoring — Copilot Instructions

## Tech Stack

- **Framework**: Angular 17+ with standalone components
- **Control flow**: Use `@if`, `@for`, `@switch` block syntax — never `*ngIf` / `*ngFor`
- **Icons**: `@ng-icons/phosphor-icons/bold` via `provideIcons()` — **never use emoji characters as icons**
- **Styling**: Component-scoped CSS with `:host` custom properties; global tokens in `src/assets/ui.css`
- **Build**: Angular CLI (`ng serve`, `ng build`)

## Design Tokens

All global tokens live in `revenue-monitoring-ui/angular-app/src/assets/ui.css` under `:root`.
Prefix: `--fit-*`. Always prefer existing tokens over hardcoded values.

### Key tokens

| Category      | Tokens                                                                                                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Font sizes    | `--fit-font-size-xs` (0.7rem), `--fit-font-size-sm` (0.75rem), `--fit-font-size-base` (0.8rem), `--fit-font-size-lg` (1rem), `--fit-font-size-xl` (1.25rem)                                                                   |
| Font weights  | `--fit-font-weight-normal` (400), `--fit-font-weight-medium` (500), `--fit-font-weight-semibold` (600)                                                                                                                        |
| Border radius | `--fit-radius-sm` (4px), `--fit-radius-md` (8px), `--fit-radius-lg` (12px), `--fit-radius-pill` (999px)                                                                                                                       |
| Spacing       | `--fit-space-2xs` → `--fit-space-xl` (0.125rem → 1.5rem)                                                                                                                                                                      |
| Colors        | `--fit-color-primary`, `--fit-color-success`, `--fit-color-error`, `--fit-color-warning`, `--fit-color-danger`, `--fit-color-text`, `--fit-color-text-muted`, `--fit-color-bg`, `--fit-color-bg-subtle`, `--fit-color-border` |
| Shadows       | `--fit-shadow-sm`, `--fit-shadow-md`                                                                                                                                                                                          |
| Transitions   | `--fit-transition-fast` (150ms), `--fit-transition-normal` (250ms)                                                                                                                                                            |

If a value you need is not tokenized, define a component-scoped custom property with a `--<prefix>-` namespace (e.g., `--ciq-` for caseiq-monitoring).

## Color Palette

These semantic colors appear frequently and must stay consistent:

| Color        | Hex (light)           | Usage                                   |
| ------------ | --------------------- | --------------------------------------- |
| Cisco Blue   | `#0070d2`             | Primary actions, links, accents         |
| Cyan         | `#00bceb`             | Informational highlights, CaseIQ accent |
| Green        | `#6ebe4a` / `#1c8c4c` | Success, healthy status                 |
| Red          | `#e53935` / `#dc2626` | Errors, critical status                 |
| Yellow/Amber | `#e6a800` / `#f39c12` | Warnings, caution                       |
| Orange       | `#ff6600`             | Secondary alert                         |
| Purple       | `#9933ff`             | Tertiary category                       |

## Icons

- **Only** use phosphor icons from `@ng-icons/phosphor-icons/bold` (or `/duotone` for special cases or large illustrative icons)
- Register icons in `app.component.ts` via `provideIcons()`
- Render with `<ng-icon name="phosphorXxxBold" />`
- **Never** use emoji characters (`⊞`, `⚠`, `◎`, `✦`) as UI icons
- Check existing registrations before adding duplicates — see `app.component.ts`

### Currently registered icons

`phosphorIdentificationCardBold`, `phosphorEyeBold`, `phosphorBinocularsBold`, `phosphorFolderOpenBold`, `phosphorCalendarCheckBold`, `phosphorInvoiceBold`, `phosphorChartLineUpBold`, `phosphorClipboardTextBold`, `phosphorBookOpenBold`, `phosphorPulseBold`, `phosphorPackageBold`, `phosphorSlidersHorizontalBold`, `phosphorBrainBold`, `phosphorReceiptBold`, `phosphorRepeatBold`, `phosphorLightbulbBold`, `phosphorHeartbeatBold`, `phosphorUserBold`, `phosphorFirstAidKitBold`, `phosphorSquaresFourBold`, `phosphorWarningBold`, `phosphorCrosshairBold`, `phosphorSparkleBold`

## Component CSS Pattern

Every new component **must** define a `:host` block with scoped custom properties and a `:host(.dark-theme)` override. Use a short prefix unique to the component.

```css
/* REQUIRED pattern for all dashboard components */
:host {
  --xx-bg: #f0f4f8;
  --xx-surface: #ffffff;
  --xx-card-bg: rgba(255, 255, 255, 0.72);
  --xx-card-border: rgba(255, 255, 255, 0.6);
  --xx-text: #1b1c1d;
  --xx-muted: #555;
  --xx-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  --xx-card-radius: 16px;
  display: block;
}

:host(.dark-theme) {
  --xx-bg: #0f1923;
  --xx-surface: #1a2733;
  --xx-card-bg: rgba(28, 44, 58, 0.85);
  --xx-card-border: rgba(42, 63, 80, 0.6);
  --xx-text: #e0e6ed;
  --xx-muted: #8899a6;
  --xx-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  --xx-card-radius: 16px;
}
```

Reference implementation: `caseiq-monitoring-dashboard.component.css`

## Dark Mode

- **Every** component must support dark mode via `:host(.dark-theme)` overrides
- Dark mode is toggled by adding the `dark-theme` class to the component host
- Test both light and dark mode before considering a component complete
- Dark background base: `#0f1923`, surface: `#1a2733`
- Dark text: `#e0e6ed`, muted text: `#8899a6`

## Card & Surface Styling

Standard card pattern (glass aesthetic):

```css
.card {
  background: var(--xx-card-bg);
  border: 1px solid var(--xx-card-border);
  border-radius: var(--xx-card-radius); /* 16px standard */
  box-shadow: var(--xx-card-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### Border radius scale

| Use case                       | Value   | Token                                 |
| ------------------------------ | ------- | ------------------------------------- |
| Small elements (badges, chips) | 4–8px   | `--fit-radius-sm` / `--fit-radius-md` |
| Cards, panels                  | 12–16px | `--fit-radius-lg` / component var     |
| Pills, rounded buttons         | 999px   | `--fit-radius-pill`                   |

## Header Pattern

Dashboard components should use a sticky blurred header:

```css
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.75); /* light */
  /* dark: rgba(15, 25, 35, 0.8) */
}
```

## Typography

- **Always** use `rem` units for font sizes — never `px`
- Base font size: `0.8rem` (`--fit-font-size-base`)
- Table header cells: `0.6875rem` (11px equivalent)
- KPI large numbers: `1.5rem`–`2rem`
- Font family: `var(--fit-font-family-base)` (Inter, system-ui fallback)

## Units

- Font sizes: `rem`
- Spacing / padding / margins: `rem` or `px` (small values like 1–4px are fine in `px`)
- Border radius: `px`
- Line heights: unitless

## Routing & Navigation

### Adding a new route

1. Add the route in `app-routing.module.ts`
2. Add a nav menu item in `app.component.html` with a phosphor icon
3. Wrap the menu item in a role check: `@if (hasRole('REQUIRED_ROLE'))`, always include admin
4. If the route is a CaseIQ sub-tab, register it in `esp-home.component.ts` tile definitions

## New Component Checklist

When creating a new dashboard component:

- [ ] Standalone component with `@Component({ standalone: true })`
- [ ] `:host` CSS block with scoped custom properties (light mode)
- [ ] `:host(.dark-theme)` CSS block (dark mode overrides)
- [ ] Sticky blurred header
- [ ] Glass card styling with `backdrop-filter`
- [ ] Phosphor icons only (registered in `app.component.ts`)
- [ ] Route added in `app-routing.module.ts`
- [ ] Nav menu entry in `app.component.html` with role guard
- [ ] `rem` for all font sizes
- [ ] Responsive layout considerations
- [ ] Both light and dark mode tested
