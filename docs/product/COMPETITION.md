# LeadLoop — Competition

> Last updated 2026-09-20. Sources: 25-competitor scorecard (`~/workspace/your_files/leadloop-scorecard.html`, built 2026-09-20), 20-persona funnel test (2026-09-20). Gaps are marked "to research" — not filled in from memory.

## Market

Interview prep + career/leadership coaching for software engineers. Two adjacent segments:
1. **Interview prep** — resume services, mock interviews, system-design prep, leveling guidance.
2. **Leadership coaching** — Staff+ promotion coaching, EM coaching, communication/influence frameworks.

## What the 25-competitor scorecard established (2026-09-20)

Five dimensions scored; five winning patterns adopted:
1. A genuinely useful free front door (our resume builder + toolkit).
2. Prominent, quantified-but-factual credibility (50+ committees — real, Aashith-verified).
3. Substantive level guides as an SEO/content moat (Google L3–L7+ guide; Meta/Amazon expansion noted as future).
4. A visible free-builder → free-series → 1:1-coaching ladder.
5. A tasteful, dismissible referral/share nudge.

## Our differentiation (verified, not claimed)

The combination, in one funnel, of:
- **Google-level resume targeting** (L3–L7+ guidance built from studying level expectations — original copy, not copied text),
- **Aashith's 50+ hiring/promotion-committee authority** (real, specific, verifiable),
- **Leadership coaching alongside interview prep** (the 20-persona test found coaching was invisible → now a first-class section with a free→free→1:1 ladder).

## Honest market signal (2026-09-20, 20 personas)

- Avg clarity 7.6/10, avg desire 5.7/10.
- "Would you pay for coaching" = **"not yet"** across personas — needs proof assets: real testimonials, pricing, concrete offer, track-specific evidence.
- Implication: the funnel's current bottleneck is trust/evidence, not tool quality. Testimonials (promised 2026-09-21) are the highest-leverage next input.

## Gaps — status 2026-09-20

- Named-competitor pricing/positioning table: **built 2026-09-20** from verified sources — see `data/competitors-2026-09-20.json` (5 verified rows, 6 in `candidates_to_verify`). Re-check weekly against the recorded source links.
- Coaching-market rate benchmarks: **partially filled** — 1:1 session rates now on record (IGotAnOffer $100–$250/session official; Design Gurus $149–$215/session official; interviewing.io $179–$339/session secondary source; Prepfully gated). Package norms still thin.
- Mock-interview platform economics (e.g. how interviewers are sourced/paid): still to research before building that offer.
- SEO keyword surface: **working list built** (`data/keywords-2026-09-20.json`) but no rank data — property verified 2026-09-20, no query data yet; site not indexed.

## Underlying data (timestamped, week on week)

Narrative above is grounded in the datasets in `docs/product/data/`
(see `DATA_LEDGER.md` for the full index, methods, and limitations).
Every dataset carries a `changes` array — baseline first, then one appended
entry per weekly update with date, what changed, rationale, and the link
re-checked. New weeks add new `*-YYYY-MM-DD.json` files; dated files are never
overwritten.

- `data/competitors-2026-09-20.json` — attributable competitor table:
  IGotAnOffer, interviewing.io, Exponent/Aced, Design Gurus, Prepfully.
  `source_type` distinguishes official pages (IGotAnOffer, Design Gurus,
  Prepfully coaches page) from secondary sources (interviewing.io via Final
  Round AI review; Exponent via review article + search snippet after the
  official page rendered empty). 6 names in `candidates_to_verify`
  (Pramp, Hello Interview, TechMockInterview, MeetAPro/Four-Leaf, and the two
  unopened official pricing pages) — excluded from the table, not from memory.
- `data/benchmarks-2026-09-20.json` — launch-day quality state: F1–F12 e2e
  (26/26 … 61/61), 5/5 personas buy mode on all 12 features, CI page-weight
  65.8 KB vs 120 KB budget.
- `data/traffic-snapshot-2026-09-20.json` — honest zero-state: no analytics
  installed; no visitor/pageview/conversion numbers exist. Do not cite
  LeadLoop traffic.
- `data/keywords-2026-09-20.json` — working keyword list from FAQ topics +
  page titles; no rank data yet (site not indexed as of 2026-09-20).

## Watch-outs from the persona test

- FAQ wording (10 Q&As) is live but still needs Aashith's exact-content review — especially claims about Google and committee counts.
- F8 (Committee Debrief Log) must remain visibly **draft awaiting Aashith's exact-content approval** — no real committee anecdotes, quotes, statistics, or observations may be invented.
- Anything public in Aashith's name (email, social post, directory submission, testimonial-style statement) requires his exact-content approval first (standing rule).
