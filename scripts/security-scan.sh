#!/usr/bin/env bash
# Security scan for the LeadLoop static site. Runs on every push/PR.
# 1. Secret scan across the repo (excluding benchmarks/history.jsonl).
# 2. Inline <script> blocks extracted from HTML and passed through node --check.
# 3. External <script src> / <iframe src> hosts must be in scripts/allowlist.txt
#    (currently empty: the site loads no third-party scripts).
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail=0

echo "== secret scan"
patterns=(
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
  'ghp_[A-Za-z0-9]{20,}'
  'github_pat_[A-Za-z0-9_]{10,}'
  'AKIA[0-9A-Z]{16}'
  'sk_live_[A-Za-z0-9]{10,}'
  '[Aa][Pp][Ii][_-]?[Kk][Ee][Yy]["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{8,}'
  '[Ss][Ee][Cc][Rr][Ee][Tt]["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{8,}'
  '[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{4,}'
  '[Tt][Oo][Kk][Ee][Nn]["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{8,}'
  '(STORE_PASS|KEY_PASS|keystorePassword)[[:space:]]*[:=]'
)
for pat in "${patterns[@]}"; do
  hits=$(grep -rPn --exclude-dir=node_modules --exclude-dir=.git --exclude=history.jsonl "$pat" . 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "  FAIL secret pattern matched: $pat"
    echo "$hits" | head -5
    fail=1
  fi
done
[ "$fail" -eq 0 ] && echo "  PASS no secrets found"

echo "== inline JS syntax check"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
n=0
shopt -s nullglob
for page in ./*.html; do
  case "$page" in ./google*.html) continue;; esac
  python3 - "$page" "$tmpdir" <<'EOF'
import re, sys
page, tmpdir = sys.argv[1], sys.argv[2]
html = open(page, encoding="utf-8").read()
i = 0
for m in re.finditer(r'<script(?![^>]*\bsrc=)(?![^>]*type="application/ld\+json")[^>]*>(.*?)</script>', html, re.S | re.I):
    body = m.group(1).strip()
    if not body:
        continue
    p = f"{tmpdir}/inline_{i}.js"
    open(p, "w", encoding="utf-8").write(body)
    print(p)
    i += 1
EOF
done > "$tmpdir/list.txt" || true
while IFS= read -r js; do
  [ -z "$js" ] && continue
  n=$((n + 1))
  if ! node --check "$js" >/dev/null 2>&1; then
    echo "  FAIL inline JS syntax error in $js"
    node --check "$js" 2>&1 | head -3
    fail=1
  fi
done < "$tmpdir/list.txt"
echo "  checked $n inline script block(s)"
[ "$fail" -eq 0 ] && echo "  PASS all inline JS parses"

echo "== external script/iframe allowlist"
allowed=$(grep -v '^\s*#' scripts/allowlist.txt 2>/dev/null | grep -v '^\s*$' || true)
ext=$(python3 - <<'EOF'
import re, glob
hosts = set()
for page in glob.glob("./*.html"):
    if "/google" in page:
        continue
    html = open(page, encoding="utf-8").read()
    for m in re.finditer(r'<(?:script|iframe)[^>]*\bsrc="(https?://[^"]+)"', html, re.I):
        hosts.add(re.sub(r'^https?://([^/]+).*$', r'\1', m.group(1)).lower())
for h in sorted(hosts):
    print(h)
EOF
)
for host in $ext; do
  if ! printf '%s\n' "$allowed" | grep -qx "$host"; then
    echo "  FAIL external host not in allowlist: $host"
    fail=1
  fi
done
if [ -z "$ext" ]; then
  echo "  PASS no external scripts/iframes"
elif [ "$fail" -eq 0 ]; then
  echo "  PASS all external hosts allowlisted"
fi

if [ "$fail" -ne 0 ]; then
  echo "security-scan: FAILURES"
  exit 1
fi
echo "security-scan: green"
