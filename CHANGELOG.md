# LeadLoop Changelog

Newest first. The feature pipeline (F2–F12) prepends its own entries as each feature ships.

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
