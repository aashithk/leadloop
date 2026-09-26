# LeadLoop — Decision Log

> Newest first. Every entry: date, decision, rationale. Undecided items are logged as such — indecision is a decision to revisit.

## 2026-09-26 — Monetization + distribution engine PROPOSED (awaiting Aashith's decision)
Aashith asked for a plan covering both products (LeadLoop + Kundli Guru, separate social accounts each): a low-ticket automated product, ad revenue, and a recursive social posting/engagement-study loop, profitable over time not day zero; open to spending money. Proposal presented in chat 2026-09-26: Phase 1 — separate FB Pages + IG professional accounts per product under one Meta Business Portfolio (Aashith creates; identity), weekly draft→approve→schedule→measure→adjust loop via Metricool/Buffer (~$20/mo), every format with metric + threshold + 90-day kill date; Phase 2 — $19 one-time auto-generated LeadLoop Interview Readiness Report via Lemon Squeezy (5% + $0.50, merchant of record), Kundli premium PDFs ₹99–499 selling polish/personalization (competitors give calculations free); Phase 3 — AdSense only when traffic justifies, paid ads only as capped experiments with stop-loss, never buying traffic to monetize via ads. Sequencing rationale: ads need ~20k (LeadLoop @ ~$5 RPM) / ~100k (Kundli India @ ~$1 RPM) monthly pageviews for $100/mo — product revenue arrives much earlier from warm audiences (CEO lens: distribution before product polish; earn the right to monetize). Research: `~/workspace/monetization-research/research-notes-2026-09-26.md`. Founder-time asks batched: (1) create the 4 accounts + portfolio, (2) Kit trial decision by 2026-10-04, (3) approve content voice + first batch, (4) Lemon Squeezy account later (tax identity).

## 2026-09-26 — Personal name anonymized to "Kamath" across the site
Kamath asked that his personal name be removed from the LeadLoop site for privacy — every visitor-visible "Kamath Kamath" / "Kamath" replaced with the proxy "Kamath" (About section, footers, JSON-LD author/publisher names, draft notes). Rationale: keep the founder's identity private while the coaching brand is unproven; the About section keeps the 50+ committees + Google Chat credibility without a first name. Known limitation: the hosting URL itself (aashithk.github.io) still contains the name — removing it requires a custom domain or a new GitHub account, flagged to Kamath as a follow-up.

## 2026-09-26 — Resume import (PDF/DOCX/TXT) + job-description tailoring approved and shipped
Kamath approved both features for the free resume builder. (1) Import an existing resume from PDF, DOCX, or TXT and prefill the existing builder for review/edit before the current print/PDF flow — manual entry was the funnel's biggest friction. (2) Paste a job description, compare it with the resume: extract key requirements/keywords, show matched vs missing keywords, reorder matching skills, suggest aligned bullet rewrites with per-suggestion apply/dismiss. Rationale: CEO lens — removes front-door friction and adds real JD-specific value before asking for money ("earn the right to monetize"); CTO lens — boring technology: fully static, client-side only, no backend, no paid services; resume contents never leave the browser (pdf.js + mammoth.js via CDN, lazy-loaded). JD paste is primary by design: cross-site fetching is blocked by CORS on most job sites, so URL fetch honestly falls back to pasted text. Keyword matching is explicitly framed as simple overlap, not an ATS score, with a truthfulness warning (only add what's true). E2E: generated PDF/DOCX/TXT samples uploaded through the real UI — 30/30 import checks and all JD checks green (keyword extraction, skill reorder, suggestion apply, fetch fallback, guards); desktop + mobile screenshots reviewed. Live on https://aashithk.github.io/leadloop/ (verified). No Android wrapper rebuild needed — the WebView loads the site remotely.

## 2026-09-20 — Feature pipeline F2–F12 approved (all 12 ideas)
Kamath approved all 12 Google AI Mode feature ideas with a strict workflow: one at a time → unique E2E → fix until 100% pass → 5-persona buy-mode validation → SEO/indexing → deploy + live verify → confirm before next. Rationale: quality compounds; a broken tool destroys trust faster than a missing tool builds it.

## 2026-09-20 — Positioning: "Interview prep for the AI era"
Pivoted from generic interview prep. Rationale: Kamath's agentic AI work on Google Chat + 50+ committees is a differentiated, defensible angle.

## 2026-09-20 — Quality/security/compliance/benchmark infrastructure
Standing instruction: keep log + test strategy + security strategy + compliance & risk strategy in GitHub and run at each push; benchmark with user metrics. Shipped: CHANGELOG.md, docs/TEST_STRATEGY.md, docs/SECURITY_STRATEGY.md, docs/COMPLIANCE_RISK.md, docs/BENCHMARKS.md, CI workflow, scripts, benchmarks/history.jsonl, tests/e2e. Rationale: "as features scale, keep upgrading the quality."

## 2026-09-20 — Cal.com + Stripe recommended for booking/payments
Cal.com free plan (includes Stripe payments) beats Calendly (needs Standard ~$10/mo). Alternatives noted: Razorpay (India/UPI), Lemon Squeezy/Paddle (merchant-of-record). Kamath creates accounts (identity step). Not done.

## 2026-09-20 — Kit chosen as email provider
Kamath chose Kit; account connected (V4 API, "Leadloop", nahata.n85@gmail.com). Trial ends 2026-10-04; 1,000-subscriber limit. Form "Newsletter site" returns 404 — unusable until fixed in Kit UI. Sender identity (aashith.kamath@gmail.com, from-name Kamath) still to fix. No sequences; 2 test subscribers; 0 emails sent. Rationale: free Newsletter plan supports one sequence + one basic automation (research; needs in-account confirmation) — enough for the 3-email series without a paid upgrade.

## 2026-09-20 — Funnel: free builder → 3-part series → paid coaching
Monetization via mock interviews, coaching packages, subscriptions — after the free funnel establishes reach. Rationale: earn trust before asking for money (20-persona test: "would you pay" = "not yet").

## 2026-09-20 — Leadership coaching made first-class
20-persona test found coaching invisible → added Coaching section with free→free→1:1 ladder. Rationale: test evidence over assumptions.

## 2026-09-20 — Android app built; Play Console pending identity review
WebView wrapper com.aashithkamath.leadloop v1.0.0; signed AAB validated. Play developer account exists (Nitin Nahata) but Google identity review pending — Create app disabled; nothing uploaded, nothing submitted. Known limitation: no native file chooser in WebView (resume upload needs device test).

## 2026-09-20 — LeadLoop SEO weighted over Kundli
Kamath: SEO effort goes to LeadLoop first — that's where he wants visitors/customers.

## Undecided (as of 2026-09-20)

- **Testimonials** — Kamath to provide directs/mentees testimonials 2026-09-21. None on site; none invented.
- **First-name-only branding** — under consideration for privacy; not applied (site uses "Kamath Kamath").
- **Launch pricing** — proposed ($49→$1 / ₹999→₹99 JD-personalized; $499/₹4,999 50% off premium). NOT approved, not on site.
- **Book on Amazon** — idea only; sequencing after launch + list growth was the assistant's recommendation, not agreed.
- **FAQ exact wording** — live 10 Q&As pending Kamath's review (Google/committee claims especially).
- **F8 Committee Debrief Log** — stays visibly draft until Kamath approves exact copy; no invented committee content, ever.

## Standing rules

- Email gate standard: localStorage `leadloop_signups_v1`, source-tagged, duplicate prevention, existing-subscriber bypass — until Kit is wired.
- Anything public in Kamath's name (email, social post, directory submission, testimonial-style statement) requires his exact-content approval first.
- Never invent credentials, testimonials, outcomes, placement statistics, salaries, pricing, scarcity, demand, guarantees, or real committee experiences.
- Never imply Google/Meta/Netflix endorsement. Never expose confidential employer information.
- No paid plans, checkout, or financial commitments without explicit approval.
