# LeadLoop — Decision Log

> Newest first. Every entry: date, decision, rationale. Undecided items are logged as such — indecision is a decision to revisit.

## 2026-09-20 — Feature pipeline F2–F12 approved (all 12 ideas)
Aashith approved all 12 Google AI Mode feature ideas with a strict workflow: one at a time → unique E2E → fix until 100% pass → 5-persona buy-mode validation → SEO/indexing → deploy + live verify → confirm before next. Rationale: quality compounds; a broken tool destroys trust faster than a missing tool builds it.

## 2026-09-20 — Positioning: "Interview prep for the AI era"
Pivoted from generic interview prep. Rationale: Aashith's agentic AI work on Google Chat + 50+ committees is a differentiated, defensible angle.

## 2026-09-20 — Quality/security/compliance/benchmark infrastructure
Standing instruction: keep log + test strategy + security strategy + compliance & risk strategy in GitHub and run at each push; benchmark with user metrics. Shipped: CHANGELOG.md, docs/TEST_STRATEGY.md, docs/SECURITY_STRATEGY.md, docs/COMPLIANCE_RISK.md, docs/BENCHMARKS.md, CI workflow, scripts, benchmarks/history.jsonl, tests/e2e. Rationale: "as features scale, keep upgrading the quality."

## 2026-09-20 — Cal.com + Stripe recommended for booking/payments
Cal.com free plan (includes Stripe payments) beats Calendly (needs Standard ~$10/mo). Alternatives noted: Razorpay (India/UPI), Lemon Squeezy/Paddle (merchant-of-record). Aashith creates accounts (identity step). Not done.

## 2026-09-20 — Kit chosen as email provider
Aashith chose Kit; account connected (V4 API, "Leadloop", nahata.n85@gmail.com). Trial ends 2026-10-04; 1,000-subscriber limit. Form "Newsletter site" returns 404 — unusable until fixed in Kit UI. Sender identity (aashith.kamath@gmail.com, from-name Aashith) still to fix. No sequences; 2 test subscribers; 0 emails sent. Rationale: free Newsletter plan supports one sequence + one basic automation (research; needs in-account confirmation) — enough for the 3-email series without a paid upgrade.

## 2026-09-20 — Funnel: free builder → 3-part series → paid coaching
Monetization via mock interviews, coaching packages, subscriptions — after the free funnel establishes reach. Rationale: earn trust before asking for money (20-persona test: "would you pay" = "not yet").

## 2026-09-20 — Leadership coaching made first-class
20-persona test found coaching invisible → added Coaching section with free→free→1:1 ladder. Rationale: test evidence over assumptions.

## 2026-09-20 — Android app built; Play Console pending identity review
WebView wrapper com.aashithkamath.leadloop v1.0.0; signed AAB validated. Play developer account exists (Nitin Nahata) but Google identity review pending — Create app disabled; nothing uploaded, nothing submitted. Known limitation: no native file chooser in WebView (resume upload needs device test).

## 2026-09-20 — LeadLoop SEO weighted over Kundli
Aashith: SEO effort goes to LeadLoop first — that's where he wants visitors/customers.

## Undecided (as of 2026-09-20)

- **Testimonials** — Aashith to provide directs/mentees testimonials 2026-09-21. None on site; none invented.
- **First-name-only branding** — under consideration for privacy; not applied (site uses "Aashith Kamath").
- **Launch pricing** — proposed ($49→$1 / ₹999→₹99 JD-personalized; $499/₹4,999 50% off premium). NOT approved, not on site.
- **Book on Amazon** — idea only; sequencing after launch + list growth was the assistant's recommendation, not agreed.
- **FAQ exact wording** — live 10 Q&As pending Aashith's review (Google/committee claims especially).
- **F8 Committee Debrief Log** — stays visibly draft until Aashith approves exact copy; no invented committee content, ever.

## Standing rules

- Email gate standard: localStorage `leadloop_signups_v1`, source-tagged, duplicate prevention, existing-subscriber bypass — until Kit is wired.
- Anything public in Aashith's name (email, social post, directory submission, testimonial-style statement) requires his exact-content approval first.
- Never invent credentials, testimonials, outcomes, placement statistics, salaries, pricing, scarcity, demand, guarantees, or real committee experiences.
- Never imply Google/Meta/Netflix endorsement. Never expose confidential employer information.
- No paid plans, checkout, or financial commitments without explicit approval.
