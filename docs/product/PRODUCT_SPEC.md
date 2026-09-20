# LeadLoop — Product Spec

> Living document. Last updated 2026-09-20. See `DECISIONS.md` for the decision log.
> Repo: `aashithk/leadloop` (public). Live: https://aashithk.github.io/leadloop/
> Honesty rule: every number in this doc is sourced from a verified run, log, or Aashith's own statements. Where a baseline is unknown it says "not yet measured" — never invent. No invented testimonials, outcomes, statistics, salaries, or anecdotes anywhere.

## Vision

Interview prep and leadership coaching for the AI era — from a practitioner who has sat on the other side of the table 50+ times.

## Target users — the 5 validation personas

Every feature is validated against all five before shipping; "buy mode" = persona reaches core value without blockers and output maps to their goal. (Full definitions: `~/workspace/goals/launch-leadloop-coaching-business/personas.md`.)

1. **P1 Priya** — Senior SWE pursuing internal Staff promotion; needs promo-packet framing and scope evidence.
2. **P2 Rahul** — Senior SWE outside FAANG targeting Google/Meta Staff interviews; needs bar/level/format certainty.
3. **P3 Mei** — New engineering manager; needs leadership/communication frameworks usable in her next 1:1.
4. **P4 Arjun** — Mid-level SWE targeting Senior; needs the senior bar made concrete + behavioral storytelling.
5. **P5 Sara** — Engineer returning after a 3-year career break; needs modern prep without condescension.

## The funnel

**Free resume builder → free 3-part email series → paid coaching (mock interviews, coaching packages, subscriptions).**

- Free front door: genuinely useful resume builder (Google-targeted guidance L3–L7+, live preview, autosave, print/PDF).
- Retention: 3-part email series (drafted; not yet sent — Kit wiring pending).
- Monetization: mock interviews, coaching packages, subscriptions (not yet priced, not yet live).

## The content moat: 12-feature interview-prep toolkit

A sequenced pipeline (F2–F12) of deep, genuinely useful free tools — each shipped one at a time with unique E2E tests, 5-persona buy-mode validation, dedicated SEO, homepage toolkit card, sitemap entry, and live verification before the next begins.

| # | Feature | Status 2026-09-20 |
|---|---|---|
| F1 | System Design Interview Pitch Sheet | live — 26/26 E2E, 5/5 personas |
| F2 | Staff Promo Doc Skeleton | live — 51/51 E2E, 5/5 personas |
| F3 | Hiring Committee Calibration | live — 55/55 E2E, 5/5 personas |
| F4 | XFN Conflict Resolver | live — 71/71 E2E, 5/5 personas |
| F5 | STAR-L Story Builder | live — 77/77 E2E, 5/5 personas |
| F6 | Staff Scope Calculator | in pipeline |
| F7 | FAANG Level Matcher | in pipeline |
| F8 | Committee Debrief Log | in pipeline — stays visibly **draft awaiting Aashith's exact-content approval** |
| F9 | AI Architecture Prompts library | in pipeline |
| F10 | System Design Timer (45-min pacer) | in pipeline |
| F11 | Staff Behavioral Flashcards | in pipeline |
| F12 | Scale Optimization Cheat Sheet | in pipeline |

Each feature uses the standard email gate (localStorage list `leadloop_signups_v1`, source-tagged, duplicate prevention, existing-subscriber bypass) until Kit is wired.

## Positioning

"Interview prep for the AI era." (Changed 2026-09-20.) Hero foregrounds Aashith's agentic enterprise AI work on Google Chat alongside his committee experience.

## Credibility (Aashith-verified facts only)

- Served on 50+ hiring and promotion committees at Google, including senior and senior-staff decisions.
- Drives agentic enterprise AI work on Google Chat.
- Never imply Google, Meta, Netflix, or any employer endorses LeadLoop. Never expose confidential employer information.

## Technical notes

- Static site on GitHub Pages (repo root serves). CI (`.github/workflows/ci.yml`) runs E2E, security scan, SEO audit, benchmarks on every push; live smoke checks every sitemap URL on main.
- Benchmarks tracked in `benchmarks/history.jsonl` (page weight budget: 120 KB warning).
- Android WebView wrapper: `com.aashithkamath.leadloop`, v1.0.0; signed AAB built and validated; Play Console account exists (Nitin Nahata) but identity review pending — no app created, no upload, no review submitted. Known limitation: WebView lacks a native file chooser; resume file-upload needs a real-device test.

## Non-goals

- Not a job board, not a resume template farm.
- No invented testimonials, placement statistics, salaries, or success anecdotes — 20-persona test finding: "would you pay for coaching" = "not yet" across personas; the honest path is proof assets (real testimonials, pricing, concrete offer), not claims.
- No paid plans, no checkout, no financial commitments without Aashith's explicit approval.

## Open questions (logged as undecided in DECISIONS.md)

- Testimonials from Aashith's directs/mentees — promised 2026-09-21, not yet received.
- First-name-only 'Aashith' branding for privacy — under consideration, not applied.
- Email provider wiring (Kit account exists; form/automation pending — see below).
- Booking/payments provider (Cal.com + Stripe recommended; Aashith creates accounts).
- Book on Amazon — idea only, not agreed; sequencing (after launch + list growth) was the assistant's recommendation.
- Temporary launch pricing ($49→$1 / ₹999→₹99 JD-personalized; $499/₹4,999 50%-off premium) — proposed, NOT approved, not on site.
