# Monitoring Dashboard Code Generation System

This system uses a **two-phase generation approach** to create monitoring dashboard containers efficiently.

## Phase 1: Generate Container Scaffold (Schematic)

The Angular schematic creates the stable container component shell with marker comments for manual code insertion.

### Installation

```bash
cd revenue-monitoring-ui/angular-app
npm install
```

The Angular app now depends on the local schematic package via `file:./schematics`, so fresh clones do not need `npm link`.

### Usage

**Basic usage** (auto-derives title from feature name):

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker
# Generates: src/app/invoice-tracker/
# Auto title: "Invoice Tracker"
```

**With custom title**:

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard gl-posting \
  --title="GL Posting Monitor"
# Overrides auto-derived title
```

**With custom assignment filter key**:

```bash
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard srt-process \
  --assignmentFilterKey="SRT"
# Sets assignmentUsersFilterKey value to "SRT" instead of default placeholder
```

### Schematic Options

| Option                  | Type    | Default                | Description                         |
| ----------------------- | ------- | ---------------------- | ----------------------------------- |
| `name`                  | string  | required               | Feature/container name (kebab-case) |
| `--title`               | string  | titlecase(name)        | Display title for header            |
| `--selectorPrefix`      | string  | app-                   | Component selector prefix           |
| `--assignmentFilterKey` | string  | FILTER_KEY_PLACEHOLDER | User context filter key             |
| `--skipTests`           | boolean | false                  | Skip spec file generation           |

### Generated Files

```
src/app/<name>/
├── <name>.component.ts          (TypeScript with marker comments)
├── <name>.component.html        (Template with marker comments)
├── <name>.component.css         (Styled container)
└── <name>.component.spec.ts     (Optional)
```

### Generated Structure (TypeScript)

The component includes:

- **Stable scaffold**: imports, constructor, lifecycle, auth, periodStatus, event handlers, subscription methods
- **Marker sections**: VISIBLE_TABS, FIELD_CONFIG, FILTER_CONFIGS, URL_MAPS, KEYS_TO_MAP
- **Empty config**: All user-facing config initialized as empty arrays/objects

The HTML includes:

- **Stable layout**: header, period info, loading state
- **Marker section**: DASHBOARD_CASES for `@case(...)` dashboard blocks

---

## Phase 2: Generate Feature Config (Backend Prompt)

The backend code generation prompt creates the Spring Boot backend code and outputs a `.md` file with:

- QueryConfigs, Service, Controller code blocks
- `uiEndpointMap` with all 4 controller URLs
- `keysToMap` derived from detailsFiltered columns

**See:** `backend-code-generation-prompt.md`

---

## Phase 3: Generate UI Config (UI Prompt)

The UI code generation prompt takes backend output + user input and generates a `.md` file with:

- VISIBLE_TABS replacement block
- FILTER_CONFIGS insertion blocks
- URL_MAPS insertion blocks
- KEYS_TO_MAP insertion blocks
- DASHBOARD_CASES insertion blocks
- Implementation checklist

**See:** `ui-code-generation-prompt.md`

---

## Phase 4: Manual Integration (App Team)

1. **Run schematic** → generates component shell with marker comments
2. **Run backend prompt** → generates backend code + endpoint URLs
3. **Run UI prompt** → generates feature config blocks
4. **Open component files** → view marker comments
5. **Copy/paste blocks** → user manually copies from `.md` files into component:
   - Find marker comment (e.g., `// ─── VISIBLE_TABS (REPLACE ...)`)
   - Copy code block from `.md`
   - Paste into component
   - Verify formatting
6. **Test & commit** → verify component compiles, test dashboard, create PR

---

## Marker Comment Reference

### In TypeScript (.ts file)

**VISIBLE_TABS**

```typescript
// ────────────────────────────────────────────────────────────────────
// ─── VISIBLE_TABS (REPLACE EMPTY ARRAY BELOW WITH AI-GENERATED CODE)
// ────────────────────────────────────────────────────────────────────
visibleTabs: { ... }[] = [];
```

User replaces the empty `[]` with the full `visibleTabs` array from the AI `.md`.

**FILTER_CONFIGS**

```typescript
// ────────────────────────────────────────────────────────────────────
// ─── FILTER_CONFIGS (INSERT AI-GENERATED FILTER ARRAYS BELOW)
// ────────────────────────────────────────────────────────────────────
// User inserts entire filter arrays after this comment
```

**FIELD_CONFIG**

```typescript
// ────────────────────────────────────────────────────────────────────
// ─── FIELD_CONFIG (REPLACE EMPTY ARRAY BELOW WITH AI-GENERATED CODE)
// ────────────────────────────────────────────────────────────────────
fieldConfig: { ... }[] = [];
```

User replaces the empty `[]` with the full field config array from the AI `.md`.

**URL_MAPS**

```typescript
// ────────────────────────────────────────────────────────────────────
// ─── URL_MAPS (INSERT AI-GENERATED URL MAP OBJECTS BELOW)
// ────────────────────────────────────────────────────────────────────
// User inserts entire URL map objects after this comment
```

**KEYS_TO_MAP**

```typescript
// ────────────────────────────────────────────────────────────────────
// ─── KEYS_TO_MAP (INSERT AI-GENERATED KEY ARRAYS BELOW)
// ────────────────────────────────────────────────────────────────────
// User inserts entire keysToMap arrays after this comment
```

### In HTML (.html file)

**DASHBOARD_CASES**

```html
<!-- ──────────────────────────────────────────────────────────────── -->
<!-- ─── DASHBOARD_CASES (INSERT AI-GENERATED @case BLOCKS BELOW) ──── -->
<!-- ──────────────────────────────────────────────────────────────── -->
<!-- User inserts @case(...) { <app-monitoring-dashboard ... /> } blocks after this comment -->
```

---

## Example Workflow

### Step 1: Generate Component

```bash
cd src/app
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard invoice-tracker
# Creates: invoice-tracker/ with TypeScript, HTML, CSS
```

### Step 2: Generate Backend Code

```
User runs backend prompt with:
- componentName: "Invoice Tracker"
- queries: { summary: "...", details: "...", detailsFiltered: "...", summaryUpdate: "..." }
- paramAliases: {}
- detailsTableFilters: ["periodName", "orgName", "processFlow"]
- etc.

Backend prompt outputs: backend-code-generation.md
```

### Step 3: Generate UI Config

```
User runs UI prompt with:
- Same user input from backend prompt
- Backend output (endpoints, keysToMap)

UI prompt outputs: ui-implementation-guide.md
```

### Step 4: Manual Paste Integration

```
1. Open: src/app/invoice-tracker/invoice-tracker.component.ts
2. Find: // ─── VISIBLE_TABS (REPLACE ...)
3. Copy from ui-implementation-guide.md: VISIBLE_TABS Block
4. Paste: replace the empty array [] with the block
5. Repeat for FILTER_CONFIGS, URL_MAPS, KEYS_TO_MAP
6. Repeat in .html for DASHBOARD_CASES
7. Replace <FILTER_KEY_PLACEHOLDER> with user-provided key
8. Verify: ng build succeeds
9. Test: run dashboard in dev
10. Commit & create PR
```

---

## Key Design Principles

1. **Schematic generates once** — creates stable scaffold with marker comments
2. **No auto-patching** — user controls where code goes via copy/paste
3. **Clear markers** — impossible to miss insertion points
4. **Separation** — schematic (structure), backend prompt (APIs), UI prompt (config), user (integration)
5. **Copy-paste friendly** — `.md` blocks are directly pasteable into component
6. **Scaffold-owned** — `filteredTabs`, `selectedIndex`, `menuItems`, event handlers remain in schematic
7. **User-owned** — `visibleTabs`, filters, URLs, keysToMap come from prompts

---

## Troubleshooting

### Component doesn't compile after pasting

- Check indentation matches surrounding code
- Ensure no extra/missing commas in arrays/objects
- Verify all TypeScript types match (`string[]`, `{ ... }[]`, etc.)
- Run: `ng build --mode=development` for verbose errors

### Marker comment not found

- Search for exact comment text in file (case-sensitive)
- Verify using correct file (.ts vs .html)
- Check file wasn't manually edited after schematic generation

### Users can't find where to paste

- Keep `.md` file open alongside component editor
- Search component for marker comment
- Copy/paste comment text into editor find dialog
- Paste code immediately after marker line
