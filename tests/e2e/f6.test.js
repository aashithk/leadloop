// E2E tests for F6: Staff Scope Calculator page.
// Run: node f6.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: 10-question radio quiz, score math (total + per-dimension
// %), band thresholds, weakest-dimension gap analysis, gated gap analysis,
// retake reset, honesty disclaimer, incomplete-form guard.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "staff-scope-calculator.html";
const BASE = "https://aashithk.github.io/leadloop/";
const BANNED = [
  /testimonial/i, /success rate/i, /promoted in \d+\s*(week|month)/i,
  /at google,? (the )?committees?/i, /google'?s hiring committee/i,
  /you will be promoted/i, /guarantee/i,
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

function answer(document, window, q, value) {
  const r = document.querySelector(`input[name="q${q}"][value="${value}"]`);
  r.checked = true;
  r.dispatchEvent(new window.Event("change", { bubbles: true }));
}
function answerAll(document, window, values) {
  for (let q = 1; q <= 10; q++) answer(document, window, q, values[q - 1]);
}
function submitQuiz(document, window) {
  document.getElementById("quiz-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}
function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F6 e2e: " + PAGE);

// --- SEO / document hygiene ---
{
  const { document, errors } = loadPage();
  check("no JS errors on load", errors.length === 0, errors[0]);
  const title = document.querySelector("title").textContent;
  check("title present and <=60 chars", title.length > 0 && title.length <= 60, title);
  check("title mentions scope calculator", /scope/i.test(title), title);
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

// --- Honesty: heuristic disclaimer, no invented predictions ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  check("heuristic disclaimer present", /honest heuristic|not a (prediction|verdict)/i.test(body));
  check("disclaimer denies outcome prediction", /not a prediction of any real promotion/i.test(body));
  const hits = BANNED.filter(re => re.test(body));
  check("no invented claims / guarantees / stats", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
}

// --- Quiz structure ---
{
  const { document } = loadPage();
  const fieldsets = document.querySelectorAll("fieldset.q");
  check("exactly 10 questions", fieldsets.length === 10, String(fieldsets.length));
  for (let q = 1; q <= 10; q++) {
    const radios = document.querySelectorAll(`input[name="q${q}"][type="radio"]`);
    if (radios.length !== 4) { check("question " + q + " has 4 options", false, String(radios.length)); break; }
  }
  check("every question has 4 radio options", document.querySelectorAll('input[type="radio"]').length === 40);
  const legends = [...document.querySelectorAll("fieldset.q legend")].map(l => l.textContent);
  check("questions cover scope/influence/ambiguity themes",
    /beyond my own|end-to-end|adopt/i.test(legends.slice(0,3).join(" ")) &&
    /authority|feedback|mentor|disagreements/i.test(legends.slice(3,7).join(" ")) &&
    /define the problem|no clear requirements|technical direction/i.test(legends.slice(7).join(" ")));
  check("results hidden initially", document.getElementById("results").hidden === true);
  check("retake hidden initially", document.getElementById("btn-retake").hidden === true);
}

// --- Incomplete form guard ---
{
  const { document, window } = loadPage();
  answer(document, window, 1, 4);
  submitQuiz(document, window);
  check("incomplete quiz shows error naming the question", /question 2/i.test(document.getElementById("q-err").textContent),
    document.getElementById("q-err").textContent);
  check("incomplete quiz keeps results hidden", document.getElementById("results").hidden === true);
}

// --- Score math: all max ---
{
  const { document, window } = loadPage();
  answerAll(document, window, [4,4,4,4,4,4,4,4,4,4]);
  submitQuiz(document, window);
  check("all-4s totals 40/40", document.getElementById("score-num").textContent === "40 / 40",
    document.getElementById("score-num").textContent);
  check("all-4s hits Staff ready band", /Staff ready/i.test(document.getElementById("score-band").textContent),
    document.getElementById("score-band").textContent);
  ["scope","influence","ambiguity"].forEach(d => {
    check("all-4s " + d + " bar at 100%", document.getElementById("pct-" + d).textContent === "100%",
      document.getElementById("pct-" + d).textContent);
  });
  check("results revealed", document.getElementById("results").hidden === false);
  check("retake shown after submit", document.getElementById("btn-retake").hidden === false);
}

// --- Score math: mixed + band thresholds + weakest dimension ---
{
  const { document, window } = loadPage();
  // scope: 1,1,1 (weakest), influence: 2,2,2,2, ambiguity: 3,3,3 -> total 20
  answerAll(document, window, [1,1,1, 2,2,2,2, 3,3,3]);
  submitQuiz(document, window);
  check("mixed totals 20/40", document.getElementById("score-num").textContent === "20 / 40",
    document.getElementById("score-num").textContent);
  check("20 lands in Staff emerging band", /Staff emerging/i.test(document.getElementById("score-band").textContent),
    document.getElementById("score-band").textContent);
  check("scope bar at 25%", document.getElementById("pct-scope").textContent === "25%",
    document.getElementById("pct-scope").textContent);
  check("influence bar at 50%", document.getElementById("pct-influence").textContent === "50%",
    document.getElementById("pct-influence").textContent);
  check("ambiguity bar at 75%", document.getElementById("pct-ambiguity").textContent === "75%",
    document.getElementById("pct-ambiguity").textContent);
}
{
  const { document, window } = loadPage();
  answerAll(document, window, [1,1,1,1,1,1,1,1,1,2]); // total 11
  submitQuiz(document, window);
  check("11 lands in Senior scope band", /Senior scope/i.test(document.getElementById("score-band").textContent),
    document.getElementById("score-band").textContent);
}
{
  const { document, window } = loadPage();
  const bf = window.LeadLoop.bandFor;
  check("bandFor boundary 19 = Senior scope", /Senior scope/.test(bf(19).band));
  check("bandFor boundary 20 = Staff emerging", /Staff emerging/.test(bf(20).band));
  check("bandFor boundary 29 = Staff emerging", /Staff emerging/.test(bf(29).band));
  check("bandFor boundary 30 = Staff ready", /Staff ready/.test(bf(30).band));
}

// --- Gap analysis identifies the weakest dimension ---
{
  const { document, window } = loadPage();
  // influence weakest: scope 4s, influence 1s, ambiguity 3s
  answerAll(document, window, [4,4,4, 1,1,1,1, 3,3,3]);
  submitQuiz(document, window);
  submitGate(document, window, "Priya", "priya@example.com");
  const gap = document.getElementById("gap-analysis").textContent;
  check("gap analysis names influence as the gap", /Influence is your gap/i.test(gap), gap.slice(0, 120));
  check("gap analysis names strongest dimension", /strongest dimension is.*scope/i.test(gap), gap.slice(0, 200));
  check("gap advice is actionable", /pre-wire|one decision|quarter/i.test(gap));
}

// --- Gap analysis gated until signup ---
{
  const { document, window } = loadPage();
  answerAll(document, window, [4,4,4,4,4,4,4,4,4,4]);
  submitQuiz(document, window);
  check("score visible without signup", document.getElementById("score-num").textContent === "40 / 40");
  check("gap analysis hidden before signup", document.getElementById("gap-analysis").hidden === true);
  check("lock note visible before signup", document.getElementById("gap-locked").style.display !== "none");
  check("gate visible before signup", document.getElementById("gate-wrap").hidden === false);

  submitGate(document, window, "Bad", "nope");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps gap locked", document.getElementById("gap-analysis").hidden === true);
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Arjun", "arjun@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks gap analysis", document.getElementById("gap-analysis").hidden === false);
  check("lock note hidden after unlock", document.getElementById("gap-locked").style.display === "none");
  check("gate hidden after unlock", document.getElementById("gate-wrap").hidden === true);
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=staff-scope-calculator",
    rows.length === 1 && rows[0].email === "arjun@example.com" && rows[0].source === "staff-scope-calculator",
    JSON.stringify(rows));
  submitGate(document, window, "Arjun", "ARJUN@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Returning visitor: gap unlocked immediately after quiz ---
{
  const storage = JSON.stringify([{ name: "M", email: "m@example.com", ts: "2026-09-20T00:00:00Z", source: "star-l-story-builder" }]);
  const { document, window } = loadPage({ storage });
  answerAll(document, window, [3,3,3,3,3,3,3,3,3,3]);
  submitQuiz(document, window);
  check("returning visitor sees gap analysis", document.getElementById("gap-analysis").hidden === false);
  check("returning visitor skips gate", document.getElementById("gate-wrap").hidden === true);
}

// --- Retake resets ---
{
  const { document, window } = loadPage();
  answerAll(document, window, [4,4,4,4,4,4,4,4,4,4]);
  submitQuiz(document, window);
  document.getElementById("btn-retake").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("retake clears all radios", document.querySelectorAll('input[type="radio"]:checked').length === 0);
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
  const radios = [...document.querySelectorAll('input[type="radio"]')].filter(r =>
    !r.closest("fieldset") || !r.closest("fieldset").querySelector("legend"));
  check("all radios grouped in labelled fieldsets", radios.length === 0);
  const inputs = [...document.querySelectorAll("input")].filter(i =>
    i.type !== "radio" && !i.getAttribute("aria-label") && !document.querySelector(`label[for="${i.id}"]`));
  check("all non-radio inputs labelled", inputs.length === 0);
  check("quiz error region has role=alert", document.getElementById("q-err").getAttribute("role") === "alert");
  check("gate error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  check("results region announced politely", document.getElementById("results").getAttribute("aria-live") === "polite");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
}

console.log(`\nF6 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
