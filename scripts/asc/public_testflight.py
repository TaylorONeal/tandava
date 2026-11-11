#!/usr/bin/env python3
"""Public TestFlight links for ClassStamp, Tandava Studio, TeacherTree and CueCraft.

Taylor approved public links and the export compliance answer "No" (Nov 11 2026).
Per app, on the newest VALID build:
  1. export compliance: set usesNonExemptEncryption=false only if unanswered
  2. Beta App Information (betaAppLocalizations en-US): fill only missing fields
  3. Beta App Review contact (betaAppReviewDetail): fill only missing contact fields,
     copied from the App Store review detail when present. Never touches demo passwords.
  4. external group "Public" with a public link, build added, What to Test set
  5. submit the build for beta app review (skipped when a demo account is required
     but none is on file, or when already submitted)
Prints each public link. Exits 3 at the end on purpose so the log is easy to read.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from internal_testers import call  # noqa: E402

APPS = [a for a in os.environ.get("PUBLIC_APP_IDS", "").split(",") if a]
GROUP = "Public"
FEEDBACK = os.environ.get("FEEDBACK_EMAIL", "")
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "")
CONTACT_PHONE = os.environ.get("CONTACT_PHONE", "")
WHAT_TO_TEST = ("Open the app, sign in if asked, and try the main flow end to end. "
                "Send feedback or a screenshot from TestFlight if anything looks wrong.")

summary = []


def first(lst):
    return (lst or [None])[0]


for aid in APPS:
    _, app = call("GET", f"/v1/apps/{aid}")
    name = app.get("data", {}).get("attributes", {}).get("name", aid)
    print(f"\n=== {name} ({aid})")
    line = {"app": name}

    # newest valid build
    _, bl = call("GET", f"/v1/builds?filter[app]={aid}&filter[processingState]=VALID&filter[expired]=false"
                        "&sort=-uploadedDate&limit=1&include=preReleaseVersion"
                        "&fields[builds]=version,uploadedDate,usesNonExemptEncryption,preReleaseVersion"
                        "&fields[preReleaseVersions]=version")
    b = first(bl.get("data"))
    if not b:
        print("  no valid build"); line["result"] = "no valid build"; summary.append(line); continue
    pv = first(bl.get("included")) or {"attributes": {}}
    bid = b["id"]
    label = f"{pv['attributes'].get('version')} ({b['attributes'].get('version')})"
    line["build"] = label
    enc = b["attributes"].get("usesNonExemptEncryption")
    print(f"  build {label} uploaded={b['attributes'].get('uploadedDate')} nonExemptEnc={enc}")
    if enc is None:
        st, _ = call("PATCH", f"/v1/builds/{bid}", {"data": {"type": "builds", "id": bid,
                     "attributes": {"usesNonExemptEncryption": False}}})
        print(f"  export compliance set to No -> {st}")

    # privacy URL and review contact from the App Store side, if present
    privacy = None
    _, infos = call("GET", f"/v1/apps/{aid}/appInfos?limit=5")
    for inf in infos.get("data", []):
        _, il = call("GET", f"/v1/appInfos/{inf['id']}/appInfoLocalizations?limit=10")
        for l in il.get("data", []):
            privacy = privacy or l["attributes"].get("privacyPolicyUrl")
    store_contact = {}
    _, vers = call("GET", f"/v1/apps/{aid}/appStoreVersions?limit=3")
    for v in vers.get("data", []):
        _, rd = call("GET", f"/v1/appStoreVersions/{v['id']}/appStoreReviewDetail")
        a = (rd.get("data") or {}).get("attributes") or {}
        if a.get("contactEmail"):
            store_contact = a
            break
    print(f"  privacyPolicyUrl={'set' if privacy else 'none'} storeReviewContact={'yes' if store_contact else 'no'} "
          f"storeDemoRequired={store_contact.get('demoAccountRequired')}")

    # 2. Beta App Information
    _, locs = call("GET", f"/v1/apps/{aid}/betaAppLocalizations?limit=10")
    loc = next((l for l in locs.get("data", []) if l["attributes"].get("locale") == "en-US"), first(locs.get("data")))
    want = {"feedbackEmail": FEEDBACK, "privacyPolicyUrl": privacy,
            "description": f"{name} beta. Try the main flow and tell us what breaks or feels off."}
    if loc:
        cur = loc["attributes"]
        patch = {k: v for k, v in want.items() if v and not cur.get(k)}
        print(f"  betaAppLocalization {cur.get('locale')}: missing={list(patch)}")
        if patch:
            st, _ = call("PATCH", f"/v1/betaAppLocalizations/{loc['id']}",
                         {"data": {"type": "betaAppLocalizations", "id": loc["id"], "attributes": patch}})
            print(f"    filled -> {st}")
    else:
        attrs = {"locale": "en-US", **{k: v for k, v in want.items() if v}}
        st, _ = call("POST", "/v1/betaAppLocalizations", {"data": {"type": "betaAppLocalizations", "attributes": attrs,
                     "relationships": {"app": {"data": {"type": "apps", "id": aid}}}}})
        print(f"  betaAppLocalization created -> {st}")

    # 3. Beta App Review contact
    _, brd = call("GET", f"/v1/apps/{aid}/betaAppReviewDetail")
    d = brd.get("data") or {}
    cur = d.get("attributes") or {}
    contact = {
        "contactFirstName": store_contact.get("contactFirstName") or "Taylor",
        "contactLastName": store_contact.get("contactLastName") or "O'Neal",
        "contactEmail": store_contact.get("contactEmail") or CONTACT_EMAIL,
        "contactPhone": store_contact.get("contactPhone") or CONTACT_PHONE,
    }
    patch = {k: v for k, v in contact.items() if v and not cur.get(k)}
    if not cur.get("notes") and store_contact.get("notes"):
        patch["notes"] = store_contact["notes"]
    if patch and d.get("id"):
        st, _ = call("PATCH", f"/v1/betaAppReviewDetails/{d['id']}",
                     {"data": {"type": "betaAppReviewDetails", "id": d["id"], "attributes": patch}})
        print(f"  betaAppReviewDetail filled {list(patch)} -> {st}")
    demo_req = cur.get("demoAccountRequired")
    demo_on_file = bool(cur.get("demoAccountName"))
    print(f"  betaReview demoAccountRequired={demo_req} demoAccountOnFile={demo_on_file} notes={'set' if (cur.get('notes') or patch.get('notes')) else 'none'}")

    # 4. external group with public link
    _, groups = call("GET", f"/v1/apps/{aid}/betaGroups?limit=50")
    g = next((x for x in groups.get("data", []) if not x["attributes"].get("isInternalGroup")
              and x["attributes"].get("name") == GROUP), None)
    if not g:
        st, cg = call("POST", "/v1/betaGroups", {"data": {"type": "betaGroups",
                      "attributes": {"name": GROUP, "publicLinkEnabled": True, "publicLinkLimitEnabled": False,
                                     "feedbackEnabled": True},
                      "relationships": {"app": {"data": {"type": "apps", "id": aid}}}}})
        print(f"  group {GROUP} created -> {st}")
        g = cg.get("data")
    elif not g["attributes"].get("publicLinkEnabled"):
        st, cg = call("PATCH", f"/v1/betaGroups/{g['id']}", {"data": {"type": "betaGroups", "id": g["id"],
                      "attributes": {"publicLinkEnabled": True, "publicLinkLimitEnabled": False}}})
        print(f"  public link enabled -> {st}")
        g = cg.get("data") or g
    if not g:
        line["result"] = "group not created"; summary.append(line); continue
    st, _ = call("POST", f"/v1/betaGroups/{g['id']}/relationships/builds",
                 {"data": [{"type": "builds", "id": bid}]})
    print(f"  build added to {GROUP} -> {st}")

    _, bbl = call("GET", f"/v1/builds/{bid}/betaBuildLocalizations?limit=10")
    if not bbl.get("data"):
        st, _ = call("POST", "/v1/betaBuildLocalizations", {"data": {"type": "betaBuildLocalizations",
                     "attributes": {"locale": "en-US", "whatsNew": WHAT_TO_TEST},
                     "relationships": {"build": {"data": {"type": "builds", "id": bid}}}}})
        print(f"  What to Test set -> {st}")

    # 5. beta review
    _, subs = call("GET", f"/v1/betaAppReviewSubmissions?filter[build]={bid}")
    sub = first(subs.get("data"))
    if sub:
        state = sub["attributes"].get("betaReviewState")
        print(f"  already submitted: {state}")
    elif demo_req and not demo_on_file:
        state = "NOT SUBMITTED: beta review needs a demo account and none is on file"
        print(f"  {state}")
    else:
        st, s = call("POST", "/v1/betaAppReviewSubmissions", {"data": {"type": "betaAppReviewSubmissions",
                     "relationships": {"build": {"data": {"type": "builds", "id": bid}}}}})
        state = ((s.get("data") or {}).get("attributes") or {}).get("betaReviewState") or f"http {st}"
        print(f"  submitted for beta review -> {st} {state}")
    line["review"] = state

    _, gg = call("GET", f"/v1/betaGroups/{g['id']}")
    link = ((gg.get("data") or {}).get("attributes") or {}).get("publicLink")
    line["link"] = link
    print(f"  PUBLIC LINK: {link}")
    summary.append(line)

print("\n=== SUMMARY")
for s in summary:
    print(f"{s.get('app')} | {s.get('build')} | {s.get('review') or s.get('result')} | {s.get('link')}")
print("\nDONE (exit 3 only so the log can be fetched)")
sys.exit(3)
