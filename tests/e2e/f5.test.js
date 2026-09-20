// E2E tests for F5: STAR-L Story Builder page.
// Run: node f5.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: five-field builder, live word counts, fictional example
// loader/clear, gated story output (preview + copy + Markdown download +
// print), markdown section coverage.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "star-l-story-builder.html";
const BASE = "https://aashithk.github.io/leadloop/";
const FIELDS = ["situation", "task", "action", "result", "lessons"];
const BANNED = [
  /testimonial/i, /success rate/i, /promoted in \d+\s*(week|month)/i,
  /at google,? (the )?committees?/i, /google'?s hiring committee/i,
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

function setField(document, window, id, text) {
  const ta = document.getElementById("f-" + id);
  ta.value = text;
  ta.dispatchEvent(new window.Event("input", { bubbles: true }));
}
function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}
const STORY = {
  situation: "Checkout timed out at peak; on-call was drowning in pages.",
  task: "I owned checkout; stop the bleeding without pausing features.",
  action: "I traced a table lock, wrote a one-pager with three options, pre-wired two skeptical leads, and led a two-week migration.",
  result: "Timeouts zero; p99 down 40%; runbook still used.",
  lessons: "The proposal doc did more work than the code — consult before deciding."
};

console.log("F5 e2e: " + PAGE);

// --- SEO / document hygiene ---
{
  const { document, errors } = loadPage();
  check("no JS errors on load", errors.length === 0, errors[0]);
  const title = document.querySelector("title").textContent;
  check("title present and <=60 chars", title.length > 0 && title.length <= 60, title);
  check("title mentions STAR-L", /star-l/i.test(title), title);
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

// --- Honesty ---
{
  const { document } = loadPage();
  const body = document.body.textContent;
  const hits = BANNED.filter(re => re.test(body));
  check("no invented testimonials/stats/committee claims", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
  check("example marked fictional", /fictional/i.test(body));
  check("no employer endorsement implied", !/(endorsed|sponsored) by (google|meta)/i.test(body));
}

// --- Builder structure ---
{
  const { document } = loadPage();
  FIELDS.forEach(f => check("textarea exists for " + f, !!document.getElementById("f-" + f)));
  FIELDS.forEach(f => {
    const lbl = document.querySelector(`label[for="f-${f}"]`);
    check("label exists for " + f, !!lbl && lbl.textContent.trim().length > 3);
  });
  FIELDS.forEach(f => check("word-count region exists for " + f, !!document.getElementById("w-" + f)));
  check("example loader button exists", !!document.getElementById("btn-example"));
  check("clear button exists", !!document.getElementById("btn-clear"));
  check("story output hidden for fresh visitor", document.getElementById("story-output").hidden === true);
  check("gate visible for fresh visitor", document.getElementById("gate-wrap").style.display !== "none");
}

// --- Live word counts ---
{
  const { document, window } = loadPage();
  setField(document, window, "action", "one two three four");
  check("word count updates on input", document.getElementById("w-action").textContent === "4 words",
    document.getElementById("w-action").textContent);
  setField(document, window, "action", "one");
  check("singular word count grammar", document.getElementById("w-action").textContent === "1 word",
    document.getElementById("w-action").textContent);
  setField(document, window, "action", "");
  check("empty field shows 0 words", document.getElementById("w-action").textContent === "0 words");
}

// --- Example loader + clear ---
{
  const { document, window } = loadPage();
  document.getElementById("btn-example").dispatchEvent(new window.Event("click", { bubbles: true }));
  const allFilled = FIELDS.every(f => document.getElementById("f-" + f).value.length > 20);
  check("example loader fills all five fields", allFilled);
  check("example is labelled fictional", FIELDS.every(f => /fictional/i.test(document.getElementById("f-" + f).value)));
  const wc = document.getElementById("w-result").textContent;
  check("example updates word counts", !/^0 words$/.test(wc), wc);
  document.getElementById("btn-clear").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("clear empties all fields", FIELDS.every(f => document.getElementById("f-" + f).value === ""));
  check("clear resets word counts", document.getElementById("w-action").textContent === "0 words");
}

// --- Gate flow ---
{
  const { document, window } = loadPage();
  submitGate(document, window, "Bad", "nope@@");
  check("invalid email shows error", document.getElementById("g-err").textContent.length > 0);
  check("invalid email keeps output hidden", document.getElementById("story-output").hidden === true);
  check("invalid email stores nothing", window.localStorage.getItem("leadloop_signups_v1") === null);

  submitGate(document, window, "Arjun", "arjun@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email reveals story output", document.getElementById("story-output").hidden === false);
  check("gate hidden after unlock", document.getElementById("gate-wrap").style.display === "none");
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=star-l-story-builder",
    rows.length === 1 && rows[0].email === "arjun@example.com" && rows[0].source === "star-l-story-builder",
    JSON.stringify(rows));
  submitGate(document, window, "Arjun", "ARJUN@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Returning visitor ---
{
  const storage = JSON.stringify([{ name: "S", email: "s@example.com", ts: "2026-09-20T00:00:00Z", source: "xfn-conflict-resolver" }]);
  const { document } = loadPage({ storage });
  check("returning visitor sees story output", document.getElementById("story-output").hidden === false);
  check("returning visitor skips gate", document.getElementById("gate-wrap").style.display === "none");
}

// --- Story preview renders user content ---
{
  const { document, window } = loadPage();
  submitGate(document, window, "Priya", "priya@example.com");
  FIELDS.forEach(f => setField(document, window, f, STORY[f]));
  const preview = document.getElementById("story-preview");
  FIELDS.forEach(f => check("preview renders " + f + " content", preview.textContent.includes(STORY[f].slice(0, 20))));
  const heads = [...preview.querySelectorAll("h3")].map(h => h.textContent);
  check("preview has all five section headings",
    ["Situation","Task","Action","Result","Leadership lessons"].every(h => heads.includes(h)), heads.join(","));
  check("preview uses safe text insertion (no script injection)", !preview.querySelector("script"));
}

// --- Markdown generator ---
{
  const { document, window } = loadPage();
  const gen = window.LeadLoop && window.LeadLoop.starLMarkdown;
  check("starLMarkdown exposed for testing", typeof gen === "function");
  FIELDS.forEach(f => setField(document, window, f, STORY[f]));
  const md = gen();
  const labels = ["## Situation","## Task","## Action","## Result","## Leadership lessons"];
  check("markdown contains all five section headers", labels.every(l => md.includes(l)));
  check("markdown contains user content", md.includes(STORY.action.slice(0, 25)));
  check("markdown ends with LeadLoop attribution", md.includes("star-l-story-builder.html"));
  check("empty fields render placeholder not invented text", (() => {
    setField(document, window, "result", "");
    return gen().includes("[Not filled in yet]");
  })());
}

// --- Download flow ---
{
  const { document, window } = loadPage({ stubCreateObjectURL: true });
  submitGate(document, window, "Rahul", "rahul@example.com");
  document.getElementById("btn-download-story").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("download created exactly one object URL", window.__createdUrls.length === 1);
  const entry = window.__createdUrls[0];
  check("download blob is text/markdown", entry.blob.type.indexOf("text/markdown") === 0, entry.blob.type);
  const anchors = [...document.querySelectorAll('a[download="my-star-l-story.md"]')];
  check("download anchor has correct filename", anchors.length >= 1);
  check("download status message shown", document.getElementById("story-status").textContent.length > 0);
}

// --- Copy flow ---
{
  const { document, window } = loadPage({ stubExecCommand: true });
  submitGate(document, window, "Sara", "sara@example.com");
  document.getElementById("btn-copy-story").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("copy sets success status", /copied/i.test(document.getElementById("story-status").textContent),
    document.getElementById("story-status").textContent);
}
{
  const { document, window } = loadPage();
  window.document.execCommand = () => { throw new Error("denied"); };
  submitGate(document, window, "Mei", "mei@example.com");
  document.getElementById("btn-copy-story").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("blocked copy shows fallback guidance",
    /blocked|Download as Markdown/i.test(document.getElementById("story-status").textContent),
    document.getElementById("story-status").textContent);
}

// --- Print flow ---
{
  const { document, window } = loadPage({ stubPrint: true });
  submitGate(document, window, "P", "p@example.com");
  document.getElementById("btn-print-story").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("print button calls window.print", window.__printed === 1);
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
}

// --- Accessibility basics ---
{
  const { document } = loadPage();
  const imgs = [...document.querySelectorAll("img")].filter(i => !i.getAttribute("alt"));
  check("all images have alt text", imgs.length === 0);
  const areas = [...document.querySelectorAll("textarea")].filter(t =>
    !t.getAttribute("aria-label") && !document.querySelector(`label[for="${t.id}"]`));
  check("all textareas labelled", areas.length === 0);
  const inputs = [...document.querySelectorAll("input")].filter(i =>
    !i.getAttribute("aria-label") && !document.querySelector(`label[for="${i.id}"]`));
  check("all inputs labelled", inputs.length === 0);
  check("error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  check("preview region has aria-live", document.getElementById("story-preview").getAttribute("aria-live") === "polite");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
}

console.log(`\nF5 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
