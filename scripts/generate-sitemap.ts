/**
 * Sitemap Generator
 *
 * Generates a static sitemap.xml for known routes.
 * Run after build: npx tsx scripts/generate-sitemap.ts
 *
 * For dynamic routes (events, instructors), this script would query
 * Supabase for slugs. When Supabase is not configured, it generates
 * only the static routes.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

const SITE_URL = process.env.VITE_APP_URL || "https://tandava.yoga";

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/schedule", priority: "0.9", changefreq: "daily" },
  { path: "/events", priority: "0.8", changefreq: "weekly" },
  { path: "/instructors", priority: "0.8", changefreq: "weekly" },
  { path: "/on-demand", priority: "0.7", changefreq: "weekly" },
];

function generateSitemap(routes: typeof staticRoutes): string {
  const today = new Date().toISOString().split("T")[0];

  const urls = routes
    .map(
      (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

const sitemap = generateSitemap(staticRoutes);
const outputPath = resolve(process.cwd(), "dist", "sitemap.xml");

try {
  writeFileSync(outputPath, sitemap, "utf-8");
  console.log(`Sitemap generated: ${outputPath} (${staticRoutes.length} URLs)`);
} catch {
  // dist/ may not exist yet — write to public/ as fallback
  const fallbackPath = resolve(process.cwd(), "public", "sitemap.xml");
  writeFileSync(fallbackPath, sitemap, "utf-8");
  console.log(`Sitemap generated: ${fallbackPath} (${staticRoutes.length} URLs)`);
}
