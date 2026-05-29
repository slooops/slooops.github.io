# WD0 Midclose Prediction Model — Status Report & Post-Mortem

**Author:** Jack Sloop
**Date:** May 29, 2026
**Audience:** Leadership review + handoff doc for FY27 retrain
**Branch:** `UI2.0`
**Related files:**

- Java service: [revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/Wd0PredictiveService.java](revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/Wd0PredictiveService.java)
- Scheduler: [revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/scheduler/Wd0PredictiveScheduledJob.java](revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/scheduler/Wd0PredictiveScheduledJob.java)
- Calibration notebook: [notebooks/wd0_weight_tuning.ipynb](notebooks/wd0_weight_tuning.ipynb)
- Predecessor methodology refit notebook: [notebooks/midclose_regression_refit.ipynb](notebooks/midclose_regression_refit.ipynb)
- Predecessor's full work folder: `/Users/jasloop/Downloads/Midclose/` (handed over by Jae Won)
- Stage 3 design context: [notebooks/STAGE3_CONTEXT.md](notebooks/STAGE3_CONTEXT.md)

---

## TL;DR

1. **The predecessor's "midclose" model has been productionized in Java** ([`Wd0PredictiveService`](revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/Wd0PredictiveService.java)) and is running as `MODEL_VERSION = 'v1-predecessor'`. It reproduces the predecessor's manual Excel formulas exactly.
2. **A 3pm Pacific scheduled job** ([`Wd0PredictiveScheduledJob`](revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/scheduler/Wd0PredictiveScheduledJob.java)) now fires **every day of the week throughout the close window** in deployed environments and persists predictions + the raw per-day-bucket inputs into Oracle. Formal predictions (WD-3/-2/-1) carry calibrated LOW/HIGH bounds; all other days — including weekends — persist `weighted_sum` + snapshots with NULL bounds purely as training data. **Data collection for retraining is live and verified** (see [Section 6](#6-data-collection-status)).
3. **Two attempts to improve on the predecessor's bounds failed**, and we now understand exactly why ([Section 5](#5-post-mortem-of-jae-wons-model)).
4. **Plan:** keep collecting aligned `(prediction, actual)` rows for ~6 months, then retrain using a 4-segment quantile regression. Long-term, retrain after every period close so the model becomes dynamic instead of fixed.

---

## 1. Background

The midclose prediction tells finance how many order lines we expect to close by month/quarter end, given the partial state of the order pipeline three, two, and one working days out. Jae Won (predecessor) built this in Excel over a few years: a hand-tuned table of per-date-column weights multiplied by per-workday min/max multipliers, producing a low/high prediction band.

The hand-tuned model was in production as a spreadsheet. Our work was to:

1. Port the algorithm to Java so it runs on a schedule.
2. Capture inputs and outputs to Oracle so we can eventually replace the hand-tuned weights with data-driven ones.
3. Try to make the bounds tighter and the coverage better.

---

## 2. What we built

### 2.1 Java service ([`Wd0PredictiveService`](revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/services/Wd0PredictiveService.java))

Verbatim port of Jae Won's May Edition formulas. Three Oracle source queries (PRODUCT via DB link to `FINFBLBLO`, SERVICE_FIRD and SERVICE_FLEXI local). The service computes:

- A weighted sum per `(period, WD, line_type)` using day-of-window weights:
  - `PRODUCT`: `-1→0.45, 0→0.50, +1→0.50, +2→0.65, +3→0.00`
  - `SERVICE_FIRD`: `-3→0.45, -2→0.45, -1→0.45, 0→0.65, +1→1.00, +2→0.65, +3→0.47`
  - `SERVICE_FLEXI`: `0→0.65, +1→1.00`
- A LOW/HIGH band by multiplying the weighted sum by WD-step multipliers:

  |      | ME (low, high) | QE (low, high) |
  | ---- | -------------- | -------------- |
  | WD-3 | (0.27, 1.76)   | (0.54, 3.52)   |
  | WD-2 | (0.36, 1.73)   | (0.72, 3.46)   |
  | WD-1 | (0.63, 1.64)   | (1.26, 3.28)   |

Tagged in DB as `MODEL_VERSION = 'v1-predecessor'`.

### 2.2 Storage tables (ARFINRO schema)

| Table                        | Purpose                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `JSR_WD0_PREDICTIONS`   | One row per `(period, WD, line_type, run)`: weighted_sum, prediction_low, prediction_high, generated_at, model_version.              |
| `JSR_WD0_RAW_SNAPSHOTS` | Per-day-bucket inputs that fed each prediction: count_date, day_offset, per_day_weight, line_count, source_query. FK to predictions. |

Together these give us the full input → output trace for every run, which is what we need to retrain.

### 2.3 Scheduler

[`Wd0PredictiveScheduledJob`](revenue-monitoring-server/src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/scheduler/Wd0PredictiveScheduledJob.java): `@Scheduled(cron = "0 0 15 * * MON-FRI", zone = "America/Los_Angeles")`. Gated by `wd0.predictions.scheduled.enabled`:

- **Defaults true** in [application.properties](revenue-monitoring-server/src/main/resources/application.properties), so all deployed pods (dev/stage/prod) auto-run at 3pm Pacific on weekdays.
- **Forced off** in [application-local.yml](revenue-monitoring-server/src/main/resources/application-local.yml), so local dev (`-Dspring.profiles.active=local`) never writes to the DB.

The job no longer no-ops outside WD-3/-2/-1. As of this revision it fires **every day of the week** (cron `0 0 15 * * *` Pacific) and captures a snapshot for any day before the next upcoming period_end (up to ~WD-30). Weekend days inherit the WD label of the next upcoming business day — so a Sunday three days before a Monday-WD-5 is also labeled WD-5, distinguished only by `COUNT_DATE` and `GENERATED_AT`. Snapshots taken outside the predecessor's calibrated WD range (WD-3/-2/-1) persist `weighted_sum` and all per-day-bucket raw inputs but write `NULL` for `PREDICTION_LOW` / `PREDICTION_HIGH`. This is the marker for "training-only snapshot" vs "formal prediction."

**Why daily (incl. weekends) capture:** the storage overhead is trivial (still hundreds of rows/month, not millions), but the upside is large. Period close happens on a Saturday and submissions land continuously through the weekend — not capturing them would leave a hole in the most volatile part of the cycle. We get a continuous decay curve of eligible counts, anomaly detection between consecutive days, drift monitoring against the same period last year, and the option to fit bounds at WD-4/-5/-6 in the v2 retrain instead of being stuck with only 3 calibration points. DB-link query load was considered and stays well under existing reporting workloads.

### 2.4 REST surface (under `/api/wd0/v2/`)

- `GET /projection` — read latest persisted predictions
- `POST /projection/run` — fire a run on demand and persist
- `GET /projection/dry-run` — compute without persisting
- `GET /raw-snapshots` — inspect the per-day-bucket inputs
- `GET /calendar` — show which date is WD-3/-2/-1 for the current cycle

---

## 3. The two retraining attempts (both failed, with valuable findings)

### 3.1 Attempt 1 — Quantile calibration ([notebooks/wd0_weight_tuning.ipynb](notebooks/wd0_weight_tuning.ipynb))

**Approach:** Take 126 historical prediction-vs-actual rows (`Result_47.csv`), compute the ratio `actual / weighted_sum` per WD-step, and fit the 10th and 90th percentile of that ratio as new low/high multipliers. Leave-one-out CV.

**Result from `wd0_weights_v2.json`:**

| Metric                | Predecessor baseline | Calibrated model |
| --------------------- | -------------------- | ---------------- |
| 80% PI coverage (LOO) | 57.9%                | 74.6%            |
| Median PI width       | 10,382               | 23,758           |

The calibrated model gets better coverage but is **2.3× wider**. That's not really winning — the band gets so wide it stops being useful. Coverage went up because the band swallowed almost everything, not because predictions got smarter.

**Why this happened:** the underlying signal is noisy. Sales and service close behaviour at month-end is driven by humans negotiating discounts, processing returns, and chasing quotas — there is real irreducible variance no amount of recalibration can squeeze out without widening the bounds.

### 3.2 Attempt 2 — Regression refit on predecessor's training data ([notebooks/midclose_regression_refit.ipynb](notebooks/midclose_regression_refit.ipynb))

**Approach:** Jae Won handed over a folder including `Model/MIDCLOSE_PREDICTION_Product.csv` and `Service.csv` (83 monthly rows, FY19–FY25) with columns like `MID_CLOSE_COUNT, PROMISE_DATE_COUNT, FUTURE_INVOICE_DATE_COUNT, HOLD_RELEASE_DATE_COUNT, RETURN_HARDWARE_DATE_COUNT, FULFILLMENT_DATE_COUNT, UNKNOW_COUNT`. Plan: regress `MID_CLOSE_COUNT` on the per-date-component columns and use the coefficients as new weights.

**Result: R² = 1.000, every coefficient ≈ 1.0.**

This looks like a miracle but is actually a data trap:

```
PRODUCT: MID_CLOSE_COUNT − sum(date_components) ≈ 0   (max residual 282 on totals up to 32,986)
SERVICE: MID_CLOSE_COUNT − sum(date_components) − UNKNOW_COUNT = 0 EXACTLY  (every one of 69 rows)
```

The "predictor" columns are a **post-hoc decomposition of the target**. They are produced after the period closes, by attributing each closed line to the date column that made it eligible. We literally handed the regression the answer split into pieces. There is zero predictive signal in this CSV.

**This is the most important finding in the whole exercise.** Jae Won's per-day weights were never derived from regressing actuals on raw eligible counts. They were derived from a different family of CSVs (`Promise_Date_WD_All_Merged.csv`, `FIRD_WD_All_Merged.csv`) using the ratio:

`Weightage_day = Actuals_Count_day / Eligible_Count_day`

That's why we need to build our own dataset: we have to capture both the eligible counts (at WD-3/-2/-1) AND the actuals (at WD0+1) in the same rows. **That is exactly what `JSR_WD0_PREDICTIONS` + `JSR_WD0_RAW_SNAPSHOTS` are designed to do**, and what the 3pm cron is now collecting.

### 3.3 Bonus finding — published min/max table is biased toward PRODUCT

Using Jae Won's own raw weightage CSVs ([midclose_regression_refit.ipynb](notebooks/midclose_regression_refit.ipynb) Section "Option 2"), I reproduced the published WD-1/-2/-3 min/max table:

| WD  | Published        | PROMISE only (PRODUCT)   | FIRD only (SERVICE) |
| --- | ---------------- | ------------------------ | ------------------- |
| -3  | (0.24, 2.09)     | (0.30, 1.70)             | (0.18, **1.82**)    |
| -2  | (0.29, **1.65**) | (0.35, **1.65**) ✓ exact | (0.20, 1.81)        |
| -1  | (**0.44**, 1.53) | (**0.44**, 1.56) ✓ exact | (0.28, 1.72)        |

The published bounds are anchored to PRODUCT-side data and are **~30% too tight when applied to SERVICE**. FIRD WD-1 alone accounts for 43% of all SERVICE actuals (58,988 of 135,969 in FY23–FY25) — half of every month's service closing happens on the last business day, and no 3-day-window bound calibrated against the wrong product type can hold up against that.

**Talking-point summary:** The published table was always a PRODUCT-derived approximation that was being applied uniformly. Splitting the table by product type — or at minimum widening it for SERVICE — is a defensible methodology improvement that does not require any new data.

---

## 4. Plan going forward

### 4.1 Now → November 2026: harvest data, change nothing

The 3pm cron now fires **every day of the week during the close window**, persisting `weighted_sum` + per-day-bucket snapshots for any day from ~WD-30 up to WD-1 (weekends inclusive, inheriting the next business day's WD label). Only the WD-3/-2/-1 rows carry bounds; all other days are tagged with NULL bounds and treated as training-only snapshots.

Volume math: ~30 calendar days × 2 line types = **~60 prediction rows per close cycle** (6 with bounds, ~54 without) and ~330–400 raw-snapshot rows. In 6 months that is ~360 prediction rows + ~2,200 snapshot rows per segment — enough to fit a real WD-vs-residual decay curve _and_ pick up weekend submission patterns that the WD-3/-2/-1-only schedule would have missed entirely.

What we are _not_ doing during this window:

- Not deploying any of the calibration weights (`wd0_weights_v2.json`) — they make the band too wide.
- Not touching Java service logic. The predecessor's algorithm stays in production.
- Not running more retraining notebook experiments — the 6-month wait is required because we genuinely don't have enough aligned training data yet.

What we _could_ do as a low-risk quality-of-life improvement (boss approval):

- Split the WD min/max table by `LINE_TYPE` in `Wd0PredictiveService.buildWeightTable()`. This is a one-file Java change driven by the FY23–FY25 raw data we already have. Would widen SERVICE bounds to better match observed variance, without changing PRODUCT.

### 4.2 November 2026 (6-month checkpoint): first real retrain

Once we have ~6 close cycles in `JSR_WD0_PREDICTIONS` + `JSR_WD0_RAW_SNAPSHOTS`:

1. Join predictions to actuals from `ARFINRO.ASK_QE_ME_INTERFACE_LOAD` (the existing midclose actuals table).
2. Compute per-day weights as the ratio `actual_at_wd0 / eligible_count_at_day_offset`, segmented by:
   - `LINE_TYPE` (PRODUCT, SERVICE_FIRD, SERVICE_FLEXI)
   - `WD` step (-3, -2, -1)
   - `PERIOD_TYPE` (ME vs QE)
3. Fit quantile regression for LOW (10th pct) and HIGH (90th pct) instead of a single point estimate.
4. Tag the resulting weights as `MODEL_VERSION = 'v2-tuned'` and shadow-deploy alongside v1 for one more close cycle before switching.

Backtest reconstruction (described in [STAGE3_CONTEXT.md](notebooks/STAGE3_CONTEXT.md) Section "Historical backtest reconstruction") is also possible as a force-multiplier — adding `creation_date <= :wd_date` filters to the source SQL lets us simulate what the queries would have returned on past WD dates. We've documented the technique but should not invest engineering time in it until the 6-month live dataset is in hand.

### 4.3 Long-term: dynamic weights that retrain every close

The end state is that the model is no longer a fixed table. After every period close:

1. A scheduled job runs (probably WD+5, after `ASK_QE_ME_INTERFACE_LOAD` is final).
2. It joins the closed cycle's predictions/raw_snapshots to actuals.
3. It refits the weights using a rolling window (e.g. last 12 closes per segment).
4. It writes the new weights to a new Oracle table (`JSR_WD0_WEIGHTS` — not yet created) with effective-from/effective-to columns.
5. `Wd0PredictiveService.buildWeightTable()` reads from that table instead of using hardcoded constants.

That last bullet is the architectural change that converts the system from "hand-tuned static" to "self-tuning dynamic." It's a small Java change once the upstream pieces exist. The data plumbing we built now is what makes it possible.

**Why not do this on day one?** Because retraining on insufficient data is worse than not retraining at all — see Section 3.1 for direct evidence. We need ~6 months of aligned data before any retrain has a chance of beating the predecessor's hand-tuned weights.

---

## 5. Post-mortem of Jae Won's model

### What Jae Won got right

- **The algorithm shape is sound.** Per-date-column weights × per-WD multipliers is a reasonable decomposition that mirrors how the underlying close process actually works. We are not replacing the architecture, just retuning the parameters.
- **Source SQL is correct.** The PRODUCT/SERVICE_FIRD/SERVICE_FLEXI queries reflect real business rules and reconcile to actuals when run at WD0. We ported them verbatim.
- **The min/max derivation methodology is well documented.** `Midclose Max Min Calculations.docx` in the handoff folder explains the cumulative-fulfillment math precisely — it's reproducible, which is rare for a hand-built model.
- **The training data was carefully built.** The `Weightage Calculations/Data Pre-Processing/*.csv` files (1,000+ rows each, FY23–FY25) are the real predictive signal and are well-structured.

### What Jae Won got wrong (or what got lost in translation)

- **Published min/max table is PRODUCT-anchored, applied uniformly.** The WD-1 min (0.44) and WD-2 max (1.65) match PROMISE_DATE-only numbers exactly; FIRD-only would give (0.28, 1.72). When this table is applied to SERVICE predictions, bounds are systematically 30% too tight in the direction of the noisy tail. This is the math reason for the OCT-25 and OCT-26 SERVICE blowouts.
- **The `Model/MIDCLOSE_PREDICTION_*.csv` regression CSVs are misleading.** They look like a training dataset but are a target decomposition. Anyone trying to refit the model from those files will get R² = 1.0 and conclude the model is perfect. It is not.
- **No automation.** Each prediction required Jae Won manually running queries, pasting into Excel, recalculating. There was no persistence of inputs alongside outputs, so there was nothing to retrain _from_. That gap is exactly what `JSR_WD0_PREDICTIONS` + `JSR_WD0_RAW_SNAPSHOTS` now fill.
- **Fixed weights, no closed feedback loop.** Weights were last calibrated against FY23–FY25 and have not moved since. As of FY26 (mid-cycle now), nothing in the system would detect or correct drift.

### What this exercise taught us

1. **Noise > methodology.** Even the best model architecture can't outperform 50% of the variance being driven by last-minute human behaviour. Realistic expectations: ~75–80% coverage with bounds that are wide enough to be useful but not so wide they become noise themselves.
2. **You can't recalibrate without aligned training data.** The current 12 rows in `JSR_WD0_PREDICTIONS` are the first time anyone at Cisco has captured both the inputs (at WD-3/-2/-1) and the outputs (predictions) atomically in one place. The actuals join makes them real training data.
3. **The dataset Jae Won used to derive his original weights still exists** in `Weightage Calculations/Data Pre-Processing/`. If we ever need a sanity check, we can recompute his exact weights from those CSVs.

---

## 6. Data collection status

**Verified live against `APPSRO@CG1PRD_SRVC_OTH` on 2026-05-29:**

### `ARFINRO.JSR_WD0_PREDICTIONS`

```
TOTAL_ROWS   EARLIEST                          LATEST                            DISTINCT_RUN_DAYS  DISTINCT_PERIODS
12           2026-05-20 18:43:53.717 (UTC)    2026-05-22 14:23:57.440 (UTC)     3                  1 (MAY-26)
```

All 12 rows tagged `MODEL_VERSION = 'v1-predecessor'`. Sample:

| RUN_TS (UTC)     | PERIOD | WD   | LINE_TYPE | WEIGHTED_SUM | LOW    | HIGH   |
| ---------------- | ------ | ---- | --------- | ------------ | ------ | ------ |
| 2026-05-22 14:23 | MAY-26 | WD-1 | PRODUCT   | 3,814        | 2,403  | 6,256  |
| 2026-05-22 14:23 | MAY-26 | WD-1 | SERVICE   | 16,317       | 10,280 | 26,760 |
| 2026-05-21 16:16 | MAY-26 | WD-2 | PRODUCT   | 4,773        | 1,718  | 8,258  |
| 2026-05-21 16:16 | MAY-26 | WD-2 | SERVICE   | 16,232       | 5,843  | 28,081 |
| 2026-05-20 18:43 | MAY-26 | WD-3 | PRODUCT   | 5,490        | 1,482  | 9,663  |
| 2026-05-20 18:43 | MAY-26 | WD-3 | SERVICE   | 16,502       | 4,456  | 29,043 |

The May 22 14:23 PT run was the 3pm Pacific scheduled job firing on WD-1 — **the cron is confirmed running in production**. The earlier WD-2 rows from May 21 are from on-demand runs during validation.

### `ARFINRO.JSR_WD0_RAW_SNAPSHOTS`

```
TOTAL_ROWS   EARLIEST_BUCKET   LATEST_BUCKET   PREDICTIONS_LINKED   SOURCE_QUERIES   SUM_LINE_COUNTS
66           2026-05-20        2026-05-26      12                   3                212,918
```

All 12 predictions have their per-day-bucket inputs persisted, across all 3 source queries (PRODUCT_PROMISE_DATE, SERVICE_FIRD, SERVICE_FLEXI). **The full input-to-output trace for every prediction is captured.** This is the dataset we will retrain on.

### Projected growth

Numbers below reflect the **daily (7-day) capture cadence** (one snapshot per calendar day, ~30 days per close cycle × 2 line types). Only WD-3/-2/-1 rows carry calibrated bounds; the rest are training-only with NULL bounds.

| Time horizon                       | Expected predictions | Expected raw snapshots | Aligned (pred, actual) tuples |
| ---------------------------------- | -------------------- | ---------------------- | ----------------------------- |
| End of MAY-26 (now)                | 12                   | 66                     | 0 (actuals land WD+5)         |
| End of JUN-26                      | ~70                  | ~400                   | ~60                           |
| End of OCT-26                      | ~310                 | ~1,800                 | ~250                          |
| End of NOV-26 (retrain checkpoint) | ~370                 | ~2,200                 | ~310                          |

~310 aligned tuples across multiple WD steps gives us enough degrees of freedom to fit per-segment quantile bounds AND model the decay curve from WD-N to WD-1, rather than treating each WD step as an independent point. Final retrain architecture decision still deferred until we see the data — see [STAGE3_CONTEXT.md](notebooks/STAGE3_CONTEXT.md) for the 4-model option.

---

## 7. Resume guide (for picking this back up in 6 months)

When ready to retrain:

1. **Verify data collection has continued uninterrupted.**
   ```sql
   SELECT COUNT(*) FROM ARFINRO.JSR_WD0_PREDICTIONS WHERE GENERATED_AT >= SYSDATE - 180;
   SELECT COUNT(*) FROM ARFINRO.JSR_WD0_RAW_SNAPSHOTS WHERE GENERATED_AT >= SYSDATE - 180;
   -- Sanity-check formal vs training-only split:
   SELECT CASE WHEN PREDICTION_LOW IS NULL THEN 'training-only' ELSE 'formal' END AS kind,
          COUNT(*) FROM ARFINRO.JSR_WD0_PREDICTIONS
    WHERE GENERATED_AT >= SYSDATE - 180 GROUP BY CASE WHEN PREDICTION_LOW IS NULL THEN 'training-only' ELSE 'formal' END;
   ```
   Expect ≥ ~360 prediction rows and ≥ ~2,000 snapshot rows; roughly **6 formal predictions per cycle** (3 WDs × 2 line types) and **~54 training-only per cycle**.
2. **Build the actuals join.** `ARFINRO.ASK_QE_ME_INTERFACE_LOAD` keyed on `(period_year, period_num, line_type)` with `close_type = 'MIDCLOSE'`.
3. **Re-read this report, then [STAGE3_CONTEXT.md](notebooks/STAGE3_CONTEXT.md) Sections "4-model architecture" and "Methodology recommendation"** — the user-decided architecture and quantile-regression plan are spec'd there.
4. **Use `notebooks/wd0_weight_tuning.ipynb` as the skeleton.** Its scaffolding for LOO CV, coverage, and width metrics is reusable. Replace the input data source with the live `JSR_WD0_*` tables.
5. **Compare any new model against `v1-predecessor` on the same LOO split.** Required deltas to ship: coverage ≥ 75% AND median width ≤ predecessor's median width × 1.1. (Don't ship something 2× wider just because it covers more — see Section 3.1.)
6. **Quick win before retrain:** split the min/max table by line type in `Wd0PredictiveService.buildWeightTable()`. SERVICE table from Section 3.3. PRODUCT stays as-is. No retraining needed.

---

## 8. Risks & open questions

| Risk                                                                                                                            | Mitigation                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Cron stops firing in prod for some reason and we don't notice for weeks                                                         | Add a Datadog/health-check alert on `MAX(GENERATED_AT)` in `JSR_WD0_PREDICTIONS` being older than 24h on a weekday. Not built yet. |
| Source SQL drifts (e.g. someone changes the DB link target) and predictions silently degrade                                    | Persist a hash of each source query in `JSR_WD0_RAW_SNAPSHOTS.SOURCE_QUERY` (currently stores name only). Easy add.                |
| 6 months of data still isn't enough to beat the predecessor's hand-tuned weights                                                | Acceptable outcome — we keep v1 in prod and document that the noise floor is the binding constraint, not the model.                     |
| Sales/service close behaviour fundamentally changes (org restructure, new ERP, etc.) and historical data becomes non-stationary | Rolling-window retrain (Section 4.3) is designed to handle exactly this, but requires monitoring drift in the meantime.                 |

---

_End of report._
