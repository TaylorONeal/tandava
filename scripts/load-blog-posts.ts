/**
 * Node-side blog loader for build scripts (sitemap + prerender).
 *
 * Mirrors the browser loader in `src/lib/blog.ts`, but reads markdown from disk
 * instead of using Vite's `import.meta.glob`. Both share the same parser
 * (`src/lib/blog-parse.ts`) so output stays identical.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { parsePost, sortByDateDesc, type BlogPost } from "../src/lib/blog-parse";

const CONTENT_DIR = resolve(process.cwd(), "src", "content", "blog");

/** All non-draft posts, newest first. */
export function loadPublishedPosts(): BlogPost[] {
  if (!existsSync(CONTENT_DIR)) return [];

  return readdirSync(CONTENT_DIR)
    .filter((f) => /\.mdx?$/i.test(f) && !/^README\.md$/i.test(f))
    .map((file) => {
      const raw = readFileSync(join(CONTENT_DIR, file), "utf-8");
      return parsePost(raw, file);
    })
    .filter((post) => !post.draft)
    .sort(sortByDateDesc);
}
