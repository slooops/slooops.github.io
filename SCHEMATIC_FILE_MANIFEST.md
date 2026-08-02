# Schematic Structure & File Manifest

## 📁 Directory Tree

```
revenue-monitoring-ui/angular-app/schematics/
├── .gitignore                                      # Git exclusions (node_modules, dist, etc)
├── package.json                                    # NPM manifest & peer dependencies
├── tsconfig.json                                   # TypeScript compilation config
├── collection.json                                 # Schematic collection declaration
│
└── monitoring-dashboard/
    ├── index.ts                                    # 🏭 Factory function (schematic generator)
    ├── schema.json                                 # CLI option definitions & validation
    ├── README.md                                   # Full documentation & usage guide
    │
    └── files/                                      # Template files (applied by factory)
        ├── __name@dasherize__.component.ts.template     # TypeScript component template
        ├── __name@dasherize__.component.html.template   # HTML template
        ├── __name@dasherize__.component.css.template    # CSS with dark mode
        └── __name@dasherize__.component.spec.ts.template # Unit test template
```

---

## 📄 File Descriptions

### Root Configuration Files

#### `package.json`

- **Purpose:** NPM package manifest for the schematics collection
- **Key Sections:**
  - `name`: `@rev-ops-monitoring/dashboard-schematics`
  - `schematics`: Points to `collection.json`
  - `peerDependencies`: Requires Angular 17+
- **Used by:** Angular app `npm install` via `file:./schematics`

#### `collection.json`

- **Purpose:** Schematic collection registry
- **Key Sections:**
  - Declares the `monitoring-dashboard` schematic
  - References `index.ts#default` as the factory
  - Links to `schema.json` for CLI options
- **Used by:** Angular CLI when running `ng generate`

#### `tsconfig.json`

- **Purpose:** TypeScript compilation settings for schematic factory
- **Key Settings:**
  - `target`: `es2020`
  - `module`: `commonjs` (for Node.js)
  - Strict mode enabled
- **Used by:** TypeScript compiler when building schematics

#### `.gitignore`

- **Purpose:** Exclude build artifacts and dependencies
- **Excludes:** `node_modules/`, `dist/`, `*.js`, `*.log`
- **Preserves:** `*.template` files (templates must be committed)

---

### Schematic Factory

#### `monitoring-dashboard/index.ts` (70 lines)

- **Type:** TypeScript factory function
- **Purpose:** Process CLI options and generate component files
- **Key Functions:**
  - `titleCase(input: string)` — Converts kebab-case to Title Case
  - `default(options)` — Main factory that applies templates
- **Input:** MonitoringDashboardOptions interface
  - `name` (required): Component name
  - `title` (optional): Custom title
  - `selectorPrefix` (optional): CSS selector prefix
  - `assignmentFilterKey` (optional): Filter key name
  - `path` (optional): Output directory
  - `skipTests` (optional): Skip spec file
- **Output:** Angular Rule that:
  - Normalizes file paths
  - Substitutes template variables
  - Applies built-in string transformations (@angular-devkit/core)
  - Moves files to destination directory
- **Technology:** @angular-devkit/schematics, @angular-devkit/core

#### `monitoring-dashboard/schema.json` (80 lines)

- **Type:** JSON Schema
- **Purpose:** Define CLI options and validation rules
- **Key Properties:**
  | Option | Type | Required | Default |
  |--------|------|----------|---------|
  | `name` | string | YES | — |
  | `title` | string | NO | Auto-derived |
  | `selectorPrefix` | string | NO | `app-` |
  | `assignmentFilterKey` | string | NO | `FILTER_KEY_PLACEHOLDER` |
  | `path` | string | NO | `src/app` |
  | `skipTests` | boolean | NO | false |
- **Used by:** `ng generate` CLI for argument validation

#### `monitoring-dashboard/README.md` (500+ lines)

- **Type:** Markdown documentation
- **Purpose:** Complete user guide and reference
- **Sections:**
  1. Installation and setup
  2. CLI usage examples
  3. Schema option reference
  4. Generated files structure
  5. Marker comment guide
  6. AI insertion contract
  7. End-to-end workflow (5 phases)
  8. Troubleshooting guide
- **Audience:** Developers using the schematic

---

### Template Files (in `files/` subdirectory)

These files are automatically processed by the factory when `ng generate` runs.

#### `__name@dasherize__.component.ts.template` (270 lines)

- **Purpose:** Generate TypeScript component with all marker comments
- **Key Sections:**
  1. **Imports** — Angular, UserContext, interfaces
  2. **UserContext Interface** — User data structure
  3. **Component Decorator** — Selector, template, styles
  4. **Constructor** — Default userContextData initialization
  5. **ngOnInit** — Query-param based tab selection
  6. **Marker: VISIBLE_TABS** — Tab definitions array (user replaces)
  7. **Marker: FIELD_CONFIG** — Field configuration array
  8. **Marker: FILTER_CONFIGS** — Filter configuration objects
  9. **Marker: KEYS_TO_MAP** — Key mapping arrays
  10. **Marker: URL_MAPS** — Endpoint URL maps
  11. **Event Handlers** — onTabChange, subscription methods (framework-owned)
- **Template Variables** (processed by factory):
  - `<%= selectorPrefix %>` → Replaced with prefix (e.g., `app-`)
  - `<%= dasherize(name) %>` → Kebab-case component name
  - `<%= title %>` → Dashboard title
  - `<%= assignmentFilterKey %>` → Filter key name
- **Markers:** All marker sections clearly labeled with divider comments

#### `__name@dasherize__.component.html.template` (80 lines)

- **Purpose:** Generate HTML template with dashboard structure
- **Key Sections:**
  1. **Dashboard Header** — Sticky, with period info
  2. **Role-based Tab Filtering** — @if role checks
  3. **Tab Switcher** — Click handlers for tab navigation
  4. **@switch Statement** — Component routing based on tab
  5. **Marker: DASHBOARD_CASES** — @case blocks for each tab (user inserts)
  6. **Loading State** — Centered spinner for loading user context
- **Features:**
  - Dark mode support via `:host(.dark-theme)` class
  - Responsive layout
  - Period info with date formatting
- **Marker:** Single large insertion point at DASHBOARD_CASES

#### `__name@dasherize__.component.css.template` (70 lines)

- **Purpose:** Provide base styling with dark mode support
- **Key Sections:**
  1. **Light Mode Variables** — Color palette for light theme
  2. **Dark Mode Overrides** — `:host(.dark-theme)` block
  3. **Header Styling** — Sticky positioning, gradient
  4. **Content Area** — Padding, background
  5. **Responsive Layout** — Flexbox patterns
- **CSS Custom Properties:**
  - `--dashboard-bg` — Background color
  - `--dashboard-surface` — Card/surface color
  - `--dashboard-text` — Text color
  - `--dashboard-muted` — Secondary text
  - `--dashboard-border` — Border colors
  - `--dashboard-shadow` — Box shadows
- **No Markers:** CSS is ready-to-use, no insertions needed

#### `__name@dasherize__.component.spec.ts.template` (30 lines)

- **Purpose:** Generate unit test file
- **Key Tests:**
  1. Component creation check
  2. visibleTabs initialization
  3. selectedIndex default value
  4. userContext loading
- **Features:**
  - Uses Angular TestBed and ComponentFixture
  - Tests lifecycle hooks
  - Ready for extension (user can add more tests)
- **No Markers:** Tests are framework-owned

---

## 🔄 Template Variable Substitution

The factory applies these transformations automatically:

| Schematics Function | Input      | Output     | Example                               |
| ------------------- | ---------- | ---------- | ------------------------------------- |
| `dasherize()`       | camelCase  | kebab-case | `invoiceTracker` → `invoice-tracker`  |
| `classify()`        | kebab-case | PascalCase | `invoice-tracker` → `InvoiceTracker`  |
| `camelize()`        | kebab-case | camelCase  | `invoice-tracker` → `invoiceTracker`  |
| `underscore()`      | kebab-case | snake_case | `invoice-tracker` → `invoice_tracker` |

**Template Syntax:**

```
<%= functionName(variableName) %>  // Evaluate and substitute
<% if (condition) %>              // Conditional block
<% } %>                           // End block
```

---

## 📊 Generation Flow

```
User Input (CLI)
    ↓
    └─→ ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard <name> [options]
            ↓
            └─→ index.ts (factory) processes options
                    ↓
                    ├─→ Validates via schema.json
                    ├─→ Normalizes paths
                    ├─→ Applies string transformations (dasherize, classify, etc)
                    ├─→ Loads template files from files/
                    ├─→ Substitutes variables in templates
                    ├─→ Moves files to output directory
                    │
                    └─→ Generates 4 files in src/app/<name>/
                            ├─ <name>.component.ts (with 6 markers)
                            ├─ <name>.component.html (with 1 marker)
                            ├─ <name>.component.css (ready to use)
                            └─ <name>.component.spec.ts (ready to use)
```

---

## 🎯 File Purposes by Owner

### Schematic Framework (Do NOT Modify)

- **index.ts** — Factory logic
- **schema.json** — CLI options
- **collection.json** — Package registry
- **tsconfig.json** — Build config
- **package.json** — Dependencies

### Templates (Can Update Framework, Keep Markers)

- **component.ts.template** — TypeScript scaffold with markers
- **component.html.template** — HTML scaffold with marker
- **component.css.template** — Styling (no markers)
- **component.spec.ts.template** — Tests (no markers)

### Generated Components (User Edits Here)

- **component.ts** — Replace markers, keep framework code
- **component.html** — Insert marker content
- **component.css** — Use as-is or extend
- **component.spec.ts** — Add more tests as needed

---

## 🚀 Quick Reference

### Install & Link

```bash
cd revenue-monitoring-ui/angular-app && npm install
```

### Generate Component

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard <name> [options]
```

### Validate Files

```bash
ls -la src/app/<name>/
grep -c "VISIBLE_TABS" src/app/<name>/<name>.component.ts  # Should output: 1
```

### Test Build

```bash
ng build
```

---

## ✅ Checklist for Successful Generation

After running `ng generate`, verify:

- [ ] 4 files created in `src/app/<name>/`
  - `.ts` file (270 lines)
  - `.html` file (80 lines)
  - `.css` file (70 lines)
  - `.spec.ts` file (30 lines)

- [ ] Component name correctly kebab-cased
  - File: `invoice-tracker.component.ts`
  - Selector: `app-invoice-tracker`
  - Class: `InvoiceTrackerComponent`

- [ ] Title correctly derived
  - `invoice-tracker` → `Invoice Tracker`

- [ ] All marker comments present
  - TypeScript: VISIBLE_TABS, FILTER_CONFIGS, URL_MAPS, KEYS_TO_MAP
  - HTML: DASHBOARD_CASES
  - (CSS and spec.ts have no markers)

- [ ] Dark mode CSS defined
  - `:host(.dark-theme)` block present
  - Color variables defined

- [ ] Component compiles
  - `ng build` succeeds
  - No TypeScript errors

---

## 📝 Next Steps

1. **Test the schematic** using the test script
2. **Review generated files** and verify marker locations
3. **Run backend code generation prompt** with your SQL queries
4. **Run Angular UI prompt** with backend output
5. **Paste generated code** at marker locations
6. **Compile and deploy**

See [SCHEMATIC_QUICKSTART.md](../SCHEMATIC_QUICKSTART.md) for testing instructions.
