/**
 * Blog markdown parsing — pure, isomorphic functions.
 *
 * Used by both the browser loader (`src/lib/blog.ts`) and the Node build
 * scripts (sitemap + prerender). Keep this free of `import.meta` and DOM APIs.
 */

import { marked } from "marked";
import yaml from "js-yaml";
import { getCategoryDef, BLOG_CATEGORY_SLUGS } from "../config/blog";

export interface BlogPost {
  /** URL slug (from frontmatter `slug` or the filename). */
  slug: string;
  title: string;
  /** Meta description / excerpt (~155 chars recommended). */
  description: string;
  /** Category slug; must exist in BLOG_CATEGORIES. */
  category: string;
  /** Resolved human-readable category name. */
  categoryName: string;
  tags: string[];
  author: string;
  authorTitle?: string;
  /** Publish date as ISO `YYYY-MM-DD`. */
  date: string;
  /** Last-updated date as ISO `YYYY-MM-DD` (defaults to `date`). */
  updated: string;
  /** Hero / Open Graph image URL (absolute path or full URL). */
  image?: string;
  featured: boolean;
  draft: boolean;
  /** Rendered HTML body. */
  html: string;
  readingTimeMinutes: number;
  wordCount: number;
}

interface RawFrontmatter {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[] | string;
  author?: string;
  authorTitle?: string;
  date?: string | Date;
  updated?: string | Date;
  image?: string;
  featured?: boolean;
  draft?: boolean;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Configure marked once (GitHub-flavored, no smartypants surprises). */
marked.setOptions({ gfm: true, breaks: false });

function toIsoDate(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  // Already a string like "2026-06-01" or full ISO — keep the date portion.
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return String(value);
}

function normalizeTags(tags: string[] | string | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function slugFromFileId(fileId: string): string {
  const base = fileId.split("/").pop() ?? fileId;
  return base.replace(/\.mdx?$/i, "");
}

/**
 * Parse a raw markdown file (frontmatter + body) into a BlogPost.
 *
 * @param raw    Full file contents.
 * @param fileId Path or filename — used to derive the slug when not in frontmatter.
 */
export function parsePost(raw: string, fileId: string): BlogPost {
  const match = raw.match(FRONTMATTER_RE);

  let data: RawFrontmatter = {};
  let body = raw;

  if (match) {
    data = (yaml.load(match[1]) as RawFrontmatter) ?? {};
    body = match[2] ?? "";
  }

  const slug = (data.slug || slugFromFileId(fileId)).trim();
  const category = (data.category || "guides").trim();
  const categoryDef = getCategoryDef(category);

  if (!categoryDef && typeof console !== "undefined") {
    console.warn(
      `[blog] Post "${slug}" has unknown category "${category}". ` +
        `Valid categories: ${BLOG_CATEGORY_SLUGS.join(", ")}.`,
    );
  }

  const date = toIsoDate(data.date) ?? new Date().toISOString().slice(0, 10);
  const updated = toIsoDate(data.updated) ?? date;

  const html = (marked.parse(body, { async: false }) as string)
    // Wrap tables so they can scroll horizontally on small screens.
    .replace(/<table>/g, '<div class="blog-table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");

  const wordCount = body
    .replace(/[#>*_`~\-[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  return {
    slug,
    title: data.title?.trim() || slug,
    description: data.description?.trim() || "",
    category,
    categoryName: categoryDef?.name ?? category,
    tags: normalizeTags(data.tags),
    author: data.author?.trim() || "Tandava Team",
    authorTitle: data.authorTitle?.trim() || undefined,
    date,
    updated,
    image: data.image?.trim() || undefined,
    featured: Boolean(data.featured),
    draft: Boolean(data.draft),
    html,
    readingTimeMinutes,
    wordCount,
  };
}

/** Sort newest-first by publish date. */
export function sortByDateDesc(a: BlogPost, b: BlogPost): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}
