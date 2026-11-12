#!/usr/bin/env python3
"""Make the newest Tandava Studio build installable from TestFlight for the account holder.

Runs on Codemagic with the "app-store-connect" integration (APP_STORE_CONNECT_*).
Internal testing only: never touches external groups and never submits for review.

Steps
1. Find (or create) an internal beta group for the app with access to all builds.
2. Add the account holder (or TESTER_EMAIL) to it as a tester.
3. On the newest builds, set usesNonExemptEncryption=false where it is unanswered
   (Info.plist already declares ITSAppUsesNonExemptEncryption=false).
4. Print each build's internal TestFlight state.
"""
import json, os, re, sys, textwrap, time
import urllib.request, urllib.error
import jwt  # PyJWT

API = "https://api.appstoreconnect.apple.com"
APP_ID = os.environ.get("ASC_APP_ID", "6831459731")
GROUP_NAME = os.environ.get("INTERNAL_GROUP_NAME", "Internal testers")


def pem_key():
    raw = os.environ["APP_STORE_CONNECT_PRIVATE_KEY"].strip()
    if raw.startswith("@file:"):
        raw = open(os.path.expanduser(raw[6:])).read()
    elif raw.startswith("@env:"):
        raw = os.environ[raw[5:]]
    elif os.path.isfile(os.path.expanduser(raw)):
        raw = open(os.path.expanduser(raw)).read()
    raw = raw.replace("\\n", "\n").strip().strip('"')
    body = re.sub(r"-----(BEGIN|END)[A-Z ]*-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(textwrap.wrap(body, 64)) + "\n-----END PRIVATE KEY-----\n"


def token():
    now = int(time.time())
    return jwt.encode(
        {"iss": os.environ["APP_STORE_CONNECT_ISSUER_ID"], "iat": now, "exp": now + 900, "aud": "appstoreconnect-v1"},
        pem_key(), algorithm="ES256",
        headers={"kid": os.environ["APP_STORE_CONNECT_KEY_IDENTIFIER"], "typ": "JWT"},
    )


TOKEN = token()


def call(method, path, body=None, ok=(200, 201, 204)):
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read().decode()
            return r.status, (json.loads(txt) if txt else {})
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        if e.code in ok:
            return e.code, {}
        print(f"!! {method} {path} -> {e.code}: {txt[:800]}")
        return e.code, (json.loads(txt) if txt.startswith("{") else {})


def main():
    failures = 0

    # 1. Internal group
    _, groups = call("GET", f"/v1/apps/{APP_ID}/betaGroups?limit=50")
    for g in groups.get("data", []):
        a = g["attributes"]
        print(f"group: {a['name']} internal={a.get('isInternalGroup')} allBuilds={a.get('hasAccessToAllBuilds')}")
    internal = [g for g in groups.get("data", []) if g["attributes"].get("isInternalGroup")]
    if internal:
        group = internal[0]
    else:
        st, res = call("POST", "/v1/betaGroups", {"data": {
            "type": "betaGroups",
            "attributes": {"name": GROUP_NAME, "isInternalGroup": True, "hasAccessToAllBuilds": True},
            "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}}}})
        if st not in (200, 201):
            print("BLOCKER: could not create the internal group"); sys.exit(1)
        group = res["data"]
        print(f"created internal group '{GROUP_NAME}' with access to all builds")
    gid = group["id"]
    all_builds = group["attributes"].get("hasAccessToAllBuilds")

    # 2. Tester = account holder (or TESTER_EMAIL)
    email = os.environ.get("TESTER_EMAIL", "").strip()
    first, last = os.environ.get("TESTER_FIRST_NAME", "Internal"), os.environ.get("TESTER_LAST_NAME", "Tester")
    if not email:
        _, users = call("GET", "/v1/users?limit=200")
        holders = [u for u in users.get("data", []) if "ACCOUNT_HOLDER" in u["attributes"].get("roles", [])]
        if not holders:
            print("BLOCKER: no account holder visible to this key (key needs Admin)"); sys.exit(1)
        ua = holders[0]["attributes"]
        email, first, last = ua["username"], ua.get("firstName") or first, ua.get("lastName") or last
        print(f"account holder: {first} {last} apple_id={email}")
    _, existing = call("GET", "/v1/betaTesters?filter[email]=" + urllib.parse.quote(email) + "&limit=5")
    if existing.get("data"):
        tid = existing["data"][0]["id"]
        if os.environ.get("READD_TESTER") == "1":
            # Remove then add back, so App Store Connect issues a fresh invite
            st, _ = call("DELETE", f"/v1/betaGroups/{gid}/relationships/betaTesters",
                         {"data": [{"type": "betaTesters", "id": tid}]})
            print(f"tester removed from group -> {st}")
            import time; time.sleep(5)
            _, again = call("GET", "/v1/betaTesters?filter[email]=" + urllib.parse.quote(email) + "&limit=5")
            if again.get("data"):
                tid = again["data"][0]["id"]
                st, _ = call("POST", f"/v1/betaGroups/{gid}/relationships/betaTesters",
                             {"data": [{"type": "betaTesters", "id": tid}]})
                print(f"tester added back to group -> {st}")
            else:
                st, _ = call("POST", "/v1/betaTesters", {"data": {
                    "type": "betaTesters",
                    "attributes": {"email": email, "firstName": first, "lastName": last},
                    "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": gid}]}}}})
                print(f"tester re-created in group -> {st}")
            if st not in (200, 201, 204):
                failures += 1
        else:
            st, _ = call("POST", f"/v1/betaGroups/{gid}/relationships/betaTesters",
                         {"data": [{"type": "betaTesters", "id": tid}]})
            print(f"tester already existed; added to group -> {st}")
    else:
        st, res = call("POST", "/v1/betaTesters", {"data": {
            "type": "betaTesters",
            "attributes": {"email": email, "firstName": first, "lastName": last},
            "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": gid}]}}}})
        print(f"tester created in group -> {st}")
        if st not in (200, 201):
            failures += 1

    # 2b. Optional extra address for the same person (e.g. the inbox they actually read)
    extra = os.environ.get("EXTRA_TESTER_EMAIL", "").strip()
    if extra and extra.lower() != email.lower():
        _, ex = call("GET", "/v1/betaTesters?filter[email]=" + urllib.parse.quote(extra) + "&limit=5")
        if ex.get("data"):
            xid = ex["data"][0]["id"]
            st, _ = call("POST", f"/v1/betaGroups/{gid}/relationships/betaTesters",
                         {"data": [{"type": "betaTesters", "id": xid}]})
            print(f"extra tester {extra} existed; added to group -> {st}")
        else:
            st, res = call("POST", "/v1/betaTesters", {"data": {
                "type": "betaTesters",
                "attributes": {"email": extra, "firstName": first, "lastName": last},
                "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": gid}]}}}})
            print(f"extra tester {extra} created in group -> {st}")

    # 3. Builds: export compliance, group access, internal state
    _, builds = call("GET", f"/v1/builds?filter[app]={APP_ID}&sort=-uploadedDate&limit=5&include=preReleaseVersion")
    versions = {i["id"]: i["attributes"].get("version") for i in builds.get("included", []) if i["type"] == "preReleaseVersions"}
    for b in builds.get("data", []):
        a = b["attributes"]
        pv = (b.get("relationships", {}).get("preReleaseVersion", {}).get("data") or {}).get("id")
        label = f"{versions.get(pv, '?')} ({a.get('version')})"
        if a.get("expired"):
            print(f"build {label}: expired, skipped"); continue
        if a.get("usesNonExemptEncryption") is None:
            st, _ = call("PATCH", f"/v1/builds/{b['id']}", {"data": {
                "type": "builds", "id": b["id"], "attributes": {"usesNonExemptEncryption": False}}})
            print(f"build {label}: export compliance set to 'no non-exempt encryption' -> {st}")
        if not all_builds:
            st, _ = call("POST", f"/v1/betaGroups/{gid}/relationships/builds", {"data": [{"type": "builds", "id": b["id"]}]})
            print(f"build {label}: added to internal group -> {st}")
        _, d = call("GET", f"/v1/builds/{b['id']}/buildBetaDetail")
        da = d.get("data", {}).get("attributes", {})
        print(f"build {label}: processing={a.get('processingState')} uploaded={a.get('uploadedDate')} "
              f"internal={da.get('internalBuildState')} external={da.get('externalBuildState')}")

    # 4. Final read of the group's testers
    _, ts = call("GET", f"/v1/betaGroups/{gid}/betaTesters?limit=50")
    for t in ts.get("data", []):
        ta = t["attributes"]
        em = ta.get("email") or ""
        masked = em or "?"
        print(f"group tester: {ta.get('firstName')} {ta.get('lastName')} email={masked} state={ta.get('state')} inviteType={ta.get('inviteType')}")
        # 5. A tester still INVITED never accepted: resend the TestFlight invite for this app
        if ta.get("state") == "INVITED" and os.environ.get("RESEND_INVITE", "1") == "1":
            st, _ = call("POST", "/v1/betaTesterInvitations", {"data": {
                "type": "betaTesterInvitations",
                "relationships": {
                    "app": {"data": {"type": "apps", "id": APP_ID}},
                    "betaTester": {"data": {"type": "betaTesters", "id": t["id"]}}}}})
            print(f"  invite resent to {masked} -> {st}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    import urllib.parse
    main()
