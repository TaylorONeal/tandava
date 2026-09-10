# Blog content

Each `.md` file in this folder is one blog post. Posts are loaded at build time
(`src/lib/blog.ts`), rendered from markdown, and surfaced at `/blog`,
`/blog/category/:category`, and `/blog/:slug`.

> The blog is **built but not live**. While `BLOG_PUBLISHED` is `false` in
> [`src/config/blog.ts`](../../config/blog.ts), every blog page renders with
> `noindex`, is excluded from the sitemap, and is not linked from the main app
> nav. Flip that flag to `true` and rebuild to launch.

## Frontmatter contract

Every post starts with a YAML frontmatter block:

```md
---
title: "Your Post Title"            # required
slug: "your-post-title"             # optional — defaults to the filename
description: "One- or two-sentence summary (~155 chars) for search + previews."
category: "guides"                  # required — must match a slug in src/config/blog.ts
tags: ["scheduling", "operations"] # optional
author: "Jane Doe"                  # optional — defaults to "Tandava Team"
authorTitle: "Studio Operations"   # optional
date: 2026-06-01                    # required — publish date (YYYY-MM-DD)
updated: 2026-06-10                 # optional — last-updated date
image: "/blog/images/your-post.jpg" # optional — hero + Open Graph image
featured: true                      # optional — promotes to the index hero
draft: false                        # optional — drafts are hidden in production
---

Markdown body goes here. Use `##` / `###` headings for structure (good for SEO
and answer engines). The first `#` H1 is rendered as the page title for you, so
start the body at `##`.
```

## Categories

Valid `category` values live in [`src/config/blog.ts`](../../config/blog.ts)
(`BLOG_CATEGORIES`). To add or rename a category, edit that list — the nav,
category pages, and sitemap pick it up automatically. An unknown category logs
a build warning and the post still renders under the raw slug.

## SEO / AEO notes

- One **H1** per post (the title) is rendered automatically; write the body in
  `##`/`###` so headings map cleanly for crawlers and answer engines.
- `description` becomes the meta description and Open Graph/Twitter summary.
- Each post emits `BlogPosting` + `BreadcrumbList` JSON-LD.
- For Answer Engine Optimization, structure content as clear questions and
  concise answers; a `FAQPage` schema helper is available
  (`faqSchema` in `src/lib/structured-data.ts`) if you want to wire FAQ blocks.

## Images

Put hero/inline images in `public/blog/images/` and reference them with an
absolute path, e.g. `image: "/blog/images/your-post.jpg"`.

## The starter posts

`getting-started-class-schedule.md` and `studio-retention-levers.md` are
evergreen starter posts so the section isn't empty. Edit or delete them freely.
