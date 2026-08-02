# Storybook Implementation Progress

> **Goal:** Set up Storybook for Material-free components only, starting with atoms, then compounds, then shared components.

## Status: ✅ Phase 2 Complete

---

## Phase 1: Setup + Atoms ✅

### Setup Tasks

| Task                                    | Status  | Notes                                |
| --------------------------------------- | ------- | ------------------------------------ |
| Install Storybook                       | ✅ Done | Storybook 10.2.0 installed           |
| Configure theme imports                 | ✅ Done | Styles configured in angular.json    |
| Configure static assets                 | ✅ Done | staticDirs in main.ts                |
| Add npm scripts                         | ✅ Done | `storybook`, `build-storybook`       |
| Verify local dev server                 | ✅ Done | Running at http://localhost:6006     |
| Fix npm install (no --legacy-peer-deps) | ✅ Done | Fixed version ranges in package.json |

### Atom Stories (11 components)

| Component                | Status    | File                           | Notes                                         |
| ------------------------ | --------- | ------------------------------ | --------------------------------------------- |
| ButtonComponent          | ✅ Done   | `button.stories.ts`            | 4 variants: primary, secondary, ghost, danger |
| IconComponent            | ✅ Done   | `icon.stories.ts`              | Various icons, sizes                          |
| BadgeComponent           | ✅ Done   | `badge.stories.ts`             | Status variants                               |
| TextInputComponent       | ✅ Done   | `text-input.stories.ts`        | With/without icons, states                    |
| SelectDropdownComponent  | ✅ Done   | `select-dropdown.stories.ts`   | Single select with options                    |
| CheckboxComponent        | ⏸️ Hidden | `checkbox.stories.ts`          | Hidden until IconComponent fixed              |
| ToggleSwitchComponent    | ✅ Done   | `toggle-switch.stories.ts`     | On/off states                                 |
| TableCellComponent       | ✅ Done   | `table-cell.stories.ts`        | Text alignment                                |
| TableHeaderCellComponent | ✅ Done   | `table-header-cell.stories.ts` | Sortable/non-sortable                         |
| PaginationComponent      | ✅ Done   | `pagination.stories.ts`        | Various page counts                           |
| ModalShellComponent      | ✅ Done   | `modal-shell.stories.ts`       | Open/closed states                            |

---

## Phase 2: Compounds + Shared (Material-Free Only) ✅

### Compound Stories (3 components)

| Component          | Status  | File                    | Notes                                                           |
| ------------------ | ------- | ----------------------- | --------------------------------------------------------------- |
| DataTableComponent | ✅ Done | `data-table.stories.ts` | 6 stories: default, search, actions, empty, loading, pagination |
| FilterBarComponent | ✅ Done | `filter-bar.stories.ts` | 5 stories: default, search, filters, admin view                 |
| UserFormComponent  | ✅ Done | `user-form.stories.ts`  | 5 stories: new user, edit, dropdown vs text                     |

### Shared Component Stories (Material-Free Only)

| Component           | Status     | File                     | Notes                                    |
| ------------------- | ---------- | ------------------------ | ---------------------------------------- |
| CardComponent       | ⏳ Pending | `card.stories.ts`        | Simple wrapper                           |
| ModalComponent      | ⏳ Pending | `modal.stories.ts`       | Dialog states                            |
| MetricTileComponent | ✅ Done    | `metric-tile.stories.ts` | 7 stories: percentages, active, ESP demo |
| BarChartComponent   | ✅ Done    | `bar-chart.stories.ts`   | 7 stories: simple, stacked, analytics    |

---

## Phase 3: Deployment ✅

### CI/CD Tasks

| Task                        | Status  | Notes                                            |
| --------------------------- | ------- | ------------------------------------------------ |
| Add Jenkinsfile stage       | ✅ Done | Integrated into existing UI build                |
| Create Storybook Dockerfile | ✅ Done | Added `npm run build-storybook` to UI Dockerfile |
| Configure server.js         | ✅ Done | Serves `/storybook/` path (no auth)              |
| Test pipeline               | ✅ Done | Storybook live at dev URL!                       |

### Deployment Details

**URL:** `https://operations-control-tower-dev.cisco.com/storybook/`

**How it works:**

- Storybook is built during the existing UI Docker build
- Served by the same node proxy server at `/storybook/` path
- No SSO auth required (open access)
- Deploys automatically with UI (no separate Spinnaker environment)

---

## Excluded Components (Material-Dependent)

These will NOT be added to Storybook until Material is removed:

- TableComponent (uses MatSort, MatPaginator)
- O2cTableComponent (uses MatSort, MatPaginator)
- CaseiqTableComponent (uses MatSort, MatPaginator, MatIcon, MatCheckbox)
- TableModalComponent (uses MatDialog)

---

## Commands

```bash
# Development
npm run storybook          # Start Storybook dev server on port 6006

# Production build
npm run build-storybook    # Build static Storybook to storybook-static/
```

---

## Changelog

| Date       | Change                                                     |
| ---------- | ---------------------------------------------------------- |
| 2026-01-21 | Created implementation plan                                |
| 2026-01-21 | Installed Storybook 10.2.0                                 |
| 2026-01-21 | Fixed npm install (removed --legacy-peer-deps requirement) |
| 2026-01-21 | Configured styles and static assets                        |
| 2026-01-21 | Created all 11 atom stories                                |
| 2026-01-21 | Storybook running at http://localhost:6006                 |
| 2026-02-02 | Added Storybook build to UI Dockerfile                     |
| 2026-02-02 | Configured server.js to serve /storybook/ path             |
| 2026-02-09 | 🎉 Storybook deployed live to production!                  |
| 2026-02-09 | Added 3 compound stories (DataTable, FilterBar, UserForm)  |
| 2026-02-09 | Added MetricTile and BarChart stories                      |
| 2026-02-09 | Fixed button size variants (sm/lg CSS classes)             |
| 2026-02-09 | Hidden Checkbox stories (IconComponent needs fixing)       |

---

## Known Issues

| Issue                      | Status     | Notes                                         |
| -------------------------- | ---------- | --------------------------------------------- |
| IconComponent broken       | ⏳ Pending | Icons don't render; need Angular icon library |
| Checkbox missing checkmark | ⏳ Pending | Depends on IconComponent fix                  |

## Future Improvements

- [ ] Add Angular icon library (research options below)
- [ ] Create CardComponent story
- [ ] Create ModalComponent story
- [ ] Add more chart variants (O2cDonutComponent, etc.)

---

## Icon Library Research

Potential Angular-native icon libraries to evaluate:

| Library                 | Link                                                     | Notes                                                    |
| ----------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| **@ng-icons/core**      | https://ng-icons.github.io/ng-icons/                     | Supports Phosphor, Heroicons, Feather, and 20+ icon sets |
| **angular-fontawesome** | https://github.com/FortAwesome/angular-fontawesome       | Official Font Awesome for Angular                        |
| **@angular/material**   | (already have)                                           | MatIcon works but trying to remove Material              |
| **ngx-bootstrap-icons** | https://github.com/nicholasrodriguez/ngx-bootstrap-icons | Bootstrap icons for Angular                              |
| **Phosphor Angular**    | https://github.com/nicholasrodriguez/ngx-phosphor-icons  | Phosphor icons (unofficial)                              |
| **Iconify**             | https://iconify.design/docs/icon-components/angular/     | 150k+ icons, single unified component                    |
