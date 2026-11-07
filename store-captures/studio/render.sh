#!/usr/bin/env bash
# Device bars, then the store frames. Expects raw page captures in store-out/raw/{ios,play}.
# Outputs everything under store-out/final.
set -euo pipefail
ROOT=$(pwd); E=store-captures/studio/engine; O=store-out
export CHROME=${CHROME:-$(command -v google-chrome || command -v chromium)}
python3 store-captures/studio/devicebar.py ios  $O/raw/ios  $E/raw/ios/tandavastudio
python3 store-captures/studio/devicebar.py play $O/raw/play $E/raw/android/tandavastudio
cd $E
python3 engine_ios.py tandavastudio || echo "::warning::iOS render had errors"
python3 engine.py tandavastudioplay || echo "::warning::Play render had errors"
python3 fg_tandavastudio.py || echo "::warning::feature graphic failed"
cd "$ROOT"
mkdir -p $O/final/ios $O/final/play $O/final/raw/ios $O/final/raw/play
cp $E/out/tandavastudio/ios-0*-1320x2868.png $O/final/ios/ 2>/dev/null || true
cp $E/out/tandavastudio/review-sheet-ios.jpg $O/final/ 2>/dev/null || true
for f in $E/out/tandavastudioplay/phone-0*-1080x1920.png; do [ -e "$f" ] && cp "$f" $O/final/play/; done
cp $E/out/tandavastudioplay/review-sheet.jpg $O/final/review-sheet-play.jpg 2>/dev/null || true
cp $E/out/tandavastudioplay/feature-graphic-1024x500.png $O/final/play/ 2>/dev/null || true
cp $E/raw/ios/tandavastudio/*.png $O/final/raw/ios/
cp $E/raw/android/tandavastudio/*.png $O/final/raw/play/
ls -R $O/final
