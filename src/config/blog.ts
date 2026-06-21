/**
 * Blog configuration — shared between the React app and build scripts.
 *
 * IMPORTANT: This module must stay free of Vite-only APIs (no `import.meta`)
 * and browser-only APIs so it can be imported by Node build scripts
 * (sitemap + prerender) AND the browser bundle.
 */

/**
 * Master switch for the blog.
 *
 * While `false` (the default), blog pages render with `noindex` and the blog
 * is excluded from the sitemap and from the main site navigation. The routes
 * and pages still exist so the section can be previewed before launch.
 *
 * To "flip it live": set this to `true`, then rebuild. That removes `noindex`,
 * adds the blog (and every published post) to the sitemap, and lets you link
 * it from the primary nav.
 */
export const BLOG_PUBLISHED = false;

/** Base path for the blog section. */
export const BLOG_BASE_PATH = "/blog";

/** A content category. Categories create SEO silos and landing pages. */
export interface BlogCategoryDef {
  /** URL-safe identifier, e.g. "studio-growth". Referenced in post frontmatter. */
  slug: string;
  /** Human-readable name shown in the UI. */
  name: string;
  /** Short description used on the category landing page + meta description. */
  description: string;
}

/**
 * Canonical category list. Every post's `category` frontmatter must match one
 * of these slugs. Add/rename here; pages and the sitemap pick it up.
 */
export const BLOG_CATEGORIES: BlogCategoryDef[] = [
  {
    slug: "guides",
    name: "Guides & How-Tos",
    description:
      "Practical, step-by-step guides for running and growing a yoga, pilates, or movement studio.",
  },
  {
    slug: "studio-growth",
    name: "Studio Growth",
    description:
      "Marketing, retention, pricing, and operations playbooks to help your studio grow sustainably.",
  },
  {
    slug: "teaching",
    name: "Teaching & Practice",
    description:
      "Ideas on sequencing, class design, and supporting teachers and students on and off the mat.",
  },
  {
    slug: "product-updates",
    name: "Product Updates",
    description:
      "What's new in Tandava — features, improvements, and release notes for studio teams.",
  },
  {
    slug: "open-source",
    name: "Open Source",
    description:
      "Notes on building Tandava in the open: architecture, data ownership, and self-hosting.",
  },
];

/** Look up a category definition by slug. */
export function getCategoryDef(slug: string): BlogCategoryDef | undefined {
  return BLOG_CATEGORIES.find((c) => c.slug === slug);
}

/** Valid category slugs, for frontmatter validation. */
export const BLOG_CATEGORY_SLUGS = BLOG_CATEGORIES.map((c) => c.slug);
