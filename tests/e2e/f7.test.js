// E2E tests for F7: FAANG Level Matcher page.
// Run: node f7.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: title/company/scope -> level mapping math, title-inflation
// adjustments, scope adjustments, no salary figures anywhere, gated detailed
// breakdown, approximate-not-official disclaimer, retake reset.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "faang-level-matcher.html";
const BASE = "https://aashithk.github.io/leadloop/";
const BANNED = [
  /testimonial/i, /success rate/i, /promoted in \d+\s*(week|month)/i,
  /you will be (promoted|hired)/i, /guarantee/i,
  /\$\d{2,3}/, /salary of/i, /compensation package/i,
];

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
}

function loadPage(opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(SITE, PAGE), "utf8");
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(String(e.stack || e)));
  const dom = new JSDOM(html, {
    url: BASE + PAGE,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      if (opts.storage) w.localStorage.setItem("leadloop_signups_v1", opts.storage);
    }
  });
  return { window: dom.window, document: dom.window.document, errors };
}

function fill(document, title, company, scope) {
  document.getElementById("m-title").value = title;
  document.getElementById("m-company").value = company;
  document.getElementById("m-scope").value = scope;
}
function submitMatch(document, window) {
  document.getElementById("match-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}
function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F7 e2e: " + PAGE);

// --- SEO / document hygiene ---
{
  const { document, errors } = loadPage();
  check("no JS errors on load", errors.length === 0, errors[0]);
  const title = document.querySelector("title").textContent;
  check("title present and <=60 chars", title.length > 0 && title.length <= 60, title);
  check("title mentions level matcher", /level matcher/i.test(title), title);
  const desc = document.querySelector('meta[name="description"]').getAttribute("content");
  check("meta description 50-160 chars", desc && desc.length >= 50 && desc.length <= 160, desc);
  const canon = document.querySelector('link[rel="canonical"]').getAttribute("href");
  check("canonical points at live URL", canon === BASE + PAGE, canon);
  const h1s = document.querySelectorAll("h1");
  check("exactly one h1", h1s.length === 1, "found " + h1s.length);
  let ldOk = true;
  document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try { JSON.parse(s.textContent); } catch (e) { ldOk = false; }
  });
  check("all JSON-LD blocks parse", ldOk);
  const types = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => { try { return JSON.parse(s.textContent)["@type"]; } catch (e) { return null; } });
  check("JSON-LD includes WebPage + BreadcrumbList",
    types.includes("WebPage") && types.includes("BreadcrumbList"), types.join(","));
  const ogUrl = document.querySelector('meta[property="og:url"]').getAttribute("content");
  check("og:url matches canonical", ogUrl === canon, ogUrl);
}

// --- Honesty: approximate, no salary, no endorsement ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  check("approximate-not-official disclaimer present",
    /approximate, not official|not official statements/i.test(body));
  check("disclaimer denies employer endorsement", /do not endorse this tool|companies do not endorse/i.test(body));
  check("explicit no-salary statement", /no salary figures/i.test(body));
  const hits = BANNED.filter(re => re.test(body));
  check("no invented claims / salary figures", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
}

// --- Form structure ---
{
  const { document } = loadPage();
  check("title input present", !!document.getElementById("m-title"));
  const co = document.getElementById("m-company");
  check("company select has 5 real options", [...co.options].filter(o => o.value).length === 5,
    [...co.options].map(o => o.value).join(","));
  const sc = document.getElementById("m-scope");
  check("scope select has 3 real options", [...sc.options].filter(o => o.value).length === 3);
  check("results hidden initially", document.getElementById("results").hidden === true);
  check("retake hidden initially", document.getElementById("btn-retake").hidden === true);
}

// --- Validation errors ---
{
  const { document, window } = loadPage();
  submitMatch(document, window);
  check("empty form errors on title", /title/i.test(document.getElementById("m-err").textContent),
    document.getElementById("m-err").textContent);
  fill(document, "Senior SWE", "", "");
  submitMatch(document, window);
  check("missing company type errors", /company type/i.test(document.getElementById("m-err").textContent),
    document.getElementById("m-err").textContent);
  fill(document, "Senior SWE", "mid", "");
  submitMatch(document, window);
  check("missing scope errors", /scope/i.test(document.getElementById("m-err").textContent),
    document.getElementById("m-err").textContent);
  check("invalid form keeps results hidden", document.getElementById("results").hidden === true);
}

// --- Mapping math ---
{
  // Senior SWE at bigtech, one team -> rank 3 -> L5 / IC6 / Senior Engineer
  const { document, window } = loadPage();
  fill(document, "Senior Software Engineer", "bigtech", "team");
  submitMatch(document, window);
  check("senior@bigtech -> Google L5", document.getElementById("lvl-google").textContent === "L5");
  check("senior@bigtech -> Meta IC6", document.getElementById("lvl-meta").textContent === "IC6");
  check("senior@bigtech -> Netflix Senior Engineer", document.getElementById("lvl-netflix").textContent === "Senior Engineer");
  check("results revealed", document.getElementById("results").hidden === false);
  check("input echo line quotes the title", /Senior Software Engineer/.test(document.getElementById("res-input-line").textContent));
  check("retake shown after submit", document.getElementById("btn-retake").hidden === false);
}
{
  // Title inflation: same senior title at an early startup deflates a level
  const { document, window } = loadPage();
  fill(document, "Senior Software Engineer", "early", "team");
  submitMatch(document, window);
  check("senior@early-startup deflates to Google L4 (title inflation)",
    document.getElementById("lvl-google").textContent === "L4",
    document.getElementById("lvl-google").textContent);
}
{
  // Scope lifts: senior at mid-size with org-wide scope -> 3 - 1 + 1 = 3 -> L5
  const { document, window } = loadPage();
  fill(document, "Senior Software Engineer", "mid", "org");
  submitMatch(document, window);
  check("org-wide scope lifts mid-size senior back to L5",
    document.getElementById("lvl-google").textContent === "L5",
    document.getElementById("lvl-google").textContent);
}
{
  // Staff at bigtech with multi scope -> 4 + 0.5 -> 5 -> L7
  const { document, window } = loadPage();
  fill(document, "Staff Engineer", "bigtech", "multi");
  submitMatch(document, window);
  check("staff@bigtech multi-team -> Google L7", document.getElementById("lvl-google").textContent === "L7",
    document.getElementById("lvl-google").textContent);
  check("staff@bigtech multi-team -> Meta IC7+", document.getElementById("lvl-meta").textContent === "IC7+",
    document.getElementById("lvl-meta").textContent);
}
{
  // Junior clamps at the bottom: rank 1 -> L3
  const { document, window } = loadPage();
  fill(document, "Junior Developer", "early", "team");
  submitMatch(document, window);
  check("junior clamps to Google L3 floor", document.getElementById("lvl-google").textContent === "L3",
    document.getElementById("lvl-google").textContent);
}
{
  // Principal clamps at the top
  const { document, window } = loadPage();
  fill(document, "Principal Engineer", "bigtech", "org");
  submitMatch(document, window);
  check("principal clamps to Google L7 ceiling", document.getElementById("lvl-google").textContent === "L7",
    document.getElementById("lvl-google").textContent);
}
{
  // baseRank unit checks via exposed API
  const { window } = loadPage();
  const br = window.LeadLoop.baseRank;
  check("baseRank: 'Staff Engineer' = 4", br("Staff Engineer") === 4);
  check("baseRank: 'Senior Software Engineer' = 3", br("Senior Software Engineer") === 3);
  check("baseRank: 'Software Engineer II' = 2", br("Software Engineer II") === 2);
  check("baseRank: 'Engineering Manager' treated as staff-level = 4", br("Engineering Manager") === 4);
}

// --- Detail breakdown gated until signup ---
{
  const { document, window } = loadPage();
  fill(document, "Senior Software Engineer", "bigtech", "team");
  submitMatch(document, window);
  check("levels visible without signup", document.getElementById("lvl-google").textContent === "L5");
  check("detail breakdown hidden before signup", document.getElementById("detail").hidden === true);
  check("lock note visible before signup", document.getElementById("detail-locked").style.display !== "none");
  check("gate visible before signup", document.getElementById("gate-wrap").hidden === false);

  submitGate(document, window, "Nope", "bad-email");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps detail locked", document.getElementById("detail").hidden === true);
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Mei", "mei@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks detail", document.getElementById("detail").hidden === false);
  check("lock note hidden after unlock", document.getElementById("detail-locked").style.display === "none");
  check("gate hidden after unlock", document.getElementById("gate-wrap").hidden === true);
  const why = document.getElementById("why-box").textContent;
  check("why-box explains the mapping", /heuristic|inflation/i.test(why), why.slice(0, 120));
  const next = document.getElementById("next-box").textContent;
  check("next-box names the next level", /L6|IC7/i.test(next), next.slice(0, 120));
  check("next-box advice is scope-based", /scope|denominator/i.test(next));
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=faang-level-matcher",
    rows.length === 1 && rows[0].email === "mei@example.com" && rows[0].source === "faang-level-matcher",
    JSON.stringify(rows));
  submitGate(document, window, "Mei", "MEI@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- XSS: title is escaped in the echo line ---
{
  const { document, window } = loadPage();
  fill(document, "<img src=x onerror=alert(1)>", "bigtech", "team");
  submitMatch(document, window);
  check("no img injected from title input", document.querySelectorAll("#res-input-line img").length === 0);
  check("results still render for odd titles", document.getElementById("results").hidden === false);
}

// --- Returning visitor: detail unlocked immediately ---
{
  const storage = JSON.stringify([{ name: "S", email: "s@example.com", ts: "2026-09-20T00:00:00Z", source: "xfn-conflict-resolver" }]);
  const { document, window } = loadPage({ storage });
  fill(document, "Senior SWE", "mid", "multi");
  submitMatch(document, window);
  check("returning visitor sees detail", document.getElementById("detail").hidden === false);
  check("returning visitor skips gate", document.getElementById("gate-wrap").hidden === true);
}

// --- Retake resets ---
{
  const { document, window } = loadPage();
  fill(document, "Senior SWE", "mid", "team");
  submitMatch(document, window);
  document.getElementById("btn-retake").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("retake clears title", document.getElementById("m-title").value === "");
  check("retake clears selects", document.getElementById("m-company").value === "" && document.getElementById("m-scope").value === "");
  check("retake hides results", document.getElementById("results").hidden === true);
}

// --- Print CSS ---
{
  const { document } = loadPage();
  const printCss = [...document.querySelectorAll("style")].some(s =>
    s.textContent.includes("@media print") && s.textContent.includes(".no-print"));
  check("print CSS hides chrome", printCss);
}

// --- Link hygiene ---
{
  const { document } = loadPage();
  const bad = [];
  document.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
    let file = null;
    if (href === BASE || href.startsWith(BASE + "#")) file = "index.html";
    else if (href.startsWith(BASE)) file = href.slice(BASE.length).split("#")[0] || "index.html";
    else if (!href.startsWith("http")) file = href.split("#")[0] || "index.html";
    else return;
    if (file && !fs.existsSync(path.join(SITE, file))) bad.push(href);
  });
  check("all internal links resolve to real files", bad.length === 0, bad.join(", "));
  const links = [...document.querySelectorAll("main a[href]")].map(a => a.textContent.trim()).filter(Boolean);
  check("internal links use descriptive anchor text", links.every(t => t.length > 3 && !/^click here$/i.test(t)), links.join(" | "));
}

// --- Accessibility basics ---
{
  const { document } = loadPage();
  const imgs = [...document.querySelectorAll("img")].filter(i => !i.getAttribute("alt"));
  check("all images have alt text", imgs.length === 0);
  const labeled = ["m-title", "m-company", "m-scope"].every(id => {
    const el = document.getElementById(id);
    return document.querySelector(`label[for="${id}"]`) && el;
  });
  check("all form fields have labels", labeled);
  check("match error region has role=alert", document.getElementById("m-err").getAttribute("role") === "alert");
  check("gate error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  check("results region announced politely", document.getElementById("results").getAttribute("aria-live") === "polite");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
}

console.log(`\nF7 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
