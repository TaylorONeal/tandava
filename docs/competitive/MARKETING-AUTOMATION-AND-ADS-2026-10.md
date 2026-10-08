# Marketing automation, ad measurement and migration: competitor research (Oct 8, 2026)

Desk research for PRD-027. Every claim has a numbered source; **UNVERIFIED** means no public source confirmed it. Competitors rarely publish prices; a missing price is missing from the source.

## 1. Automated CRM marketing

| Vendor | Automations | Channels | AI | Lead capture | Packaging |
|---|---|---|---|---|---|
| Mindbody | "Journeys": welcome, re-engagement, promotions, win-back at 30/60 days, milestones; segments like new / regulars / not booked recently [1][2] | Email + SMS through Attentive, A/B testing [1][2] | AI Concierge (24/7 front desk, books, texts back missed calls), AI content [1] | Attentive pop-ups and forms; lead pipeline [1][2] | From $79/mo per location; email/SMS marketing and leads only in the Ultimate tier; AI Concierge add-on on Accelerate [3]. Conversion tracking "coming soon" [1] |
| Momence | Automations exist; triggers UNVERIFIED | Email/SMS [4] | UNVERIFIED | Meta Instant Forms leads sync in [5] | Not public [4][5] |
| Arketa | First visit/class, class finished, membership change, package low, ad interest, intro offer ending, lapsing [6] | Email, SMS (dedicated number), push [6] | AI copy and images [6]; inbox chatbot [7] | Lead tracking, segments [7] | Paid "Marketing Suite" add-on [6][7] |
| WellnessLiving | Lifecycle workflows from operational signals (missed classes, expiring memberships), nurture, win-back [8] | Email, SMS [8] | CAASI AI front desk qualifies leads [8] | Via CAASI [8] | Not public; Marketing Suite launched May 2026 [8] |
| Walla | 21-day intro-offer conversion engine (7 messages); welcome, lapsed, win-back, birthday, milestones; WallaPredict at-risk scoring [9] | Email, 1- and 2-way SMS [9] | AI drafts in the studio's voice, auto-respond [9] | Lead tracker, Google/Meta lead integrations, forms, landing pages [9] | Not public; ads and automation build-out sold as services [9] |
| Mariana Tek | Behaviour-based sends, funnel goals, staff tasks, cart abandonment [10] | Email, 2-way SMS [10] | UNVERIFIED | Forms, gated landing pages [10] | Not public [10] |
| Mangomint (salon/spa) | Campaigns, Automated Flows [11] | Email/SMS [11] | Not listed | | $120/mo per location + $10/user; marketing add-on from $30/mo [11] |
| ABC Glofox | Lead workflows; XLerate CRM (SMS, email, push) [12] | Email, SMS, push; Mailchimp [12] | UNVERIFIED | Website and Facebook lead capture [12] | €220 / €300 / €515 per month; XLerate add-on except Elite [12] |

**Pattern:** the same trigger set everywhere (first visit, intro offer expiring, pack low, membership change, lapsed / at-risk, birthday, milestone), usually gated behind a top tier or a paid add-on. AI shows up as copy generation and a lead-qualifying front desk agent.

## 2. Integrated advertising

| Vendor | Offering | Measurement | Fees |
|---|---|---|---|
| Momence | Ads Manager (Jul 2024): build, launch and report Meta campaigns in-app; lookalike, inclusion and exclusion audiences from studio data [5][13] | Leads sync in; ROI report with spend, revenue, ROI [5]. Conversions API use UNVERIFIED | Not public [5] |
| Mindbody | Marketplace exposure (Mindbody app, intro offers, last-minute deals) [1][3]; ClassPass listing [1]; national consumer ads for the app (2022) [14]. A managed Meta/Google ads service for studios: UNVERIFIED | Revenue-impact dashboard; conversion tracking "coming soon" [1] | UNVERIFIED |
| Walla | Paid ads as a service; Google/Meta lead integrations [9] | Revenue attribution dashboard [9] | Not public |
| Glofox | Facebook lead capture only [12] | Lead conversion reporting [12] | |

**Gap:** none of these publicly documents server-side conversions (Meta Conversions API, Google offline/enhanced conversions) or ROAS on *booked and paid* revenue. That is the opening.

## 3. Ad-platform mechanics we would implement (2026)

**Meta Conversions API:** required `event_name`, `event_time` (≤ 7 days old), `user_data`, `action_source`; `event_source_url` for web [15]. Standard events include Lead, Schedule, CompleteRegistration, StartTrial, Subscribe, Purchase (value + currency) [16]. Dedupe: Pixel `eventID` = server `event_id`, same event name, within 48 h [17]. SHA-256 after normalising em/ph/fn/ln/db/ge/ct/st/zp/country; never hash IP, user agent, fbc, fbp [18]. Limited Data Use for US state laws via `data_processing_options` [19]. As a platform: per-pixel tokens through Meta Business Extension (recommended) or a client system-user token, `partner_agent` on every event, App Review [20]; Tech Provider verification before other businesses can grant ads permissions [21]. CAPI for CRM (lead funnels): `action_source: system_generated`, Meta `lead_id`, at least two funnel stages, daily uploads [22].

**Google Ads:** click ids `gclid`, `gbraid`, `wbraid` [23]; enhanced conversions for leads with hashed identifiers and a `consent` field [23]. **From June 15, 2026 the Google Ads API stopped accepting new users of offline conversion import; the Data Manager API (GA Dec 2025) replaces it** [24][25][26][27]. Build on Data Manager. Developer token tiers if the Ads API is needed for reporting [28]. Consent Mode v2 signals: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` [29].

**TikTok Events API:** per-event-set token, shared `event_id` for dedupe, capture `ttclid`, SHA-256 email/phone [30] (secondary source; confirm against TikTok docs).

## 4. Migration from other systems

| Source | Exports | Cards | Pain points |
|---|---|---|---|
| Mindbody | Clients, memberships, credit balances, visit history [31] | Formal data release, PGP-encrypted to the new processor, ID verification [32] | One switcher reports $600 for two exports [33]; 30 days' notice for cards [34]; 3-4 weeks [35]; API billed per call per location, manual approval, logo requirement [36] |
| WellnessLiving | Report exports: All Clients, Visits Remaining, Projected Revenue, Attendance, All Sales [37] | Paragon: $500 export fee + transfer agreement; or Stripe [38] | Shared emails can't import; clients missing from reports [37] |
| Mariana Tek | Admin export [35] | "Exit files"; only active, unexpired cards from the first set [39] | |
| Glofox | UNVERIFIED | Stripe; GoCardless separately [34] | |
| Walla | CSV [35] | Stripe [35] | |
| Arketa | UNVERIFIED | Stripe-to-Stripe [40] | |
| Momence | UNVERIFIED | UNVERIFIED | |

Usually not transferred: schedules, staff, product catalogue, payment history [35]. Stripe: PAN import with an old-id → `cus_`/`pm_` mapping file, ~10 business days [41]; copy between Stripe accounts keeps customer ids, changes payment-method ids, **does not copy subscriptions** [42]; export out only to a PCI Level 1 processor [43]. Whether an import can land directly in a Connect account: UNVERIFIED, confirm with Stripe.

## Sources
1. https://www.mindbodyonline.com/marketing
2. https://www.mindbodyonline.com/business/attentive-guide/sign-up-units
3. https://www.mindbodyonline.com/business/pricing
4. https://www.capterra.com/p/229516/Ribbon/pricing/
5. https://momence.substack.com/p/introducing-the-momence-ads-manager
6. https://www.arketa.com/features/marketing-automations.md
7. https://help.arketa.com/marketing/overview
8. https://www.contentgrip.com/wellnessliving-marketing-suite/
9. https://hellowalla.com/features/marketing-suite
10. https://www.marianatek.com/features/marketing-crm/
11. https://www.mangomint.com/pricing/
12. https://www.glofox.com/price-2026/
13. https://insider.fitt.co/press-release/launch-ad-campaigns-with-more-ease-than-ever-before-with-momence/
14. https://www.mindbodyonline.com/education/blog/mindbody-launches-national-advertising-help-you-grow-your-business
15. https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event
16. https://developers.facebook.com/docs/meta-pixel/reference
17. https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
18. https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
19. https://developers.facebook.com/docs/marketing-apis/data-processing-options
20. https://developers.facebook.com/docs/marketing-api/conversions-api/set-up-conversions-api-as-a-platform
21. https://developers.facebook.com/docs/development/release/tech-providers
22. https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/conversions-api-crm-for-platforms
23. https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
24. https://ppc.land/google-blocks-new-offline-conversion-imports-via-ads-api-from-june-15/
25. https://www.techwyse.com/news/platform-updates/google-ads-api-offline-conversion-import-cutoff
26. https://support.google.com/google-ads/answer/2998031?hl=en
27. https://ads-developers.googleblog.com/2025/12/the-data-manager-api-is-now-generally.html
28. https://developers.google.com/google-ads/api/docs/api-policy/access-levels
29. https://developers.google.com/tag-platform/security/guides/consent
30. https://www.stackmatix.com/blog/tiktok-events-api-setup
31. https://www.joinzipper.com/onboarding/switch-guides/mindbody
32. https://support.hellowalla.com/en/articles/9107922-how-to-request-your-data-export-mindbody
33. https://support.zingfit.com/en/articles/4336325-migrating-to-zingfit-from-mindbody
34. https://support.glofox.com/hc/en-us/articles/46456394306580
35. https://www.joinzipper.com/help-center-article/what-data-transfers-from-mindbody-mariana-tek-glofox-walla
36. https://www.usecarly.com/blog/mindbody-api/
37. https://support.hellowalla.com/what-data-is-migrated-wellness-living-walla-support-center
38. https://help.union.fit/en/articles/12160448-converting-cards-on-file-from-wellness-living
39. https://support.marianatek.com/en/articles/6949083-why-are-some-customers-missing-credit-card-information-after-migration
40. https://help.arketa.com/getting-started/transfer-clients
41. https://docs.stripe.com/get-started/data-migrations/pan-import
42. https://support.stripe.com/questions/data-that-can-be-copied-between-stripe-accounts
43. https://docs.stripe.com/get-started/data-migrations/pan-export
