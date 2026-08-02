# WD0 Midclose Prediction Model — Status Report & Post-Mortem

**Author:** Jack Sloop
**Date:** May 29, 2026 (last updated 2026-07-24)
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
5. **⚠ JUL-26 (Q4 YE) `PREDICTION_LOW` / `PREDICTION_HIGH` are hand-overridden** by finance leadership across WD-3, WD-2, and WD-1 for both PRODUCT and SERVICE (6 rows total, `PREDICTION_ID` 863, 864, 883, 884, 903, 904). **Do not use those two columns for JUL-26 in any retrain or backtest.** `WEIGHTED_SUM` and `JSR_WD0_RAW_SNAPSHOTS` are untouched and remain the source of truth — see [Section 9](#9-jul-26-ye-manual-override-notice).

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

| Table                   | Purpose                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
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
- **Predecessor's calibration window sat across a business-mix inflection point, and the mix keeps moving.** The FY23–FY25 training data spans directly across the Splunk acquisition, which reshaped Cisco's SERVICE segment. Concrete timeline overlaid on the training window (Cisco fiscal year ends late July):

  | Date                          | Event                                                                          | Training-data implication                                                    |
  | ----------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
  | Aug 2022 – Mar 17, 2024       | Pre-Splunk baseline                                                            | ~19 months of PRODUCT-dominant rows at the front of the FY23–FY25 window     |
  | **Mar 18, 2024**              | Splunk acquisition closes                                                      | Structural break — nothing before this point represents the current business |
  | May 15, 2024 (Q3 FY24 report) | First Splunk revenue in Cisco financials — partial quarter, $413M contribution | Mar–Apr 2024 close cycles have partial-Splunk noise                          |
  | Aug 14, 2024 (Q4 FY24 report) | First full quarter with Splunk absorbed ($1.4B FY24 total)                     | From here on, SERVICE line volume steps up permanently                       |
  | Aug 13, 2025 (Q4 FY25 report) | Splunk enters "organic" YoY baseline; ex-Splunk callouts dropped               | Roughly the end of the predecessor's training window                         |
  | Aug 2025 – present (FY26)     | AI-infra buildout shifts mix back toward PRODUCT-dominant                      | JUL-26 YE shows PRODUCT `WEIGHTED_SUM` ~7× SERVICE — see Section 9           |

  Two consequences for the retrain:
  - The PRODUCT-anchored-uniform-table bias documented above is _compounded_ by the fact that even a well-fit SERVICE table calibrated on FY23–FY25 may not generalize forward if the mix keeps inverting. Roughly half of the predecessor's training window is pre-Splunk (small SERVICE) and half is post-Splunk (large SERVICE) — the "average" fit will be wrong for whatever regime is current.
  - **Future retrains should treat PRODUCT and SERVICE as independent time series with independently-fit weights and multipliers, and should not lean on cross-line-type ratios or a joint model.** When the FY27 retrain happens, also consider segmenting or weighting training rows by era (`< 2024-03-18` = pre-Splunk, `2024-03-18` → `2025-07-31` = Splunk-integration transient, `≥ 2025-08-01` = fully-consolidated) rather than treating the whole FY23–FY25 window as homogeneous. Rolling-window retrain (Section 4.3) is the long-term answer for exactly this reason — the PRODUCT/SERVICE relationship at Cisco is non-stationary on the scale of years due to acquisitions and macro spend cycles (Splunk in FY24, AI-infra boom FY25–FY26, whatever comes next), and coupling them will bake past mix assumptions into future predictions.

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
   **Before joining to actuals: read [Section 9](#9-jul-26-ye-manual-override-notice) and either drop the 6 tampered JUL-26 rows or reconstruct their bounds from `WEIGHTED_SUM`. Do not train against the stored `PREDICTION_LOW` / `PREDICTION_HIGH` for that period.**
2. **Build the actuals join.** `ARFINRO.ASK_QE_ME_INTERFACE_LOAD` keyed on `(period_year, period_num, line_type)` with `close_type = 'MIDCLOSE'`. Known data-quality issues to clean before training (verified 2026-07-24):
   - **APR-23 and MAY-23 rows are identical duplicates** (P=20,872 / S=25,401 for both). Likely a mistaken reload; one row should be dropped, and the correct source for the other backfilled if possible.
   - **MAY-26 SERVICE is mis-tagged** with `PERIOD_NUM=8` (which is MAR-26). The row with `LINE_TYPE='SERVICE'`, `LINE_COUNT=1567`, `CLOSE_START='2026-05-24'` is almost certainly the real MAY-26 SERVICE close and should be renumbered to `PERIOD_NUM=10`.
   - **FEB-25 CLOSE_START='2024-02-23'** is a probable typo (should be 2025-02-23).
   - **FY22 rows all have empty CLOSE_START.** If close-date is needed for time-based joins, backfill from period metadata.
   - **FY23 has 3–5× outlier months** (AUG-23 P=51,809, MAR-23 P=49,629, JUL-23 S=73,854). Investigate before including — could be legitimate quarter-end surges or backfill/reclass events, but they will materially move any weighted average.
3. **Re-read this report, then [STAGE3_CONTEXT.md](notebooks/STAGE3_CONTEXT.md) Sections "4-model architecture" and "Methodology recommendation"** — the user-decided architecture and quantile-regression plan are spec'd there.
4. **Use `notebooks/wd0_weight_tuning.ipynb` as the skeleton.** Its scaffolding for LOO CV, coverage, and width metrics is reusable. Replace the input data source with the live `JSR_WD0_*` tables.
5. **Compare any new model against `v1-predecessor` on the same LOO split.** Required deltas to ship: coverage ≥ 75% AND median width ≤ predecessor's median width × 1.1. (Don't ship something 2× wider just because it covers more — see Section 3.1.)
6. **Quick win before retrain:** split the min/max table by line type in `Wd0PredictiveService.buildWeightTable()`. SERVICE table from Section 3.3. PRODUCT stays as-is. No retraining needed.

---

## 8. Risks & open questions

| Risk                                                                                                                            | Mitigation                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cron stops firing in prod for some reason and we don't notice for weeks                                                         | Add a Datadog/health-check alert on `MAX(GENERATED_AT)` in `JSR_WD0_PREDICTIONS` being older than 24h on a weekday. Not built yet.                                                                                                                                         |
| Source SQL drifts (e.g. someone changes the DB link target) and predictions silently degrade                                    | Persist a hash of each source query in `JSR_WD0_RAW_SNAPSHOTS.SOURCE_QUERY` (currently stores name only). Easy add.                                                                                                                                                        |
| 6 months of data still isn't enough to beat the predecessor's hand-tuned weights                                                | Acceptable outcome — we keep v1 in prod and document that the noise floor is the binding constraint, not the model.                                                                                                                                                        |
| Sales/service close behaviour fundamentally changes (org restructure, new ERP, etc.) and historical data becomes non-stationary | Rolling-window retrain (Section 4.3) is designed to handle exactly this, but requires monitoring drift in the meantime.                                                                                                                                                    |
| Manual override of `PREDICTION_LOW` / `PREDICTION_HIGH` by leadership after cron write (occurred for JUL-26 YE)                 | Preserve `WEIGHTED_SUM` and `JSR_WD0_RAW_SNAPSHOTS` untouched; document every override in Section 9; recompute originals from raw during retrain. Longer-term consider an `IS_OVERRIDDEN` / `OVERRIDE_NOTE` column and a trigger-based audit log on the predictions table. |

---

## 9. JUL-26 YE manual override notice

**Date recorded:** 2026-07-24 (WD-1 of JUL-26, Q4 fiscal year-end)
**Recorded by:** Jack Sloop, at the direction of finance leadership.
**Scope:** `ARFINRO.JSR_WD0_PREDICTIONS` rows where `PERIOD_NAME = 'JUL-26'` and `WD IN ('WD-3','WD-2','WD-1')` — 6 rows total.

### What happened

For the JUL-26 Q4 year-end close, leadership replaced the model-computed `PREDICTION_LOW` and `PREDICTION_HIGH` values with hand-calculated numbers produced outside this system. The WD-3 and WD-2 overrides were applied by the DBA directly. The WD-1 override was applied via this codebase's MCP tooling on 2026-07-24 with values supplied by the DBA (LOW/HIGH: PRODUCT 19436 / 38267, SERVICE 21747 / 46543).

### Rows affected

| PREDICTION_ID | WD   | LINE_TYPE | WEIGHTED_SUM (untouched) | Current LOW (overridden) | Current HIGH (overridden) |
| ------------- | ---- | --------- | ------------------------ | ------------------------ | ------------------------- |
| 863           | WD-3 | PRODUCT   | 25,526                   | 18,923                   | 38,621                    |
| 864           | WD-3 | SERVICE   | 2,995                    | 18,654                   | 26,453                    |
| 883           | WD-2 | PRODUCT   | 25,548                   | 12,435                   | 29,621                    |
| 884           | WD-2 | SERVICE   | 3,100                    | 19,242                   | 24,653                    |
| 903           | WD-1 | PRODUCT   | 25,304                   | 19,436                   | 38,267                    |
| 904           | WD-1 | SERVICE   | 4,085                    | 21,747                   | 46,543                    |

### What the model would have said (reconstructed from `JSR_WD0_RAW_SNAPSHOTS`)

Each of the 6 predictions has its full per-day-bucket input trace preserved in `JSR_WD0_RAW_SNAPSHOTS` (PRODUCT rows have 2 buckets each, SERVICE rows have 9 each — 2 SERVICE_FLEXIBLE_INVOICE + 7 SERVICE_FUTURE_INVOICE_RELEASE). Summing `PER_DAY_WEIGHT × LINE_COUNT` across those buckets and cross-checking against the stored `WEIGHTED_SUM` confirms **all six reconstructions match to the rounding**, so the numbers below are what the model produced end-to-end at the snapshot time of day for each WD:

| PREDICTION_ID | WD   | LINE_TYPE | Snapshot GEN (UTC) | Recomputed WS (from raw) | Stored WS | Model LOW (`WS × qe_low`) | Model HIGH (`WS × qe_high`) |
| ------------- | ---- | --------- | ------------------ | -----------------------: | --------: | ------------------------: | --------------------------: |
| 863           | WD-3 | PRODUCT   | 2026-07-22 22:01   |                25,525.65 |    25,526 |                **13,784** |                  **89,850** |
| 864           | WD-3 | SERVICE   | 2026-07-22 22:01   |                 2,995.45 |     2,995 |                 **1,618** |                  **10,544** |
| 883           | WD-2 | PRODUCT   | 2026-07-23 22:01   |                25,548.25 |    25,548 |                **18,395** |                  **88,397** |
| 884           | WD-2 | SERVICE   | 2026-07-23 22:01   |                 3,099.89 |     3,100 |                 **2,232** |                  **10,726** |
| 903           | WD-1 | PRODUCT   | 2026-07-24 22:01   |                25,303.95 |    25,304 |                **31,883** |                  **82,997** |
| 904           | WD-1 | SERVICE   | 2026-07-24 22:01   |                 4,085.21 |     4,085 |                 **5,147** |                  **13,399** |

Independent verification: rows 903 and 904 are the two the model output today. I read `PREDICTION_LOW` / `PREDICTION_HIGH` out of the DB immediately before the WD-1 override was applied, and they matched the reconstructed values above to the dollar (31,883 / 82,997 for PRODUCT and 5,147 / 13,399 for SERVICE). WD-3 and WD-2 model bounds were never persisted anywhere — they were overwritten in place — but the raw-snapshot reconstruction is the audit-trail equivalent.

### Model output vs. overridden values, side by side

| WD   | LINE_TYPE | Model LOW | Overridden LOW |   ∆ LOW | Model HIGH | Overridden HIGH |  ∆ HIGH |
| ---- | --------- | --------: | -------------: | ------: | ---------: | --------------: | ------: |
| WD-3 | PRODUCT   |    13,784 |         18,923 |  +5,139 |     89,850 |          38,621 | −51,229 |
| WD-3 | SERVICE   |     1,618 |         18,654 | +17,036 |     10,544 |          26,453 | +15,909 |
| WD-2 | PRODUCT   |    18,395 |         12,435 |  −5,960 |     88,397 |          29,621 | −58,776 |
| WD-2 | SERVICE   |     2,232 |         19,242 | +17,010 |     10,726 |          24,653 | +13,927 |
| WD-1 | PRODUCT   |    31,883 |         19,436 | −12,447 |     82,997 |          38,267 | −44,730 |
| WD-1 | SERVICE   |     5,147 |         21,747 | +16,600 |     13,399 |          46,543 | +33,144 |

Pattern the overrides implement:

- **PRODUCT HIGH pulled way in** across all three WDs (−45k to −59k lines). The model's HIGH bound is dominated by the 3.28–3.52 QE multiplier applied to a Jul-27-heavy weighted sum, which produces ~80–90k lines. Leadership evidently doesn't believe that upper tail.
- **SERVICE bounds pushed way out** across all three WDs (LOW +~17k lines, HIGH +14–33k lines). The model believes SERVICE close will be tiny (`WS` of 3–4k → HIGH of only ~10–13k lines). Leadership is compensating for the well-documented Section 3.3 bias that under-predicts SERVICE — the predecessor's calibration on a window (FY23–FY25) that swings from 49% SERVICE share to 29% SERVICE share year-over-year (see Section 5) means the multiplier table is a wide-window average that will misfit any specific YE.
- **Portfolio totals (PRODUCT + SERVICE combined):** Model band `LOW/HIGH` = 15,401 / 100,394 (WD-3), 20,627 / 99,122 (WD-2), 37,030 / 96,396 (WD-1). Overridden band = 37,577 / 65,074 (WD-3), 31,677 / 54,274 (WD-2), 41,183 / 84,810 (WD-1). The overridden band is narrower everywhere and skews the top of the range down substantially.

All numbers in this section are order-line counts (rows in `cg1_oe_order_lines_all` / FIRD / FLEXI), not currency. The model does not touch revenue amounts anywhere in the pipeline.

The tampering is unambiguous but there is no `IS_OVERRIDDEN` flag on the table today — this section is the only marker.

### Rules for any future retrain / backtest touching JUL-26

1. **Do not read `PREDICTION_LOW` or `PREDICTION_HIGH` for JUL-26.** These columns are contaminated and no longer represent model output.
2. **Recompute originals from `WEIGHTED_SUM`** using the QE multipliers from Section 2.1:
   - WD-3 QE: `(0.54, 3.52)`
   - WD-2 QE: `(0.72, 3.46)`
   - WD-1 QE: `(1.26, 3.28)`
     Reconstruction: `original_low = WEIGHTED_SUM × qe_low`, `original_high = WEIGHTED_SUM × qe_high`.
3. **`WEIGHTED_SUM` itself is untouched** and matches what the model produced on 2026-07-22 / 07-23 / 07-24. Same for `JSR_WD0_RAW_SNAPSHOTS` — every per-day-bucket line count that fed these predictions is intact. Those two are the source of truth going forward.
4. **When computing coverage / width metrics against actuals**, either drop the JUL-26 rows or use the reconstructed originals — never the DB-stored bounds.
5. **If similar overrides happen again**, add a row to this table and to the audit trail rather than silently overwriting.

### 9.5 What is actually in the Jul 27 pileup

Live drill-down of `finfblrl.cg1_oe_order_lines_all@FINFBLBLO_LINK` for `promise_date = 2026-07-27`, run 2026-07-24 late afternoon (same filters as `PRODUCT_PROMISE_DATE_SQL`):

| Metric                              |                                                          Value |
| ----------------------------------- | -------------------------------------------------------------: |
| Total eligible lines                |                                                     **35,192** |
| Distinct orders (header_id)         |                                                     **11,837** |
| Distinct customers (sold_to_org_id) |                                                        **728** |
| Total ordered value                 |                                                 **≈ $10.72 B** |
| Median unit selling price           |                                                        $766.56 |
| Avg unit selling price              | $83,453 (skewed by large-ticket software / subscription lines) |

**By flow status** (line counts):

| Flow status                       |  Lines | Ordered value |
| --------------------------------- | -----: | ------------: |
| AWAITING_FULFILLMENT              | 12,921 |       $1.75 B |
| BOOKED                            | 10,850 |   **$8.19 B** |
| AWAITING_SHIPPING                 | 10,577 |        $736 M |
| SHIPPED                           |    649 |         $18 M |
| PO_OPEN / PRODUCTION_OPEN / other |    195 |        ~$36 M |

The `BOOKED` bucket is only ~31% of lines but ~76% of dollar value — that's where the big-ticket software / subscription / large-enterprise deals sit. `AWAITING_FULFILLMENT` + `AWAITING_SHIPPING` (67% of lines, 23% of value) is the physical hardware channel push.

**Top 15 customers by line count** (Party names resolved from `apps.hz_cust_accounts` ⋈ `apps.hz_parties`):

|   # | Customer                                | Lines | Ordered value |
| --: | --------------------------------------- | ----: | ------------: |
|   1 | INGRAM MICRO                            | 2,727 |       $28.5 M |
|   2 | TD SYNNEX CORPORATION                   | 2,322 |       $31.7 M |
|   3 | CDW LOGISTICS LLC                       | 1,807 |       $17.7 M |
|   4 | WORLD WIDE TECHNOLOGY INC               | 1,584 |       $28.5 M |
|   5 | PRESIDIO NETWORKED SOLUTIONS GROUP, LLC | 1,101 |       $12.1 M |
|   6 | TD SYNNEX SUPPLY CHAIN SERVICES LIMITED |   693 |       $10.8 M |
|   7 | SCANSOURCE INC                          |   583 |        $7.7 M |
|   8 | EPLUS TECHNOLOGY INC                    |   581 |        $5.0 M |
|   9 | INSIGHT DIRECT USA INC                  |   525 |        $6.9 M |
|  10 | WESTCON GROUP NETHERLANDS B V           |   483 |        $9.1 M |
|  11 | INGRAM MICRO INC CANADA                 |   459 |        $3.7 M |
|  12 | D&H DISTRIBUTING COMPANY                |   433 |        $4.9 M |
|  13 | COMPUTACENTER AG & CO. OHG              |   406 |        $9.6 M |
|  14 | MICRONET DE MEXICO SA DE CV             |   396 |       $29.1 M |
|  15 | INGRAM MICRO PAN EUROPE GMBH            |   362 |       $12.1 M |

Top 15 customers = 14,462 lines = **41% of the whole day**. All names are the standard Cisco distributor / global VAR channel — Ingram, TD SYNNEX, CDW, WWT, Presidio, ScanSource, ePlus, Insight, Westcon, D&H, Computacenter. No unusual concentration; this is the year-end push flowing through the normal channel accounts.

**Top line types** (all PRODUCT, resolved from `apps.oe_transaction_types_tl`):

| Line type          | Region         |                                 Lines |
| ------------------ | -------------- | ------------------------------------: |
| Standard-PRD-US-L  | United States  |                                16,811 |
| Standard-PRD-UKH-L | UK / EMEAR Hub |                                11,479 |
| Standard-PRD-MX-L  | Mexico         |                                 1,405 |
| Standard-PRD-IN-L  | India          |                                 1,228 |
| Standard-PRD-CAN-L | Canada         |                                   900 |
| Standard-PRD-AUS-L | Australia      |                                   816 |
| Standard-PRD-KR-L  | Korea          | 761 (but $9.6 B — subscription-heavy) |

All top line types are `Standard-PRD-*-L` (Standard Revenue Order product lines) across geographies. Zero SERVICE line types in the top 15, which is consistent with this data flowing exclusively through `PRODUCT_PROMISE_DATE_SQL`. SERVICE has its own two independent inputs (Section 3.1: `SERVICE_FLEXIBLE_INVOICE_SQL` on `apps.xxgco_oe_invoice_schedules` and `SERVICE_FUTURE_INVOICE_RELEASE_SQL` on `apps.xxgco_oe_order_lines_ext`); neither reads promise_date.

### 9.6 Reading of the Jul 27 signal

- **Not a data-quality artifact.** The pileup is 11,837 distinct orders across 728 customers — nothing is duplicated or mis-tagged.
- **Not a "one whale" deal.** The single largest customer (Ingram Micro) is 7.7% of Jul 27 lines. Top 15 combined = 41%. This is a broad channel push, not a single distortion.
- **Consistent with year-end push behavior.** 31% of lines are `BOOKED` and account for 76% of dollar value → high-value contracts staged to release into revenue by fiscal-year cutoff. 67% of lines are physical hardware `AWAITING_FULFILLMENT` / `AWAITING_SHIPPING` → distributor replenishment plus channel year-end.
- **The model's HIGH is defensible.** At the QE HIGH multiplier of 3.28, 25,304 `WEIGHTED_SUM` yields 82,997 HIGH. Given 35,192 lines are already sitting on Jul 27 alone with `flow_status` not CLOSED/CANCELLED, the model saying "up to ~83k lines could close this WD" is arithmetically consistent with the data. The override tightened this to 38,267 — a bound that would need > 55% of the Jul 27 pipeline to slip past YE for the actual to fall inside it.

### Follow-up work worth doing

- Add `IS_OVERRIDDEN NUMBER(1) DEFAULT 0` and `OVERRIDE_NOTE VARCHAR2(4000)` columns to `JSR_WD0_PREDICTIONS`, or add a lightweight `JSR_WD0_PREDICTION_OVERRIDES` audit table keyed by `PREDICTION_ID`. Backfill the 6 JUL-26 rows.
- If leadership wants to keep the ability to override, add an authenticated write endpoint that stamps the override + reason instead of doing this at the SQL level.
- **Post-JUL-26 actuals (available 2026-07-27):** join `ARFINRO.ASK_QE_ME_INTERFACE_LOAD` on `PERIOD_NAME = 'JUL-26'`, compare against both the model's original bounds and the override, and log which was closer. This is the first end-to-end training instance for the FY27 recalibration.

---

_End of report._
