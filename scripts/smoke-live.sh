#!/usr/bin/env bash
# Post-deploy live smoke test for the LeadLoop site.
# Polls the live GitHub Pages site (up to ~6 minutes for the Pages rebuild),
# then fetches live sitemap.xml, derives every page URL, and asserts each
# returns HTTP 200 plus the homepage contains the id="toolkit" marker.
# This is the "make sure a push hasn't broken something" gate.
set -u
SITE="https://aashithk.github.io/leadloop"

echo "== waiting for GitHub Pages deploy"
sleep 90
ok=0
for i in $(seq 1 12); do
  code=$(curl -s -o /tmp/smoke-home.html -w "%{http_code}" "$SITE/" 2>/dev/null || true)
  if [ "$code" = "200" ] && grep -q 'id="toolkit"' /tmp/smoke-home.html 2>/dev/null; then
    ok=1
    break
  fi
  echo "attempt $i: homepage not ready (http=$code); retrying in 20s"
  sleep 20
done
if [ "$ok" -ne 1 ]; then
  echo "FAIL: homepage never returned HTTP 200 with the toolkit marker"
  exit 1
fi
echo "PASS homepage live with toolkit marker"

echo "== fetching live sitemap"
if ! curl -s --fail "$SITE/sitemap.xml" -o /tmp/smoke-sitemap.xml; then
  echo "FAIL: live sitemap.xml not fetchable"
  exit 1
fi

fail=0
urls=$(grep -o '<loc>[^<]*</loc>' /tmp/smoke-sitemap.xml | sed 's/<[^>]*>//g')
if [ -z "$urls" ]; then
  echo "FAIL: no URLs found in live sitemap"
  exit 1
fi
for u in $urls; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$u" 2>/dev/null || true)
  if [ "$code" = "200" ]; then
    echo "PASS 200 $u"
  else
    echo "FAIL $code $u"
    fail=1
  fi
done
if [ "$fail" -ne 0 ]; then
  echo "smoke: FAILURES"
  exit 1
fi
echo "smoke: all live sitemap URLs return 200"
