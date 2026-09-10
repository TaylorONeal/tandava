/** Check the marketing/product boundary against an actual production artifact. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const [mode, directory = 'dist'] = process.argv.slice(2);
assert.ok(['marketing', 'product'].includes(mode), 'Usage: node scripts/check-blog-game-build.mjs marketing|product [output-directory]');
const marketing = mode === 'marketing';
const root = resolve(directory);
const game = join(root, 'page/studio-sprout/index.html');
const article = join(root, 'blog/a-little-room-to-grow/index.html');
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const assets = readdirSync(join(root, 'assets'));
assert.equal(existsSync(game), marketing, 'Standalone game HTML boundary');
assert.equal(existsSync(article), marketing, 'Article boundary');
assert.equal(assets.some(name => name.startsWith('studioSprout')), marketing, 'Game asset boundary');
assert.equal(sitemap.includes('/page/studio-sprout'), false, 'Game must not be discoverable through sitemap');
assert.equal(sitemap.includes('/blog/a-little-room-to-grow'), marketing, 'Article sitemap boundary');
if (marketing) {
  assert.match(readFileSync(game, 'utf8'), /noindex, nofollow/, 'Game must not be indexed');
  assert.match(readFileSync(article, 'utf8'), /\/page\/studio-sprout/, 'Post must link to the game');
} else {
  for (const name of assets.filter(name => /\.(js|css|map)$/.test(name))) {
    assert.doesNotMatch(readFileSync(join(root, 'assets', name), 'utf8'), /Studio Sprout|Plant the first seed/, `Game content leaked into ${name}`);
  }
}
console.log(`PASS ${mode} blog-game build boundary`);
