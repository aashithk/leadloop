# LeadLoop Changelog

Newest first. The feature pipeline (F2–F12) prepends its own entries as each feature ships.

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

