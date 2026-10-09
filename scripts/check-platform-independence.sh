#!/usr/bin/env bash
# Fails if the repo references Lovable or Replit (tooling, hosting, icons, env vars).
# Allowed: docs that document the removal (see ALLOW below).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
PATTERN='lovable\.(app|dev|com)|lovableproject|lovable[-_]|@lovable|\.lovable|replit|gpt-?engineer|repl\.co|repl\.it'
ALLOW=(
  ':!scripts/check-platform-independence.sh'
  ':!.github/workflows/platform-independence.yml'
  ':!docs/INDEPENDENT-HOSTING.md'
  ':!docs/archive/**'
)
hits=$(git grep -n -i -I -E "$PATTERN" -- . "${ALLOW[@]}" || true)
bad_files=""
# Binary lockfiles are skipped by -I, so scan them as text.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  grep -a -i -q -E "$PATTERN" "$f" && bad_files+="$f (binary lockfile references Lovable/Replit)"$'\n'
done < <(git ls-files | grep -E '(^|/)bun\.lockb?$' || true)
# Lovable template icon (heart favicon) and template placeholder, at any depth including repo root.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  sum=$(md5sum "$f" | cut -c1-8)
  case "$(basename "$f")" in
    favicon.ico) [ "$sum" = "9f504444" ] && bad_files+="$f (Lovable template favicon)"$'\n' ;;
    placeholder.svg) [ "$sum" = "35707bd9" ] && bad_files+="$f (Lovable template placeholder)"$'\n' ;;
  esac
done < <(git ls-files | grep -E '(^|/)(favicon\.ico|placeholder\.svg)$' || true)
# Platform files and folders, at any depth.
while IFS= read -r f; do
  bad_files+="$f (platform file)"$'\n'
done < <(git ls-files | grep -E '(^|/)(\.replit|replit\.md|\.lovable/.*)$' || true)
if [ -n "$hits$bad_files" ]; then
  echo "Platform independence check failed:" >&2
  [ -n "$hits" ] && echo "$hits" >&2
  [ -n "$bad_files" ] && printf '%s' "$bad_files" >&2
  exit 1
fi
echo "Platform independence check passed."
