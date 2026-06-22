/**
 * Blog content loader (browser).
 *
 * Reads every markdown file in `src/content/blog/` at build time via Vite's
 * `import.meta.glob`, parses it, and exposes query helpers for the pages.
 *
 * Authoring: drop a `.md` file in `src/content/blog/` with frontmatter.
 * See `src/content/blog/README.md` for the frontmatter contract.
 */

import { parsePost, sortByDateDesc, type BlogPost } from "@/lib/blog-parse";
import {
  BLOG_PUBLISHED,
  BLOG_CATEGORIES,
  getCategoryDef,
  type BlogCategoryDef,
} from "@/config/blog";

export type { BlogPost } from "@/lib/blog-parse";

// Eagerly import raw markdown so posts are available synchronously at render.
const rawModules = import.meta.glob("/src/content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const ALL_POSTS: BlogPost[] = Object.entries(rawModules)
  // Skip the authoring guide that lives alongside the posts.
  .filter(([fileId]) => !/\/README\.md$/i.test(fileId))
  .map(([fileId, raw]) => parsePost(raw, fileId))
  // Drafts are hidden in production builds, visible in dev for previewing.
  .filter((post) => import.meta.env.DEV || !post.draft)
  .sort(sortByDateDesc);

/** All visible posts, newest first. */
export function getAllPosts(): BlogPost[] {
  return ALL_POSTS;
}

/** A single post by slug, or undefined. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}

/** Posts in a given category, newest first. */
export function getPostsByCategory(categorySlug: string): BlogPost[] {
  return ALL_POSTS.filter((p) => p.category === categorySlug);
}

/** The featured post (first `featured: true`), falling back to the newest. */
export function getFeaturedPost(): BlogPost | undefined {
  return ALL_POSTS.find((p) => p.featured) ?? ALL_POSTS[0];
}

export interface CategoryWithCount extends BlogCategoryDef {
  count: number;
}

/** All categories that have at least one post, with post counts. */
export function getCategoriesWithCounts(): CategoryWithCount[] {
  return BLOG_CATEGORIES.map((cat) => ({
    ...cat,
    count: ALL_POSTS.filter((p) => p.category === cat.slug).length,
  })).filter((cat) => cat.count > 0);
}

/**
 * Related posts for a given post: same category first, then most recent,
 * excluding the post itself.
 */
export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const sameCategory = ALL_POSTS.filter(
    (p) => p.slug !== post.slug && p.category === post.category,
  );
  const others = ALL_POSTS.filter(
    (p) => p.slug !== post.slug && p.category !== post.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export { BLOG_PUBLISHED, getCategoryDef };
