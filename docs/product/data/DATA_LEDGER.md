# Data Ledger — LeadLoop (leadloop)

The index of every dataset behind `docs/product/`. Narrative docs summarize;
**these files are the evidence**. If a number appears in a strategy doc, its
source row must be findable here.

## Change-history convention (required, week on week)

Every dataset file in this directory carries a top-level `changes` array.
The first entry records the baseline. Every later update **appends** an entry —
never rewrites history:

```json
"changes": [
  {"date": "2026-09-20", "change": "baseline established 2026-09-20: <what was observed, with numbers>",
   "rationale": "<why this measurement matters / what decision it informs>",
   "rechecked": "n/a (first snapshot)"},
  {"date": "2026-09-27", "change": "GoatCounter installed; first real traffic: 41 visits, 12 toolkit-card clicks; pricing re-check: interviewing.io still $X/session (https://.../pricing re-opened)",
   "rationale": "measurement actually started; competitor pricing confirmed unchanged",
   "rechecked": "https://aashithk.github.io/leadloop/ , https://www.interviewing.io/pricing"}
]
```

Rules:
- One new timestamped dataset file per week (`<name>-YYYY-MM-DD.json`); never
  overwrite a dated file. The ledger below always points at the latest.
- `rechecked` names the exact link re-opened (or `n/a` for first snapshots).
- Unverifiable fields are `"not yet measured"` — never invented, never carried
  forward silently. If a value disappears behind a login/paywall, the change
  entry says so.
- The weekly strategy-review worker appends change entries and adds new rows
  here when new datasets appear.

## Datasets

| Dataset (latest) | What it is | How measured | Measured by | Measured at | Limitations |
|---|---|---|---|---|---|
| `benchmarks-2026-09-20.json` | Launch-day quality state: per-feature E2E pass counts (F1–F12), 5-persona buy-mode results, CI page-weight/security/SEO benchmark | Local jsdom e2e suites + live HTTP/content verification | pika (Muse agent) | 2026-09-20 | jsdom, not real-browser; persona validation is agent-simulated, not real users |
| `traffic-snapshot-2026-09-21.json` | Honest zero-state: GoatCounter snippet deployed, activation unverified | Live HTTP 200 + page-source check (no dashboard login) | pika (Muse agent) | 2026-09-21 | No pageview/visitor/conversion numbers exist; do not cite traffic for LeadLoop |
| `keywords-2026-09-20.json` | Working keyword list actually targeted on-page | Derived from shipped FAQ topics + page titles | pika (Muse agent) | 2026-09-20 | Working list only — **no rank data**; site not indexed as of 2026-09-20 |
| `competitors-2026-09-21.json` | Competitor table: mock-interview / interview-coaching platforms with pricing + features observed on live pages, attributable source links, `candidates_to_verify` for unverified names | Live page fetches + web search on 2026-09-21 | pika (Muse agent) | 2026-09-21 | Only what was displayed on fetched pages; gated pricing recorded as "not yet measured" |

## Raw sources (outside the repo)

- `~/workspace/goals/launch-leadloop-coaching-business/e2e/` — per-feature e2e suites
- `~/workspace/goals/launch-leadloop-coaching-business/validation/` — persona logs + progress.md
- `~/workspace/qinfra/benchmarks/history.jsonl` — CI benchmark history

