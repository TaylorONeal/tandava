# Website Embed — put booking on your own site

Most studios already have a website (Squarespace, Wix, WordPress, Webflow, or
hand-built HTML). The embed widget lets you show your **live class schedule**, a
**"Book Now" button**, or a **single event** right on that site — the same way
Mindbody, Arketa, and Momence integrate — without sending visitors away.

You paste **one line**. No API keys, no build step, no plugin.

> **Don't have a website, or can't edit it?** You don't need the widget. **Manage → Booking Links**
> (`/manage/share`) gives you a link straight to your branded booking page, plus a printable QR
> code. Nothing to install. That's usually the better first move: a link works in an Instagram bio,
> a Linktree, a Google listing and a text message, and the widget only helps where you already have
> traffic on your own site.

---

## Quick start

In Tandava, go to **Manage → Website Embed** (`/manage/embed`), pick a widget,
set your brand color, and copy the snippet. It looks like this:

```html
<!-- Inline class schedule with a Book button on each class -->
<script src="https://YOUR-STUDIO.com/embed.js"
        data-studio="your-studio-slug"
        data-view="schedule"
        data-primary="4fd1c5"></script>
```

Your slug and brand color are filled in from your studio settings — you don't need to look them up.

> Your studio must be set to **discoverable** for the public schedule to load. The widget renders
> empty until it is.

### Where the paste goes, per platform

**Squarespace** (needs a Business plan or higher; Personal plans cannot add code blocks at all)
1. Open the page and click **Edit**.
2. Click an insert point (**+**) and choose **Code**.
3. Delete the sample HTML in the block.
4. Paste the snippet.
5. **Apply**, then **Save**. It often shows only on the live page, not in the editor.

**Wix**
1. **Add (+) → Embed Code → Embed HTML**.
2. Click **Enter Code** on the box.
3. Paste, then **Update**.
4. Drag the box to roughly the right size; it resizes itself to fit your classes.
5. **Publish** — it won't render while you're still editing.

**WordPress** (if someone else maintains your site, send them the snippet instead)
1. Edit the page.
2. Block editor: add a **Custom HTML** block. Classic editor: switch to the **Text** tab.
3. Paste the snippet.
4. **Update**.
5. If it disappears on save, your host or a security plugin is stripping scripts. Ask whoever
   maintains the site to allow it, or use Booking Links instead.

**Anything else** (Webflow, Showit, hand-built): the snippet goes anywhere in the page body. Send it
to whoever maintains the site.

---

## The three widgets

| `data-view` | What it renders |
|-------------|-----------------|
| `schedule`  | Your upcoming classes inline, each with a Book button |
| `button`    | A single button that opens your schedule in a lightbox popup |
| `event`     | One workshop/training (set `data-event="EVENT_ID"`) |

### Options

| Attribute | Purpose | Default |
|-----------|---------|---------|
| `data-studio` | Your studio slug | — (required for schedule/button) |
| `data-view` | `schedule` \| `button` \| `event` | `schedule` |
| `data-event` | Event id (when `data-view="event"`) | — |
| `data-label` | Button text (when `data-view="button"`) | `Book a Class` |
| `data-primary` | Brand color (hex, no `#`) | `4fd1c5` |

---

## No-iframe option (Web Component) — for developers

> This needs two technical values (a project URL and a publishable key), so it's best handed to
> whoever maintains the site. In the app it sits collapsed behind "My site strips scripts or blocks
> iframes" rather than beside the one-line snippets, because it is not something a studio owner
> should have to evaluate.

Some CMS plans strip `<iframe>` tags, or you may want the schedule inlined into
your own DOM. The `tandava-schedule` custom element renders into shadow DOM (so
it still won't fight your page's styles) and reads the same public RPC directly:

```html
<script src="https://YOUR-STUDIO.com/widget.js" defer></script>
<tandava-schedule
  supabase-url="https://xxxx.supabase.co"
  anon-key="eyJ...publishable..."
  studio="your-studio-slug"
  app-url="https://YOUR-STUDIO.com"
  primary="#4fd1c5"></tandava-schedule>
```

The `/manage/embed` generator fills in your project's Supabase URL and
publishable key. That key is **safe to expose** — it only permits the public,
read-only `get_public_schedule` RPC (row/column-restricted server-side). As with
the iframe, booking opens `app-url` in a new tab.

Trade-off vs. the iframe: more attributes to set (URL + key), no automatic
resize needed (it's inline). Prefer the iframe snippet unless your host blocks it.

---

## Why booking opens in a new tab (not in the widget)

Browsers **partition storage per top-level site**, so a member who is logged in
on your Tandava site is *not* seen as logged in inside a widget embedded on
`yoursite.com` — they're different storage partitions. Rather than force an
unreliable in-widget login, the widget always hands off to your Tandava site
(new tab) to complete booking, payment, and auth. This is the same pattern the
incumbents use for embedded booking.

---

## How it works

1. The snippet loads a ~4 KB script (`public/embed.js`) from your Tandava
   deployment.
2. The script injects a sandboxed `<iframe>` pointing at a chrome-less page on
   your site (`/embed/schedule/:slug`, `/embed/event/:id`).
3. That page reads **public data only** via a narrow `get_public_schedule` RPC
   (and published-events RLS) using the Supabase anon key — so there are **no
   secrets on your website**. The RPC returns only safe, public columns for a
   discoverable studio's *upcoming* classes; the underlying tables stay private.
4. The iframe **auto-resizes** to its content via `postMessage` (no inner
   scrollbars), and honors your `data-primary` brand color.
5. **Booking and payment open on your Tandava site in a new tab**, so checkout
   and login are never trapped inside the frame.

Because it reads live data, updating a class in Tandava updates every site the
widget is embedded on — instantly.

---

## Security & privacy

- Read-only, public data only. No tokens or keys are exposed in the snippet.
- The public schedule comes from a `SECURITY DEFINER` RPC that returns only
  safe columns for *future* classes of a *discoverable* studio
  (migration `00016_public_schedule_read.sql`) — the `class_occurrences` table
  itself stays participants-only, so internal fields and history aren't exposed.
- The iframe is isolated from your site's CSS and JavaScript.

---

## SEO note

Iframe-embedded content isn't indexed as part of your host site. If you want
search-indexable, Tandava-hosted pages, use the **Landing Pages** builder
(`/manage/landing-pages`) — the two are complementary.

---

## Implementation reference

| Piece | Location |
|-------|----------|
| Loader script (iframe) | `public/embed.js` |
| Web Component (no iframe) | `public/widget.js` (`<tandava-schedule>`) |
| Embed pages | `src/pages/embed/` (`EmbedSchedule`, `EmbedEvent`, `EmbedLayout`) |
| Routes | `/embed/schedule/:slug`, `/embed/event/:id` (in `src/App.tsx`) |
| Public read RPC | `get_public_schedule()` in `supabase/migrations/00016_public_schedule_read.sql` |
| Snippet generator | `/manage/embed` (`src/pages/manage/EmbedSettings.tsx`) |
| Booking links + QR | `/manage/share` (`src/pages/manage/ShareLinks.tsx`), `src/lib/booking/shareLinks.ts` |
| Studio prefill RPC | `get_my_studio()` in `supabase/migrations/00020_my_studio.sql` |
