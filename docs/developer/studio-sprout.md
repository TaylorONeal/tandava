# Studio Sprout: blog-only game

Studio Sprout is a positive, six-week studio-economics game for prospective studio owners reading the public Tandava blog. It is not a product feature.

## Entry and build boundary

- Article: `/blog/a-little-room-to-grow`, authored in `editorial/posts/a-little-room-to-grow.md` and rendered by the existing blog components/parser/prerenderer.
- Game: `/page/studio-sprout/`, a standalone HTML/React entry with its own CSS, no app providers, authentication, demo data, or studio operations.
- The article is the **only site content linking to the game**. No game link is added to landing-page, demo, dashboard, product, or blog navigation. The game has `noindex, nofollow` and is absent from the sitemap.
- Normal `npm run build` / `npm run dev` do not include the game or its article. The game is not imported into `src/App.tsx`.
- `npm run build:marketing` / `npm run dev:marketing` explicitly opt in using `VITE_BLOG_GAMES=true`. Use this command only for the public marketing deployment. Normal GitHub/self-hosted builds retain their standard command.
- The service worker bypasses the game route and its dedicated JS/CSS, so visiting from the marketing blog does not add the game to the installed app’s offline cache.
- Source remains in the repository for maintainers, but no game JS, CSS, HTML, or entry post is emitted into a normal installation build.
- The Vite HTML output is placed at `page/studio-sprout/index.html`; an explicit Vercel rewrite precedes the SPA fallback. In standard builds the destination does not exist.
- This is a discovery/build boundary, not access control: someone with a direct game URL can visit it on a marketing deployment. No referrer check, login, or tracking is used.

The opt-in uses the process environment for both Vite and postbuild so browser content, prerendered pages, and sitemap agree. Use the supplied marketing commands or set `VITE_BLOG_GAMES=true` in the deployment environment. A local `.env` file cannot enable this feature.

## Design and financial model

Based on the existing `yoga-studio-profit-and-break-even` post, with links to the calculator, retention and discovery-platform posts. The game shares concepts, **not calculator numbers or its EBITDA metric**. All amounts are fictional USD.

Choose a 14/20/28-mat room with $900/$1,150/$1,450 weekly rent and overhead, then six turns of schedule, realized ticket yield, and one initiative. Teacher pay follows scheduled classes. Owner pay is always included. Capacity caps visits. Recurring demand grows only in subsequent turns. A disclosed neighborhood event affects each week's visits. Forecasts and results use the same pure function.

Game cash = prior cash + class revenue + workshop revenue − rent/overhead − teacher pay − owner pay − initiative cost. Negative cash explicitly shows additional funding needed; play continues as an educational sandbox. No tax, processing, financing, or cash-timing claims.

Warm feedback replaces failure screens. Three achievable badges, a growing illustrated room, immediate pressed states, brief result animation, and replay encourage comparison. No timers, randomized punishments, leaderboard, account, telemetry, or persistent storage.

## Reference review

Reviewed current primary guidance and local examples:

- [Apple: Game controls](https://developer.apple.com/design/human-interface-guidelines/game-controls): direct touch controls, visible interaction feedback.
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/): keyboard operation, no essential color-only feedback, readable instructions, reduced motion.
- [Google: Lessons learned building games](https://developers.google.com/assistant/games/guide/lessons-learned): teach the goal through the opening, immediate pressed feedback.
- Cuecraft/Yogaflow `F626-socialnumbers-game-feel.md`, `ResultReveal.tsx`: pre-decision forecasts, tradeoffs, a warm reveal, reduced motion.
- Thinkermetrics `src/components/game/ResultReveal.tsx`: tie result feedback to a concrete learning concept. Adapted the pattern, not code or dependencies.

No claim of measured retention or “world-class fun” is made; playtesting with real readers remains useful.

## Verification

Run `npm run test:editorial` and `npm run typecheck:editorial`. Engine tests cover cash reconciliation, schedule-based costs, workshop separation, capacity, rooms, delayed growth, full seasons, invalid plans, and all 135 room/plan combinations across six turns.

Browser coverage: 1440px desktop, 390px phone, 320px narrow phone; complete seasons, all initiatives, forecasts versus actual cash, recap, replay, room changes, keyboard activation, reduced motion, no overflow or game console errors. The web-game skill client is also run; `window.render_game_to_text()` exposes game state. `advanceTime()` never commits a turn because gameplay has no clock.

Verify both builds after routing changes: marketing must contain the article/game and product must contain neither. Serve the production marketing output and follow the actual blog link, since dev middleware alone cannot verify the production HTML path.

Artifact checks: after a normal build run `npm run check:blog-game-build -- product`; after a marketing build run `npm run check:blog-game-build -- marketing`. The checker verifies output files, bundled source maps, article discoverability, and the game’s noindex boundary.

### Verified results

- Existing suite: 112 tests pass. Editorial suite: 10 tests pass (eight economics, two service-worker boundaries).
- Editorial strict TypeScript and targeted ESLint pass.
- Standard and marketing production builds pass; both artifact boundary checks pass, including product source-map exclusion.
- Production browser flow and active service-worker cache exclusion pass. Inspected intro, planning, reveal, article, and completion screenshots.
- Repository-wide TypeScript still reports errors in untouched demo data, Supabase adapter, Community, Import, Tasks, teacher Schedule, and database types. These are outside this change; the build and runtime game checks pass.
- Product navigation is unchanged. Vercel uses `scripts/build-vercel.mjs`: only `VERCEL=1` with `VERCEL_PROJECT_PRODUCTION_URL=tandavastudio.com` enables the marketing build (including that project’s previews). Other projects and missing metadata default to product-only, even if a stale game flag is present. The script verifies the resulting artifact boundary before deployment succeeds. Normal local builds remain unchanged.

### Publishing

Merge to main to publish through the existing Vercel GitHub integration. The repository build command scopes editorial content to the public domain using [Vercel system metadata](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_project_production_url), without requiring a dashboard override. Verify `/blog` → `/blog/a-little-room-to-grow` → `/page/studio-sprout/` after deployment. Run `node --test scripts/build-vercel.test.mjs` to check deployment selection.
