// E2E tests for F3: Hiring Committee Calibration page.
// Run: node f3.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: blur-gated L7 analysis (class toggle + lock note + hidden
// leveling table), fictional-example disclaimers, no invented committee claims,
// the 4-pattern calibration lens, gate dedupe, print flow.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "hiring-committee-calibration.html";
const BASE = "https://aashithk.github.io/leadloop/";
const BANNED = [
  /at google,? (the )?committees?/i,
  /google'?s hiring committee/i,
  /our committee (decided|found|said|ruled)/i,
  /real (committee|interview) (data|feedback|notes)/i,
  /success rate/i,
  /promoted in \d+\s*(week|month)/i,
  /testimonial/i,
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
      if (opts.stubPrint) w.print = () => { w.__printed = (w.__printed || 0) + 1; };
    }
  });
  return { window: dom.window, document: dom.window.document, errors };
}

function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F3 e2e: " + PAGE);

// --- SEO / document hygiene ---
{
  const { document, errors } = loadPage();
  check("no JS errors on load", errors.length === 0, errors[0]);
  const title = document.querySelector("title").textContent;
  check("title present and <=60 chars", title.length > 0 && title.length <= 60, title);
  check("title mentions committee calibration", /committee/i.test(title) && /(level|l5)/i.test(title), title);
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
  const body = document.body.textContent;
  check("body is substantial (not a thin page)", body.length > 4000, String(body.length));
}

// --- Honesty: fictional + no invented committee claims ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  check("fictional-example disclaimer present", /fictional,? illustrative/i.test(body));
  check("disclaimer denies real committee data", /not (a )?real (interview|committee)/i.test(body));
  const hits = BANNED.filter(re => re.test(body));
  check("no invented committee claims / stats / testimonials", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
  check("no employer endorsement implied", !/(endorsed|sponsored) by (google|meta)/i.test(body));
}

// --- Calibration content: lens + three levels ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  ["Scope of impact", "Ambiguity navigated", "Influence without authority", "Leveling vs"].forEach(p =>
    check("calibration lens covers: " + p, body.includes(p)));
  check("L5 card present", !!document.querySelector(".level-tag.l5"));
  check("L6 card present", !!document.querySelector(".level-tag.l6"));
  check("L7 card present", !!document.querySelector(".level-tag.l7"));
  const lens = document.querySelectorAll(".lens");
  check("each level has a committee-lens readout", lens.length >= 3, String(lens.length));
  check("the shared prompt question is quoted", /Tell me about a time you disagreed with a partner team/i.test(body));
  const sideTable = document.getElementById("l7-extra").textContent;
  check("leveling table covers scope denominator", /denominator/i.test(sideTable));
  check("leveling table covers durability", /Durability|class of problem/i.test(sideTable));
  const checklist = document.querySelectorAll(".check li");
  check("self-calibration checklist has >=4 items", checklist.length >= 4, String(checklist.length));
}

// --- Blur gate: fresh visitor ---
{
  const { window, document } = loadPage();
  check("L7 card starts blurred", document.getElementById("l7-card").classList.contains("gated-blur"));
  check("lock note visible for fresh visitor", document.getElementById("l7-locknote").style.display !== "none");
  check("leveling table hidden for fresh visitor", document.getElementById("l7-extra").hidden === true);
  check("gate form visible for fresh visitor", document.getElementById("gate-wrap").style.display !== "none");
  check("L5/L6 cards are outside the blurred region",
    !document.querySelector(".level-tag.l5").closest(".gated-blur") &&
    !document.querySelector(".level-tag.l6").closest(".gated-blur"));

  submitGate(document, window, "Bad", "not-an-email");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps L7 blurred", document.getElementById("l7-card").classList.contains("gated-blur"));
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Rahul", "rahul@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unblurs L7 card", !document.getElementById("l7-card").classList.contains("gated-blur"));
  check("lock note hidden after unlock", document.getElementById("l7-locknote").style.display === "none");
  check("leveling table revealed after unlock", document.getElementById("l7-extra").hidden === false);
  check("gate hidden after unlock", document.getElementById("gate-wrap").style.display === "none");
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=committee-calibration",
    rows.length === 1 && rows[0].email === "rahul@example.com" && rows[0].source === "committee-calibration",
    JSON.stringify(rows));
  submitGate(document, window, "Rahul", "RAHUL@EXAMPLE.COM");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Blur gate: returning visitor bypasses ---
{
  const storage = JSON.stringify([{ name: "P", email: "p@example.com", ts: "2026-09-20T00:00:00Z", source: "pitch-sheet" }]);
  const { document } = loadPage({ storage });
  check("returning visitor sees L7 unblurred", !document.getElementById("l7-card").classList.contains("gated-blur"));
  check("returning visitor sees leveling table", document.getElementById("l7-extra").hidden === false);
  check("returning visitor skips gate", document.getElementById("gate-wrap").style.display === "none");
}

// --- Print flow + print CSS ---
{
  const { window, document } = loadPage({ stubPrint: true });
  submitGate(document, window, "Mei", "mei@example.com");
  document.getElementById("btn-print-cal").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("print button calls window.print", window.__printed === 1);
  const printCss = [...document.querySelectorAll("style")].some(s =>
    s.textContent.includes("@media print") && s.textContent.includes(".no-print"));
  check("print CSS hides chrome", printCss);
  const styleText = [...document.querySelectorAll("style")].map(s => s.textContent).join("\n");
  check("print CSS removes blur when printing", /\.gated-blur\s+\.blur-target\s*\{\s*filter:\s*none/i.test(styleText));
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
  const inputs = [...document.querySelectorAll("input")].filter(i =>
    !i.getAttribute("aria-label") && !document.querySelector(`label[for="${i.id}"]`));
  check("all inputs labelled", inputs.length === 0);
  check("error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
  check("locked L7 region is an article landmark with heading", !!document.getElementById("l7-h"));
}

console.log(`\nF3 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
