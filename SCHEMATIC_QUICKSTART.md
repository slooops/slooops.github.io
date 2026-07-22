# ✨ Monitoring Dashboard Schematic - Quick Start

## 📋 What's Ready to Test

All schematic files are now in place:

```
revenue-monitoring-ui/angular-app/schematics/
├── package.json                    # NPM manifest
├── tsconfig.json                   # TypeScript config
├── .gitignore                      # Git exclusions
├── collection.json                 # Schematic declaration
└── monitoring-dashboard/
    ├── index.ts                    # Factory (component generator)
    ├── schema.json                 # CLI option definitions
    ├── README.md                   # Full documentation
    └── files/
        ├── __name@dasherize__.component.ts.template    # TS component
        ├── __name@dasherize__.component.html.template  # HTML template
        ├── __name@dasherize__.component.css.template   # CSS with dark mode
        └── __name@dasherize__.component.spec.ts.template # Unit tests
```

## 🚀 Quick Test (2 minutes)

### Option 1: Automated (Recommended)

```bash
bash test-schematic.sh invoice-tracker
```

This runs the full test suite with validation:

- ✅ Installs dependencies
- ✅ Generates component
- ✅ Validates marker comments
- ✅ Compiles Angular app
- ✅ Reports results

### Option 2: Manual

```bash
# Setup
cd revenue-monitoring-ui/angular-app && npm install

# Test
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker

# Verify
ls -la src/app/invoice-tracker/
grep VISIBLE_TABS src/app/invoice-tracker/invoice-tracker.component.ts
ng build
```

## ✅ Expected Output

After running the schematic, you should see:

**File Structure:**

```
src/app/invoice-tracker/
├── invoice-tracker.component.ts      # ← Edit here (paste config)
├── invoice-tracker.component.html    # ← Edit here (paste cases)
├── invoice-tracker.component.css     # Ready to use
└── invoice-tracker.component.spec.ts # Ready to use
```

**Component Contents (TypeScript):**

- ✅ Standalone component decorator
- ✅ UserContext interface and import
- ✅ Constructor with default userData
- ✅ ngOnInit with query-param handling
- ✅ Marker: **VISIBLE_TABS** (empty array to replace)
- ✅ Marker: **FIELD_CONFIG** (array to replace)
- ✅ Marker: **FILTER_CONFIGS** (arrays to insert)
- ✅ Marker: **KEYS_TO_MAP** (arrays to insert)
- ✅ Marker: **URL_MAPS** (objects to insert)
- ✅ All event handlers and methods (don't edit these)

**Template Contents (HTML):**

- ✅ Sticky header with title and period info
- ✅ Tab switcher component
- ✅ Marker: **DASHBOARD_CASES** (insert @case blocks here)
- ✅ Loading state for roles not yet loaded
- ✅ Dark mode support

**Styling (CSS):**

- ✅ Light mode color variables
- ✅ Dark mode overrides (`:host(.dark-theme)`)
- ✅ Responsive header layout
- ✅ Card and surface styling patterns

## 📦 CLI Options Reference

When running the schematic:

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard <name> [options]
```

| Option                  | Type    | Default                  | Purpose                                        |
| ----------------------- | ------- | ------------------------ | ---------------------------------------------- |
| `name`                  | string  | **required**             | Component name (kebab-case: `invoice-tracker`) |
| `--title`               | string  | Auto-derived             | Custom title (default: `Invoice Tracker`)      |
| `--selectorPrefix`      | string  | `app-`                   | CSS selector prefix (e.g., `ciq-`)             |
| `--assignmentFilterKey` | string  | `FILTER_KEY_PLACEHOLDER` | Filter key name                                |
| `--path`                | string  | `src/app`                | Output directory                               |
| `--skipTests`           | boolean | false                    | Skip spec file generation                      |

### Examples:

**Basic (auto-title):**

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker
# Creates: src/app/invoice-tracker/ with title "Invoice Tracker"
```

**With custom options:**

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker \
  --title="Invoicing Status" \
# Creates: src/app/dashboards/invoice-tracker/
  --selectorPrefix="ciq-" \
  --assignmentFilterKey="assignedTo" \
  --path="src/app/dashboards"
```

## 🔍 What to Look For in Generated Files

### Marker Comment: VISIBLE_TABS (TypeScript)

```typescript
// ────────────────────────────────────────────────────────────────────
// ─── VISIBLE_TABS (REPLACE EMPTY ARRAY BELOW WITH AI-GENERATED CODE)
// ────────────────────────────────────────────────────────────────────
visibleTabs: {
  label: string;
  component: string;
  role: string[];
  disabled?: boolean;
}[] = [];
```

**What to paste here:** Array of tab definitions from UI generation prompt

---

### Marker Comment: FILTER_CONFIGS (TypeScript)

```typescript
// ────────────────────────────────────────────────────────────────────
// ─── FILTER_CONFIGS (INSERT FILTER ARRAYS BELOW)
// ────────────────────────────────────────────────────────────────────
const filterConfig: Record<string, Array<{ label: string; value: any }>> = {};
```

**What to paste here:** Filter configuration objects from UI prompt

---

### Marker Comment: DASHBOARD_CASES (HTML)

```html
<!-- ─── DASHBOARD_CASES (INSERT AI-GENERATED @case BLOCKS BELOW) ──── -->
<!-- Remove this comment and replace with:
  @case ("app-feature-name") {
    <app-monitoring-dashboard
      [selectedMetrics]="tabs[selectedIndex]?.component"
      [filters]="filters"
      [userContext]="userContextData">
    </app-monitoring-dashboard>
  }
-->
```

**What to paste here:** Tab case blocks from UI prompt

---

### Dark Mode Support (CSS)

The component CSS automatically includes dark mode styling. Test with:

```typescript
// In parent component:
<invoice-tracker class="dark-theme"></invoice-tracker>
```

## 🛠️ After Validation Passes

Once you confirm the schematic works, we'll proceed with:

### Phase 1: Backend Code Generation ✅ (Ready)

**Input:** Your SQL queries + parameter info
**Output:** Spring Boot Service + Controller classes
**Prompt:** Already created and tested

### Phase 2: Angular UI Code Generation ⏳ (Next)

**Input:** Backend output (uiEndpointMap, keysToMap) + dashboard config
**Output:** Implementation guide with copy-paste blocks for all markers
**Prompt:** Waiting for schematic validation

### Phase 3: Manual Integration (User)

1. Run backend prompt → copy Service & Controller classes
2. Run UI prompt → copy 5 config blocks
3. Paste each block at its marker comment location
4. Compile and deploy

### Phase 4: Testing ⏳ (After integration)

1. Unit tests for service layer
2. Component integration tests
3. E2E tests in Cypress

## 📞 Support

### Test Failed?

See [SCHEMATIC_TESTING_GUIDE.md](SCHEMATIC_TESTING_GUIDE.md) → Troubleshooting section

### Questions About Structure?

See [revenue-monitoring-ui/angular-app/schematics/monitoring-dashboard/README.md](revenue-monitoring-ui/angular-app/schematics/monitoring-dashboard/README.md)

### Need to Regenerate?

```bash
rm -rf src/app/invoice-tracker/
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker
```

## ✨ Design Philosophy

This schematic implements a **stable scaffold + flexible configuration** approach:

| Component                  | Owner     | Reason                         |
| -------------------------- | --------- | ------------------------------ |
| **Lifecycle hooks**        | Schematic | Same for all dashboards        |
| **Event handlers**         | Schematic | Consistent patterns            |
| **Type definitions**       | Schematic | UserContext, filter interfaces |
| **Dark mode CSS**          | Schematic | Global theme support           |
| **Tab switching logic**    | Schematic | Query-param routing            |
| **VISIBLE_TABS array**     | AI Prompt | Dashboard-specific config      |
| **FILTER_CONFIGS**         | AI Prompt | Business logic                 |
| **URL_MAPS object**        | AI Prompt | Endpoint mapping               |
| **DASHBOARD_CASES blocks** | AI Prompt | Component rendering            |

This split ensures:

- ✅ **Stability:** Framework code doesn't change between features
- ✅ **Flexibility:** Config is AI-generated and highly customizable
- ✅ **Control:** Users see exactly what's being pasted (no hidden code)
- ✅ **Maintainability:** Framework updates don't break feature configs

---

**Ready to test?** Run:

```bash
bash test-schematic.sh invoice-tracker
```

Report back with results and we'll move to **Phase 2: Angular UI Code Generation Prompt** 🎯
