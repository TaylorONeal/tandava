/**
 * Blog prerenderer (lightweight static-snapshot SSG).
 *
 * After `vite build`, this reads the built `dist/index.html` shell and writes a
 * static HTML file for every blog URL (`/blog`, each category, each post) with:
 *   - page-specific <title>, meta description, canonical, Open Graph/Twitter
 *   - JSON-LD (BlogPosting + BreadcrumbList) for SEO + answer engines
 *   - the rendered article HTML inside #root
 *
 * Crawlers and link-preview bots get real HTML at the URL; when a browser loads
 * the page, React (`createRoot`) replaces #root and the SPA takes over.
 *
 * This never throws — any problem is logged and the build continues.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { BLOG_PUBLISHED, BLOG_CATEGORIES, getCategoryDef } from "../src/config/blog";
import { loadPublishedPosts } from "./load-blog-posts";
import { formatBlogDate } from "../src/lib/blog-format";
import type { BlogPost } from "../src/lib/blog-parse";

const SITE_URL = process.env.VITE_APP_URL || "https://tandava.yoga";
const SITE_NAME = process.env.VITE_APP_NAME || "Tandava";
const DIST = resolve(process.cwd(), "dist");
const TEMPLATE_PATH = join(DIST, "index.html");

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip the shell's static SEO tags so per-page ones don't collide. */
function stripDefaultHead(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "");
}

interface HeadMeta {
  title: string;
  description: string;
  path: string;
  ogType: "website" | "article";
  image?: string;
  jsonLd: Record<string, unknown>[];
}

function buildHead(meta: HeadMeta): string {
  const fullTitle = `${meta.title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${meta.path}`;
  const image = meta.image
    ? meta.image.startsWith("http")
      ? meta.image
      : `${SITE_URL}${meta.image}`
    : `${SITE_URL}/og-image.png`;
  const robots = BLOG_PUBLISHED ? "index, follow" : "noindex, nofollow";

  const ld = meta.jsonLd
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join("\n    ");

  return `<title>${esc(fullTitle)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:title" content="${esc(fullTitle)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:type" content="${meta.ogType}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:site_name" content="${esc(SITE_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(fullTitle)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    ${ld}`;
}

function render(template: string, meta: HeadMeta, bodyHtml: string): string {
  let html = stripDefaultHead(template);
  html = html.replace(/<\/head>/i, `    ${buildHead(meta)}\n  </head>`);
  // Replace the #root placeholder content (lazy match stops at the </div>
  // immediately followed by the module <script> Vite injects).
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*<script)/i,
    `<div id="root">${bodyHtml}</div>$1`,
  );
  return html;
}

function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

function blogPostingLd(post: BlogPost) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image
      ? post.image.startsWith("http")
        ? post.image
        : `${SITE_URL}${post.image}`
      : `${SITE_URL}/og-image.png`,
    datePublished: post.date,
    dateModified: post.updated,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
    },
    articleSection: post.categoryName,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
  };
}

function postCardHtml(post: BlogPost): string {
  return `<li><a href="/blog/${esc(post.slug)}"><h3>${esc(post.title)}</h3>` +
    `<p>${esc(post.description)}</p>` +
    `<small>${esc(post.categoryName)} &middot; ${esc(post.author)} &middot; ${esc(
      formatBlogDate(post.date),
    )} &middot; ${post.readingTimeMinutes} min read</small></a></li>`;
}

function listPageBody(heading: string, intro: string, posts: BlogPost[]): string {
  const items = posts.map(postCardHtml).join("\n");
  return `<main><h1>${esc(heading)}</h1><p>${esc(intro)}</p><ul>${items}</ul></main>`;
}

function postPageBody(post: BlogPost): string {
  const cat = getCategoryDef(post.category);
  const crumbs = `<nav aria-label="Breadcrumb"><a href="/blog">Blog</a>${
    cat ? ` &rsaquo; <a href="/blog/category/${esc(cat.slug)}">${esc(cat.name)}</a>` : ""
  }</nav>`;
  return (
    `<main><article>${crumbs}` +
    `<h1>${esc(post.title)}</h1>` +
    (post.description ? `<p>${esc(post.description)}</p>` : "") +
    `<p><span>${esc(post.author)}</span> &middot; ` +
    `<time datetime="${esc(post.date)}">${esc(formatBlogDate(post.date))}</time> &middot; ` +
    `${post.readingTimeMinutes} min read</p>` +
    (post.image ? `<img src="${esc(post.image)}" alt="" />` : "") +
    `<div>${post.html}</div>` +
    `</article></main>`
  );
}

function writePage(routePath: string, html: string) {
  const dir = join(DIST, routePath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html, "utf-8");
}

function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.log("[prerender-blog] dist/index.html not found — skipping.");
    return;
  }

  const template = readFileSync(TEMPLATE_PATH, "utf-8");
  const posts = loadPublishedPosts();
  let count = 0;

  // /blog index
  const indexIntro =
    "Practical guides, studio growth playbooks, and product updates from Tandava.";
  writePage(
    "/blog",
    render(
      template,
      {
        title: "Blog | Studio Growth, Guides & Product Updates",
        description: indexIntro,
        path: "/blog",
        ogType: "website",
        jsonLd: [
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ],
      },
      listPageBody("The Tandava Blog", indexIntro, posts),
    ),
  );
  count++;

  // category pages (only those with posts)
  for (const cat of BLOG_CATEGORIES) {
    const catPosts = posts.filter((p) => p.category === cat.slug);
    if (catPosts.length === 0) continue;
    writePage(
      `/blog/category/${cat.slug}`,
      render(
        template,
        {
          title: `${cat.name} | Tandava Blog`,
          description: cat.description,
          path: `/blog/category/${cat.slug}`,
          ogType: "website",
          jsonLd: [
            breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: cat.name, path: `/blog/category/${cat.slug}` },
            ]),
          ],
        },
        listPageBody(cat.name, cat.description, catPosts),
      ),
    );
    count++;
  }

  // post pages
  for (const post of posts) {
    const cat = getCategoryDef(post.category);
    writePage(
      `/blog/${post.slug}`,
      render(
        template,
        {
          title: post.title,
          description: post.description,
          path: `/blog/${post.slug}`,
          ogType: "article",
          image: post.image,
          jsonLd: [
            blogPostingLd(post),
            breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              ...(cat ? [{ name: cat.name, path: `/blog/category/${cat.slug}` }] : []),
              { name: post.title, path: `/blog/${post.slug}` },
            ]),
          ],
        },
        postPageBody(post),
      ),
    );
    count++;
  }

  console.log(
    `[prerender-blog] Wrote ${count} static page(s)` +
      `${BLOG_PUBLISHED ? "" : " (noindex — blog not yet published)"}.`,
  );
}

try {
  main();
} catch (err) {
  console.warn("[prerender-blog] Skipped due to error:", (err as Error).message);
}
