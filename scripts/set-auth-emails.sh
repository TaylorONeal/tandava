#!/usr/bin/env bash
# Pushes the branded auth emails (supabase/templates/*.html + subjects.json) and the
# redirect allow-list to the hosted Supabase project via the Management API.
# Prompts (hidden) for a Supabase access token. Safe to rerun.
# Usage: scripts/set-auth-emails.sh [project-ref]
set -euo pipefail
REF="${1:-mkaixgjwakfufmmwembn}"
cd "$(dirname "$0")/.."
[ -n "${SUPABASE_ACCESS_TOKEN:-}" ] || { read -r -s -p "Supabase access token: " SUPABASE_ACCESS_TOKEN; echo >&2; }
export SUPABASE_ACCESS_TOKEN REF
python3 - <<'PY'
import json, os, urllib.request
ref, tok = os.environ["REF"], os.environ["SUPABASE_ACCESS_TOKEN"]
url = f"https://api.supabase.com/v1/projects/{ref}/config/auth"
def call(method, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "User-Agent": "tandava-setup"})
    with urllib.request.urlopen(req) as r: return json.load(r)
cur = call("GET")
subjects = json.load(open("supabase/templates/subjects.json"))
body = {}
for k, subj in subjects.items():
    body[f"mailer_subjects_{k}"] = subj
    body[f"mailer_templates_{k}_content"] = open(f"supabase/templates/{k}.html").read()
want = ["https://tandavastudio.com/**", "https://*.tandavastudio.com/**",
        "https://tandava-git-*-tayloroneal-1467s-projects.vercel.app/**", "http://localhost:8080/**"]
have = [u for u in (cur.get("uri_allow_list") or "").split(",") if u]
body["uri_allow_list"] = ",".join(dict.fromkeys(have + want))
call("PATCH", body)
new = call("GET")
print("site_url:", new.get("site_url"))
print("uri_allow_list:", new.get("uri_allow_list"))
print("smtp_host:", new.get("smtp_host") or "(built-in, 2 emails/hour: set Resend SMTP)")
for k in subjects:
    ok = new.get(f"mailer_templates_{k}_content", "") == body[f"mailer_templates_{k}_content"]
    print(f"{k}: {'ok' if ok else 'MISMATCH'} | {new.get(f'mailer_subjects_{k}')}")
PY
