// E2E tests for F9: AI Architecture Prompts page.
// Run: node f9.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: 14-prompt library, live search filtering, category
// filter, no-results state, per-prompt copy success/failure, Markdown
// download gated behind email (filename, blob), print, practice-only
// disclaimer + banned-claim scan.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "ai-architecture-prompts.html";
const BASE = "https://aashithk.github.io/leadloop/";
const BANNED = [
  /testimonial/i, /success rate/i, /promoted in \d+\s*(week|month)/i,
  /you will be (promoted|hired)/i, /guarantee/i,
  /are real interview questions from/i, /asked at google/i,
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

function setSearch(document, window, q) {
  const s = document.getElementById("f-search");
  s.value = q;
  s.dispatchEvent(new window.Event("input", { bubbles: true }));
}
function setCat(document, window, c) {
  const s = document.getElementById("f-cat");
  s.value = c;
  s.dispatchEvent(new window.Event("change", { bubbles: true }));
}
function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

(async () => {
console.log("F9 e2e: " + PAGE);

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
  const ogUrl = document.querySelector('meta[property="og:url"]').getAttribute("content");
  check("og:url matches canonical", ogUrl === canon, ogUrl);
}

// --- Honesty: practice prompts, not real questions ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  check("practice-only disclaimer present", /Practice prompts, not predictions/i.test(body));
  check("disclaimer denies real company questions", /not real interview questions from any company/i.test(body));
  const hits = BANNED.filter(re => re.test(body));
  check("no invented claims about real loops", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
}

// --- Library structure ---
{
  const { document, window } = loadPage();
  check("14 prompts in the library", window.LeadLoop.PROMPTS.length === 14,
    String(window.LeadLoop.PROMPTS.length));
  const cats = new Set(window.LeadLoop.PROMPTS.map(p => p.c));
  check("5 categories covered", cats.size === 5, [...cats].join(","));
  check("every prompt has title/body/tags", window.LeadLoop.PROMPTS.every(p => p.t && p.b && p.tags));
  check("count line shows 14 of 14", document.getElementById("count").textContent === "14 of 14 prompts",
    document.getElementById("count").textContent);
  check("14 prompt cards rendered", document.querySelectorAll(".prompt").length === 14);
  check("every card has a copy button", document.querySelectorAll("[data-copy]").length === 14);
  const opts = [...document.getElementById("f-cat").options].filter(o => o.value).length;
  check("category select has 5 real options", opts === 5, String(opts));
}

// --- Search filtering ---
{
  const { document, window } = loadPage();
  setSearch(document, window, "agent");
  const n = document.querySelectorAll(".prompt").length;
  check("search 'agent' narrows results", n > 0 && n < 14, String(n));
  check("count updates with search", document.getElementById("count").textContent === n + " of 14 prompts",
    document.getElementById("count").textContent);
  check("search matches body text too", [...document.querySelectorAll(".prompt h3")].some(h => /agent/i.test(h.textContent)));
  setSearch(document, window, "AGENT");
  check("search is case-insensitive", document.querySelectorAll(".prompt").length === n);
  setSearch(document, window, "");
  check("clearing search restores all", document.querySelectorAll(".prompt").length === 14);
}
{
  const { document, window } = loadPage();
  setSearch(document, window, "zzz-no-such-thing");
  check("no-results state shown", /No prompts match/i.test(document.getElementById("prompts").textContent));
  check("count shows 0 on no-results", document.getElementById("count").textContent === "0 of 14 prompts");
}

// --- Category filtering + combined ---
{
  const { document, window } = loadPage();
  setCat(document, window, "eval");
  const n = document.querySelectorAll(".prompt").length;
  check("category filter shows only eval prompts", n === 3, String(n));
  check("eval cards carry eval label", [...document.querySelectorAll(".prompt .cat")].every(c => /Eval/.test(c.textContent)));
  setCat(document, window, "");
  check("resetting category restores all", document.querySelectorAll(".prompt").length === 14);
}
{
  const { document, window } = loadPage();
  setCat(document, window, "agents");
  setSearch(document, window, "cost");
  check("search + category combine", document.querySelectorAll(".prompt").length === 1,
    String(document.querySelectorAll(".prompt").length));
}

// --- Copy button: success path ---
{
  const { document, window } = loadPage();
  let copied = null;
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: t => { copied = t; return Promise.resolve(); } },
    configurable: true
  });
  document.querySelector('[data-copy="0"]').dispatchEvent(new window.Event("click", { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  check("copy writes prompt text to clipboard", copied && copied.indexOf("Design a code-review agent") === 0,
    copied && copied.slice(0, 60));
  check("copy shows success feedback", document.getElementById("copied-0").textContent === "Copied ✓",
    document.getElementById("copied-0").textContent);
}

// --- Copy button: blocked path ---
{
  const { document, window } = loadPage();
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: () => Promise.reject(new Error("denied")) },
    configurable: true
  });
  window.document.execCommand = () => false;
  document.querySelector('[data-copy="1"]').dispatchEvent(new window.Event("click", { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  check("blocked copy shows manual guidance", /manually/i.test(document.getElementById("copied-1").textContent),
    document.getElementById("copied-1").textContent);
}

// --- Download gated until signup ---
{
  const { document, window } = loadPage();
  check("download hidden before signup", document.getElementById("dl-ready").hidden === true);
  check("download lock note visible", document.getElementById("dl-locked").style.display !== "none");
  check("gate visible before signup", document.getElementById("gate-wrap").hidden === false);

  submitGate(document, window, "Nope", "bad");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps download locked", document.getElementById("dl-ready").hidden === true);
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Rahul", "rahul@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks download", document.getElementById("dl-ready").hidden === false);
  check("lock note hidden after unlock", document.getElementById("dl-locked").style.display === "none");
  check("gate hidden after unlock", document.getElementById("gate-wrap").hidden === true);
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=ai-architecture-prompts",
    rows.length === 1 && rows[0].email === "rahul@example.com" && rows[0].source === "ai-architecture-prompts",
    JSON.stringify(rows));
  submitGate(document, window, "Rahul", "RAHUL@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Download: markdown content + filename ---
{
  const storage = JSON.stringify([{ name: "R", email: "r@example.com", ts: "2026-09-20T00:00:00Z", source: "ai-architecture-prompts" }]);
  const { document, window } = loadPage({ storage });
  const md = window.LeadLoop.markdown();
  check("markdown covers all 14 prompts", (md.match(/^## /gm) || []).length === 14,
    String((md.match(/^## /gm) || []).length));
  check("markdown has category + tags per prompt", /Category: Agentic systems/.test(md));
  let clicked = null, createdUrl = null;
  const origCreate = window.URL.createObjectURL;
  window.URL.createObjectURL = blob => { createdUrl = blob; return "blob:fake"; };
  window.URL.revokeObjectURL = () => {};
  const origCreateEl = document.createElement.bind(document);
  document.createElement = tag => {
    const el = origCreateEl(tag);
    if (tag === "a") {
      const origClick = el.click.bind(el);
      el.click = () => { clicked = { download: el.getAttribute("download"), href: el.getAttribute("href") }; origClick(); };
    }
    return el;
  };
  document.getElementById("btn-download").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("download filename correct", clicked && clicked.download === "leadloop-ai-architecture-prompts.md",
    JSON.stringify(clicked));
  check("download blob is markdown", createdUrl && createdUrl.type === "text/markdown");
  window.URL.createObjectURL = origCreate;
  document.createElement = origCreateEl;
}

// --- Returning visitor: download unlocked on load ---
{
  const storage = JSON.stringify([{ name: "Q", email: "q@example.com", ts: "2026-09-20T00:00:00Z", source: "star-l-story-builder" }]);
  const { document } = loadPage({ storage });
  check("returning visitor sees download", document.getElementById("dl-ready").hidden === false);
  check("returning visitor skips gate", document.getElementById("gate-wrap").hidden === true);
}

// --- Print flow ---
{
  const { document, window } = loadPage();
  let printed = false;
  window.print = () => { printed = true; };
  document.getElementById("btn-print").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("print button calls window.print", printed === true);
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
  const labeled = ["f-search", "f-cat"].every(id => !!document.querySelector(`label[for="${id}"]`));
  check("filter controls have labels", labeled);
  check("gate error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  check("count region has aria-live", document.getElementById("count").getAttribute("aria-live") === "polite");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
}

console.log(`\nF9 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
})();
