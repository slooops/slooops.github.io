---
description: "Use when creating or editing Angular UI components, templates, styles, or services. Covers component architecture, theming, icons, and CSS patterns for the revenue monitoring dashboard."
applyTo: "revenue-monitoring-ui/**"
---

# Angular UI Standards

## Component Architecture

- All components must be **standalone**: `@Component({ standalone: true })`
- Use Angular 17+ control flow: `@if`, `@for`, `@switch` — **never** `*ngIf`, `*ngFor`, `*ngSwitch`
- Import dependencies directly in the component's `imports` array

## Icons — Phosphor Only

- Import from `@ng-icons/phosphor-icons/bold` (or `/duotone` for special cases)
- Register in `app.component.ts` via `provideIcons({ ... })`
- Render: `<ng-icon name="phosphorXxxBold" />`
- **Never** use emoji characters as icons (no `⊞`, `⚠`, `◎`, `✦`)
- Before adding a new icon, check `app.component.ts` for existing registrations to avoid duplicates

## CSS — Scoped Custom Properties

Every component CSS file must follow this pattern:

```css
:host {
  --xx-bg: #f0f4f8; /* page background */
  --xx-surface: #ffffff; /* surface/container */
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
}
```

Replace `xx` with a short component-specific prefix (e.g., `ciq` for caseiq, `sh` for self-healing).

### Rules

- Reference `var(--xx-*)` throughout the component — **never** hardcode colors in element rules
- Every `:host` block must have a matching `:host(.dark-theme)` block
- All font sizes in `rem` — never `px`
- Base font size: `0.8rem`, table headers: `0.6875rem`, KPI numbers: `1.5rem`–`2rem`
- Use global `--fit-*` tokens from `src/assets/ui.css` when applicable

## Card Pattern

```css
.card {
  background: var(--xx-card-bg);
  border: 1px solid var(--xx-card-border);
  border-radius: var(--xx-card-radius);
  box-shadow: var(--xx-card-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

## Sticky Header Pattern

```css
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.75);
}
:host(.dark-theme) .header {
  background: rgba(15, 25, 35, 0.8);
}
```

## Border Radius Scale

| Use case                      | Value   |
| ----------------------------- | ------- |
| Badges, chips, small elements | 4–8px   |
| Cards, panels                 | 12–16px |
| Pills, rounded buttons        | 999px   |

## Routing

When adding a new routed component:

1. Define the route in `app-routing.module.ts`
2. Add a nav menu entry in `app.component.html` with a phosphor icon
3. Gate the menu entry with `@if (hasRole('REQUIRED_ROLE'))`
4. For CaseIQ sub-tabs, register in `esp-home.component.ts` tile definitions

## Reference Implementation

See `caseiq-monitoring-dashboard.component.css` for the gold-standard pattern covering:

- Light/dark `:host` variables
- Glass card aesthetic
- Sticky blurred header
- Inline SVG line chart with gradient fill
- Custom tooltip positioning
