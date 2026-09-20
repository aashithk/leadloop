# LeadLoop — Success Metrics

> Last updated 2026-09-20. Honesty rule: baselines below are real or explicitly "not yet measured". Never invent traffic, revenue, or testimonials.

## North-star metric

**Email subscribers who complete the 3-part series** — the engaged list that the coaching business is built on. (Proxy until Kit is wired: localStorage signups `leadloop_signups_v1`.)

## Baselines (real, 2026-09-20)

| Metric | Baseline | Source |
|---|---|---|
| Site visits | not yet measured | GoatCounter `leadloop` snippet present; site-code creation/activation not verified |
| Email subscribers (production) | 0 | signups are localStorage-only; no provider wired |
| Kit test subscribers | 2 (aashith.kamath@gmail.com, aashithk@outlook.com — active) | Kit API 2026-09-20; test-only, no email sent |
| Emails sent | 0 | no sequence exists in Kit |
| Revenue | $0 | no pricing, no checkout |
| Testimonials on site | 0 | none invented; Aashith promised directs/mentees testimonials 2026-09-21 |
| Features live | 5 of 12 toolkit features | CHANGELOG.md (F1 26/26, F2 51/51, F3 55/55, F4 71/71, F5 77/77 E2E; all 5/5 personas buy mode) |
| Indexed pages | not yet measured | Search Console property verified 2026-09-20; sitemap submitted; recheck 2026-09-21 |

## Funnel economics (targets — to validate, not claims)

| Stage | Target conversion | How measured |
|---|---|---|
| Visitor → resume builder use | baseline: not yet measured | GoatCounter events (to instrument) |
| Builder use → email signup | 10–20% (hypothesis) | `leadloop_signups_v1` → Kit list after wiring |
| Signup → series completion | 40–60% (hypothesis) | Kit sequence stats after launch |
| Series completer → coaching inquiry | 2–5% (hypothesis) | booking link clicks / waitlist |

These are hypotheses for the CEO/CTO panel to pressure-test, not benchmarks. Real baselines begin once Kit is wired and traffic exists.

## Input metrics to instrument

- Toolkit-card CTR (homepage → each feature page).
- Email-gate conversion per feature (gate views → successful signups).
- Print/download actions per feature.
- Resume builder completions; signup and waitlist submissions.
- Page weight per page (tracked: `benchmarks/history.jsonl`; heaviest page 65.8 KB on 2026-09-20, budget 120 KB warning).

## SEO metrics

- Indexed pages; Search Console query impressions/clicks (baseline: not yet measured).
- Sitemap URLs grow with each toolkit feature (F1–F5 live; F6–F12 pending).

## Targets

| Metric | Target | By |
|---|---|---|
| Kit wired: form live + 3-email series active | done | 2026-10-04 (before Creator trial ends — downgrade-or-pay decision due) |
| Email subscribers | 100 | 2026-10-31 |
| Series completion rate | measured baseline | 2026-11-15 |
| All 12 toolkit features live | 12/12 | per pipeline cadence (F6–F12 in progress) |
| First coaching inquiry | 1 | 2026-11-30 |
| Revenue | $0 until pricing approved | — |

## Measurement rules

- CI runs E2E + security + SEO + benchmark on every push (`.github/workflows/ci.yml`); live smoke checks sitemap URLs on main.
- Never claim deployment, traffic, capture, delivery, or test success without direct verification (standing rule).
- Kit trial ends 2026-10-04 — the downgrade-to-free-Newsletter vs paid decision is the nearest-dated business risk.
