#!/usr/bin/env python3
"""Attach the review QR pass PDF to App Review Information of the newest editable iOS version.

Idempotent: does nothing when a file with the same name is already attached and complete.
Writes only the attachment (store data entry). Never submits for review.
"""
import hashlib, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from internal_testers import call, APP_ID  # noqa: E402

PDF = os.environ.get("REVIEW_PDF", "docs/app-store/review/studio-review-passes.pdf")
name = os.path.basename(PDF)
data = open(PDF, "rb").read()

_, vs = call("GET", f"/v1/apps/{APP_ID}/appStoreVersions?filter[platform]=IOS"
                    "&filter[appStoreState]=PREPARE_FOR_SUBMISSION,DEVELOPER_REJECTED,REJECTED,METADATA_REJECTED")
if not vs.get("data"):
    sys.exit("no editable iOS version")
vid = vs["data"][0]["id"]
_, rd = call("GET", f"/v1/appStoreVersions/{vid}/appStoreReviewDetail")
rid = rd["data"]["id"]
_, att = call("GET", f"/v1/appStoreReviewDetails/{rid}/appStoreReviewAttachments")
for a in att.get("data", []):
    aa = a["attributes"]
    state = (aa.get("assetDeliveryState") or {}).get("state")
    if aa.get("fileName") == name and state == "COMPLETE":
        print(f"already attached: {name} ({state})"); sys.exit(0)
    if aa.get("fileName") == name:
        call("DELETE", f"/v1/appStoreReviewAttachments/{a['id']}")
        print(f"removed incomplete {name} ({state})")

s, res = call("POST", "/v1/appStoreReviewAttachments", {"data": {
    "type": "appStoreReviewAttachments",
    "attributes": {"fileName": name, "fileSize": len(data)},
    "relationships": {"appStoreReviewDetail": {"data": {"type": "appStoreReviewDetails", "id": rid}}}}})
aid = res["data"]["id"]
for op in res["data"]["attributes"]["uploadOperations"]:
    chunk = data[op["offset"]:op["offset"] + op["length"]]
    req = urllib.request.Request(op["url"], data=chunk, method=op["method"],
                                 headers={h["name"]: h["value"] for h in op.get("requestHeaders", [])})
    with urllib.request.urlopen(req) as r:
        print(f"uploaded {len(chunk)} bytes -> {r.status}")
s, res = call("PATCH", f"/v1/appStoreReviewAttachments/{aid}", {"data": {
    "type": "appStoreReviewAttachments", "id": aid,
    "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(data).hexdigest()}}})
print(f"committed {name}: {s} state={(res.get('data', {}).get('attributes', {}).get('assetDeliveryState') or {}).get('state')}")
