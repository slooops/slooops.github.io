# Storybook Implementation Progress

> **Goal:** Set up Storybook for Material-free components only, starting with atoms, then compounds, then shared components.

## Status: � Phase 1 In Progress

---

## Phase 1: Setup + Atoms

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

| Component                | Status  | File                           | Notes                                         |
| ------------------------ | ------- | ------------------------------ | --------------------------------------------- |
| ButtonComponent          | ✅ Done | `button.stories.ts`            | 4 variants: primary, secondary, ghost, danger |
| IconComponent            | ✅ Done | `icon.stories.ts`              | Various icons, sizes                          |
| BadgeComponent           | ✅ Done | `badge.stories.ts`             | Status variants                               |
| TextInputComponent       | ✅ Done | `text-input.stories.ts`        | With/without icons, states                    |
| SelectDropdownComponent  | ✅ Done | `select-dropdown.stories.ts`   | Single select with options                    |
| CheckboxComponent        | ✅ Done | `checkbox.stories.ts`          | Checked/unchecked/disabled                    |
| ToggleSwitchComponent    | ✅ Done | `toggle-switch.stories.ts`     | On/off states                                 |
| TableCellComponent       | ✅ Done | `table-cell.stories.ts`        | Text alignment                                |
| TableHeaderCellComponent | ✅ Done | `table-header-cell.stories.ts` | Sortable/non-sortable                         |
| PaginationComponent      | ✅ Done | `pagination.stories.ts`        | Various page counts                           |
| ModalShellComponent      | ✅ Done | `modal-shell.stories.ts`       | Open/closed states                            |

---

## Phase 2: Compounds + Shared (Material-Free Only)

### Compound Stories (3 components)

| Component          | Status     | File                    | Notes                 |
| ------------------ | ---------- | ----------------------- | --------------------- |
| DataTableComponent | ⏳ Pending | `data-table.stories.ts` | With mock data        |
| FilterBarComponent | ⏳ Pending | `filter-bar.stories.ts` | Filter configurations |
| UserFormComponent  | ⏳ Pending | `user-form.stories.ts`  | Form states           |

### Shared Component Stories (Material-Free Only)

| Component           | Status     | File                     | Notes                   |
| ------------------- | ---------- | ------------------------ | ----------------------- |
| CardComponent       | ⏳ Pending | `card.stories.ts`        | Simple wrapper          |
| ModalComponent      | ⏳ Pending | `modal.stories.ts`       | Dialog states           |
| MetricTileComponent | ⏳ Pending | `metric-tile.stories.ts` | KPI display             |
| BarChartComponent   | ⏳ Pending | `bar-chart.stories.ts`   | D3 chart with mock data |

---

## Phase 3: Deployment

### CI/CD Tasks

| Task                        | Status     | Notes                     |
| --------------------------- | ---------- | ------------------------- |
| Add Jenkinsfile stage       | ⏳ Pending | `Build Storybook` stage   |
| Create Storybook Dockerfile | ⏳ Pending | Static nginx image        |
| Create deployment YAML      | ⏳ Pending | Separate subdomain config |
| Test pipeline               | ⏳ Pending | End-to-end deploy test    |

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
