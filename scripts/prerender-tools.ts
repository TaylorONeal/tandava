/**
 * Tool-page prerenderer (lightweight static-snapshot SSG).
 *
 * Same shape as prerender-blog.ts: after `vite build`, read the built
 * `dist/index.html` shell and write a static HTML file for each public tool
 * route, carrying page-specific <title>, meta description, canonical,
 * Open Graph/Twitter, JSON-LD, and the article body inside #root.
 *
 * Crawlers and link-preview bots get real HTML at the URL. When a browser loads
 * the page React replaces #root and the interactive calculator takes over.
 *
 * This never throws — any problem is logged and the build continues.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import {
  CALC_ROUTE,
  CALC_TITLE,
  CALC_META_DESCRIPTION,
  CALC_HERO_PROMISE,
  calcStaticHtml,
  calcStructuredData,
} from "../src/content/studioCalculator";

const SITE_URL = process.env.VITE_APP_URL || "https://tandavastudio.com";
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
  jsonLd: Record<string, unknown>[];
}

function buildHead(meta: HeadMeta): string {
  const fullTitle = `${meta.title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${meta.path}`;
  const image = `${SITE_URL}/og-image.png`;

  const ld = meta.jsonLd
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join("\n    ");

  return `<title>${esc(fullTitle)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:title" content="${esc(fullTitle)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:type" content="article" />
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
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*<script)/i,
    `<div id="root">${bodyHtml}</div>$1`,
  );
  return html;
}

function writePage(routePath: string, html: string) {
  const dir = join(DIST, routePath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html, "utf-8");
}

function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.log("[prerender-tools] dist/index.html not found — skipping.");
    return;
  }

  const template = readFileSync(TEMPLATE_PATH, "utf-8");

  writePage(
    CALC_ROUTE,
    render(
      template,
      {
        title: CALC_TITLE.replace(/\s*\(Free\)$/, ""),
        description: CALC_META_DESCRIPTION,
        path: CALC_ROUTE,
        jsonLd: calcStructuredData(SITE_URL),
      },
      `<main>${calcStaticHtml()}<p>${esc(CALC_HERO_PROMISE)}</p></main>`,
    ),
  );

  console.log("[prerender-tools] wrote 1 tool page.");
}

try {
  main();
} catch (err) {
  console.error("[prerender-tools] failed, continuing build:", err);
}
