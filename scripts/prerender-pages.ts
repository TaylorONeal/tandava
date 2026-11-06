/**
 * Marketing-page prerenderer and llms.txt writer. Runs last in postbuild.
 *
 * 1. Copies the pristine SPA shell to dist/app.html. vercel.json rewrites every
 *    unknown path to /app.html, which frees dist/index.html to carry the home
 *    page's own HTML. This copy must succeed, so it is not wrapped in a catch.
 * 2. Writes static HTML (head, JSON-LD, body text) for the search landing
 *    pages and /for-studios, same pattern as prerender-tools.ts.
 * 3. On the hosted product (backend configured, not demo, home mode
 *    "platform"), writes the home page into dist/index.html and llms.txt.
 *
 * Copy comes from src/content/marketing/pages.ts, so crawlers, agents and the
 * React pages read the same words. The App Store state comes from
 * VITE_STUDIO_APP_LIVE (src/config/studioApp.ts).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "fs";
import { resolve, join } from "path";
import { isStudioAppLive, STUDIO_APP, studioAppAvailability } from "../src/config/studioApp";
import {
  appStatusPhrase,
  HOME_FAQ_IDS,
  homeContent,
  landingPages,
  STUDIO_APP_FEATURES,
  WEB_FEATURES,
  type MarketingPage,
} from "../src/content/marketing/pages";
import { homeLd, landingLd, REPO_URL, SUPPORT_EMAIL } from "../src/content/marketing/schema";
import { helpFor } from "../src/content/help";
import { parseHomeMode } from "../src/lib/homeMode";

const SITE_URL = process.env.VITE_APP_URL || "https://tandavastudio.com";
const SITE_NAME = process.env.VITE_APP_NAME || "Tandava";
const DIST = resolve(process.cwd(), "dist");
const TEMPLATE_PATH = join(DIST, "index.html");
const SHELL_PATH = join(DIST, "app.html");
const ROOT_FILLED = '<div id="root"><nav aria-label="Site">';
const SIGNUP = "/auth/register?intent=studio&amp;next=%2Fmanage%2Fonboarding";

const live = isStudioAppLive(process.env.VITE_STUDIO_APP_LIVE);

export function isHostedPlatformBuild(env: Record<string, string | undefined>): boolean {
  return (
    Boolean(env.VITE_SUPABASE_URL) &&
    env.VITE_DEMO_MODE !== "true" &&
    parseHomeMode(env.VITE_HOME_MODE) === "platform"
  );
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

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
  canonicalPath: string;
  image: string;
  jsonLd: Record<string, unknown>[];
}

function buildHead(m: HeadMeta): string {
  const fullTitle = `${m.title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${m.canonicalPath}`;
  const image = m.image.startsWith("http") ? m.image : `${SITE_URL}${m.image}`;
  const ld = m.jsonLd
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`)
    .join("\n    ");
  return `<title>${esc(fullTitle)}</title>
    <meta name="description" content="${esc(m.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:title" content="${esc(fullTitle)}" />
    <meta property="og:description" content="${esc(m.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${esc(SITE_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(fullTitle)}" />
    <meta name="twitter:description" content="${esc(m.description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    ${ld}`;
}

function render(template: string, meta: HeadMeta, bodyHtml: string): string {
  let html = stripDefaultHead(template);
  html = html.replace(/<\/head>/i, () => `    ${buildHead(meta)}\n  </head>`);
  if (!html.includes("<!-- /root")) {
    throw new Error("index.html lost its <!-- /root --> marker; prerendered pages would ship without content");
  }
  return html.replace(/<div id="root">[\s\S]*?<\/div>(<!-- \/root)/i, (_m, marker: string) => `<div id="root">${bodyHtml}</div>${marker}`);
}

function writeAt(routePath: string, html: string) {
  if (routePath === "/") {
    writeFileSync(TEMPLATE_PATH, html, "utf-8");
    return;
  }
  const dir = join(DIST, routePath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html, "utf-8");
}

const list = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;

const SITE_NAV = `<nav aria-label="Site"><ul>
  <li><a href="/">Tandava for studios</a></li>
  <li><a href="/studio-app">${esc(STUDIO_APP.name)}, the check-in app</a></li>
  <li><a href="/yoga-studio-software">Yoga studio software</a></li>
  <li><a href="/class-booking-software">Class booking software</a></li>
  <li><a href="/open-source">Open source</a></li>
  <li><a href="/discover">Find a class</a></li>
  <li><a href="/support">Support</a></li>
</ul></nav>`;

function appStatusHtml(): string {
  return live
    ? `<p><a href="${esc(STUDIO_APP.appStoreUrl)}">Download ${esc(STUDIO_APP.name)} on the App Store</a></p>`
    : `<p>${esc(STUDIO_APP.name)}: ${esc(studioAppAvailability(false))}.</p>`;
}

function homeBody(): string {
  const c = homeContent(live);
  const faq = helpFor("owner", HOME_FAQ_IDS)
    .map((f) => `<h3>${esc(f.question)}${f.status === "planned" ? " (planned)" : ""}</h3>${f.answer.split("\n").map((p) => `<p>${esc(p)}</p>`).join("")}`)
    .join("");
  return `${SITE_NAV}<main>
    <p>${esc(c.eyebrow)}</p>
    <h1>${esc(c.h1)}</h1>
    <p>${esc(c.intro)}</p>
    <p><a href="${SIGNUP}">Set up your studio</a> · <a href="/demo">Look around a demo studio</a></p>
    <p>${esc(c.finePrint)}</p>
    <h2>How it works</h2>
    <ol>${c.steps.map((s) => `<li><strong>${esc(s.title)}.</strong> ${esc(s.body)}</li>`).join("")}</ol>
    <h2>${esc(c.webCard.heading)}</h2><p>${esc(c.webCard.body)}</p>${list(WEB_FEATURES)}
    <h2>${esc(c.appCard.heading)}</h2><p>${esc(c.appCard.body)}</p>${list(STUDIO_APP_FEATURES)}
    ${appStatusHtml()}
    <h2>${esc(c.pilot.heading)}</h2><p>${esc(c.pilot.body)}</p>
    <h2>Questions studio owners ask</h2>${faq}
    <h2>${esc(c.openSource.heading)}</h2><p>${esc(c.openSource.body)}</p><p><a href="/open-source">${esc(c.openSource.linkLabel)}</a></p>
  </main>`;
}

function landingBody(p: MarketingPage): string {
  const sections = p.sections
    .map((s) => {
      let out = `<h2>${esc(s.heading)}</h2>`;
      if (s.paragraphs) out += s.paragraphs.map((x) => `<p>${esc(x)}</p>`).join("");
      if (s.bullets) out += list(s.bullets);
      if (s.steps) out += `<ol>${s.steps.map((st) => `<li><strong>${esc(st.title)}.</strong> ${esc(st.body)}</li>`).join("")}</ol>`;
      return out;
    })
    .join("");
  const faq = p.faq.length
    ? `<h2>Questions</h2>${p.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}`
    : "";
  const related = `<h2>Read more</h2><ul>${p.related.map((r) => `<li><a href="${esc(r.to)}">${esc(r.label)}</a></li>`).join("")}</ul>`;
  return `${SITE_NAV}<main>
    <p>${esc(p.eyebrow)}</p>
    <h1>${esc(p.h1)}</h1>
    ${p.intro.map((x) => `<p>${esc(x)}</p>`).join("")}
    ${p.isAppPage ? appStatusHtml() : ""}
    <p><a href="${SIGNUP}">Set up your studio</a></p>
    ${sections}${faq}${related}
  </main>`;
}

export function llmsTxt(): string {
  const c = homeContent(live);
  const pages = landingPages(live);
  return `# Tandava

> Tandava is studio management software for yoga, pilates and movement studios: class schedule, drop-ins, class packs, memberships, online booking, check-in and reports. Studio owners sign up and run their studio on the web at ${SITE_URL}. Staff check members in at the door with ${STUDIO_APP.name}, an iPhone app (${appStatusPhrase(live)}). The code is open source under AGPL-3.0.

Key facts:
- Owners create their studio on the web only: ${SITE_URL}/auth/register?intent=studio. The iPhone app has no sign-up; staff sign in with the email their studio invited.
- ${STUDIO_APP.name} (iPhone, free${live ? "" : `, ${appStatusPhrase(live)}). What it will do at launch`}${live ? ")" : ""}: ${STUDIO_APP_FEATURES.join(" ")}${live ? ` App Store: ${STUDIO_APP.appStoreUrl}` : ""}
- On the web: ${WEB_FEATURES.map((f) => f.toLowerCase()).join("; ")}.
- Students book on the studio's booking page in a phone browser. No student app is needed.
- Status: onboarding first studios (Austin, Texas). ${c.pilot.body.split(". ").slice(-1)[0]}
- Hosted vs self-hosted: most studios use the hosted version. Developers can self-host from ${REPO_URL} (AGPL-3.0); they run their own backups, upgrades and support.
- Made by Purafield Studio LLC, Austin, Texas. Contact: ${SUPPORT_EMAIL}

## For studio owners
- [Home: set up your studio](${SITE_URL}/): ${c.description}
${pages.map((p) => `- [${p.h1}](${SITE_URL}${p.route}): ${p.description}`).join("\n")}
- [Studio profitability calculator](${SITE_URL}/tools/studio-calculator): free break-even and cash flow model for a yoga studio

## For developers
- [Open source and self-hosting](${SITE_URL}/open-source): stack, license, how to run it
- [Source code](${REPO_URL})

## For students
- [Find a class](${SITE_URL}/discover): classes from studios listed on Tandava Discover

## Policies and support
- [Support](${SITE_URL}/support)
- [Privacy](${SITE_URL}/privacy)
- [Terms](${SITE_URL}/terms)
`;
}

function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.log("[prerender-pages] dist/index.html not found, skipping.");
    return;
  }
  // A rerun over an already-prerendered dist must not copy the home page into
  // the shell, or every SPA route would carry the home page's canonical.
  const alreadyRan = existsSync(SHELL_PATH) && readFileSync(TEMPLATE_PATH, "utf-8").includes(ROOT_FILLED);
  const template = readFileSync(alreadyRan ? SHELL_PATH : TEMPLATE_PATH, "utf-8");

  // 1. The SPA fallback. vercel.json depends on it; let a failure fail the build.
  if (!alreadyRan) copyFileSync(TEMPLATE_PATH, SHELL_PATH);

  let written = 0;
  try {
    for (const p of landingPages(live)) {
      writeAt(p.route, render(template, {
        title: p.title,
        description: p.description,
        canonicalPath: p.route,
        image: p.ogImage,
        jsonLd: landingLd(SITE_URL, p, live),
      }, landingBody(p)));
      written++;
    }

    if (isHostedPlatformBuild(process.env)) {
      const c = homeContent(live);
      const homeMeta = { title: c.title, description: c.description, canonicalPath: "/", image: "/og-image.png", jsonLd: homeLd(SITE_URL, live) };
      const homeHtml = render(template, homeMeta, homeBody());
      writeAt("/for-studios", homeHtml);
      writeAt("/", homeHtml);
      writeFileSync(join(DIST, "llms.txt"), llmsTxt(), "utf-8");
      written += 2;
      console.log("[prerender-pages] hosted build: home prerendered, llms.txt written.");
    }
  } catch (err) {
    console.error("[prerender-pages] failed, continuing build:", err);
  }
  console.log(`[prerender-pages] app.html written; ${written} marketing pages prerendered (App Store ${live ? "live" : "coming soon"}).`);
}

main();
