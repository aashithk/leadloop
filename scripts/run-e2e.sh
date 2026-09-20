#!/usr/bin/env bash
# Run every tests/e2e/*.test.js from the repo root. Fails on any failure.
# CI installs jsdom first (npm init -y && npm i jsdom). Locally, set
# NODE_PATH to a directory containing jsdom, e.g.
#   NODE_PATH=~/workspace/goals/launch-leadloop-coaching-business/e2e/node_modules bash scripts/run-e2e.sh
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

shopt -s nullglob
files=(tests/e2e/*.test.js)
if [ "${#files[@]}" -eq 0 ]; then
  echo "run-e2e: no tests/e2e/*.test.js found"
  exit 1
fi

fail=0
for t in "${files[@]}"; do
  echo "== $t"
  if node "$t"; then
    echo "-- PASS $t"
  else
    echo "-- FAIL $t"
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "run-e2e: FAILURES"
  exit 1
fi
echo "run-e2e: all green (${#files[@]} test files)"
