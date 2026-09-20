// E2E tests for F1: System Design Pitch Sheet page.
// Run: node f1.test.js  (from the tests/e2e/ dir; expects repo-root layout)
// Uses jsdom to load the real page, run its scripts, and drive the flows.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "system-design-pitch-sheet.html";
const BASE = "https://aashithk.github.io/leadloop/";

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
}

function loadPage() {
  const html = fs.readFileSync(path.join(SITE, PAGE), "utf8");
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(String(e.stack || e)));
  const dom = new JSDOM(html, {
    url: BASE + PAGE,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const { window } = dom;
  // Stub print: jsdom does not implement it.
  let printed = 0;
  window.print = () => { printed++; };
  const printCount = () => printed;
  return { window, document: window.document, errors, printCount };
}

function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F1 e2e: " + PAGE);

// --- SEO / document hygiene ---
{
  const { document, errors } = loadPage();
  check("no JS errors on load", errors.length === 0, errors[0]);
  const title = document.querySelector("title").textContent;
  check("title present and <=60 chars", title.length > 0 && title.length <= 60, title);
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
}

// --- Gate flow: fresh visitor ---
{
  const { window, document } = loadPage();
  check("sheet hidden for fresh visitor", document.getElementById("sheet-full").hidden === true);
  check("gate form visible for fresh visitor",
    document.getElementById("gate-wrap").style.display !== "none");
  check("print button inside locked sheet",
    !!document.getElementById("btn-print-sheet"));

  // Invalid email -> error, stays locked, nothing stored.
  submitGate(document, window, "Test", "not-an-email");
  check("invalid email shows error",
    document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps sheet locked",
    document.getElementById("sheet-full").hidden === true);
  check("invalid email stores nothing",
    window.localStorage.getItem("leadloop_signups_v1") === null);

  // Valid email -> unlocks, stores, hides gate.
  submitGate(document, window, "Priya", "priya@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks sheet", document.getElementById("sheet-full").hidden === false);
  check("gate hidden after unlock",
    document.getElementById("gate-wrap").style.display === "none");
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored in localStorage",
    rows.length === 1 && rows[0].email === "priya@example.com" && rows[0].source === "pitch-sheet",
    JSON.stringify(rows));

  // Duplicate email -> no duplicate row, still unlocked.
  document.getElementById("gate-wrap").style.display = ""; // simulate re-show edge
  submitGate(document, window, "Priya", "priya@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email not stored twice", rows.length === 1);
}

// --- Gate flow: returning visitor ---
{
  const { window, document } = loadPage();
  window.localStorage.setItem("leadloop_signups_v1",
    JSON.stringify([{ name: "R", email: "r@example.com", ts: "2026-09-20T00:00:00Z" }]));
  // Re-run the on-load unlock logic by re-loading the page with storage pre-set:
  const html = fs.readFileSync(path.join(SITE, PAGE), "utf8");
  const dom2 = new JSDOM(html, { url: BASE + PAGE, runScripts: "dangerously", pretendToBeVisual: true });
  dom2.window.localStorage.setItem("leadloop_signups_v1",
    JSON.stringify([{ name: "R", email: "r@example.com", ts: "2026-09-20T00:00:00Z" }]));
  // Scripts already ran before storage was set; emulate a reload by re-creating:
  const dom3 = new JSDOM(html, {
    url: BASE + PAGE, runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.localStorage.setItem("leadloop_signups_v1",
        JSON.stringify([{ name: "R", email: "r@example.com", ts: "2026-09-20T00:00:00Z" }]));
    }
  });
  const d3 = dom3.window.document;
  check("returning visitor sees sheet unlocked", d3.getElementById("sheet-full").hidden === false);
  check("returning visitor skips gate", d3.getElementById("gate-wrap").style.display === "none");
}

// --- Print flow ---
{
  const { window, document, printCount } = loadPage();
  submitGate(document, window, "Mei", "mei@example.com");
  document.getElementById("btn-print-sheet").dispatchEvent(
    new window.Event("click", { bubbles: true }));
  check("print button calls window.print", printCount() === 1);
  const printCss = [...document.querySelectorAll("style")].some(s =>
    s.textContent.includes("@media print") && s.textContent.includes(".no-print"));
  check("print CSS hides chrome, keeps sheet", printCss);
}

// --- Link hygiene: every internal link resolves to a real file ---
{
  const { document } = loadPage();
  const bad = [];
  document.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
    let file = null;
    if (href === BASE || href === BASE + "#toolkit" || href.startsWith(BASE + "#")) file = "index.html";
    else if (href.startsWith(BASE)) file = href.slice(BASE.length).split("#")[0] || "index.html";
    else return; // external link
    if (file && !fs.existsSync(path.join(SITE, file))) bad.push(href);
  });
  check("all internal links resolve to real files", bad.length === 0, bad.join(", "));
}

// --- Accessibility basics ---
{
  const { document } = loadPage();
  const imgs = [...document.querySelectorAll("img")].filter(i => !i.getAttribute("alt"));
  check("all images have alt text", imgs.length === 0);
  const inputs = [...document.querySelectorAll("input")].filter(i =>
    !i.getAttribute("aria-label") && !document.querySelector(`label[for="${i.id}"]`));
  check("all inputs labelled", inputs.length === 0);
  check("error region has role=alert",
    document.getElementById("g-err").getAttribute("role") === "alert");
}

console.log(`\nF1 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
