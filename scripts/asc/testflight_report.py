#!/usr/bin/env python3
"""Read-only TestFlight report across every app on this App Store Connect team.

Answers "why does the TestFlight app on my phone show only old builds?":
groups, testers and invite state, newest builds with processing / export compliance /
internal TestFlight state, and which builds each group can see.
Only GET requests. Exits 3 at the end on purpose so the log is easy to fetch.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from internal_testers import call  # noqa: E402  (signs a JWT at import)


def mask(e):
    if not e or "@" not in e:
        return e
    u, d = e.split("@", 1)
    return f"{u[:3]}***@{d}"


_, users = call("GET", "/v1/users?limit=200")
holder = None
for u in users.get("data", []):
    a = u["attributes"]
    if "ACCOUNT_HOLDER" in (a.get("roles") or []):
        holder = (a.get("username") or "").lower()
    print(f"user: {mask(a.get('username'))} roles={a.get('roles')} allApps={a.get('allAppsVisible')}")

_, apps = call("GET", "/v1/apps?limit=50")
for app in apps.get("data", []):
    aa = app["attributes"]
    aid = app["id"]
    print(f"\n=== app: {aa.get('name')} bundle={aa.get('bundleId')} id={aid}")

    _, bl = call("GET", f"/v1/builds?filter[app]={aid}&sort=-uploadedDate&limit=6"
                        "&include=buildBetaDetail,preReleaseVersion"
                        "&fields[builds]=version,uploadedDate,processingState,expired,expirationDate,usesNonExemptEncryption,buildBetaDetail,preReleaseVersion"
                        "&fields[buildBetaDetails]=internalBuildState,externalBuildState,autoNotifyEnabled"
                        "&fields[preReleaseVersions]=version")
    inc = {(i["type"], i["id"]): i["attributes"] for i in bl.get("included", [])}
    for b in bl.get("data", []):
        ba = b["attributes"]
        rel = b.get("relationships", {})
        bd = inc.get(("buildBetaDetails", (rel.get("buildBetaDetail", {}).get("data") or {}).get("id")), {})
        pv = inc.get(("preReleaseVersions", (rel.get("preReleaseVersion", {}).get("data") or {}).get("id")), {})
        print(f"  build {pv.get('version')} ({ba.get('version')}) uploaded={ba.get('uploadedDate')} proc={ba.get('processingState')} "
              f"expired={ba.get('expired')} expires={ba.get('expirationDate')} nonExemptEnc={ba.get('usesNonExemptEncryption')} "
              f"internal={bd.get('internalBuildState')} external={bd.get('externalBuildState')} autoNotify={bd.get('autoNotifyEnabled')}")

    _, groups = call("GET", f"/v1/apps/{aid}/betaGroups?limit=50")
    for g in groups.get("data", []):
        ga = g["attributes"]
        print(f"  group: {ga.get('name')} internal={ga.get('isInternalGroup')} allBuilds={ga.get('hasAccessToAllBuilds')} "
              f"publicLink={ga.get('publicLinkEnabled')} created={ga.get('createdDate')}")
        _, ts = call("GET", f"/v1/betaGroups/{g['id']}/betaTesters?limit=50")
        for t in ts.get("data", []):
            ta = t["attributes"]
            same = (ta.get("email") or "").lower() == holder
            print(f"    tester: {mask(ta.get('email'))} isAccountHolder={same} state={ta.get('state')} inviteType={ta.get('inviteType')}")
        _, gb = call("GET", f"/v1/betaGroups/{g['id']}/builds?limit=5&fields[builds]=version,uploadedDate")
        print("    group builds (API list): " + ", ".join(
            f"{x['attributes'].get('version')}@{(x['attributes'].get('uploadedDate') or '')[:10]}" for x in gb.get("data", [])))

    _, loc = call("GET", f"/v1/apps/{aid}/betaAppLocalizations?limit=5")
    print(f"  betaAppLocalizations: {len(loc.get('data', []))}")

# The holder's tester record across apps
if holder:
    _, bt = call("GET", f"/v1/betaTesters?filter[email]={holder}&include=apps,betaGroups&limit=5")
    inc = {(i["type"], i["id"]): i["attributes"] for i in bt.get("included", [])}
    for t in bt.get("data", []):
        ta = t["attributes"]
        apps_ = [inc.get(("apps", x["id"]), {}).get("name") for x in (t.get("relationships", {}).get("apps", {}).get("data") or [])]
        print(f"\nholder tester record {t['id']}: state={ta.get('state')} inviteType={ta.get('inviteType')} apps={apps_}")

print("\nREPORT DONE (exit 3 only so the log can be fetched)")
sys.exit(3)
