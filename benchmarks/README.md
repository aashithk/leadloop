# benchmarks/

`history.jsonl` is the append-only log of automated quality benchmarks, one
JSON object per line, written by CI (`scripts/benchmark.js`) on every push to
`main`. Lines with `"kind": "user-metrics"` (added later, once privacy-friendly
analytics exist) record real user-measurement windows.

Fields per CI line:

- `date` — ISO timestamp of the run
- `commit` — git SHA measured (or `"pre-ci"` for the seed line)
- `branch` — branch the push landed on
- `pages` — number of root HTML pages measured
- `max_html_kb` — heaviest page weight in KB
- `e2e_files` / `e2e_pass` — test files run and whether 100% passed
- `seo_pass` / `security_pass` — CI job results for those gates
- `notes` — short human-readable note

Never edit or delete lines; append only. No invented numbers.
