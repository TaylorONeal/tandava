---
title: "What Studio Software Actually Costs — and What the Cut Buys (2026)"
slug: "studio-software-pricing-and-what-the-cut-buys"
description: "Public pricing for the major studio platforms, plus the economics of transaction cuts, app-store fees, and the real question: when is a platform's cut fair, and when is it just a tax?"
category: "studio-growth"
tags: ["pricing", "mindbody", "payments", "economics", "studio software"]
author: "Tandava Team"
authorTitle: "Studio Growth"
date: 2026-06-18
draft: false
---

The published entry price is rarely what you pay. Two things move the real
number: how a vendor charges for more locations, and whether it takes a cut of
your revenue on top of the subscription. Understanding *what that cut buys* is
the difference between software that pays for itself and a fee that quietly
drains your margin.

This piece pairs with the
[feature comparison](/blog/studio-software-feature-comparison-2026): features and
price are two different questions, and we keep them separate on purpose. Here we
use **publicly visible pricing only**, linked to the source so you can check it
yourself.

## The honest caveat on every number here

Most of these vendors gate their real "studio" pricing behind a demo, stack
add-ons that move the true number a lot, and run promos that change monthly.
Payment-processing rates in particular are often quoted only on request. Where a
figure is secondhand (a review site, an operator report), we say so. **Treat
published numbers as a floor, not a quote, and confirm anything material with the
vendor before you sign.**

## The quick comparison

"Cut" = any platform take-rate on transactions, *on top of* card processing.
Entry prices are the lowest published monthly figure; real spend is usually
higher once tiers and add-ons stack.

| Platform | Model | Entry / month | Platform cut on transactions | Transparency |
|---|---|---|---|---|
| Mindbody | Sales-led tiers, per location | ~$99 (Starter) | Marketplace 20%, capped $30, **new-client discovery only** | Low |
| Arketa | Public solo tiers; studio demo-gated | $49 (annual) | 3% on every transaction + Stripe | High (solo) |
| Momence | Flat fee + tiered revenue-share | $0 / $60 / $199 | 5% free / 2.5% Pro / 0% Custom (+~1% over Stripe) | Medium |
| WellnessLiving | Public flat tiers per location | $69 (Starter) | None | High |
| Vagaro | Per bookable calendar | ~$24–30 (1 calendar) | None | Highest |
| Glofox | Sales-led, quote-gated, per location | "from $99" | Reported surcharge over Stripe | Lowest |
| Walla | Public flat tiers, per location | $220 (Starter) | None (pure Stripe pass-through) | High |
| Tandava | Open source, self-hosted | $0 software | None (no platform exists) | Fully open |

Verify before relying on any cell. Sources are linked per platform below.

## The per-platform detail (public figures)

- **Mindbody** — Starter ~$99/mo, charged **per location**; higher tiers
  (Accelerate, Ultimate, Ultimate Plus) are widely reported at ~$259–699+ but are
  secondhand/sales-led, not official. Processing ~2.99% + $0.30 card-present,
  ~3.5% online. Branded app and livestream/on-demand are add-ons. 12–24 month
  auto-renewing terms are widely reported.
  ([pricing](https://www.mindbodyonline.com/business/pricing),
  [marketplace fees](https://support.mindbodyonline.com/s/article/217038307-What-are-Marketing-Platform-fees),
  [fee breakdown — Gymdesk](https://gymdesk.com/blog/mindbody-fees))
- **Arketa** — public solo tiers $49 / $83 / $124 (billed annually); studio tiers
  are "book a demo." A **3% Arketa fee on every transaction** sits on top of
  Stripe (~6% all-in on solo plans). Month-to-month unless you opt into annual.
  ([arketa.com/pricing](https://www.arketa.com/pricing))
- **Momence** — the lower your monthly fee, the higher the cut: Basic free (5%),
  Pro $60 (2.5%), Custom $199 (0% platform fee). A +~1% over standard Stripe is
  widely reported. Operators report $250–2,000+/mo once add-ons and locations
  stack (secondhand). ([momence.com/pricing](https://momence.com/pricing))
- **WellnessLiving** — Starter $69 / Business $199 / BusinessPro $349, Enterprise
  custom; **no transaction revenue-share**. Livestream (FitLIVE) and on-demand
  (FitVID) are flat add-ons. Free onboarding + 2 free data migrations; 15% off
  for veterans and registered non-profits.
  ([wellnessliving.com/pricing](https://www.wellnessliving.com/pricing/))
- **Vagaro** — the most transparent: priced **per bookable calendar**, ~$24–30
  for one, scaling to ~$84/mo at 7+. No transaction cut. Branded app $100 one-time
  + $100/mo. ([vagaro.com/pro/pricing](https://www.vagaro.com/pro/pricing))
- **Glofox (ABC Glofox)** — sales-led, quote-gated, per location; advertised
  "from $99/mo" with no published tiers. A platform surcharge over Stripe is
  reported but not officially published. One widely cited operator complaint is a
  ~70% mid-contract price increase (secondhand — we flag it as an operator report,
  not an established fact). ([glofox.com/plans](https://www.glofox.com/plans/))
- **Walla** — public flat tiers per location: Starter $220 / Core $320 (annual) /
  Pro ~$557–599. **Pure Stripe pass-through** (2.9% + $0.30, no markup). Branded
  app $149/mo (US only), included in Pro. Free data migration.
  ([hellowalla.com/us/pricing](https://www.hellowalla.com/us/pricing))
- **Tandava (open source — ours)** — the software is free (AGPL-3.0); there's no
  platform cut and no app-store cut because there's nothing in the middle taking a
  percentage. Your real costs are infrastructure (Supabase free tier to ~$25/mo
  for small studios), Stripe at standard rates, hosting (often free), and **your
  own time** to deploy and maintain it. It's a V1 alpha reference implementation,
  not a managed service. ([github.com/TaylorONeal/tandava](https://github.com/TaylorONeal/tandava))

## How it adds up at scale

A no-cut, public-tier platform charges a flat fee plus card processing, full
stop. A revenue-share platform changes the math: on **$20,000/mo in card sales**,
Momence's free-tier 5% would take ~$1,000/mo, and Arketa's flat 3% ~$600/mo on
solo plans — on top of Stripe. At three locations, almost every hosted platform
charges per location, so a $320 tier becomes ~$960/mo before add-ons. Vagaro
(per bookable calendar) and Tandava (self-hosted, locations are row-level
isolation in one deployment) are the structural outliers.

**Rule of thumb:** flat per-location pricing is predictable and rewards
high-volume studios, because cost doesn't grow with revenue. Revenue-share feels
cheap at low volume and gets expensive as you grow — the opposite of what a
scaling business wants. Mindbody sits apart: its cut is tied to *discovery*, not
volume, which is the most defensible model of all — if the discovery is real.

## The big-ticket problem: workshops, trainings, retreats

Teacher trainings and retreats are large transactions ($3,000–5,000+), and at
~2.9% card processing a single $3,000 training costs ~$87 per student — ~$1,700
on a 20-person training just to accept the cards. Note the nuance that cuts in
Mindbody's favor: its marketplace commission is **capped at $30**, so on a $3,000
training it's effectively ~1%. On big-ticket items, **processing is the dominant
cost, not the platform fee** — which is exactly why so many studios take
trainings and retreats offline (bank transfer, check) where the cost is roughly
0%. The economics aren't in dispute; the explicit "we do it to dodge fees"
framing is partly studio-stated.
([Gymdesk](https://gymdesk.com/blog/mindbody-fees),
[Brett Larkin](https://www.brettlarkin.com/how-to-take-payments-for-private-yoga-classes/))

## App-store cuts: the layer most people get wrong

If you sell through a mobile app, Apple and Google may take a cut — but only
sometimes, and the distinction is the most important thing here:

- **In-person services are exempt.** Apple's Guideline 3.1.3(e) says physical
  goods/services consumed outside the app must **not** use In-App Purchase. An
  in-person class, a studio membership, a workshop you physically attend: **no
  app-store commission**. Google has the same physical-services carve-out.
- **Digital content is not exempt.** An auto-renewing subscription to a streaming
  / on-demand library generally **must** use IAP: Apple 30% standard, 15% under
  the Small Business Program (<$1M/yr) and after a subscriber's first 12 months.
  Google is mid-restructure (March 2026: roughly a 20% service fee + ~5%
  processing, 10% on subscriptions, rolling out by June 30, 2026).
- **The cut is about the purchase type, not the device.** The same membership
  sold on the web avoids the app-store cut entirely — which is why studios push
  memberships and big purchases to web checkout and keep the app for booking.

**In flux — verify before relying on precise US numbers.** After Epic v. Apple,
the December 11, 2025 Ninth Circuit affirmed Apple's contempt but reversed the
zero-commission remedy and remanded, so the exact allowable commission on
linked-out US purchases is unsettled as of June 2026, and Google's restructure is
still rolling out.
([Apple guidelines](https://developer.apple.com/app-store/review/guidelines/),
[Apple SBP](https://developer.apple.com/app-store/small-business-program/),
[Google Play fees](https://support.google.com/googleplay/android-developer/answer/112622),
[Fenwick on Epic v. Apple](https://www.fenwick.com/insights/publications/ninth-circuit-largely-upholds-ruling-in-epic-v-apple))

## The argument: a lead is worth a cut, a booking is not

Strip away the feature lists and pricing comes down to one question: **what is
the platform actually being paid for?**

A single class booking is a $15–25 transaction and an easy one — take a name,
hold a spot, charge a card. That software is a commodity. The hard, valuable
thing is **discovery**: putting a brand-new person in front of your schedule and
getting them to buy. That value isn't the first booking; it's **Customer
Lifetime Value** (roughly monthly revenue per member ÷ monthly churn). At $50/mo
and 10% monthly churn, that's ~$500 of lifetime value, and good retention pushes
it well into four figures. That's why acquisition is expensive everywhere:
health-and-fitness Google Ads run ~$5 per click and ~$63 per lead (2025
benchmarks), and boutique studios commonly spend $100–300 to acquire one member.
Nobody pays $63 for a lead worth $20 — they pay it because the lead is worth
$1,000.
([WordStream](https://www.wordstream.com/blog/2025-google-ads-benchmarks),
[WellnessLiving CLV guide](https://www.wellnessliving.com/blog/understanding-lifetime-value-your-fitness-clients/))

**So when is a cut fair?** When the platform actually sourced the lead. Mindbody's
marketplace charges 20% of the first purchase, capped at $30, on a genuinely new
client who found you in the Mindbody app — and $0 on existing clients,
self-sourced clients, and pack/membership redemptions. If that person becomes a
$1,000+ member, paying up to $30 to acquire them beats $63–300 through ads. The
platform did the expensive part (discovery) and took a slice of the cheap part
(the booking). That's the deal working.

**When is it just a tax?** When the platform sourced nothing. If a student found
you on Instagram, a referral, or your own website and the platform is merely the
cash register, a large percentage cut drains margin the platform didn't earn.
That's the whole reason some studios route their biggest transactions
off-platform — not anti-software, just refusing to pay a lead price for a booking
service. (We go deeper on this in
[discovery platforms vs. your own funnel](/blog/discovery-platforms-vs-your-own-funnel).)

Commission is rational compensation for sourcing a high-value lead. It is not
rational as a tax on a transaction you already owned. Discovery is the expensive,
valuable thing; the booking layer, however slick, is plumbing.

## A note on this comparison

Our honest opinion, offered to help — **not legal or financial advice**, and we'd
recommend your own counsel review any contract.

- **Public information only**, linked and checked June 2026; secondhand,
  estimated, or sales-gated figures are labeled as such.
- **Numbers drift** — promos, tiers, and processing rates change monthly. Treat
  published figures as a floor and confirm with the vendor.
- **We make one of these** (Tandava, open source), so we have a bias and disclose
  it.

All product names and trademarks belong to their respective owners; we are not
affiliated with, endorsed by, or partnered with any platform mentioned. Found
something out of date? Tell us and we'll update.
