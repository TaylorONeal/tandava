#!/usr/bin/env bash
# usage: run.sh <ios|android> <screencap command writing PNG to $1>
P=$1; CAP=$2; R=results.txt; : > "$R"
echo "platform $P  commit $GITHUB_SHA  run $GITHUB_RUN_ID" >> "$R"
for f in 01-launch 02-signin-screen 03-empty-submit 04-validation-text 05-type-email 06-email-only-submit; do
  if maestro test -e P="$P" "$f.yaml" > "log-$P-$f.txt" 2>&1; then
    echo "PASS $f" >> "$R"
  else
    why=$(grep -E 'FAILED|Assertion|not found|not visible|Element|Exception|Error' "log-$P-$f.txt" | tail -1 | cut -c1-200)
    echo "FAIL $f: ${why:-see log-$P-$f.txt}" >> "$R"
    $CAP "$P-$f-fail.png" || true
  fi
done
cat "$R"
