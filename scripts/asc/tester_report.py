#!/usr/bin/env python3
"""Read-only: list every app's TestFlight groups and testers on this App Store Connect team,
so we can compare why one app's invite reaches a phone and another's does not."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from internal_testers import call  # noqa: E402  (signs a JWT at import)

_, users = call("GET", "/v1/users?limit=200")
for u in users.get("data", []):
    a = u["attributes"]
    print(f"user: {a.get('username')} roles={a.get('roles')} allApps={a.get('allAppsVisible')} provisioning={a.get('provisioningAllowed')}")
_, invs = call("GET", "/v1/userInvitations?limit=50")
for i in invs.get("data", []):
    a = i["attributes"]
    print(f"pending user invitation: {a.get('email')} roles={a.get('roles')} expires={a.get('expirationDate')}")

_, apps = call("GET", "/v1/apps?limit=50")
for app in apps.get("data", []):
    aa = app["attributes"]
    print(f"\napp: {aa.get('name')} bundle={aa.get('bundleId')} id={app['id']}")
    _, groups = call("GET", f"/v1/apps/{app['id']}/betaGroups?limit=50")
    for g in groups.get("data", []):
        ga = g["attributes"]
        print(f"  group: {ga.get('name')} internal={ga.get('isInternalGroup')} allBuilds={ga.get('hasAccessToAllBuilds')} "
              f"publicLink={ga.get('publicLinkEnabled')} created={ga.get('createdDate')}")
        _, ts = call("GET", f"/v1/betaGroups/{g['id']}/betaTesters?limit=50")
        for t in ts.get("data", []):
            ta = t["attributes"]
            print(f"    tester: {ta.get('email')} state={ta.get('state')} inviteType={ta.get('inviteType')} id={t['id']}")
