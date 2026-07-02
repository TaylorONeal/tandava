import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const OUT_DIR = join(process.cwd(), "node_modules", ".cache", "tandava-postbuild");
const tasks = ["generate-sitemap.ts", "prerender-blog.ts"];

mkdirSync(OUT_DIR, { recursive: true });

for (const task of tasks) {
  const outfile = join(OUT_DIR, task.replace(/\.ts$/, ".mjs"));

  await build({
    entryPoints: [join("scripts", task)],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    sourcemap: "inline",
    logLevel: "silent",
  });

  await import(pathToFileURL(outfile).href);
}

rmSync(OUT_DIR, { recursive: true, force: true });
