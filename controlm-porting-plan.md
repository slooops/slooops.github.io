# Control-M Porting Plan — 11 commits from `feature/controlm-prod`

Source repo: [github.com/cisco-it-finance/i2c-control-m](https://github.com/cisco-it-finance/i2c-control-m)
Branch: `feature/controlm-prod`
Range: `e2a19ed^..6b7184f` — **13 files, +2071 / -232**
Author: Chandan Rungta, Jul 19–20 2026

## Status snapshot (2026-08-03)

| Phase                                     | Status              | Notes                                                                                                                                                         |
| ----------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Backend sanity check                  | ✅ Effectively done | Prod backend up after deploy fix; inherited commits live. Formal payload diff vs `control-m.types.ts` not yet run.                                            |
| 2 — Pending KPI clickable                 | 🟡 Half done        | Visuals + `kpiPending` in place. Missing: `'PENDING'` in `JobCategory` union, click wiring on progress seg + legend chip, `PENDING` branch in `filteredJobs`. |
| 3 — AI chat matched-job enrichment        | ❌ Not started      | `MatchedJob` missing `description` / `waiting_on` / `estimated_start_time`; chat template not updated.                                                        |
| 4 — Group Mapping page                    | ❌ Not started      | No `group-mapping` route or component. Backend endpoints assumed live.                                                                                        |
| 5 — Folder override admin UI _(optional)_ | ⏸ Deferred          | Backend only; UI intentionally postponed.                                                                                                                     |

## The 11 commits (oldest → newest)

| Hash      | Date       | Message                                                                          |
| --------- | ---------- | -------------------------------------------------------------------------------- |
| `e2a19ed` | 2026-07-19 | fix: add threading lock to prevent Oracle deadlock during concurrent upserts     |
| `d8a0d7a` | 2026-07-19 | feat: folder override system for manual folder-to-group mapping                  |
| `bde099e` | 2026-07-19 | feat: make Pending KPI clickable to filter waiting jobs                          |
| `070d9eb` | 2026-07-19 | feat: transform chat into Dashboard Expert with full tile/group/job intelligence |
| `73bebd0` | 2026-07-19 | fix: prevent ORA-00060 deadlock in upsert_jobs                                   |
| `83e6ea6` | 2026-07-20 | feat: smarter AI chat — sub-app drill-down, descriptions, better answers         |
| `2550750` | 2026-07-20 | feat: advanced LATE_START detection with time condition awareness                |
| `c4a021d` | 2026-07-20 | feat: late-start cyclic detection via parent folder inheritance                  |
| `817035e` | 2026-07-20 | feat: multi-select bulk move on Group Mapping page                               |
| `c080d24` | 2026-07-20 | fix: resolve folder grouping fallback NameError                                  |
| `6b7184f` | 2026-07-20 | feat: add Cmd/Ctrl-click multi-select for group mapping                          |

## Key insight

Our Angular app talks directly to Chandan's Python backend at `i2c-control-m-dev.cisco.com` (via `revenue-monitoring-ui/angular-app/proxy.conf.json`). **We don't own the backend.**

Therefore **7 of the 11 commits are backend-only and auto-inherit** when he deploys `feature/controlm-prod` to that host. We only need Angular work for commits that touch the React frontend or introduce a JSON shape change.

## Commit categorization

| Category                               | Commits                                                                            | Angular work?                         |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| Backend-only, no shape change          | `e2a19ed`, `73bebd0`, `c080d24`, `2550750`, `c4a021d`                              | None — auto-inherited                 |
| Backend-only, new endpoint             | `d8a0d7a` (folder-override system)                                                 | Optional admin UI (deferrable)        |
| Backend-only, enriches existing shapes | `070d9eb` (Dashboard Expert chat)                                                  | None — our chat auto-benefits         |
| Frontend, tiny                         | `bde099e` (Pending KPI clickable), `83e6ea6` frontend portion (AI chat enrichment) | Small, in-place                       |
| Frontend, new page                     | `817035e` + `6b7184f` (Group Mapping multi-select)                                 | Large — page doesn't exist in Angular |

## Consolidated into 4 phases (5 with optional)

### Phase 1 — Backend sanity check (no code, ~15 min)

**Status: ✅ Effectively done (2026-08-03)** — prod backend redeployed and live; Chandan's backend-only commits are running under us. Payload-shape diff against `control-m.types.ts` was not formally executed but nothing observed as broken.

- Confirm Chandan's `feature/controlm-prod` is deployed to the dev host we hit.
- Curl / observe network calls to `/api/summary`, `/api/folders`, `/api/jobs`, `/api/chat`.
- Compare payloads against our TypeScript types in `revenue-monitoring-ui/angular-app/src/app/control-m/control-m.types.ts` — check for new fields.
- Behaviour smoke test:
  - Click a folder; verify LATE_START flag behavior matches (commits `2550750`, `c4a021d`).
  - Send a chat query about a sub-app; expect the enriched response (commits `070d9eb`, `83e6ea6` backend).
  - Trigger a manual refresh several times in quick succession; expect no deadlock (commits `e2a19ed`, `73bebd0`).

### Phase 2 — Port `bde099e` "Pending KPI clickable" (small)

**Status: 🟡 Half done (2026-08-03)**

- ✅ `kpiPending` getter, donut Pending slice, progress-bar `.cm-seg-pending`, legend swatch, and `--cm-pending` tokens (light + dark) all present in `control-m-dashboard.component.{ts,html,css}`.
- ❌ `'PENDING'` still missing from the `JobCategory` union in `control-m.types.ts`.
- ❌ Pending progress segment has no `(click)` handler — currently visual-only.
- ❌ Pending legend chip is a static `<span>` with class `cm-legend-static`; needs to become a clickable `<button class="cm-legend-chip">` with `(click)="onCategoryClick('PENDING')"` and `[class.active]` binding.
- ❌ `filteredJobs` getter has no `PENDING` branch — add the "category NOT in the known 7-set" filter.

- `control-m.types.ts`: add `'PENDING'` to the `JobCategory` union.
- `control-m-dashboard.component.ts`: in the `filteredJobs` getter, add the special-case branch — when `activeCategory === 'PENDING'`, return jobs whose category is NOT in the known 7-set (`SUCCESS`, `FAILURE`, `LONG_RUNNING`, `LATE_START`, `RUNNING`, `WAIT_CONDITION`, `UNKNOWN_STATUS`).
- Make the donut's Pending slice clickable via `onCategoryClick('PENDING')`.
- Add PENDING status chip styling (slate/gray) wherever the status badge equivalent renders — the tree and log-viewer.

### Phase 3 — Port `83e6ea6` AI chat matched-job enrichment (small)

**Status: ❌ Not started (2026-08-03)** — `MatchedJob` still lacks the three optional fields; chat template has no description / waiting / est-start lines.

- `control-m.types.ts` `MatchedJob`: add optional `description`, `waiting_on`, `estimated_start_time` (these fields already exist on `Job` — reuse).
- `control-m-ai-chat.component.html` `lastMatches` render block: under each matched job add an italic description line, an amber `Waiting: {value}` line, and a cyan/blue `Est. start: {value}` line — using our `--cm-*` tokens (not Tailwind classes from the React source).

### Phase 4 — Group Mapping page from scratch, with multi-select baked in (large — a full day+)

**Status: ❌ Not started (2026-08-03)** — no `group-mapping` route or component in the Angular app.

- Base React `SettingsPage.tsx` is **766 lines** and does not exist in our Angular app at all.
- Rather than porting the two commits (`817035e` base + `6b7184f` refinement) separately, port the **current head state** as one new Angular route: `/control-m/group-mapping`.
- Includes:
  - Tile list with search.
  - Single-tile move modal (group / sub-group two-step flow).
  - Inline rename for group and sub-group.
  - **Cmd/Ctrl-click multi-select.**
  - Bulk-move modal for the multi-selection.
- Uses existing `--cm-*` tokens, glass card + sticky header pattern, `LoadingSymbolComponent` for large load states, `LoadingSymbolSmallComponent` inline.
- Add corresponding service methods to `control-m.service.ts` for the group-mapping CRUD endpoints (identify from the diff first — grep the React diff for `/api/` URLs).

### Phase 5 (optional, defer) — Folder override admin UI (commit `d8a0d7a`)

**Status: ⏸ Deferred (2026-08-03)** — intentional; backend already exposes it, no UI needed yet.

- Only needed if we want manual folder→group override management via the UI.
- Backend already exposes it; can build later or leave curl-only.

## Recommended execution order

1. Phase 1 (verify backend deployment first, before touching anything).
2. Phase 2 (Pending KPI — quick win, validates our `filteredJobs` refactor recipe).
3. Phase 3 (AI chat enrichment — quick, same recipe as #2).
4. Phase 4 (Group Mapping page — the real work).
5. Phase 5 only if requested.

## References — where to look in the source repo

- Local clone: `/Users/jasloop/Documents/i2c-control-m` (branch: `feature/controlm-prod`).
- To re-inspect any commit: `git --no-pager show <hash>` from that clone.
- To see the full frontend diff we need to mirror in Angular: `git --no-pager diff e2a19ed^..6b7184f -- 'frontend/**'`.
