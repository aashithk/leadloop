# LeadLoop Test Strategy

Static site (vanilla HTML/CSS/JS, no backend, no build step), served from the
repo root by GitHub Pages. Quality is enforced by this strategy **and** by the
CI workflow in `.github/workflows/ci.yml`, which runs every check on every push
and pull request.

## 1. Per-feature jsdom E2E tests

- Every feature ships its own `tests/e2e/fN.test.js`.
- Tests must be **unique per feature** — written against that feature's real
  flows (gates, generators, calculators, timers, downloads), not generic filler.
- They load the real page with jsdom (`runScripts: "dangerously"`) and drive
  the actual DOM: form submission, validation errors, storage writes, unlocks,
  button actions, downloads/prints, keyboard paths.
- Rule: **100% of tests green before deploy.** Fix and rerun until all pass.
- Run from repo root: `npm i jsdom && node tests/e2e/fN.test.js`
  (or `bash scripts/run-e2e.sh` to run every test file at once).

## 2. Five-persona buy-mode validation

Each feature is validated against five critical user personas before the next
feature begins:

| Persona | Goal |
|---|---|
| **Priya** — Senior SWE chasing an internal Staff promotion | Promotion packet / scope artifacts |
| **Rahul** — Senior SWE at a non-FAANG, targeting Google/Meta Staff interviews | Interview prep that matches real bars |
| **Mei** — New engineering manager | Leadership and influence frameworks |
| **Arjun** — Mid-level SWE targeting Senior, weak at scope + behavioral stories | Scope framing and STAR stories |
| **Sara** — Engineer returning after a three-year career break | Confidence rebuild, current interview norms |

A persona reaches **buy mode** only when: the core value is reached, the task
completes with no blockers, and the output is relevant to that persona.
All five must reach buy mode; results are logged in `validation/fN-persona-log.md`
in the working area (kept out of the public repo).

## 3. Homepage regression (CI + pre-deploy)

- No JavaScript errors on load.
- `#toolkit` hub section present; exactly one `<h1>`.
- Every internal link resolves to an existing file.
- `sitemap.xml` is valid XML and lists every root HTML page.
- New feature adds a toolkit card on the homepage.

## 4. Post-deploy live smoke (CI `smoke` job, main branch only)

After the push reaches GitHub, CI polls the live site (up to ~6 minutes for the
Pages rebuild), then:
- Fetches live `sitemap.xml`, derives every page URL, asserts HTTP 200 each.
- Asserts the homepage contains the `id="toolkit"` section marker.
- Fails the run if anything breaks — this is the "make sure a push hasn't
  broken something" gate.

## 5. Full regression after F12

Once all twelve features are live: homepage, resume builder, FAQ, every toolkit
feature, and the sitemap are re-tested end to end (E2E suite + live smoke), and
the results are recorded in `benchmarks/history.jsonl` and the changelog.

## Content and interaction rules (enforced in review and tests)

- Interactive-looking controls must **genuinely work** — no fake buttons,
  tabs, or dropdowns.
- Never invent claims: no fabricated testimonials, placement statistics,
  salaries, pricing, scarcity, guarantees, or specific real committee anecdotes.
- Never imply Google, Meta, Netflix, or any employer endorses LeadLoop.
