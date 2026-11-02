#!/bin/bash
# Run a command once one of N concurrent "browser slots" is free:  kit/slot.sh node kit/check.mjs sims/QM03
# Always run the harness through this wrapper: many builders share one machine, and bare puppeteer runs starve each other.
N=${PSV2_SLOTS:-8}
BASE="${PSV2_SLOTS_DIR:-${TMPDIR:-/tmp}/psv2-slots}"
mkdir -p "$BASE"
while true; do
  for i in $(seq 1 $N); do
    d="$BASE/s$i"
    if [ -d "$d" ] && [ -f "$d/pid" ] && ! kill -0 "$(cat "$d/pid")" 2>/dev/null; then rm -rf "$d"; fi
    if mkdir "$d" 2>/dev/null; then
      echo $$ > "$d/pid"
      trap 'rm -rf "$d"' EXIT INT TERM
      "$@"; rc=$?
      exit $rc
    fi
  done
  sleep $((3 + RANDOM % 5))
done
