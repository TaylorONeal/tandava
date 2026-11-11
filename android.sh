#!/usr/bin/env bash
cd "$(dirname "$0")"
adb install -r ../native/studio/android/app/build/outputs/apk/debug/app-debug.apk
adb shell settings put global window_animation_scale 0 || true
adb shell dumpsys webviewupdate | grep -iE 'current webview package' > webview.txt || true
./run.sh android ./cap.sh
adb logcat -d -t 2000 > logcat.txt || true
