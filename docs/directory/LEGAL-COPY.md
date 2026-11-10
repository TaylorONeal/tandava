# Studio directory: legal and disclaimer copy

Source of the wording on `/studios`, `/studios/:slug` and `/studios/about`
(`src/pages/directory/`). Change the wording here first, then in the page.

Status: drafted 2026-11-10 from Taylor's direction ("make it very clear that
this is a directory site ... not guaranteed to be accurate ... date last
refreshed for that record, as well as the email address to contact to update
it"). Not legal advice. Worth a lawyer's read before the directory is indexed
(`VITE_DIRECTORY_INDEXABLE=true`).

## Why a directory like this is a normal thing to publish

- It lists basic public business facts (name, area, website, social links,
  styles, which public booking platform their booking link uses). No reviews,
  ratings, prices or private data.
- Map data comes from OpenStreetMap under the Open Database License (ODbL 1.0).
  ODbL allows commercial use with attribution "© OpenStreetMap contributors"
  on every page that shows it. If we ever publish the derived database itself
  (a download or API), it must be offered under ODbL too.
- Descriptions are our own words. No studio text or photos are copied.
- Studio and software names are used descriptively (nominative use), with a
  no-affiliation, no-endorsement line.
- Phone and street address stay internal (`src/data/directory/display.json`)
  until Taylor decides otherwise. Staff names are never listed.
- Every listing has an update and a removal door, answered by email.
- The site checker identifies itself, follows robots.txt, reads only public
  pages and runs only after `/studios/about` is live (SCRAPING-PLAN.md).

## Short notice (top of `/studios`, bottom of each listing)

> This is a public directory, not an endorsement. Listings come from publicly
> available sources, mainly OpenStreetMap, and are not guaranteed to be
> accurate or current. Each listing shows when it was last refreshed. Check
> details with the studio before you go. Tandava is not affiliated with the
> studios listed or with the software companies named.
>
> Run one of these studios, or spotted a mistake? {update email} updates or
> removes a listing.

## Per listing

- "Last refreshed {date}" on every listing, from `last_refreshed_at`.
- "Checked by a person on {date}" only when `last_verified_at` is set.
- Buttons: "Request an update" and "Ask us to remove it", both mailto the
  update email with the studio name, city and listing URL filled in.
- Map attribution: "Map data © OpenStreetMap contributors (ODbL)" and a link
  to the place on openstreetmap.org.
- Software line wording: "Booking via Arketa. Previously: Mindbody." Never
  "uses" as a claim about their contract, never a judgement of the software.

## Update email

`hello@purafieldstudio.com` (already the site's main contact). Set in
`src/data/directory/display.json` as `update_email`.

## `/studios/about`

Sections: What this is, Where listings come from, Accuracy, Update or remove a
listing, Our site checker. Full text lives in `DirectoryAbout.tsx`.

Removal requests: remove within a few business days, add the studio to
`data/directory/suppressions.json` so the next refresh does not bring it back.
