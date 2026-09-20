# LeadLoop Benchmarks

## Part A — Automated quality benchmarks (CI, every push)

Each push runs these measurements via `scripts/benchmark.js`, and the results
are appended to `benchmarks/history.jsonl` (committed back to `main` by CI),
so quality trends upward and regressions fail the push:

| Benchmark | Budget / bar | Enforced |
|---|---|---|
| Per-page HTML weight | warn > 120 KB, **fail > 200 KB** per page | CI benchmark job |
| E2E pass rate | **100%** of `tests/e2e/*.test.js` green | CI e2e job |
| SEO audit pass rate | **100%** of pages pass `scripts/seo-audit.js` | CI seo-quality job |
| Broken internal links | **0** | CI seo-quality job |
| Sitemap validity + coverage | parses; lists every root HTML page | CI seo-quality job |
| Security scan | **0** secret hits, **0** unlisted external scripts, all inline JS parses | CI security job |
| Live smoke (main pushes) | all sitemap URLs return HTTP 200; homepage has `id="toolkit"` | CI smoke job |

Page counts, weights, test counts, and pass/fail results are recorded per
commit in `benchmarks/history.jsonl`. Page weight trends are the early-warning
signal: feature pages should stay well under the 120 KB warn line (today the
heaviest page is ~66 KB).

## Part B — User metrics plan

**Honest baseline: LeadLoop has no analytics and no production email capture
today.** Signups are localStorage-only; there is no traffic data, no
conversion funnel, and no user numbers — so none are claimed here or in CI.

Once privacy-friendly analytics ship (with a privacy policy and consent, per
`docs/COMPLIANCE_RISK.md`), we will track, per feature page:

- Pageviews and unique visitors per feature page
- Toolkit-card click-through rate (homepage → feature)
- Email-gate conversion rate (gate views → successful unlocks)
- Download/print actions per feature

**Baselines get set after 30 days of real data** — no targets or projections
until then. When metrics exist, they will be recorded in
`benchmarks/history.jsonl` under a separate `kind: "user-metrics"` line, with
the measurement window stated, and reviewed monthly.

No invented numbers, ever.
