/**
 * Public API contract for the Monitoring Dashboard.
 *
 * These types form the single source of truth shared by the runtime library,
 * its consumers, the schematic, and the onboarding wizard. Keep this file free
 * of Angular-app-specific imports so it can move into a standalone package
 * without changes.
 */

/**
 * The set of endpoint URLs (relative to `userContext.apiUrl`) the dashboard
 * calls. `summaryUrl`, `detailsUrl` and `filteredDetailsUrl` are required for
 * the core table experience; the rest are optional and fall back to the
 * historical defaults when omitted.
 */
export interface MonitoringUrls {
  summaryUrl: string;
  detailsUrl: string;
  filteredDetailsUrl: string;
  summaryUpdateUrl?: string;
  webexMessageUrl?: string;
  /** Overrides the `monitoring-period-status` endpoint path. */
  periodStatusUrl?: string;
  /** Overrides the `summary-assignment-users` endpoint path. */
  assignableUsersUrl?: string;
  /** Overrides the `process-flow-total` endpoint path. */
  processFlowTotalUrl?: string;
  [key: string]: string | undefined;
}

/** A column that participates in the details filter bar. */
export interface ColumnFilterConfig {
  formControlName: string;
  columnName: string;
  type: string;
  subAppMapping: boolean;
}

/**
 * Identity + environment the dashboard runs under. Supplied by the consuming
 * application (typically derived from its own auth service) so the library
 * never depends on a concrete authentication implementation.
 */
export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

/**
 * How a details-table column should render its cell.
 * - `text`   — plain value (default).
 * - `action` — clickable link that emits `cellAction` and, when a
 *              `detailPanel` template is provided, opens the detail region.
 */
export type ColumnRendererKind = 'text' | 'action';

/** Per-column render configuration keyed by the column name. */
export type ColumnRenderers = Record<string, ColumnRendererKind>;

/**
 * Payload emitted when a user activates an `action` column cell. Consumers use
 * this to open their own detail experience (e.g. self-healing exception
 * details) without the library knowing anything about it.
 */
export interface CellActionEvent {
  column: string;
  value: string;
  row: Record<string, unknown>;
}

/**
 * Context object handed to a projected `detailPanel` template via
 * `ngTemplateOutletContext`. Mirrors the fields of {@link CellActionEvent}
 * plus a `close` callback the template invokes to dismiss the detail region.
 *
 * Usage in a consumer template:
 * ```html
 * <ng-template #detail let-value let-close="close">
 *   <app-exception-details [exceptionId]="value" (back)="close()" />
 * </ng-template>
 * ```
 */
export interface DetailPanelContext {
  /** The activated cell value (bound to `let-value` / `$implicit`). */
  $implicit: string;
  value: string;
  column: string;
  row: Record<string, unknown>;
  close: () => void;
}
