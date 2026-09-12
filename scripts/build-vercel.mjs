import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Only the public editorial site opts in automatically. Forks stay product-only.
export function isMarketingDeployment(env) {
  return env.VERCEL === "1"
    && env.VERCEL_PROJECT_PRODUCTION_URL === "tandavastudio.com";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const marketing = isMarketingDeployment(process.env);
  console.log(`Building Tandava ${marketing ? "marketing site with blog game" : "product without blog game"}`);
  const result = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    env: { ...process.env, VITE_BLOG_GAMES: String(marketing) },
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
  const check = spawnSync(process.execPath, [
    "scripts/check-blog-game-build.mjs", marketing ? "marketing" : "product",
  ], { stdio: "inherit" });
  process.exit(check.status ?? 1);
}
