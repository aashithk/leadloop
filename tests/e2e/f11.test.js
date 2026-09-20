// E2E tests for F11: Staff Behavioral Flashcards page.
// Run: node f11.test.js  (from the e2e/ dir; expects ../site/ layout)
// Feature-specific: deck state machine unit tests (flip/prev/next wrap,
// shuffle permutation + reset), DOM flip via click and button, keyboard
// (arrows/space/enter/S), progress text, aria-live announcements,
// reduced-motion CSS, gated Markdown download, print, practice-only
// disclaimer + banned-claim scan.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..", "..");
const PAGE = "staff-behavioral-flashcards.html";
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
function click(el, window) {
  el.dispatchEvent(new window.Event("click", { bubbles: true }));
}
function key(targetWindow, document, key, target) {
  const ev = new targetWindow.KeyboardEvent("keydown", { key, bubbles: true });
  (target || document).dispatchEvent(ev);
}
function submitGate(document, window, name, email) {
  document.getElementById("g-name").value = name;
  document.getElementById("g-email").value = email;
  document.getElementById("gate-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }));
}

console.log("F11 e2e: " + PAGE);

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
  check("disclaimer denies real company questions", /not real questions from any company/i.test(body));
  const hits = BANNED.filter(re => re.test(body));
  check("no invented claims", hits.length === 0, hits.map(String).join(" | ").slice(0, 200));
}

// --- Deck state machine unit tests ---
{
  const { window } = loadPage();
  const cards = [{ q: "a" }, { q: "b" }, { q: "c" }];
  const d = window.LeadLoop.makeDeck(cards);
  check("12 cards in the real deck", window.LeadLoop.CARDS.length === 12,
    String(window.LeadLoop.CARDS.length));
  check("every card has q/probe/tip",
    window.LeadLoop.CARDS.every(c => c.q && c.probe && c.tip));
  let s = d.state();
  check("starts at index 0, unflipped", s.index === 0 && s.flipped === false);
  d.flip();
  check("flip toggles flipped", d.state().flipped === true);
  d.flip();
  check("flip toggles back", d.state().flipped === false);
  d.next();
  check("next advances", d.state().index === 1);
  check("navigation unflips", d.state().flipped === false);
  d.next(); d.next();
  check("next wraps to 0", d.state().index === 0, String(d.state().index));
  d.prev();
  check("prev wraps to last", d.state().index === 2, String(d.state().index));
  d.prev();
  check("prev goes back", d.state().index === 1);
  const before = d.state().order.join(",");
  d.shuffle();
  const after = d.state().order;
  check("shuffle preserves the full set", after.slice().sort().join(",") === before.split(",").sort().join(","),
    after.join(","));
  check("shuffle resets to index 0", d.state().index === 0);
  check("shuffle unflips", d.state().flipped === false);
}

// --- DOM: initial render ---
{
  const { document } = loadPage();
  check("front shows first prompt", /disagreed with your manager/i.test(document.getElementById("card-front").textContent),
    document.getElementById("card-front").textContent.slice(0, 60));
  check("card not flipped initially", !document.getElementById("fcard").classList.contains("flipped"));
  check("progress reads Card 1 of 12", document.getElementById("progress").textContent === "Card 1 of 12");
  check("card has role=button", document.getElementById("fcard").getAttribute("role") === "button");
  check("card is keyboard-focusable", document.getElementById("fcard").getAttribute("tabindex") === "0");
}

// --- DOM: flip via button and via card click ---
{
  const { document, window } = loadPage();
  click(document.getElementById("btn-flip"), window);
  check("flip button flips the card", document.getElementById("fcard").classList.contains("flipped"));
  check("back shows probe text", /Probes:/.test(document.getElementById("card-probe").textContent));
  check("back shows tip text", /Tip:/.test(document.getElementById("card-tip").textContent));
  check("aria-live announces the back", /Probes:/.test(document.getElementById("card-sr").textContent));
  click(document.getElementById("fcard"), window);
  check("clicking card flips back", !document.getElementById("fcard").classList.contains("flipped"));
  check("aria-live announces the front", /disagreed with your manager/i.test(document.getElementById("card-sr").textContent));
}

// --- DOM: prev/next buttons ---
{
  const { document, window } = loadPage();
  click(document.getElementById("btn-next"), window);
  check("next shows card 2", /influenced a team/i.test(document.getElementById("card-front").textContent) ||
    document.getElementById("progress").textContent === "Card 2 of 12",
    document.getElementById("progress").textContent);
  check("progress updates", document.getElementById("progress").textContent === "Card 2 of 12");
  click(document.getElementById("btn-prev"), window);
  check("prev returns to card 1", document.getElementById("progress").textContent === "Card 1 of 12");
  click(document.getElementById("btn-prev"), window);
  check("prev wraps to card 12", document.getElementById("progress").textContent === "Card 12 of 12",
    document.getElementById("progress").textContent);
}

// --- DOM: shuffle button ---
{
  const { document, window } = loadPage();
  click(document.getElementById("btn-next"), window);
  click(document.getElementById("btn-shuffle"), window);
  check("shuffle resets to card 1", document.getElementById("progress").textContent === "Card 1 of 12");
}

// --- DOM: keyboard behavior ---
{
  const { document, window } = loadPage();
  key(window, document, "ArrowRight", document);
  check("ArrowRight advances", document.getElementById("progress").textContent === "Card 2 of 12");
  key(window, document, "ArrowLeft", document);
  check("ArrowLeft goes back", document.getElementById("progress").textContent === "Card 1 of 12");
  key(window, document, " ", document.getElementById("fcard"));
  check("Space on card flips", document.getElementById("fcard").classList.contains("flipped"));
  key(window, document, "Enter", document.getElementById("fcard"));
  check("Enter on card flips back", !document.getElementById("fcard").classList.contains("flipped"));
  key(window, document, "s", document.body);
  check("S shuffles (resets to card 1)", document.getElementById("progress").textContent === "Card 1 of 12");
}
{
  // typing in an input must not trigger shortcuts
  const { document, window } = loadPage();
  const input = document.getElementById("g-email");
  key(window, document, "ArrowRight", input);
  check("shortcuts ignored inside inputs", document.getElementById("progress").textContent === "Card 1 of 12");
}

// --- Reduced motion ---
{
  const { document } = loadPage();
  const css = [...document.querySelectorAll("style")].some(s =>
    s.textContent.includes("prefers-reduced-motion") && s.textContent.includes("transition:none"));
  check("reduced-motion disables flip animation", css);
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

  submitGate(document, window, "Mei", "mei2@example.com");
  check("valid email clears error", document.getElementById("g-err").textContent === "");
  check("valid email unlocks download", document.getElementById("dl-ready").hidden === false);
  check("lock note hidden after unlock", document.getElementById("dl-locked").style.display === "none");
  check("gate hidden after unlock", document.getElementById("gate-wrap").hidden === true);
  let rows = [];
  try { rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1")); } catch (e) {}
  check("signup row stored with source=staff-behavioral-flashcards",
    rows.length === 1 && rows[0].source === "staff-behavioral-flashcards", JSON.stringify(rows));
  submitGate(document, window, "Mei", "MEI2@example.com");
  rows = JSON.parse(window.localStorage.getItem("leadloop_signups_v1"));
  check("duplicate email (case-insensitive) not stored twice", rows.length === 1);
}

// --- Download: markdown content + filename ---
{
  const storage = JSON.stringify([{ name: "M", email: "m2@example.com", ts: "2026-09-20T00:00:00Z", source: "staff-behavioral-flashcards" }]);
  const { document, window } = loadPage({ storage });
  const md = window.LeadLoop.markdown();
  check("markdown covers all 12 cards", (md.match(/^## Card /gm) || []).length === 12,
    String((md.match(/^## Card /gm) || []).length));
  check("markdown has probe + tip per card", /Probes:/.test(md) && /\*\*Tip:\*\*/.test(md));
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
  check("download filename correct", clicked && clicked.download === "leadloop-behavioral-flashcards.md",
    JSON.stringify(clicked));
  check("download blob is markdown", createdUrl && createdUrl.type === "text/markdown");
  window.URL.createObjectURL = origCreate;
  document.createElement = origCreateEl;
}

// --- Returning visitor: download unlocked on load ---
{
  const storage = JSON.stringify([{ name: "Z", email: "z@example.com", ts: "2026-09-20T00:00:00Z", source: "system-design-timer" }]);
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
  check("card sr announcer has aria-live", document.getElementById("card-sr").getAttribute("aria-live") === "polite");
  check("gate error region has role=alert", document.getElementById("g-err").getAttribute("role") === "alert");
  const btns = [...document.querySelectorAll("button")].filter(b => !b.textContent.trim());
  check("all buttons have discernible text", btns.length === 0);
  const focusCss = [...document.querySelectorAll("style")].some(s => s.textContent.includes(":focus-visible"));
  check("visible focus styles defined", focusCss);
}

console.log(`\nF11 result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
