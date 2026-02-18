# Signal Quality Testing Plan

After tightening the scoring prompt for actionability, use this plan to validate improvements.

---

## Quick Smoke Test (5 min)

1. Run ingestion for one target with 3–5 subreddits:

   ```bash
   curl -X POST http://localhost:3000/api/cron/ingest
   ```

2. Check logs for `inserted` count and `durationFormatted`.

3. In the dashboard, review the signals that scored ≥70. Quick checks:
   - Are there **daily/weekly discussion threads**? (Should be fewer or gone.)
   - Are there **"what do you think?"** posts with no specific ask? (Should score lower.)
   - Do the **high-scoring signals** have a clear, specific question or need?

---

## Regression Checklist

After a run, scan the signal list for these anti-patterns. Each should score **<50** (or be excluded from the ≥70 display):

| Anti-pattern         | Example titles                                               | Expected |
| -------------------- | ------------------------------------------------------------ | -------- |
| Daily/weekly threads | "Daily FI discussion thread - Monday..."                     | <50      |
| Sticky megathreads   | "Please use this thread for..."                              | <50      |
| Generic "thoughts?"  | "What do you think about X?" (no specific ask)               | <50      |
| News/announcements   | "Company Y just launched..."                                 | <50      |
| AutoModerator posts  | Author: AutoModerator                                        | <50      |
| Tangential fit       | Topic related but target doesn't solve the specific question | <50      |

---

## Positive Signal Sanity Check

Signals scoring **75+** should typically look like:

- Poster has a **specific question** (e.g. "Which 401k funds should I pick?", "How do I track my portfolio?")
- Poster describes a **concrete problem** the target could address
- A founder replying with the target would read as **direct, helpful advice**

Manually review 5–10 high-scoring signals and confirm they meet this bar.

---

## A/B Comparison (Optional)

If you have a previous run’s data (before the prompt changes):

1. Run ingestion again with the same target and subreddits.
2. Compare:
   - **Inserted count**: Expect fewer signals (stricter scoring).
   - **Score distribution**: Fewer 60–75 scores; clearer separation between 40–50 (audit-only) and 75+ (actionable).
   - **Sample review**: Spot-check 10 random signals from old vs new run. New run should have fewer anti-patterns.

---

## Threshold Tuning (If Needed)

- Current display threshold: **70**. Signals with score ≥70 are shown.
- If you still see noise: Consider raising to **75** in the UI or persist logic.
- If you lose too many good signals: Review the prompt—it may be overcorrecting.

---

## Iteration

If quality is still off after a run:

1. **Too many false positives**: Add more anti-patterns to the system prompt or raise the display threshold.
2. **Too many false negatives**: Soften "Be strict" or clarify what counts as a "specific need" with examples.
3. **Edge cases**: Log `score` and `reason` for borderline signals (e.g. 65–75) and refine the prompt based on patterns.
