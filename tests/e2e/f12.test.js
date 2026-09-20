// E2E tests for F12: Scale & Optimization Cheat Sheet page.
// Run: node f12.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: approximate labeling (banner + every value cell carries
// ≈ and an "approx" tag), three reference tables, live row filter with
// count + no-results, gated Markdown download (filename, blob, markdown
// keeps ≈), print, banned-claim scan (no precise-figure language).
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "scale-optimization-cheat-sheet.html";
const BASE = "https://aashithk.github.io/leadloop/";
const BANNED = [
  /testimonial/i, /success rate/i, /promoted in \d+\s*(week|month)/i,
  /you will be (promoted|hired)/i, /guarantee/i,
  /exact figures?/i, /precise numbers?/i, /benchmarked at/i,
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
function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F12 e2e: " + PAGE);

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

// --- Approximate labeling: banner + every value ---
{
  const { document, window } = loadPage();
  const banner = document.getElementById("approx-banner");
  check("approx banner exists", !!banner);
  check("banner states every number is approximate",
    /Every number on this page is approximate/i.test(banner.textContent));
  check("banner advises verifying against own benchmarks",
    /verify against your own benchmarks/i.test(banner.textContent));
  check("orders-of-magnitude disclaimer present", /Orders of magnitude, not specifications/i.test(document.body.textContent));
  check("disclaimer warns against precise quoting", /never be quoted as precise figures/i.test(document.body.textContent));
  const vals = [...document.querySelectorAll("td.val")];
  check("value cells exist", vals.length === window.LeadLoop.totalRows, vals.length + " vs " + window.LeadLoop.totalRows);
  check("every value cell starts with ≈", vals.every(td => td.textContent.trim().startsWith("≈")),
    vals.filter(td => !td.textContent.trim().startsWith("≈")).map(td => td.textContent).join(" | "));
  check("every value cell carries an approx tag",
    vals.every(td => td.querySelector(".approx-tag") && /approx/i.test(td.querySelector(".approx-tag").textContent)));
  const hits = BANNED.filter(re => re.test(document.body.textContent));
  check("no precise-figure / guarantee language", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
}

// --- Table structure ---
{
  const { document, window } = loadPage();
  check("3 tables defined", window.LeadLoop.TABLES.length === 3);
  const heads = [...document.querySelectorAll("#tables h3")].map(h => h.textContent);
  check("tables are latency/storage/throughput",
    /latency/i.test(heads[0]) && /storage/i.test(heads[1]) && /throughput/i.test(heads[2]),
    heads.join(" | "));
  check("3 tables rendered", document.querySelectorAll("#tables table").length === 3);
  check("every table has scope=col headers",
    [...document.querySelectorAll("#tables th")].every(th => th.getAttribute("scope") === "col"));
  check("count shows all rows", document.getElementById("count").textContent === window.LeadLoop.totalRows + " of " + window.LeadLoop.totalRows + " rows",
    document.getElementById("count").textContent);
}

// --- Row filter ---
{
  const { document, window } = loadPage();
  const total = window.LeadLoop.totalRows;
  setSearch(document, window, "SSD");
  const n = document.querySelectorAll("#tables tbody tr").length;
  check("filter 'SSD' narrows rows", n > 0 && n < total, String(n));
  check("count updates with filter", document.getElementById("count").textContent === n + " of " + total + " rows",
    document.getElementById("count").textContent);
  check("filter matches value cells too",
    [...document.querySelectorAll("#tables tbody tr")].every(tr => /ssd/i.test(tr.textContent)));
  setSearch(document, window, "NETWORK");
  check("filter is case-insensitive", document.querySelectorAll("#tables tbody tr").length > 0);
  setSearch(document, window, "");
  check("clearing filter restores all rows", document.querySelectorAll("#tables tbody tr").length === total);
}
{
  const { document, window } = loadPage();
  setSearch(document, window, "zzz-no-such-row");
  check("no-results state shown", /No rows match/i.test(document.getElementById("tables").textContent));
  check("count shows 0 on no-results",
    document.getElementById("count").textContent === "0 of " + window.LeadLoop.totalRows + " rows");
}

// --- Download gated until signup ---
{
  const { document, window } = loadPage();
  check("download hidden before signup", document.getElementById("dl-ready").hidden === true);
  check("lock note visible", document.getElementById("dl-locked").style.display !== "none");
  check("gate visible before signup", document.getElementById("gate-wrap").hidden === false);

  submitGate(document, window, "Nope", "bad");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps download locked", document.getElementById("dl-ready").hidden === true);
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Arjun", "arjun2@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks download", document.getElementById("dl-ready").hidden === false);
  check("lock note hidden after unlock", document.getElementById("dl-locked").style.display === "none");
  check("gate hidden after unlock", document.getElementById("gate-wrap").hidden === true);
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=scale-optimization-cheat-sheet",
    rows.length === 1 && rows[0].source === "scale-optimization-cheat-sheet", JSON.stringify(rows));
  submitGate(document, window, "Arjun", "ARJUN2@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Download: markdown content + filename ---
{
  const storage = JSON.stringify([{ name: "A", email: "a2@example.com", ts: "2026-09-20T00:00:00Z", source: "scale-optimization-cheat-sheet" }]);
  const { document, window } = loadPage({ storage });
  const md = window.LeadLoop.markdown();
  const bullets = (md.match(/^- \*\*/gm) || []).length;
  check("markdown covers all rows", bullets === window.LeadLoop.totalRows, String(bullets));
  check("markdown keeps ≈ on values", /≈/.test(md));
  check("markdown carries approximate notice", /approximate/i.test(md));
  check("markdown has all three table headings", /Latency/.test(md) && /Storage/.test(md) && /Throughput/.test(md));
  let clicked = null, createdUrl = null;
  const origCreate = window.URL.createObjectURL;
  window.URL.createObjectURL = blob => { createdUrl = blob; return "blob:fake"; };
  window.URL.revokeObjectURL = () => {};
  const origCreateEl = document.createElement.bind(document);
  document.createElement = tag => {
    const el = origCreateEl(tag);
    if (tag === "a") {
      const origClick = el.click.bind(el);
      el.click = () => { clicked = { download: el.getAttribute("download") }; origClick(); };
    }
    return el;
  };
  document.getElementById("btn-download").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("download filename correct", clicked && clicked.download === "leadloop-scale-cheat-sheet.md",
    JSON.stringify(clicked));
  check("download blob is markdown", createdUrl && createdUrl.type === "text/markdown");
  window.URL.createObjectURL = origCreate;
  document.createElement = origCreateEl;
}

// --- Returning visitor: download unlocked on load ---
{
  const storage = JSON.stringify([{ name: "Y", email: "y@example.com", ts: "2026-09-20T00:00:00Z", source: "ai-architecture-prompts" }]);
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
  const css = [...document.querySelectorAll("style")].map(s => s.textContent).join("\n");
  check("print CSS hides chrome", css.includes("@media print") && css.includes(".no-print"));
  check("print CSS compacts tables", /@media print[\s\S]{0,800}table\{font-size:.82rem/.test(css));
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
  check("search input labelled", !!document.querySelector('label[for="f-search"]'));
  check("gate error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  check("count region has aria-live", document.getElementById("count").getAttribute("aria-live") === "polite");
  check("approx banner has role=note", document.getElementById("approx-banner").getAttribute("role") === "note");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
}

console.log(`\nF12 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
