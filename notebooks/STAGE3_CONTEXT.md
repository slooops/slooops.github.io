# Stage 3 Context — WD0 Predictions Notebook Handoff

> **Read first:** [`wd0_weight_tuning.ipynb`](./wd0_weight_tuning.ipynb) — has the existing scaffold and 6-step plan.
> **Service under replacement:** [`Wd0PredictiveService.java`](../revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/Wd0PredictiveService.java) — current production algorithm.

---

## What's already done (Stages 1+2 — DO NOT REDO)

- ✅ `Wd0PredictiveService` ports the predecessor's manual Excel formula into Java. Two-layer weighting: per-day weights × WD multipliers.
- ✅ Three source SQL queries run against Oracle CG1PRD (PRODUCT via `@FINFBLBLO_LINK.CISCO.COM` DB link; SERVICE_FIRD and SERVICE_FLEXI local to `apps.*`).
- ✅ Two Oracle tables in ARFINRO:
  - `JSR_WD0_PREDICTIONS` — one row per (period, wd, line_type, run) with `WEIGHTED_SUM`, `PREDICTION_LOW`, `PREDICTION_HIGH`, `GENERATED_AT` (UTC).
  - `JSR_WD0_RAW_SNAPSHOTS` — one row per day-bucket, FK to prediction. Captures `COUNT_DATE`, `DAY_OFFSET`, `PER_DAY_WEIGHT`, `LINE_COUNT`, plus `SOURCE_QUERY` tag.
- ✅ REST endpoints under `/api/wd0/v2/`: `projection`, `projection/run` (POST, writes), `projection/dry-run` (GET), `raw-snapshots`, `calendar`.
- ✅ Scheduler `Wd0PredictiveScheduledJob` (cron `0 0 15 * * MON-FRI` America/Los_Angeles) gated by `wd0.predictions.scheduled.enabled` — runs only WD-3/-2/-1 of each fiscal period.
- ✅ Validated end-to-end vs predecessor's Excel: PRODUCT and SERVICE LOW/HIGH match exactly within timing drift.
- ✅ UTC timestamp convention enforced (`Timestamp.from(Instant.now())`).

**Stage 3 is the ONLY work that should happen in the notebook.** Do not modify Java service code from the notebook session.

---

## The goal of Stage 3

Replace the predecessor's hand-tuned weights with **data-driven weights** fit from historical actuals.

**Why:** The current weights (`DAY_WEIGHTS` + `WD_MULTIPLIERS` in `Wd0PredictiveService.java`) came from one analyst's gut over years of trial and error. They reproduce the Excel exactly, but we have 5+ years of `ASK_QE_ME_INTERFACE_LOAD` actuals sitting in the warehouse. We should fit weights from data instead of inheriting them.

**Success criteria:**

- Prediction interval covers actual ≥ 80% of the time (current implicit coverage is ~99% which means the interval is way too wide).
- Mean interval width tighter than predecessor's by ≥ 20%.
- 4 model splits compared (1 model / 2 models / 4 models — see below) and the winner picked.

---

## The 4-model architecture (user decision, already made)

| Model      | Trains on                              | Predicts             |
| ---------- | -------------------------------------- | -------------------- |
| ME-PRODUCT | Month-end periods, PRODUCT line type   | PRODUCT count at WD0 |
| ME-SERVICE | Month-end periods, SERVICE line type   | SERVICE count at WD0 |
| QE-PRODUCT | Quarter-end periods, PRODUCT line type | PRODUCT count at WD0 |
| QE-SERVICE | Quarter-end periods, SERVICE line type | SERVICE count at WD0 |

WD-step (WD-3, WD-2, WD-1) is an **input feature**, not a separate model. So each of the 4 models sees a feature vector that includes which working day the snapshot is from.

**Why split QE vs ME:** Quarter-end multipliers in the predecessor's table are exactly 2× the month-end multipliers (e.g. WD-3 PRODUCT ME=`(0.27, 1.76)`, QE=`(0.54, 3.52)`). User suspects QE has genuinely different dynamics and wants the model to learn that, not assume 2×.

---

## Data sources

### Forward (live snapshots, growing)

```sql
SELECT * FROM ARFINRO.JSR_WD0_RAW_SNAPSHOTS;
SELECT * FROM ARFINRO.JSR_WD0_PREDICTIONS;
```

Currently has ~1 cycle. After 3-6 months of live operation, will have 3-6 ME + 1-2 QE samples per segment.

### Historical actuals (5+ years available)

```sql
SELECT period_year, period_num, period_name, line_type, line_count
  FROM ARFINRO.ASK_QE_ME_INTERFACE_LOAD
 WHERE close_type = 'MIDCLOSE';
```

This is the **target variable** — what we want to predict.

### Historical backtest reconstruction (THE KEY UNLOCK)

We can replay what the 3 source queries WOULD have returned on past WD-3/-2/-1 dates by adding `creation_date` filters to simulate the historical state. This is documented in the notebook Step 3.

**Source tables for replay:**

- `ONT.OE_ORDER_LINES_ALL` (PRODUCT)
- `apps.ra_customer_trx_lines_all`, `apps.ra_interface_lines_all` (NOT EXISTS subqueries)
- `XXGCO.XXGCO_OE_INVOICE_SCHEDULES`, `XXGCO.XXGCO_OE_ORDER_LINES_EXT` (SERVICE)
- `finfblrl.cg1_oe_order_lines_all@FINFBLBLO_LINK.CISCO.COM` (PRODUCT via DB link)

**The trick:** Take current SQL from `Wd0PredictiveService.PRODUCT_PROMISE_DATE_SQL` etc., add `AND creation_date <= :wd_date` to source tables and adjust the NOT EXISTS subqueries to count rows where `creation_date > :wd_date` (i.e. weren't invoiced yet on the historical date).

**Known biases (acceptable, document them):**

- `flow_status_code` and `bill_status_code` reflect _current_ state, not state-at-wd_date. Small under-count.
- Hard-deleted lines unrecoverable. Minor.

**Validation step:** Reconstruct the MOST RECENT closed period and compare to the live snapshot we captured in `JSR_WD0_RAW_SNAPSHOTS`. If they match within ~5%, the reconstruction is trustworthy.

---

## SQL templates (copy from Java service)

The exact SQL the service runs is in `Wd0PredictiveService.java` as inline string constants:

- `PRODUCT_PROMISE_DATE_SQL` (~line 60-110)
- `SERVICE_FUTURE_INVOICE_RELEASE_SQL` (~line 120-170)
- `SERVICE_FLEXIBLE_INVOICE_SQL` (~line 180-220)

These are the verbatim May Edition queries from the predecessor. Use them as the starting point for backtest reconstruction.

---

## Window definitions (must match service exactly)

From `Wd0PredictiveService.windowFor()`:

- PRODUCT (Promise Date): `[PE-1, PE+3]` — 5 days. PE = period_end_date.
- SERVICE_FIRD (Future Invoice Release Date): `[PE-3, PE+3]` — 7 days.
- SERVICE_FLEXI (Flexible Invoice): `[PE, PE+1]` — 2 days.

Day offsets and per-day weights (current Excel-derived values, what we're trying to improve on):

```
PRODUCT:       -1→0.45, 0→0.50, +1→0.50, +2→0.65, +3→0.00
SERVICE_FIRD:  -3→0.45, -2→0.45, -1→0.45, 0→0.65, +1→1.00, +2→0.65, +3→0.47
SERVICE_FLEXI: 0→0.65, +1→1.00
```

WD multipliers (current):

```
              ME (low,  high)    QE (low,  high)
WD-3        (0.27, 1.76)        (0.54, 3.52)
WD-2        (0.36, 1.73)        (0.72, 3.46)
WD-1        (0.63, 1.64)        (1.26, 3.28)
```

---

## Suggested 4-model feature vector

For training row at (period, wd, line_type):

```
features = [
  raw_count_at_each_day_offset_in_window,  # 5, 7, or 2 numeric features
  wd_step,                                  # categorical: -3, -2, -1
  period_type,                              # ME or QE (or absorbed into model split)
  month_of_year,                            # seasonality
  days_until_period_end,                    # derived from wd_step + calendar
]
target = actual_midclose_count_at_wd0
```

---

## Methodology recommendation (notebook author can deviate)

1. **Quantile regression** for LOW and HIGH bounds (10th and 90th percentile of `actual/raw_sum` ratio per segment) — gives an 80% prediction interval directly.
2. **Compare against:**
   - Predecessor's hand-tuned weights (baseline)
   - 1-model (everything in one regression with line_type + period_type as features)
   - 2-model (PRODUCT vs SERVICE only, period_type as feature)
   - 4-model (the user's preferred architecture)
3. **Cross-validation:** leave-one-period-out. Report mean interval width and coverage rate per split.
4. **Winner becomes `MODEL_VERSION = 'v2-tuned'`** in `Wd0PredictiveService` (a follow-up Java change, NOT the notebook's job).

---

## Output deliverables

1. `notebooks/wd0_weights_v2.json` — fitted weights, traceable.
2. Java code block (printed by notebook cell) ready to paste into `Wd0PredictiveService.buildWeightTable()`.
3. Backtest report cells in the notebook: actual-vs-predicted scatter, coverage rate, interval width per split.
4. Brief recommendation cell on which split won and why.

---

## Environment

- Notebook uses `oracledb` thin mode (no Instant Client needed).
- Connection via env vars: `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_DSN` (defaults to `CG1PRD`).
- Existing notebook scaffold at [`wd0_weight_tuning.ipynb`](./wd0_weight_tuning.ipynb) already has connection cell.
- Python deps: `oracledb`, `pandas`, `numpy`, `scikit-learn`. User has a venv at `/tmp/xlsxenv` if needed; otherwise create one.

---

## Hard constraints / do-not-do

- **Do not** modify `Wd0PredictiveService.java` or any Java code. Notebook session is read-only on the server.
- **Do not** delete rows from `JSR_WD0_*` tables — those are live operational data.
- **Do not** run heavy queries against PRODUCT via the DB link without a `ROWNUM` cap during exploration — that link is shared.
- **Use UTC** for any timestamps you compute or store. DB convention.
- **No emoji** in any notebook output destined for production code paths.

---

## When you're done

Hand back to the main agent session with:

1. The chosen weight table (JSON + Java snippet).
2. Coverage / interval-width comparison table.
3. Any biases or caveats discovered during backtest reconstruction.

Main session will integrate into `Wd0PredictiveService`, bump `MODEL_VERSION`, and validate the next live run matches the new weights.
