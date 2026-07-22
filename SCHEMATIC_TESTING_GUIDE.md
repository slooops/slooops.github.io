# Schematic Testing Guide

## Setup & Installation

### Step 1: Install the Angular app dependencies

From the root workspace:

```bash
cd revenue-monitoring-ui/angular-app
npm install
```

The local schematic package is installed automatically from `file:./schematics`, so no manual linking is required.

---

## Test Command

Run the schematic with a test component name:

### Basic Test (minimal options)

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker
```

This will create:

- `src/app/invoice-tracker/invoice-tracker.component.ts`
- `src/app/invoice-tracker/invoice-tracker.component.html`
- `src/app/invoice-tracker/invoice-tracker.component.css`
- `src/app/invoice-tracker/invoice-tracker.component.spec.ts` (if not skipped)

Title will auto-derive to: **Invoice Tracker**

### Advanced Test (with options)

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker \
  --title="Custom Title" \
  --selectorPrefix="ciq" \
  --assignmentFilterKey="assignedTo" \
  --path="src/app/dashboards"
```

This will create in `src/app/dashboards/invoice-tracker/`

---

## Validation Checklist

After running the schematic, verify:

- [ ] **Component files created** in correct path
  - Check: `ls src/app/invoice-tracker/`
  - Expected: `.ts`, `.html`, `.css`, `.spec.ts` files

- [ ] **Title correctly derived**
  - Check: `grep "Dashboard: Invoice Tracker" src/app/invoice-tracker/invoice-tracker.component.ts`
  - Expected: Title appears in component decorator

- [ ] **Selector correctly formatted**
  - Check: `grep "selector:" src/app/invoice-tracker/invoice-tracker.component.ts`
  - Expected: `selector: 'app-invoice-tracker'` or custom prefix if specified

- [ ] **Marker comments present**
  - Check TypeScript:
    ```bash
    grep "VISIBLE_TABS\|FIELD_CONFIG\|FILTER_CONFIGS\|URL_MAPS\|KEYS_TO_MAP" src/app/invoice-tracker/invoice-tracker.component.ts
    ```
  - Expected: All markers found

  - Check HTML:
    ```bash
    grep "DASHBOARD_CASES" src/app/invoice-tracker/invoice-tracker.component.html
    ```
  - Expected: HTML marker found

- [ ] **Dark mode CSS present**
  - Check: `grep "dark-theme" src/app/invoice-tracker/invoice-tracker.component.css`
  - Expected: Dark mode variables defined

- [ ] **Component compiles**

  ```bash
  ng build
  ```

  - Expected: Build succeeds with no errors

---

## Troubleshooting

### Schematic not found

```
Error: Collection "@rev-ops-monitoring/dashboard-schematics" cannot be resolved.
```

**Solution:**

1. Verify the local dependency exists in `package.json`
2. Reinstall from the Angular app root: `rm -rf node_modules package-lock.json && npm install`
3. Clear Angular cache: `rm -rf .angular/cache`

### TypeScript errors after generation

```
Error: Property 'UserContext' does not exist
```

**Solution:**

1. Ensure `shared/models/UserContext.interface.ts` exists
2. Verify import path in generated component
3. Run `ng build` to see full errors

### Template files not found

```
Error: Could not find schematic template files
```

**Solution:**

1. Verify file structure:

   ```bash
   ls -la revenue-monitoring-ui/angular-app/schematics/monitoring-dashboard/files/
   ```

   - Expected: `__name@dasherize__.component.ts.template`
   - Expected: `__name@dasherize__.component.html.template`
   - Expected: `__name@dasherize__.component.css.template`

2. Verify `index.ts` uses correct `url()` path: `url('./files')`

### Local dependency install failed

```
Error: Cannot resolve local package ./schematics
```

**Solution:**

```bash
cd revenue-monitoring-ui/angular-app
rm -rf node_modules package-lock.json
npm install
```

---

## Post-Generation Workflow

Once schematic validation passes:

### 1. Run backend code generation prompt

With your SQL queries and config, use the **Backend Code Generation Prompt** to generate:

- Service class
- Controller endpoints
- envfile.json entries

### 2. Run Angular UI prompt

Pass the backend output to the **Angular UI Code Generation Prompt** to generate:

- VISIBLE_TABS config
- FILTER_CONFIGS arrays
- URL_MAPS object
- KEYS_TO_MAP object
- DASHBOARD_CASES @case blocks

### 3. Manual integration

Copy-paste AI-generated code blocks into the marker locations in your component

### 4. Compile and test

```bash
ng build
ng serve
```

---

## Quick Test One-Liner

Generate, validate, and build:

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard test-component && \
  grep -c "VISIBLE_TABS" src/app/test-component/test-component.component.ts && \
  echo "✓ Marker comments present" && \
  ng build
```

---

## Files Created by Schematic

Location: `revenue-monitoring-ui/angular-app/schematics/`

```
revenue-monitoring-ui/angular-app/schematics/
├── package.json (NPM manifest)
├── collection.json (Schematic declaration)
└── monitoring-dashboard/
    ├── index.ts (Schematic factory)
    ├── schema.json (CLI option definitions)
    ├── README.md (Full documentation)
    └── files/
        ├── __name@dasherize__.component.ts.template
        ├── __name@dasherize__.component.html.template
        ├── __name@dasherize__.component.css.template
        └── __name@dasherize__.component.spec.ts.template
```

---

## Next Steps

1. **Run the basic test** and report results
2. **Verify all markers** are present
3. **Once validated**, we'll generate the:
   - Angular UI Code Generation Prompt
   - Backend integration tests

Ready to test? Run:

```bash
cd revenue-monitoring-ui/angular-app
npm install
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard test-dashboard
```
