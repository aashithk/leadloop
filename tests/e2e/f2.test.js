// E2E tests for F2: Staff Promo Doc Skeleton page.
// Run: node f2.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: Markdown generation, Blob download, clipboard copy fallback,
// printable template sections, career-break callout, email gate.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "staff-promo-doc-skeleton.html";
const BASE = "https://aashithk.github.io/leadloop/";
const SECTIONS = [
  "Executive summary", "Business impact", "Scope of influence", "Technical depth",
  "Leadership & mentorship", "Multi-team evidence", "Peer feedback themes",
  "Growth areas & next cycle"
];

let passed = 0, failed = 0;
const asyncChecks = [];
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
      if (opts.stubCreateObjectURL) {
        w.__createdUrls = [];
        w.URL.createObjectURL = (blob) => {
          const u = "blob:mock-" + w.__createdUrls.length;
          w.__createdUrls.push({ url: u, blob });
          return u;
        };
        w.URL.revokeObjectURL = () => {};
      }
      if (opts.stubExecCommand) w.document.execCommand = () => true;
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

console.log("F2 e2e: " + PAGE);

// --- SEO / document hygiene ---
{
  const { document, errors } = loadPage();
  check("no JS errors on load", errors.length === 0, errors[0]);
  const title = document.querySelector("title").textContent;
  check("title present and <=60 chars", title.length > 0 && title.length <= 60, title);
  check("title mentions promo doc", /promo/i.test(title), title);
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
  const crumbs = [...document.querySelectorAll(".crumbs a")].map(a => a.textContent.trim());
  check("breadcrumb nav links Home + toolkit", crumbs.includes("Home") && crumbs.some(c => /toolkit/i.test(c)), crumbs.join(" | "));
  const ogUrl = document.querySelector('meta[property="og:url"]').getAttribute("content");
  check("og:url matches canonical", ogUrl === canon, ogUrl);
}

// --- Markdown generator: structure + honesty ---
{
  const { window } = loadPage();
  const gen = window.LeadLoop && window.LeadLoop.promoDocMarkdown;
  check("promoDocMarkdown exposed for testing", typeof gen === "function");
  const md = gen();
  check("markdown is a long non-empty string", typeof md === "string" && md.length > 1500, String(md && md.length));
  const missing = SECTIONS.filter(s => !md.includes(s));
  check("markdown contains all 8 section headers", missing.length === 0, "missing: " + missing.join(", "));
  check("markdown uses fill-in placeholders", md.includes("[Your name]"), "no [Your name] placeholder");
  check("markdown has zero invented testimonials/stats",
    !/testimonial|success rate|promoted in \d+\s*(week|month)/i.test(md));
  check("markdown ends with LeadLoop attribution", md.includes("staff-promo-doc-skeleton.html"));
}

// --- Printable HTML template mirrors the markdown sections ---
{
  const { document } = loadPage();
  const printArea = document.getElementById("packet-print").textContent;
  const missing = SECTIONS.filter(s => !printArea.includes(s));
  check("printable view contains all sections", missing.length === 0, "missing: " + missing.join(", "));
  check("printable view has >=9 fill-in placeholder markers",
    document.querySelectorAll("#packet-print .ph").length >= 9,
    String(document.querySelectorAll("#packet-print .ph").length));
  check("career-break callout present (P5 Sara)", /career break/i.test(document.body.textContent));
  check("multi-team denominator language present", /denominator|cross|multi-team/i.test(printArea));
  check("say-it-like-this examples present",
    document.querySelectorAll("#packet-print .sayit").length >= 5,
    String(document.querySelectorAll("#packet-print .sayit").length));
}

// --- Gate flow: fresh visitor ---
{
  const { window, document } = loadPage();
  check("packet hidden for fresh visitor", document.getElementById("packet-full").hidden === true);
  check("gate form visible for fresh visitor",
    document.getElementById("gate-wrap").style.display !== "none");
  check("download/copy/print buttons exist",
    !!document.getElementById("btn-download-md") &&
    !!document.getElementById("btn-copy-md") &&
    !!document.getElementById("btn-print-packet"));

  submitGate(document, window, "Test", "bad@@x");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps packet locked", document.getElementById("packet-full").hidden === true);
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Priya", "priya@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks packet", document.getElementById("packet-full").hidden === false);
  check("gate hidden after unlock", document.getElementById("gate-wrap").style.display === "none");
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=promo-doc-skeleton",
    rows.length === 1 && rows[0].email === "priya@example.com" && rows[0].source === "promo-doc-skeleton",
    JSON.stringify(rows));

  submitGate(document, window, "Priya", "PRIYA@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Gate flow: returning visitor ---
{
  const storage = JSON.stringify([{ name: "R", email: "r@example.com", ts: "2026-09-20T00:00:00Z", source: "pitch-sheet" }]);
  const { document } = loadPage({ storage });
  check("returning visitor sees packet unlocked", document.getElementById("packet-full").hidden === false);
  check("returning visitor skips gate", document.getElementById("gate-wrap").style.display === "none");
}

// --- Download flow: Blob + anchor attributes ---
{
  const { window, document } = loadPage({ stubCreateObjectURL: true });
  submitGate(document, window, "Rahul", "rahul@example.com");
  document.getElementById("btn-download-md").dispatchEvent(
    new window.Event("click", { bubbles: true }));
  check("download created exactly one object URL", window.__createdUrls.length === 1);
  const entry = window.__createdUrls[0];
  check("download blob is text/markdown", entry.blob.type.indexOf("text/markdown") === 0, entry.blob.type);
  check("download blob is non-trivial", entry.blob.size > 1000, String(entry.blob.size));
  const anchors = [...document.querySelectorAll('a[download="staff-promo-doc-skeleton.md"]')];
  check("download anchor has correct filename", anchors.length >= 1, "anchors: " + anchors.length);
  check("download status message shown",
    document.getElementById("md-status").textContent.length > 0,
    document.getElementById("md-status").textContent);
  const md = window.LeadLoop.promoDocMarkdown();
  if (typeof entry.blob.text === "function") {
    asyncChecks.push(entry.blob.text().then(t => {
      check("downloaded markdown matches generator output", t === md);
    }).catch(() => { check("downloaded markdown readable", false); }));
  }
}

// --- Copy flow: clipboard fallback path ---
{
  const { window, document } = loadPage({ stubExecCommand: true });
  submitGate(document, window, "Mei", "mei@example.com");
  document.getElementById("btn-copy-md").dispatchEvent(
    new window.Event("click", { bubbles: true }));
  check("copy sets a status message",
    document.getElementById("md-status").textContent.length > 0,
    document.getElementById("md-status").textContent);
  check("copy status is success (execCommand stubbed true)",
    /copied/i.test(document.getElementById("md-status").textContent),
    document.getElementById("md-status").textContent);
}

// --- Copy flow: blocked clipboard shows failure guidance ---
{
  const { window, document } = loadPage(); // no execCommand stub -> throws/returns undefined path
  window.document.execCommand = () => { throw new Error("denied"); };
  submitGate(document, window, "Sara", "sara@example.com");
  document.getElementById("btn-copy-md").dispatchEvent(
    new window.Event("click", { bubbles: true }));
  check("blocked copy shows fallback guidance",
    /blocked|Download as Markdown/i.test(document.getElementById("md-status").textContent),
    document.getElementById("md-status").textContent);
}

// --- Print flow ---
{
  const { window, document } = loadPage({ stubPrint: true });
  submitGate(document, window, "Arjun", "arjun@example.com");
  document.getElementById("btn-print-packet").dispatchEvent(
    new window.Event("click", { bubbles: true }));
  check("print button calls window.print", window.__printed === 1);
  const printCss = [...document.querySelectorAll("style")].some(s =>
    s.textContent.includes("@media print") && s.textContent.includes(".no-print"));
  check("print CSS hides chrome, keeps packet", printCss);
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
    else return;
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
  check("error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  check("status region has aria-live", document.getElementById("md-status").getAttribute("aria-live") === "polite");
}

Promise.all(asyncChecks).then(() => {
  console.log(`\nF2 result: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
});
