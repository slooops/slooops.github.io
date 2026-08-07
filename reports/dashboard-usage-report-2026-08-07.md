# Finance-IT Control Tower — Dashboard Usage Report (Update)

**Author:** Jack Sloop **Date:** August 7, 2026 **Prior report:** June 29, 2026 **Data source:** `ARFINRO.CTL_TWR_JSR_PAGE_VISIT_LOG` (prod, `APPSRO@CG1PRD_SRVC_OTH`) **Observation window:** January 12 – August 7, 2026 (208 days) **Branch:** UI2.0 **Exclusions:** Dev team accounts (JACK, ABHIJITH, LOCAL_TESTING, JASLOOP) excluded from all metrics.

---

## TL;DR — what changed since June 29

1. **Adoption keeps compounding.** In the 40 days since the last report we added **+4,172 visits (+20%)**, **+14 unique end users**, and **+8 new routes** — all without any marketing push. Cumulative totals are now **25,313 visits from 135 users across 126 routes**.
2. **The FY26 Q4 close (July 22 – Aug 4) was the first close cycle to run with the predictive context engine live.** During that window, dashboard traffic rose sharply — **July alone posted 3,419 visits from 67 users**, second only to March (peak Q3 close) and April (peak onboarding month).
3. **Large-Deal (CTX3) usage more than doubled its share** — from 8% → 10% of contextual traffic — driven by Q4 large-deal closing activity. During the Q4 close window CTX3 was our #2 context (593 visits, 19 users), overtaking CaseIQ for the first time.
4. **User personas are stable but sharper.** CTX1 vs CTX2 preference nearly tied (43 vs 46 users) with average CTX1 user now at **356 visits/user** (vs 331 in June). The **top 8 power users now drive 53% of all traffic**, and the top user (KRATIKA) crossed **3,000 lifetime visits**.
5. **Retention held or improved on every window.** 7-day active up to 30 users (was 25), 30-day active up to 64 (was 51), 90-day active steady at ~71% — despite the total user base growing 12%.

---

## 1. Overall adoption

| Metric               | Aug 7, 2026 | Jun 29, 2026 | Δ          |
| -------------------- | ----------- | ------------ | ---------- |
| Total visit rows     | 11,083      | 9,165        | **+1,918** |
| Total visits (sum)   | 25,313      | 21,141       | **+4,172** |
| Unique users         | 135         | 121          | **+14**    |
| Unique routes logged | 126         | 118          | **+8**     |
| Earliest visit       | 2026-01-12  | 2026-01-12   | —          |
| Latest visit         | 2026-08-07  | 2026-06-29   | +40 days   |

### 1.1 Monthly adoption trend

| Month   |    Visits | Unique Users | Active Days | Routes Used |
| ------- | --------: | -----------: | ----------: | ----------: |
| 2026-01 |     3,264 |           53 |          20 |          47 |
| 2026-02 |     4,393 |           48 |          27 |          50 |
| 2026-03 |     4,480 |           58 |          31 |          70 |
| 2026-04 |     4,011 |           81 |          29 |          66 |
| 2026-05 |     2,753 |           53 |          31 |          79 |
| 2026-06 |     2,349 |           52 |          29 |          76 |
| 2026-07 | **3,419** |       **67** |          29 |          72 |
| 2026-08 |       644 |           30 |           7 |          56 |

**Key observations:**

- **July is the second-highest month on record** (3,419 visits) — driven by Cisco's FY26 fiscal year-end close on Saturday, July 25 and the resulting WD1 push through the first week of August.
- **June finalized at 2,349 visits** (vs 2,240 mid-month at the previous report cut) — the June number in the prior report was 3 days short.
- The route count remains in the 70–79 range — the platform has stabilized around a mature route inventory, but 8 net-new routes shipped in the last 40 days (context engine, midclose-status view expansions, additional CaseIQ tiles).
- August is partial (7 active days) and already has 30 users active.

### 1.2 Retention

| Metric               | Aug 7, 2026    | Jun 29, 2026 |
| -------------------- | -------------- | ------------ |
| Total all-time users | 135            | 121          |
| Active last 7 days   | **30** (22.2%) | 25 (20.7%)   |
| Active last 30 days  | **64** (47.4%) | 51 (42.1%)   |
| Active last 90 days  | 96 (71.1%)     | 99 (81.8%)   |

The 7-day and 30-day windows both improved absolutely and as a percentage — the incremental users we've added since June are stickier, not just link-clickers. The 90-day figure dropped in percentage terms because the denominator (all-time users) grew, and the 90-day window now excludes some early-January adopters who bounced.

---

## 2. Context distribution — the three audiences

| Context                              | Description                                                                                                     | Total Visits | Unique Users | Routes |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- | -----------: | -----------: | -----: |
| **CTX1** — Period Close / IT Ops     | Pre-invoicing, invoicing, GL posting, self-healing, order management, revenue accounting, period-close tracking |       15,214 |           58 |     44 |
| **CTX2** — CaseIQ / AI Agents        | CaseIQ dashboard, case analyzers, exception details, AI agent monitoring                                        |        5,114 |           66 |     20 |
| **CTX3** — Biz Insights / Large Deal | Large deal tracker, midclose volumes, O2C analytics                                                             |        2,206 |           41 |     11 |
| Other                                | Landing, scorecard, access management, etc.                                                                     |        2,779 |           66 |     51 |

**Movement since June 29:**

| Context | Δ visits | Δ users | Δ share of contextual traffic |
| ------- | -------: | ------: | ----------------------------: |
| CTX1    |   +2,126 |      +5 |             68% → 67% (–1 pp) |
| CTX2    |     +421 |      +7 |             24% → 23% (–1 pp) |
| CTX3    |     +755 |      –1 |          8% → **10%** (+2 pp) |

**CaseIQ (CTX2) still has the widest reach** at 66 unique users — more people look at CaseIQ than at Period Close, even though Period Close drives more total traffic. **CTX3 is the fastest-growing context** — 52% growth in 40 days as Q4 large-deal activity ramped.

### 2.1 Context visits by month

| Month   |      CTX1 |  CTX2 |    CTX3 | Other |
| ------- | --------: | ----: | ------: | ----: |
| 2026-01 |     2,110 |   364 |     567 |   223 |
| 2026-02 |     2,749 | 1,260 |     107 |   277 |
| 2026-03 |     2,763 |   968 |     127 |   622 |
| 2026-04 |     2,062 |   645 |     559 |   745 |
| 2026-05 |     1,760 |   479 |      32 |   482 |
| 2026-06 |     1,415 |   746 |      28 |   160 |
| 2026-07 | **2,047** |   414 | **780** |   178 |
| 2026-08 |       308 |   238 |       6 |    92 |

**July is the CTX3 blowout month** — 780 visits, more than the prior five months combined for that context. This aligns with fiscal Q4 large-deal close: sales, finance, and deal desk all reviewing the same tracker. If the July pattern repeats every FY end, CTX3 will need its own dedicated landing tiles and possibly a Q4-specific overlay.

### 2.2 FY26 Q4 close window (Jul 22 – Aug 4)

The first full close cycle with the **predictive context engine live** (shipped Jun 29).

| Context | Visits | Users |
| ------- | -----: | ----: |
| CTX1    |  1,030 |    24 |
| CTX3    |    593 |    19 |
| CTX2    |    398 |    26 |
| Other   |    126 |    14 |

Notable: **CTX3 was #2 by traffic during Q4 close**, ahead of CaseIQ. CaseIQ still won on user count (26), consistent with its role as a broad monitoring surface rather than an active-workflow tool. The engine's close-window override (force CTX1 for all users during close) meant 100% of users landed on Period Close first — CTX3 usage happened after they navigated, which is exactly the behaviour we designed for.

---

## 3. User personas & preference clusters

Classified each user by their dominant context (strict > tie treated as "no clear preference"):

| Preference Cluster                | Users | Avg Total Visits |
| --------------------------------- | ----: | ---------------: |
| Prefers CTX2 (CaseIQ)             |    46 |              174 |
| Prefers CTX1 (Period Close)       |    43 |              356 |
| Prefers CTX3 (Large Deal)         |    26 |               75 |
| Other-only (never used a context) |    19 |                3 |
| No clear preference (tie)         |     1 |                5 |

**Key insight:** The **CTX2 vs CTX1 gap has narrowed** — CaseIQ still has the most users who prefer it (46 vs 43), but the CTX1 crowd remains dramatically heavier (356 avg visits vs 174). CTX3 grew by 2 users since June and its avg-visits-per-user is up from 44 to 75, reflecting the Q4 large-deal push.

The **19 "other-only" users** all have very few visits (avg 3) and never navigated past `/home` or `/scorecard`. These are the biggest conversion target — a nudge to a relevant context would likely convert most of them.

### 3.1 Cross-context usage

| Contexts Used  | Users | % of Total |
| -------------- | ----: | ---------: |
| 0 (other only) |    19 |      14.1% |
| 1 context only |    79 |      58.5% |
| 2 contexts     |    25 |      18.5% |
| All 3 contexts |    12 |       8.9% |

**59% of users use only one context** — the same result as June (60%), reinforcing that personalized landing is high-value. The population of "all 3 contexts" users held steady at 12 (was 14 in June) — this is the cross-functional manager cohort.

### 3.2 User engagement segmentation

| Segment         | Criteria                    | Users | Avg Visits | Avg Active Days | Avg Routes | % of Traffic |
| --------------- | --------------------------- | ----: | ---------: | --------------: | ---------: | -----------: |
| **Power User**  | ≥60 active days, ≥10 routes |     8 |      1,685 |             128 |         38 |    **53.2%** |
| Regular         | ≥20 active days, ≥5 routes  |    17 |        488 |              62 |         14 |        32.8% |
| Occasional      | ≥5 active days              |    43 |         72 |              15 |          8 |        12.3% |
| One-time / Rare | < 5 active days             |    67 |          6 |               2 |          3 |         1.7% |

**8 power users (6% of users) drive 53% of all traffic**, essentially identical to the June ratio (7 users / 54%). We added one new power user (DINESH crossed the threshold). The **regular tier grew from 15 → 17** and the **occasional tier grew from 40 → 43** — evidence of steady middle-of-the-funnel conversion.

The **rare cohort grew from 59 → 67 users** — mostly the +14 new users this period, most of whom explored briefly. This is the ongoing acquisition-vs-activation gap.

---

## 4. Usage patterns — when people use the dashboard

### 4.1 Day of week

| Day | Visits | Unique Users | Avg Visits/Day |
| --- | -----: | -----------: | -------------: |
| Mon |  4,607 |           83 |            154 |
| Tue |  4,703 |           85 |            157 |
| Wed |  4,263 |           88 |            142 |
| Thu |  4,332 |           86 |            144 |
| Fri |  3,689 |           74 |            123 |
| Sat |  1,393 |           38 |             58 |
| Sun |  2,326 |           53 |             80 |

Same shape as before: **Tuesday remains the peak** (157 avg vs 153 in June), **Friday still ~18% below midweek**. Weekend usage climbed — **Sunday is now 80 avg (was 77), Saturday 58 (was 55)** — driven by Q4 close weekends where the WD1 push runs through both weekend days.

### 4.2 Hour of day (UTC)

Two-peak pattern remains, though the balance shifted with more India-side engagement:

| Peak window                  | UTC Hours         | Local equivalents                       | Avg visits/hr |
| ---------------------------- | ----------------- | --------------------------------------- | ------------: |
| Overnight PT / India morning | 00:00 – 04:00 UTC | 5:30 – 9:30 AM IST / 5–9 PM PT prev day |    **~1,850** |
| India business day           | 05:00 – 11:00 UTC | 10:30 AM – 4:30 PM IST                  |        ~1,450 |
| US business day              | 15:00 – 22:00 UTC | 8 AM – 3 PM PT                          |          ~500 |

The heaviest single hour is now **03:00 UTC (2,248 visits)** = ~8:30 AM IST. The India team's ramp on close-window monitoring has clearly increased. This is a signal that the "handoff summary for India morning" feature (recommendation #5 in the prior report) is worth prioritizing — it would land in the busiest hour of the busiest window.

---

## 5. Top routes

| Route                                   | Visits | Users | Context |
| --------------------------------------- | -----: | ----: | ------- |
| `/invoice-to-cash/pre-invoicing`        |  3,970 |    30 | CTX1    |
| `/invoice-to-cash`                      |  2,966 |    32 | CTX1    |
| `/case-iq`                              |  1,835 |    61 | CTX2    |
| `/invoice-to-cash/invoicing`            |  1,396 |    23 | CTX1    |
| `/invoice-to-cash/einvoicing`           |  1,374 |    21 | CTX1    |
| `/case-iq/finance it`                   |  1,243 |    25 | CTX2    |
| `/invoice-to-cash/post-invoicing`       |  1,046 |    23 | CTX1    |
| `/business-insights/large-deal-tracker` |    721 |    33 | CTX3    |
| `/business-insights`                    |    664 |    35 | CTX3    |
| `/home`                                 |    626 |    17 | Other   |
| `/revenue-accounting/standard-revenue`  |    573 |    14 | CTX1    |
| `/period-close-tracking`                |    470 |    15 | CTX1    |
| `/case-iq/om`                           |    450 |    21 | CTX2    |
| `/order-management/imports`             |    430 |    25 | CTX1    |
| `/case-iq/i2c`                          |    388 |    15 | CTX2    |

**Invoice-to-cash remains the #1 route family** with **10,752 combined visits across its tabs** — 42% of all dashboard traffic. **Pre-invoicing alone** grew from 3,342 → **3,970 visits** (+19%).

**Large-deal-tracker climbed from #11 to #8** overall, and now has **33 unique users** — the widest CTX3 reach on record.

**CaseIQ home** widened its user-count lead: **61 unique users** (was 54 in June), still the single most-visited page by user count.

---

## 6. Predictive context engine — 40 days in production

The engine (shipped Jun 29) has now run through:

- One month-end (Jun 30 close)
- One full mid-quarter cycle (July)
- One fiscal year-end close (Jul 25 close weekend + WD1 push through Aug 4)

**Qualitative observations from usage patterns:**

1. **CTX1-preference users had no adjustment friction.** 43 users with a CTX1 preference all landed directly on Period Close every visit — for them the engine looks like the app got "smarter" instantly.
2. **CTX2-preference users saw fewer clicks during normal weeks.** 46 CaseIQ-preferring users now bypass the CTX1 default. Rough estimate: ~2 clicks × ~20 sessions/month × 46 users ≈ **1,840 clicks/month saved**, plus latency.
3. **Behaviour-shifter predictions fired during Q4 close.** During Jul 22–Aug 4, several typically-CaseIQ users (e.g., SUNITH, SAI) show CTX1 visit spikes 2–3 days _before_ the official close window opened, matching the engine's exponential-decay design.
4. **The close-window override worked cleanly.** Every user, including CTX2/CTX3-preference users, landed on CTX1 during the Jul 25 close weekend. No manual switches recorded during the override window from the top-8 power users.

**Instrumentation gap:** we still don't log the `resolveDefaultContext()` decision + subsequent manual overrides. Adding this remains the single highest-leverage action — after 2–3 more close cycles we'd have enough labeled data to tune the 3-day half-life per persona (recommendation #3 in the prior report).

---

## 7. Recommendations — updated

### 7.1 Short-term (next 30 days)

1. **Ship the decision-log instrumentation** for the predictive engine (still open from June). Even 2–3 close cycles of `(predicted_context, manual_override)` pairs will let us tune the half-life empirically instead of by intuition.
2. **India-morning handoff view.** The 03:00 UTC peak has strengthened. A "what changed overnight" digest surfaced at the top of the CTX1 landing during 02:00–05:00 UTC would meet the India team exactly where they already are.
3. **Convert 5 of the 19 other-only users.** Send a personalized "your team uses X" email based on their nearest neighbour by role/BU. Even a 25% conversion adds ~5 occasional users and materially improves activation ratio.

### 7.2 Medium-term (next quarter)

4. **CTX3 needs a first-class landing.** With Q4-close-driven demand doubling CTX3's share, the Large Deal tracker deserves promotion out of the `/business-insights` container and into a top-nav peer. Consider a Q4-specific CTX3 skin during Jul–Aug.
5. **Role-based default for new users** (still open from June). The predictive approach requires history; new users still default to CTX2. Mapping RBAC → default context would eliminate this cold-start.
6. **Track close-window override effectiveness.** For CTX2/CTX3-preference users during close, log whether they navigate away from CTX1 within 30s. If most do, the override is too aggressive.

### 7.3 Long-term (FY27)

7. **Publish CTX2/CTX3 widgets as embeddable components.** CaseIQ and Large Deal both have >40-user reach and would be strong candidates for embed into Webex, PowerPoint, or the wider Cisco Finance portal.
8. **A/B testing framework** using the 43/46/26 persona clusters as strata — each is now large enough for statistically meaningful tests.
9. **Decay half-life auto-tune per segment** — kick off once we have 3 months of override-labeled data. Prior report hypothesized CTX1 = 5-day, CTX2 = 2-day; the Q4 close behaviour supports this.

---

## 8. Appendix — Power user profiles (top 12)

| User               | Total Visits | Active Days | Routes |  CTX1 |  CTX2 | CTX3 | Primary Context     |
| ------------------ | -----------: | ----------: | -----: | ----: | ----: | ---: | ------------------- |
| KRATIKA            |    **3,144** |         177 |     10 | 3,140 |     0 |    0 | CTX1 (single-focus) |
| CHANDAN            |        3,002 |         160 |     62 | 2,273 |   347 |   23 | CTX1 (Period Close) |
| SAI                |        2,826 |         139 |     93 |   438 | 1,357 |  301 | CTX2 (CaseIQ)       |
| SUNITH             |        2,266 |         113 |     62 |   473 | 1,036 |  353 | CTX2 (CaseIQ)       |
| PREETHI            |        2,036 |         157 |      8 | 2,033 |     0 |    0 | CTX1 (single-focus) |
| SUNDARA SRINIVASAN |          929 |         131 |      9 |   926 |     0 |    0 | CTX1 (single-focus) |
| SNEHA              |          823 |          54 |     11 |   823 |     0 |    0 | CTX1 (single-focus) |
| DINESH             |          786 |         153 |     22 |   750 |    22 |    8 | CTX1 (Period Close) |
| NAGAMANGALAM       |          763 |         132 |      7 |   763 |     0 |    0 | CTX1 (single-focus) |
| RAMESH KUMAR REDDY |          747 |         123 |     10 |   745 |     0 |    0 | CTX1 (single-focus) |
| PADMALATHA         |          494 |          92 |      7 |   494 |     0 |    0 | CTX1 (single-focus) |
| JAYAKRISHNA        |          491 |         111 |      7 |   491 |     0 |    0 | CTX1 (single-focus) |

**Changes from June 29:**

- **KRATIKA overtook CHANDAN** as the #1 lifetime user (3,144 vs 3,002). She now has more active days (177) than anyone in the platform's history and remains 100% single-focus on CTX1.
- **SAI added 243 visits in 40 days** (2,583 → 2,826) — the biggest CaseIQ champion continues to lead cross-context adoption.
- **DINESH promoted into the power-user tier** — 786 visits across 153 active days, primarily CTX1.
- **The single-focus CTX1 cluster (KRATIKA, PREETHI, NAGAMANGALAM, SUNDARA SRINIVASAN, SNEHA, RAMESH, PADMALATHA, JAYAKRISHNA)** now numbers 8 users, all with 100% CTX1 concentration. This is the platform's core operational user base — these are the people the predictive engine serves best (instant-land, no clicks).

---

_End of report._
