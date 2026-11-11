#!/usr/bin/env python3
"""Read-only: what App Store Connect still lacks before Tandava Studio 1.0 can be added for review.

Prints the version state, attached build, listing text lengths, screenshot sets, App Review
contact and demo account (presence only, never values), age rating and app info. Writes nothing.
App Privacy (nutrition labels) is not in the API, so it is listed as "check in ASC".
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from internal_testers import call, APP_ID  # noqa: E402

def get(path):
    s, d = call("GET", path, ok=(200,))
    return d if s == 200 else {}

def present(v):
    return "set" if v not in (None, "", []) else "MISSING"

app = get(f"/v1/apps/{APP_ID}").get("data", {}).get("attributes", {})
print(f"app: {app.get('name')} bundle={app.get('bundleId')} primaryLocale={app.get('primaryLocale')} "
      f"contentRights={app.get('contentRightsDeclaration')}")

for info in get(f"/v1/apps/{APP_ID}/appInfos").get("data", []):
    ia = info["attributes"]
    print(f"appInfo {info['id']}: state={ia.get('state') or ia.get('appStoreState')} ageRating={ia.get('appStoreAgeRating')}")
    cat = get(f"/v1/appInfos/{info['id']}/primaryCategory").get("data") or {}
    print(f"  primaryCategory={cat.get('id', 'MISSING')}")
    for loc in get(f"/v1/appInfos/{info['id']}/appInfoLocalizations").get("data", []):
        la = loc["attributes"]
        print(f"  {la.get('locale')}: name={la.get('name')!r} subtitle={la.get('subtitle')!r} "
              f"privacyPolicyUrl={la.get('privacyPolicyUrl')}")
    ar = get(f"/v1/appInfos/{info['id']}/ageRatingDeclaration").get("data") or {}
    attrs = ar.get("attributes", {})
    unanswered = [k for k, v in attrs.items() if v is None]
    print(f"  ageRatingDeclaration: {len(attrs)} fields, unanswered={unanswered or 'none'}")

for v in get(f"/v1/apps/{APP_ID}/appStoreVersions?filter[platform]=IOS&limit=5").get("data", []):
    va = v["attributes"]
    print(f"\nversion {va.get('versionString')} id={v['id']} state={va.get('appStoreState')} "
          f"versionState={va.get('appVersionState')} release={va.get('releaseType')} copyright={va.get('copyright')!r}")
    b = get(f"/v1/appStoreVersions/{v['id']}/build").get("data")
    print(f"  build attached: {b['attributes'].get('version') if b else 'NONE'}")
    rd = get(f"/v1/appStoreVersions/{v['id']}/appStoreReviewDetail").get("data")
    if rd:
        r = rd["attributes"]
        phone = r.get("contactPhone") or ""
        print(f"  review contact: name={present(r.get('contactFirstName'))} email={present(r.get('contactEmail'))} "
              f"phone={'ends ' + phone[-4:] if phone else 'MISSING'}")
        print(f"  demo account: required={r.get('demoAccountRequired')} user={r.get('demoAccountName')} "
              f"password={present(r.get('demoAccountPassword'))} notes={len(r.get('notes') or '')} chars")
        att = get(f"/v1/appStoreReviewDetails/{rd['id']}/appStoreReviewAttachments").get("data", [])
        print(f"  review attachments: {[a['attributes'].get('fileName') for a in att]}")
    else:
        print("  review detail: NONE")
    for loc in get(f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations").get("data", []):
        la = loc["attributes"]
        print(f"  {la.get('locale')}: description={len(la.get('description') or '')} keywords={len(la.get('keywords') or '')} "
              f"promo={len(la.get('promotionalText') or '')} support={la.get('supportUrl')} marketing={la.get('marketingUrl')}")
        for ss in get(f"/v1/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets").get("data", []):
            shots = get(f"/v1/appScreenshotSets/{ss['id']}/appScreenshots").get("data", [])
            states = sorted({s['attributes'].get('assetDeliveryState', {}).get('state') for s in shots})
            print(f"    screenshots {ss['attributes'].get('screenshotDisplayType')}: {len(shots)} {states}")

print("\nnot in the API: App Privacy labels, pricing tier check -> see ASC")
