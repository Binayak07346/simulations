#!/bin/bash
# Run a command once one of N concurrent "browser slots" is free:  slot.sh node check.mjs built.html
# Always run the harness through this wrapper: many builders share one machine, and bare puppeteer runs starve each other.
N=${SG_SLOTS:-4}
BASE="${SG_SLOTS_DIR:-${TMPDIR:-/tmp}/sg-slots}"
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
