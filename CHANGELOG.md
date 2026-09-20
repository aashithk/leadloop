# LeadLoop Changelog

Newest first. The feature pipeline (F2–F12) prepends its own entries as each feature ships.

## 2026-09-20 — F6: Staff Scope Calculator (live)

- Live page: https://aashithk.github.io/leadloop/staff-scope-calculator.html
- What it is: interactive 10-question self-assessment on scope, influence, and
  ambiguity (native radios, 1–4 scale). Computes a Senior-vs-Staff readiness
  score (x/40) with bands (Senior scope / Staff emerging / Staff ready),
  per-dimension bars, and a personalized gap analysis naming the weakest
  dimension with actionable advice — the analysis unlocks via email gate
  (localStorage list `leadloop_signups_v1`,
  `source:"staff-scope-calculator"`; existing subscribers bypass; duplicates
  not stored twice). Retake resets. Explicit "honest heuristic" disclaimer —
  predicts no real outcome.
- Tests: `tests/e2e/f6.test.js` — **67/67 pass** (score math incl. band
  boundaries 19/20/29/30, weakest-dimension identification, gated gap
  analysis, gate invalid/valid/dedupe/returning flows, retake reset,
  incomplete-form guard, heuristic-disclaimer + banned-claim scan, SEO
  hygiene, link resolution, accessibility basics).
- Persona validation: **5/5 reach buy mode** (Priya, Rahul, Mei, Arjun, Sara).
- SEO: dedicated title/meta/canonical/OG/Twitter, WebPage + BreadcrumbList
  JSON-LD, homepage toolkit card #6, sitemap entry.

## 2026-09-20 — F5: STAR-L Story Builder (live)

- Live page: https://aashithk.github.io/leadloop/star-l-story-builder.html
- What it is: interactive STAR-L builder — Situation, Task, Action, Result,
  Leadership lessons — with live word counts, a fictional-example loader,
  and clear. The formatted story output (live preview + copy + Markdown
  download + print) unlocks via email gate (localStorage list
  `leadloop_signups_v1`, `source:"star-l-story-builder"`; existing
  subscribers bypass; duplicates not stored twice).
- Tests: `tests/e2e/f5.test.js` — **77/77 pass** (five-field builder, live
  word counts, example loader/clear, gated output, markdown section
  coverage, copy/download/print flows, fictional-example + banned-claim
  scan, SEO hygiene, link resolution, accessibility basics).
- Persona validation: **5/5 reach buy mode** (Priya, Rahul, Mei, Arjun, Sara).
- SEO: dedicated title/meta/canonical/OG/Twitter, WebPage + BreadcrumbList
  JSON-LD, homepage toolkit card #5, sitemap entry.

## 2026-09-20 — F4: XFN Conflict Resolver (live)

- Live page: https://aashithk.github.io/leadloop/xfn-conflict-resolver.html
- What it is: interactive tool — pick 1 of 5 cross-functional conflict
  scenarios (blocked launch, deadline pressure, ownership fight, rejected
  design, slipping dependency); each yields an incentives read, the
  staff-level move (steps), a "say it like this" message, and a junior-vs-staff
  contrast. Scenario 1 free; scenarios 2–5 unlock via email gate
  (localStorage list `leadloop_signups_v1`, `source:"xfn-conflict-resolver"`;
  existing subscribers bypass; duplicates not stored twice).
- Tests: `tests/e2e/f4.test.js` — **71/71 pass** (scenario switching,
  per-scenario lock gating, unlock persistence across switches, duplicate
  guard, returning visitor, aria-live region, keyboard-operable native
  select, SEO hygiene, link resolution, accessibility basics).
- Persona validation: **5/5 reach buy mode** (Priya, Rahul, Mei, Arjun, Sara).
- SEO: dedicated title/meta/canonical/OG/Twitter, WebPage + BreadcrumbList
  JSON-LD, homepage toolkit card #4, sitemap entry.

## 2026-09-20 — F3: Hiring Committee Calibration (live)

- Live page: https://aashithk.github.io/leadloop/hiring-committee-calibration.html
- What it is: free calibration preview — one behavioral question answered three
  ways (L5 / L6 / L7 patterns), each with a "committee lens" readout (scope,
  ambiguity, influence, leveling-vs-bar). The L7 response + side-by-side leveling
  table are blur-gated until email signup (localStorage list
  `leadloop_signups_v1`, `source:"committee-calibration"`; existing subscribers
  bypass; duplicates not stored twice). All examples explicitly fictional and
  illustrative — no real committee data, anecdotes, stats, or quotes invented.
- Tests: `tests/e2e/f3.test.js` — **55/55 pass** (blur gate lock/unlock,
  invalid email rejected, duplicate guard, returning visitor, print + print-CSS
  unblur, fictional-disclaimer + banned-claim scan, SEO hygiene, link
  resolution, accessibility basics).
- Persona validation: **5/5 reach buy mode** (Priya, Rahul, Mei, Arjun, Sara).
- SEO: dedicated title/meta/canonical/OG/Twitter, WebPage + BreadcrumbList
  JSON-LD, homepage toolkit card #3, sitemap entry.

## 2026-09-20 — F2: Staff Promo Doc Skeleton (live)

- Live page: https://aashithk.github.io/leadloop/staff-promo-doc-skeleton.html
- What it is: free 9-section staff promotion packet template (executive
  summary, business impact, scope of influence with headcount denominator,
  technical depth, leadership & mentorship, multi-team evidence, peer feedback
  themes, growth areas), unlocked via email gate (localStorage list
  `leadloop_signups_v1`, `source:"promo-doc-skeleton"`; existing subscribers
  bypass; duplicates not stored twice). Download as Markdown (Blob), copy to
  clipboard with fallback guidance, print/PDF. Includes a dedicated
  "Returning after a career break?" section.
- Tests: `tests/e2e/f2.test.js` — **51/51 pass** (gate flow, duplicate guard,
  returning visitor, MD generator section coverage, blob download
  filename+content match, copy fallback success + blocked-clipboard guidance,
  print, link hygiene, accessibility basics).
- Persona validation: **5/5 reach buy mode** (Priya, Rahul, Mei, Arjun, Sara).
- SEO: dedicated title/meta/canonical/OG/Twitter, WebPage + BreadcrumbList
  JSON-LD, homepage toolkit card #2, sitemap entry.

## 2026-09-20 — F1: System Design Interview Pitch Sheet (live)

- Live page: https://aashithk.github.io/leadloop/system-design-pitch-sheet.html
- What it is: free 45-minute system-design framework pitch sheet (clarifying
  questions, high-level design structure, deep-dive guidance, scale math,
  trade-off/closing checklist, "say it like this" examples, rehearsal drill),
  unlocked via email gate (localStorage list `leadloop_signups_v1`,
  `source:"pitch-sheet"`; existing subscribers bypass; duplicates not stored
  twice). Print/PDF via browser print flow.
- Tests: `tests/e2e/f1.test.js` — **26/26 pass** (gate flow, duplicate guard,
  returning visitor, print, SEO hygiene, link resolution, accessibility basics).
- Persona validation: **5/5 reach buy mode** (Priya, Rahul, Mei, Arjun, Sara).
- SEO: dedicated title/meta/canonical/OG/Twitter, WebPage + BreadcrumbList
  JSON-LD, homepage toolkit card + `#toolkit` nav link, sitemap entry.
- Homepage regression green (no JS errors, toolkit hub present, exactly one H1,
  valid sitemap).




