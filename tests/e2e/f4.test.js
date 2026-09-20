// E2E tests for F4: XFN Conflict Resolver page.
// Run: node f4.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: scenario dropdown switching, per-scenario lock gating
// (scenario 1 free, 2-5 locked until signup), unlock persistence across
// scenario changes, say-it-like-this per scenario, honesty checks.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "xfn-conflict-resolver.html";
const BASE = "https://aashithk.github.io/leadloop/";
const SCENARIOS = ["blocked", "deadline", "ownership", "rejected", "dependency"];
const BANNED = [
  /testimonial/i, /success rate/i, /promoted in \d+\s*(week|month)/i,
  /at google,? (the )?committees?/i, /google'?s hiring committee/i,
  /real (committee|interview) (data|feedback)/i,
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

function selectScenario(document, window, value) {
  const sel = document.getElementById("scenario");
  sel.value = value;
  sel.dispatchEvent(new window.Event("change", { bubbles: true }));
}
function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F4 e2e: " + PAGE);

// --- SEO / document hygiene ---
{
  const { document, errors } = loadPage();
  check("no JS errors on load", errors.length === 0, errors[0]);
  const title = document.querySelector("title").textContent;
  check("title present and <=60 chars", title.length > 0 && title.length <= 60, title);
  check("title mentions XFN conflict", /xfn|conflict/i.test(title), title);
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
  check("body is substantial (not a thin page)", document.body.textContent.length > 4000);
}

// --- Honesty: no invented claims ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  const hits = BANNED.filter(re => re.test(body));
  check("no invented testimonials/stats/committee claims", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
  check("no employer endorsement implied", !/(endorsed|sponsored) by (google|meta)/i.test(body));
}

// --- Scenario tool: structure ---
{
  const { document } = loadPage();
  const sel = document.getElementById("scenario");
  check("scenario select exists and is labelled",
    !!sel && (!!sel.getAttribute("aria-label") || !!document.querySelector('label[for="scenario"]')));
  const values = [...sel.options].map(o => o.value);
  const missing = SCENARIOS.filter(s => !values.includes(s));
  check("all 5 scenarios in dropdown", missing.length === 0, "missing: " + missing.join(","));
  const lockedOpts = [...sel.options].filter(o => /🔒/.test(o.textContent));
  check("4 locked scenarios marked with lock glyph", lockedOpts.length === 4, String(lockedOpts.length));
  check("free scenario has no lock glyph", !/🔒/.test(sel.options[0].textContent));
  SCENARIOS.forEach(s => check("panel exists for " + s, !!document.getElementById("panel-" + s)));
  const sayits = document.querySelectorAll(".sayit");
  check("each scenario has a say-it-like-this", sayits.length >= 5, String(sayits.length));
  const juniors = document.querySelectorAll(".junior");
  check("each scenario contrasts junior handling", juniors.length >= 5, String(juniors.length));
  const steps = document.querySelectorAll("ol.steps");
  check("each scenario has a step list", steps.length >= 5, String(steps.length));
}

// --- Free scenario works without signup ---
{
  const { document, window } = loadPage();
  check("blocked panel visible on load", document.getElementById("panel-blocked").hidden === false);
  check("gate hidden for free scenario", document.getElementById("gate-wrap").hidden === true);
  check("locked-panel hidden for free scenario", document.getElementById("locked-panel").hidden === true);
  const text = document.getElementById("panel-blocked").textContent;
  check("free panel has incentives read", /Their incentives|incentives/i.test(text));
  check("free panel has the staff-level move", /staff-level move/i.test(text));
}

// --- Locked scenarios gated until signup ---
{
  const { document, window } = loadPage();
  ["deadline", "ownership", "rejected", "dependency"].forEach(s => {
    selectScenario(document, window, s);
    check("locked scenario '" + s + "' shows lock panel", document.getElementById("locked-panel").hidden === false);
    check("locked scenario '" + s + "' shows gate", document.getElementById("gate-wrap").hidden === false);
    check("locked scenario '" + s + "' hides its panel", document.getElementById("panel-" + s).hidden === true);
  });
  // switching back to the free scenario re-hides the gate
  selectScenario(document, window, "blocked");
  check("returning to free scenario hides gate again", document.getElementById("gate-wrap").hidden === true);
}

// --- Gate flow unlocks everything ---
{
  const { document, window } = loadPage();
  selectScenario(document, window, "deadline");
  submitGate(document, window, "Bad", "nope");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps panel locked", document.getElementById("locked-panel").hidden === false);
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Mei", "mei@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("unlock reveals selected panel", document.getElementById("panel-deadline").hidden === false);
  check("unlock hides lock panel", document.getElementById("locked-panel").hidden === true);
  check("unlock hides gate", document.getElementById("gate-wrap").hidden === true);
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=xfn-conflict-resolver",
    rows.length === 1 && rows[0].email === "mei@example.com" && rows[0].source === "xfn-conflict-resolver",
    JSON.stringify(rows));
  // all scenarios now reachable without re-gating
  ["ownership", "rejected", "dependency", "blocked"].forEach(s => {
    selectScenario(document, window, s);
    check("post-unlock scenario '" + s + "' shows its panel", document.getElementById("panel-" + s).hidden === false);
  });
  check("post-unlock gate stays hidden", document.getElementById("gate-wrap").hidden === true);
  submitGate(document, window, "Mei", "MEI@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Returning visitor bypasses the gate entirely ---
{
  const storage = JSON.stringify([{ name: "A", email: "a@example.com", ts: "2026-09-20T00:00:00Z", source: "pitch-sheet" }]);
  const { document, window } = loadPage({ storage });
  ["deadline", "ownership", "rejected", "dependency"].forEach(s => {
    selectScenario(document, window, s);
    check("returning visitor sees '" + s + "' unlocked", document.getElementById("panel-" + s).hidden === false);
  });
  check("returning visitor never sees gate", document.getElementById("gate-wrap").hidden === true);
}

// --- Print flow + print CSS ---
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
  const { document, window } = loadPage();
  const imgs = [...document.querySelectorAll("img")].filter(i => !i.getAttribute("alt"));
  check("all images have alt text", imgs.length === 0);
  const inputs = [...document.querySelectorAll("input")].filter(i =>
    !i.getAttribute("aria-label") && !document.querySelector(`label[for="${i.id}"]`));
  check("all inputs labelled", inputs.length === 0);
  check("error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  check("panels region announced politely", document.getElementById("panels").getAttribute("aria-live") === "polite");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
  check("select is keyboard-operable native control", document.getElementById("scenario").tagName === "SELECT");
}

console.log(`\nF4 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
