// SEO + page-quality audit for the LeadLoop static site.
// Runs with plain node (no dependencies), from the repo root:
//   node scripts/seo-audit.js
// Checks, for every root *.html (excluding Google verification files):
//   title present and <=60 chars; meta description 50-160 chars;
//   absolute https canonical; exactly one h1; og:title present;
//   all JSON-LD blocks parse; at least one JSON-LD block;
//   every internal link resolves to an existing repo file.
// Also checks sitemap.xml: looks like XML, and lists every root HTML page,
// and every listed <loc> resolves to an existing file.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://aashithk.github.io/leadloop/";

let failed = 0;
const fail = (m) => { failed++; console.log("  FAIL " + m); };
const ok = (m) => console.log("  PASS " + m);

const pages = fs.readdirSync(ROOT)
  .filter((f) => f.endsWith(".html") && !f.startsWith("google"))
  .sort();
if (pages.length === 0) fail("no root HTML pages found");

// --- sitemap ---
let locs = [];
try {
  const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").trim();
  if (!sm.startsWith("<?xml") || !sm.includes("<urlset")) {
    fail("sitemap.xml does not look like a valid sitemap");
  } else {
    locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    if (locs.length === 0) fail("sitemap.xml contains no <loc> entries");
    else ok("sitemap.xml parses with " + locs.length + " URL(s)");
  }
} catch (e) {
  fail("sitemap.xml missing or unreadable: " + e.message);
}

const resolveInternal = (page, href) => {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  let rel;
  if (href.startsWith(SITE_ORIGIN)) {
    rel = href.slice(SITE_ORIGIN.length).split("#")[0].split("?")[0] || "index.html";
  } else if (href.startsWith("/")) {
    rel = href.replace(/^\/(leadloop\/)?/, "").split("#")[0].split("?")[0] || "index.html";
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return null; // other external scheme
  } else {
    rel = href.split("#")[0].split("?")[0];
  }
  const p = path.normalize(path.join(ROOT, rel));
  return p.startsWith(ROOT + path.sep) ? p : null;
};

for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");

  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!t) fail(`${page}: missing <title>`);
  else if (t[1].trim().length === 0 || t[1].trim().length > 60)
    fail(`${page}: title is ${t[1].trim().length} chars (need 1-60)`);
  else ok(`${page}: title ok (${t[1].trim().length} chars)`);

  const d = html.match(/<meta\s[^>]*name="description"[^>]*>/i);
  const dc = d ? d[0].match(/content="([^"]*)"/i) : null;
  if (!dc) fail(`${page}: missing meta description`);
  else if (dc[1].length < 50 || dc[1].length > 160)
    fail(`${page}: meta description is ${dc[1].length} chars (need 50-160)`);
  else ok(`${page}: meta description ok (${dc[1].length} chars)`);

  const c = html.match(/<link\s[^>]*rel="canonical"[^>]*>/i);
  const cc = c ? c[0].match(/href="([^"]*)"/i) : null;
  if (!cc) fail(`${page}: missing canonical`);
  else if (!cc[1].startsWith("https://")) fail(`${page}: canonical not absolute https: ${cc[1]}`);
  else ok(`${page}: canonical ok`);

  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1 !== 1) fail(`${page}: found ${h1} <h1> tags (need exactly 1)`);
  else ok(`${page}: exactly one h1`);

  if (!/property="og:title"/i.test(html)) fail(`${page}: missing og:title`);
  else ok(`${page}: og:title present`);

  const lds = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (lds.length === 0) fail(`${page}: no JSON-LD blocks`);
  else {
    let bad = 0;
    for (const m of lds) { try { JSON.parse(m[1]); } catch (e) { bad++; } }
    if (bad) fail(`${page}: ${bad} invalid JSON-LD block(s)`);
    else ok(`${page}: ${lds.length} JSON-LD block(s) valid`);
  }

  const bad = [];
  for (const m of html.matchAll(/<(?:a|link)[^>]*?href="([^"]*)"/gi)) {
    const p = resolveInternal(page, m[1]);
    if (p === null) continue;
    if (!fs.existsSync(p)) bad.push(m[1]);
  }
  if (bad.length) fail(`${page}: broken internal links: ${[...new Set(bad)].join(", ")}`);
  else ok(`${page}: internal links resolve`);

  const expected = SITE_ORIGIN + (page === "index.html" ? "" : page);
  if (!locs.includes(expected)) fail(`sitemap.xml missing entry for ${expected}`);
  else ok(`${page}: sitemap entry present`);
}

for (const loc of locs) {
  if (!loc.startsWith(SITE_ORIGIN)) { fail(`sitemap <loc> outside site: ${loc}`); continue; }
  const rel = loc.slice(SITE_ORIGIN.length) || "index.html";
  if (!fs.existsSync(path.join(ROOT, rel))) fail(`sitemap <loc> has no file: ${loc}`);
}

console.log(failed ? `\nseo-audit: ${failed} FAILURE(S)` : "\nseo-audit: all green");
process.exit(failed ? 1 : 0);
