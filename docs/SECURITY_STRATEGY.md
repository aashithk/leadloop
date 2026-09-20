# LeadLoop Security Strategy

## Threat model (static site, no backend)

| Threat | What it means here |
|---|---|
| Push compromise / defacement | Attacker with repo access (or a stolen token) pushes malicious HTML/JS to `main`; GitHub Pages serves it to visitors. |
| XSS via stored data | Email-gate signups are stored in `localStorage` and could be re-rendered into the DOM. If rendering ever interpolates stored strings as HTML, an attacker-controlled value becomes script. |
| Malicious PR | A third party opens a PR with a backdoored page; a maintainer merges without review. |
| Secret leakage | API keys, tokens, keystore passwords, or credentials accidentally committed or pasted into files. |
| Supply chain | The site ships **zero runtime dependencies** (vanilla HTML/CSS/JS). `jsdom` is a dev/CI-only test dependency. Risk is low today and grows only if we add third-party scripts. |

## Controls (CI enforces on every push/PR)

1. **Secret scan** (`scripts/security-scan.sh`): greps the whole repo (excluding
   `benchmarks/history.jsonl`) for private-key blocks, GitHub tokens
   (`ghp_`, `github_pat_`), AWS keys (`AKIA…`), Stripe live keys (`sk_live_`),
   and `api_key`/`secret`/`password`/`token` assignments, plus keystore
   password patterns. Any hit fails the build.
2. **Inline-JS syntax check**: every inline `<script>` block is extracted and
   passed through `node --check`. A syntax error fails the build.
3. **External script/iframe allowlist**: allowlist lives in
   `scripts/allowlist.txt` and is currently **empty** — the site loads no
   third-party scripts. Any new external `<script src>` or `<iframe src>` host
   fails CI unless the allowlist (and this doc's rationale) is updated with a
   review note.
4. **Untrusted localStorage**: all signup data in `localStorage` is treated as
   untrusted input. Pages must render stored values with `textContent` (or
   explicit escaping), never `innerHTML`. Reviewers check this on every
   feature.
5. **No credentials in repo**: never commit keystore passwords, keystores,
   API keys, tokens, or credentials into the repo, files, or chat logs. The
   Android upload-keystore password was handed to Aashith once and is stored
   nowhere.

## Recommended repo hardening (Aashith to enable)

- GitHub **secret scanning** + **push protection** on the repository.
- **Branch protection** on `main`: require PR review + required status checks
  (the CI workflow) before merge.
- **Dependabot** alerts once the repo has real dependencies.

## Incident response

1. Revert the offending commit immediately (`git revert`, push to `main`).
2. Rotate any credential or token that may have been exposed.
3. Verify the live site (clear cache / wait for Pages rebuild; rerun the
   `smoke` job manually if needed).
4. Write a one-paragraph postmortem in this doc's history below, then add a
   regression check so it can't recur.

### History

- 2026-09-20: strategy created alongside CI; no incidents to date.
