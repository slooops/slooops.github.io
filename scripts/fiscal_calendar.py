#!/usr/bin/env python3
"""
Cisco Fiscal Calendar Calculator

Pattern:
  - FY ends on the last Saturday in July (e.g. FY26 ends last Sat of Jul 2026)
  - Each quarter: 4 weeks + 4 weeks + 5 weeks = 13 weeks
  - 53-week years: Q3 Period 7 becomes 5 weeks (5-4-5 instead of 4-4-5)
  - All period-end dates fall on Saturdays

Usage:
  python fiscal_calendar.py                     # today's date
  python fiscal_calendar.py 2026-04-27          # specific date
  python fiscal_calendar.py --validate          # compare against known monthEndDates
  python fiscal_calendar.py --quarter Q3FY26    # look up a specific quarter
"""

import sys
from datetime import date, timedelta


# ── Known month-end dates for validation (from monthEndDates.ts) ──────────────
KNOWN_MONTH_ENDS = [
    # '2025-01-26',  # data says Sunday — algorithm gives 2025-01-25 (Saturday)
    '2025-02-22', '2025-03-22',  # using corrected value (original had 03-20)
    '2025-04-26', '2025-05-24', '2025-06-21',
    '2025-07-26', '2025-08-23', '2025-09-20',
    '2025-10-25', '2025-11-22', '2025-12-20',
    '2026-01-24', '2026-02-21', '2026-03-21',
    '2026-04-25', '2026-05-23', '2026-06-20',
    '2026-07-25', '2026-08-22', '2026-09-19',
    '2026-10-24', '2026-11-21', '2026-12-19',
    '2027-01-23', '2027-02-27', '2027-03-27',
    '2027-05-01', '2027-05-29', '2027-06-26',
    '2027-07-31', '2027-08-28', '2027-09-25',
    '2027-10-30', '2027-11-27', '2027-12-25',
    '2028-01-29', '2028-02-26', '2028-03-25',
    '2028-04-29', '2028-05-27', '2028-06-24',
    '2028-07-29', '2028-08-26', '2028-09-23',
    '2028-10-28', '2028-11-25', '2028-12-23',
    '2029-01-27', '2029-02-24', '2029-03-24',
    '2029-04-28', '2029-05-26', '2029-06-23',
    '2029-07-28', '2029-08-25', '2029-09-22',
    '2029-10-27', '2029-11-24', '2029-12-22',
    '2030-01-26', '2030-02-23', '2030-03-23',
    '2030-04-27', '2030-05-25', '2030-06-22',
    '2030-07-27',
]


def last_saturday_in_july(year: int) -> date:
    """Find the last Saturday in July for a given calendar year."""
    jul_31 = date(year, 7, 31)
    # weekday(): Mon=0 … Sat=5, Sun=6
    days_since_sat = (jul_31.weekday() - 5) % 7
    return jul_31 - timedelta(days=days_since_sat)


def fy_end(fy: int) -> date:
    """FY{N} ends on the last Saturday in July of calendar year N."""
    return last_saturday_in_july(fy)


def compute_fiscal_year(fy: int):
    """
    Compute all 12 period-end dates for FY{fy}.
    Returns: (periods: list[date], is_53_week: bool, anchor: date)
    """
    anchor = fy_end(fy - 1)        # previous FY end = this FY's anchor
    end = fy_end(fy)
    total_days = (end - anchor).days
    is_53 = total_days == 371       # 53 × 7

    # Build the week pattern: 4-4-5 per quarter, Q3 P7 gets +1w in 53-week years
    pattern = []
    for q in range(4):
        if is_53 and q == 2:        # Q3 in a 53-week year
            pattern.extend([5, 4, 5])
        else:
            pattern.extend([4, 4, 5])

    periods = []
    cursor = anchor
    for weeks in pattern:
        cursor += timedelta(weeks=weeks)
        periods.append(cursor)

    return periods, is_53, anchor


def fiscal_year_for_date(d: date) -> int:
    """Which Cisco FY does this calendar date belong to?"""
    fy_end_this_year = last_saturday_in_july(d.year)
    if d > fy_end_this_year:
        return d.year + 1
    # Also check if the date is before the FY start for this calendar year's FY
    fy_candidate = d.year
    prev_fy_end = fy_end(fy_candidate - 1)
    if d <= prev_fy_end:
        return fy_candidate
    return fy_candidate


def get_info_for_date(d: date) -> dict:
    """Full fiscal calendar info for a given date."""
    fy = fiscal_year_for_date(d)
    periods, is_53, anchor = compute_fiscal_year(fy)

    # Find which period/quarter the date is in
    period_num = None
    quarter_num = None
    for i, p_end in enumerate(periods):
        p_start = anchor + \
            timedelta(days=1) if i == 0 else periods[i - 1] + timedelta(days=1)
        if p_start <= d <= p_end:
            period_num = i + 1
            quarter_num = (i // 3) + 1
            break

    qtr_start_idx = (quarter_num - 1) * 3 if quarter_num else 0
    qtr_start = anchor + \
        timedelta(
            days=1) if qtr_start_idx == 0 else periods[qtr_start_idx - 1] + timedelta(days=1)
    qtr_end = periods[qtr_start_idx + 2] if quarter_num else None

    return {
        'date': d,
        'fy': fy,
        'quarter': quarter_num,
        'period': period_num,
        'is_53_week': is_53,
        'fy_start': anchor + timedelta(days=1),
        'fy_end': periods[11],
        'quarter_start': qtr_start,
        'quarter_end': qtr_end,
        'periods': periods,
        'anchor': anchor,
    }


def parse_quarter_arg(arg: str) -> tuple:
    """Parse 'Q3FY26' → (quarter=3, fy=26+2000)."""
    arg = arg.upper().strip()
    if not arg.startswith('Q') or 'FY' not in arg:
        raise ValueError(f"Expected format like Q3FY26, got: {arg}")
    q = int(arg[1])
    fy = int(arg[arg.index('FY') + 2:])
    if fy < 100:
        fy += 2000
    return q, fy


def print_calendar(info: dict):
    fy = info['fy']
    periods = info['periods']
    _, is_53, anchor = compute_fiscal_year(fy)

    # Build week pattern
    pattern = []
    for q in range(4):
        if is_53 and q == 2:
            pattern.extend([5, 4, 5])
        else:
            pattern.extend([4, 4, 5])

    print(f"\n{'=' * 65}")
    print(f"  Cisco Fiscal Calendar  —  FY{fy}")
    print(f"{'=' * 65}")
    print(f"  Input date:     {info['date']}")
    print(f"  Fiscal Year:    FY{fy}  ({'53-week' if is_53 else '52-week'})")
    print(f"  Quarter:        Q{info['quarter']}FY{fy}")
    print(f"  Period:         P{info['period']}")
    print(f"  FY range:       {info['fy_start']}  →  {info['fy_end']}")
    print(
        f"  Quarter range:  {info['quarter_start']}  →  {info['quarter_end']}")
    print()

    qtr_labels = ['Q1'] * 3 + ['Q2'] * 3 + ['Q3'] * 3 + ['Q4'] * 3
    print(
        f"  {'Period':<8} {'Quarter':<10} {'Weeks':<7} {'Start':<13} {'End':<13} {'Day'}")
    print(f"  {'─' * 8} {'─' * 10} {'─' * 7} {'─' * 13} {'─' * 13} {'─' * 12}")

    for i, p_end in enumerate(periods):
        p_start = anchor + \
            timedelta(days=1) if i == 0 else periods[i - 1] + timedelta(days=1)
        q_label = f"{qtr_labels[i]}FY{fy}"
        weeks = pattern[i]
        is_qtr_end = (i + 1) % 3 == 0
        is_current = (i + 1) == info['period']
        marker = ' ◀ QTR' if is_qtr_end else ''
        star = ' ★' if is_current else ''
        day_name = p_end.strftime('%a')
        print(
            f"  P{i + 1:<6} {q_label:<10} {weeks}w      {p_start}    {p_end}   {day_name}{marker}{star}")

    print()

    # Weekly throughput boundaries for the selected quarter
    q = info['quarter']
    q_start = info['quarter_start']
    q_end = info['quarter_end']
    print(f"  Weekly throughput boundaries for Q{q}FY{fy}:")
    print(f"  Quarter: {q_start} → {q_end}")
    week_num = 1
    w_start = q_start
    while w_start <= q_end:
        w_end = min(w_start + timedelta(days=6), q_end)
        full = (w_end - w_start).days == 6
        tag = '' if full else '  (partial week)'
        print(
            f"    W{week_num:>2}:  {w_start} → {w_end}  ({(w_end - w_start).days + 1}d){tag}")
        week_num += 1
        w_start = w_end + timedelta(days=1)
    print()


def validate():
    """Compare computed dates against the known monthEndDates.ts list."""
    known = [date.fromisoformat(d) for d in KNOWN_MONTH_ENDS]
    print(f"\n{'=' * 65}")
    print(f"  Validation against monthEndDates.ts ({len(known)} dates)")
    print(f"{'=' * 65}")

    # Compute FY25 through FY30
    all_computed = []
    for fy in range(25, 31):
        periods, is_53, _ = compute_fiscal_year(2000 + fy)
        all_computed.extend(periods)

    matches = 0
    misses = 0
    for kd in known:
        if kd in all_computed:
            matches += 1
        else:
            # Find closest computed
            closest = min(all_computed, key=lambda c: abs((c - kd).days))
            delta = (kd - closest).days
            print(f"  MISMATCH: known={kd} ({kd.strftime('%A')})  "
                  f"closest computed={closest} ({closest.strftime('%A')})  "
                  f"Δ={delta:+d}d")
            misses += 1

    print(f"\n  Results: {matches}/{matches + misses} match  "
          f"({misses} mismatches)")
    print()


def main():
    if len(sys.argv) < 2:
        d = date.today()
        info = get_info_for_date(d)
        print_calendar(info)
        return

    arg = sys.argv[1]

    if arg == '--validate':
        validate()
        return

    if arg.upper().startswith('Q') and 'FY' in arg.upper():
        # --quarter Q3FY26 style (with or without --quarter flag)
        q_arg = arg
        if arg == '--quarter' and len(sys.argv) > 2:
            q_arg = sys.argv[2]
        q, fy = parse_quarter_arg(q_arg)
        periods, is_53, anchor = compute_fiscal_year(fy)
        # Pick a date in the middle of that quarter
        q_start_idx = (q - 1) * 3
        q_mid = periods[q_start_idx]  # end of first period in that quarter
        info = get_info_for_date(q_mid)
        print_calendar(info)
        return

    try:
        d = date.fromisoformat(arg)
    except ValueError:
        print(f"Invalid input: {arg}")
        print(
            "Usage: python fiscal_calendar.py [YYYY-MM-DD | Q3FY26 | --validate]")
        sys.exit(1)

    info = get_info_for_date(d)
    print_calendar(info)


if __name__ == '__main__':
    main()
