import assert from "node:assert/strict";
import test from "node:test";
import { isMarketingDeployment } from "./build-vercel.mjs";

test("public site's production and preview builds include editorial content", () => {
  for (const VERCEL_ENV of ["production", "preview"]) {
    assert.equal(isMarketingDeployment({ VERCEL: "1", VERCEL_ENV,
      VERCEL_PROJECT_PRODUCTION_URL: "tandavastudio.com" }), true);
  }
});

test("local installs, forks, other hosted projects, and missing metadata stay product-only", () => {
  for (const env of [{}, { VITE_BLOG_GAMES: "true" }, { VERCEL: "1" },
    { VERCEL_PROJECT_PRODUCTION_URL: "tandavastudio.com" },
    { VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "studio.example.com" },
    { VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "tandavastudio.com.example.com" }]) {
    assert.equal(isMarketingDeployment(env), false);
  }
});
