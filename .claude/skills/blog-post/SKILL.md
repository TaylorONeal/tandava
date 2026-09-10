---
name: blog-post
description: >-
  Create or edit a Tandava blog post. Use when the user wants to draft, write,
  or publish a blog article, turn notes/an outline into a post, or add content
  to the /blog section. Produces a single SEO/AEO-optimized markdown file in
  src/content/blog/ with valid frontmatter.
---

# Blog post creator

Turn a topic, outline, or rough draft into a publish-ready markdown post for the
Tandava blog. Output is a single `.md` file in `src/content/blog/`.

> This is a starter skill. If you have a preferred blog-post workflow (e.g. the
> one used for cuecraft), drop its instructions in here — the frontmatter
> contract below is what the Tandava blog actually reads, so keep that intact.

## Before writing

1. Read `src/content/blog/README.md` (the frontmatter contract) and
   `src/config/blog.ts` (the valid category slugs). Never invent a category —
   pick an existing slug or ask whether to add one.
2. Confirm with the user (only if unknown): **topic/angle**, **target reader**,
   **primary keyword**, and **category**. If they gave a draft, infer these.

## Frontmatter (required shape)

```md
---
title: "Specific, benefit-driven title (≤ 60 chars is ideal for SERPs)"
slug: "url-safe-kebab-case"            # stable; don't change after publishing
description: "1–2 sentences, ~150–155 chars. This is the meta description."
category: "guides"                      # MUST match a slug in src/config/blog.ts
tags: ["topic", "subtopic"]
author: "Tandava Team"
authorTitle: "Studio Operations"        # optional
date: YYYY-MM-DD                         # today's date for new posts
featured: false                          # true only if it should headline /blog
draft: true                              # start as draft; flip to false to show
---
```

## Writing rules (SEO + AEO)

- **One H1** is rendered from `title` automatically. Start the body at `##`.
- Open with a 2–3 sentence answer to the reader's core question (answer-engine
  friendly — put the payoff up top, not after 600 words of preamble).
- Use descriptive `##`/`###` headings phrased the way people search/ask.
- Prefer short paragraphs, lists, and concrete steps over fluff.
- Include the primary keyword naturally in the title, first paragraph, and at
  least one `##`.
- Where the topic suits it, include a short FAQ section ("## Frequently asked
  questions") with clear Q/A pairs — this is prime AEO material and can later be
  wired to `faqSchema` in `src/lib/structured-data.ts`.
- End with a relevant call to action (usually pointing to the demo or a related
  post). Internally link to other `/blog/...` posts where natural.
- Aim for 700–1,400 words unless the user asks otherwise. Don't pad.
- Keep claims honest and specific to studios; no invented statistics.

## Images (optional)

If the user provides a hero image, place it in `public/blog/images/` and set
`image: "/blog/images/<file>"`. Otherwise omit `image` (the default OG image is
used).

## After writing

1. Save to `src/content/blog/<slug>.md`.
2. Note that the post is a **draft** (hidden in production) until `draft: false`,
   and that the whole blog stays `noindex` until `BLOG_PUBLISHED` is set to
   `true` in `src/config/blog.ts`.
3. Tell the user how to preview: `npm run dev`, then visit `/blog` (drafts are
   visible in dev) or `/blog/<slug>`.
