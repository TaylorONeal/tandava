# Hosted beta pricing (decision D1)

Decided by the maintainer on November 27, 2026: price the hosted version at about
half the average of Mindbody, Arketa and Momence, label it beta pricing, and ask
studios to contact us to start.

## The price

- **$29 a month per location.**
- **No platform cut of studio payments.** `PLATFORM_FEE_BPS` stays `0` in Supabase
  secrets, so Stripe Connect takes no application fee.
- Stripe's card fees are paid from the studio's own Stripe account, as today.
- Beta only. Studios write to hello@purafieldstudio.com to start.
- Self-hosting stays free under AGPL-3.0.

The copy lives in one place: `BETA_PRICE` in `src/content/marketing/pages.ts`. The
home page, landing pages, demo FAQ, prerendered HTML and llms.txt read it.

## How the number was picked

Entry price for one location, checked November 27, 2026:

| Vendor | Entry plan | Monthly | Platform fee on payments | Source |
|---|---|---|---|---|
| Mindbody | Starter | from $79 per location | processing markup plus $0.10 to $0.30 per transaction; 20% of a marketplace client's first purchase, capped at $30 | [mindbodyonline.com/business/pricing](https://www.mindbodyonline.com/business/pricing) |
| Arketa | Individual (studio plans are demo-only) | $49, billed annually | 3% on top of Stripe | [arketa.com/pricing](https://www.arketa.com/pricing.md) |
| Momence | Pro (no public prices since late 2026) | $60, from our Oct 2026 benchmark | about 1% on top of Stripe | [momence pricing, 3rd party](https://vibefam.com/momence-pricing-2026/), [our blog post](../../src/content/blog/studio-software-pricing-and-what-the-cut-buys.md) |

Average entry price: (79 + 49 + 60) / 3 = $62.67. Half is $31.33, rounded down to
**$29**. That compares only the subscription. Each competitor also takes a cut or
a markup on payments, and Tandava takes none, so the real gap is bigger.

Weak spots: Arketa and Momence no longer publish studio prices, so two of the
three numbers are an entry tier or a secondhand figure. Re-check before beta ends.

## Not built yet

- Billing studios for the subscription. During beta, invoice by hand (for example a
  Stripe Payment Link or invoice from the platform account). Building self-serve
  studio billing is a later backlog item.
