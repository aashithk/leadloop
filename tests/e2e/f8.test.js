// E2E tests for F8: Committee Debrief Log page.
// Run: node f8.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: DRAFT banner presence + exact wording, four generic
// patterns with gated deep-dives, private localStorage debrief log
// (add/delete/persist/empty-note guard), print, banned-content scan
// (no anecdotes, quotes, stats, or real committee observations).
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "committee-debrief-log.html";
const BASE = "https://aashithk.github.io/leadloop/";
// No anecdotes, attributed quotes, stats, testimonials, or real observations.
const BANNED = [
  /testimonial/i, /success rate/i, /promoted in \d+\s*(week|month)/i,
  /you will be (promoted|hired)/i, /guarantee/i,
  /a candidate (once|i interviewed|told me)/i, /one interviewer (told|said)/i,
  /in (a|the) (real|actual) (debrief|committee)/i,
  /\d+% of (candidates|loops|committees)/i,
  /“[^”]+”\s*—\s*[A-Z][a-z]+/,
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
      if (opts.signup) w.localStorage.setItem("leadloop_signups_v1", opts.signup);
      if (opts.log) w.localStorage.setItem("leadloop_debrief_log_v1", opts.log);
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
function addEntry(document, window, cat, notes) {
  document.getElementById("l-cat").value = cat;
  document.getElementById("l-notes").value = notes;
  document.getElementById("log-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F8 e2e: " + PAGE);

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

// --- DRAFT banner: exact locked wording, prominent ---
{
  const { document } = loadPage();
  const banner = document.getElementById("draft-banner");
  check("DRAFT banner exists", !!banner);
  check("DRAFT banner uses exact locked wording",
    banner && /DRAFT — awaiting Aashith's exact-content approval\./.test(banner.textContent),
    banner && banner.textContent.slice(0, 80));
  check("DRAFT banner is the first thing in main",
    banner && document.querySelector("main").firstElementChild !== banner ?
      document.querySelector("main nav").nextElementSibling === banner : true);
  check("DRAFT banner clarifies educational-only", /Educational patterns only/i.test(banner.textContent));
  check("DRAFT banner clarifies nothing real", /Nothing here describes a real interview/i.test(banner.textContent));
}

// --- Educational-only honesty ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  check("educational-only disclaimer present", /Educational only/i.test(body));
  check("disclaimer denies real committee observations", /not observations from any real committee/i.test(body));
  const hits = BANNED.filter(re => re.test(body));
  check("no anecdotes/quotes/stats/real observations", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
}

// --- Pattern structure ---
{
  const { document } = loadPage();
  const patterns = document.querySelectorAll(".pattern");
  check("exactly 4 patterns", patterns.length === 4, String(patterns.length));
  const heads = [...patterns].map(p => p.querySelector("h3").textContent);
  check("patterns are scope/ambiguity/influence/leveling-vs-bar",
    /scope/i.test(heads[0]) && /ambiguity/i.test(heads[1]) && /influence/i.test(heads[2]) && /leveling vs bar/i.test(heads[3]),
    heads.join(" | "));
  const teasers = [...patterns].map(p => p.querySelector(".teaser").textContent);
  check("every pattern has a free teaser", teasers.every(t => t && t.length > 20));
  const deeps = document.querySelectorAll("[data-deep]");
  check("every pattern has a deep-dive", deeps.length === 4);
  check("deep-dives hidden before signup", [...deeps].every(d => d.hidden === true));
  check("lock note visible before signup", document.getElementById("detail-locked").style.display !== "none");
  check("gate visible before signup", document.getElementById("gate-wrap").hidden === false);
}

// --- Gate unlocks deep-dives ---
{
  const { document, window } = loadPage();
  submitGate(document, window, "Nope", "bad");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps deep-dives locked",
    [...document.querySelectorAll("[data-deep]")].every(d => d.hidden === true));
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Sara", "sara@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks all deep-dives",
    [...document.querySelectorAll("[data-deep]")].every(d => d.hidden === false));
  check("lock note hidden after unlock", document.getElementById("detail-locked").style.display === "none");
  check("gate hidden after unlock", document.getElementById("gate-wrap").hidden === true);
  const deepText = [...document.querySelectorAll("[data-deep]")].map(d => d.textContent).join(" ");
  check("deep-dives are substantive guidance", deepText.length > 800, String(deepText.length));
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=committee-debrief-log",
    rows.length === 1 && rows[0].email === "sara@example.com" && rows[0].source === "committee-debrief-log",
    JSON.stringify(rows));
  submitGate(document, window, "Sara", "SARA@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Returning visitor: deep-dives unlocked on load ---
{
  const signup = JSON.stringify([{ name: "P", email: "p@example.com", ts: "2026-09-20T00:00:00Z", source: "faang-level-matcher" }]);
  const { document } = loadPage({ signup });
  check("returning visitor sees deep-dives", [...document.querySelectorAll("[data-deep]")].every(d => d.hidden === false));
  check("returning visitor skips gate", document.getElementById("gate-wrap").hidden === true);
}

// --- Private debrief log: add ---
{
  const { document, window } = loadPage();
  check("log shows empty state initially", /No entries yet/i.test(document.getElementById("entries").textContent));
  addEntry(document, window, "scope", "My stories stayed at one-team scope.");
  const entries = document.querySelectorAll("#entries .entry");
  check("one entry added", entries.length === 1, String(entries.length));
  check("entry shows category label", /Scope/.test(entries[0].textContent));
  check("entry shows note text", /one-team scope/.test(entries[0].textContent));
  check("textarea cleared after add", document.getElementById("l-notes").value === "");
  let log = [];
  try { log = JSON.parse(window.localStorage.getItem("leadloop_debrief_log_v1")); } catch (e) {}
  check("entry persisted to localStorage", log.length === 1 && log[0].notes === "My stories stayed at one-team scope." && log[0].cat === "scope",
    JSON.stringify(log));
}

// --- Log: empty note guard ---
{
  const { document, window } = loadPage();
  addEntry(document, window, "general", "   ");
  check("empty note shows error", document.getElementById("l-err").textContent.length > 0);
  check("empty note adds nothing", document.querySelectorAll("#entries .entry").length === 0);
  check("empty note stores nothing", window.localStorage.getItem("leadloop_debrief_log_v1") === null);
}

// --- Log: newest first + delete ---
{
  const { document, window } = loadPage();
  addEntry(document, window, "scope", "First note");
  addEntry(document, window, "influence", "Second note");
  const first = document.querySelector("#entries .entry p").textContent;
  check("newest entry first", first === "Second note", first);
  document.querySelector('#entries [data-del="0"]').dispatchEvent(new window.Event("click", { bubbles: true }));
  const remaining = document.querySelectorAll("#entries .entry");
  check("delete removes one entry", remaining.length === 1, String(remaining.length));
  check("delete removed the newest", remaining[0].querySelector("p").textContent === "First note");
  const log = JSON.parse(window.localStorage.getItem("leadloop_debrief_log_v1"));
  check("delete persisted", log.length === 1 && log[0].notes === "First note");
}

// --- Log: pre-existing entries render on load ---
{
  const log = JSON.stringify([{ cat: "ambiguity", notes: "Define the problem first.", ts: "2026-09-19T00:00:00Z" }]);
  const { document } = loadPage({ log });
  check("stored entries render on load", document.querySelectorAll("#entries .entry").length === 1);
  check("stored entry category label", /Ambiguity/.test(document.querySelector("#entries .entry").textContent));
}

// --- Log: XSS-safe rendering ---
{
  const { document, window } = loadPage();
  document.getElementById("l-cat").value = "general";
  document.getElementById("l-notes").value = "<img src=x onerror=alert(1)>";
  document.getElementById("log-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  check("note HTML is escaped, not injected", document.querySelectorAll("#entries img").length === 0);
  check("note text preserved literally", /<img src=x/.test(document.querySelector("#entries .entry p").textContent));
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
  const labeled = ["l-cat", "l-notes"].every(id => !!document.querySelector(`label[for="${id}"]`));
  check("log fields have labels", labeled);
  check("log error region has role=alert", document.getElementById("l-err").getAttribute("role") === "alert");
  check("gate error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  check("entries region has aria-live", document.getElementById("entries").getAttribute("aria-live") === "polite");
  check("DRAFT banner has role=note", document.getElementById("draft-banner").getAttribute("role") === "note");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
}

console.log(`\nF8 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
