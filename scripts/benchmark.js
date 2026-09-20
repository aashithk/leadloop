// Benchmark recorder for the LeadLoop static site.
// Runs with plain node (no dependencies), from the repo root:
//   node scripts/benchmark.js
// Measures per-page HTML weight (warn >120KB, fail >200KB), counts pages and
// e2e test files, reads the e2e/seo/security gate results from env
// (E2E_RESULT, SEO_RESULT, SECURITY_RESULT as set by CI), appends one JSON
// line to benchmarks/history.jsonl, and exits non-zero on any violation.
// In CI this runs with `needs: [e2e, security, seo-quality]` and if: always().
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WARN_KB = 120;
const FAIL_KB = 200;
const HIST = path.join(ROOT, "benchmarks", "history.jsonl");

let failed = 0;
const fail = (m) => { failed++; console.log("  FAIL " + m); };

const pages = fs.readdirSync(ROOT)
  .filter((f) => f.endsWith(".html") && !f.startsWith("google"))
  .sort();
if (pages.length === 0) fail("no root HTML pages found");

const details = pages.map((p) => ({
  page: p,
  kb: +(fs.statSync(path.join(ROOT, p)).size / 1024).toFixed(1),
}));
const maxKb = details.length ? Math.max(...details.map((d) => d.kb)) : 0;

for (const d of details) {
  if (d.kb > FAIL_KB) fail(`${d.page}: ${d.kb}KB exceeds fail budget ${FAIL_KB}KB`);
  else if (d.kb > WARN_KB) console.log(`  WARN ${d.page}: ${d.kb}KB exceeds warn budget ${WARN_KB}KB`);
  else console.log(`  PASS ${d.page}: ${d.kb}KB`);
}

const e2eDir = path.join(ROOT, "tests", "e2e");
const e2eFiles = fs.existsSync(e2eDir)
  ? fs.readdirSync(e2eDir).filter((f) => f.endsWith(".test.js"))
  : [];
console.log(`  e2e test files: ${e2eFiles.length}`);

const e2ePass = process.env.E2E_RESULT === "success";
const seoPass = process.env.SEO_RESULT === "success";
const secPass = process.env.SECURITY_RESULT === "success";
if (!e2ePass) fail("e2e gate did not pass (E2E_RESULT=" + (process.env.E2E_RESULT || "unset") + ")");
if (!seoPass) fail("seo-quality gate did not pass (SEO_RESULT=" + (process.env.SEO_RESULT || "unset") + ")");
if (!secPass) fail("security gate did not pass (SECURITY_RESULT=" + (process.env.SECURITY_RESULT || "unset") + ")");

const line = {
  date: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || "local",
  branch: (process.env.GITHUB_REF || "").replace("refs/heads/", "") || "local",
  kind: "ci",
  pages: pages.length,
  max_html_kb: maxKb,
  e2e_files: e2eFiles.length,
  e2e_pass: e2ePass,
  seo_pass: seoPass,
  security_pass: secPass,
  notes: process.env.BENCHMARK_NOTE || "",
};
fs.mkdirSync(path.dirname(HIST), { recursive: true });
fs.appendFileSync(HIST, JSON.stringify(line) + "\n");
console.log("appended record to benchmarks/history.jsonl");

console.log(failed ? "benchmark: FAILURES" : "benchmark: green");
process.exit(failed ? 1 : 0);
