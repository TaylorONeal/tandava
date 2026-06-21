# Blog Architecture

The blog is a markdown-driven, SEO/AEO-oriented content section that lives
alongside the app but uses its own brand-level layout (not the studio app
chrome). It is **built but not yet launched** — see "Going live" below.

## Status

`BLOG_PUBLISHED` in [`src/config/blog.ts`](../../src/config/blog.ts) is the
master switch. While it is `false`:

- every blog page renders `<meta name="robots" content="noindex, nofollow">`,
- the blog is excluded from `sitemap.xml`,
- the blog is **not** linked from the main app navigation.

The routes and pages still work, so the section can be previewed before launch.

## How content flows

```
src/content/blog/*.md        Authoring (frontmatter + markdown)
        │
        ├── src/lib/blog-parse.ts   Pure parser: frontmatter (js-yaml) +
        │                           markdown→HTML (marked) + reading time.
        │                           Isomorphic — used by app AND build scripts.
        │
        ├── src/lib/blog.ts         Browser loader: import.meta.glob → posts,
        │                           query helpers (by slug, category, related…).
        │
        └── scripts/load-blog-posts.ts   Node loader: reads files from disk,
                                         reuses the same parser.
```

## Routes (`src/App.tsx`)

| Path                       | Page                              |
| -------------------------- | --------------------------------- |
| `/blog`                    | `src/pages/Blog.tsx`              |
| `/blog/category/:category` | `src/pages/blog/BlogCategory.tsx` |
| `/blog/:slug`              | `src/pages/blog/BlogPost.tsx`     |

`/blog/category/:category` is more specific than `/blog/:slug`, so there is no
routing conflict.

## Categories

Categories are the blog's primary "sections" and create topical SEO silos with
their own landing pages. The canonical list is `BLOG_CATEGORIES` in
`src/config/blog.ts`. Each post references one by slug in its frontmatter.

## SEO & AEO

- **Per-page metadata** via `SEOHead` (`react-helmet-async`): title, meta
  description, canonical, Open Graph (`article` for posts), Twitter cards.
- **Structured data** (`src/lib/structured-data.ts`):
  `blogPostingSchema`, `blogSchema`, `breadcrumbSchema`, and `faqSchema` for
  Answer Engine Optimization.
- **Static prerendering (SSG):** `scripts/prerender-blog.ts` runs in `postbuild`
  and writes a real HTML snapshot for every blog URL into `dist/blog/...` with
  page-specific head tags + JSON-LD and the article HTML inside `#root`.
  Crawlers and link-preview bots get HTML at the URL; React (`createRoot`)
  replaces `#root` on load. This is what makes the SPA blog crawlable and
  backlink-ready.

## Authoring

See [`src/content/blog/README.md`](../../src/content/blog/README.md) for the
frontmatter contract, or use the **blog-post** skill
(`.claude/skills/blog-post/`). Drafts (`draft: true`) are visible in `npm run
dev` but hidden in production builds.

## Going live (launch checklist)

1. Set `BLOG_PUBLISHED = true` in `src/config/blog.ts`.
2. Add a "Blog" link to the main nav (`src/components/layout/AppLayout.tsx`)
   and/or marketing pages, plus the `blog` i18n key.
3. `npm run build` — this adds `/blog` URLs to `sitemap.xml` and drops `noindex`
   from the prerendered snapshots.
4. Submit the updated sitemap and validate a post in Google's Rich Results Test.
