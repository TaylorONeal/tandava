import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

type FetchHandler = (event: { request: Request; respondWith: (response: Promise<Response>) => void }) => void;

function worker() {
  const handlers = new Map<string, FetchHandler>();
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { addEventListener: (name: string, callback: FetchHandler) => handlers.set(name, callback) },
    URL, Response,
    fetch: async () => new Response('ok'),
    caches: { open: async () => ({ put: async () => {} }) },
  });
  return handlers.get('fetch')!;
}
it('keeps game pages and assets out of installed-app offline handling', () => {
  const handle = worker();
  for (const path of ['/page/studio-sprout', '/page/studio-sprout/', '/assets/studioSprout-abc.js', '/assets/studioSprout-abc.css']) {
    let intercepted = false;
    handle({ request: new Request(`https://tandavastudio.com${path}`), respondWith: () => { intercepted = true; } });
    expect(intercepted).toBe(false);
  }
});
it('preserves normal product asset handling', async () => {
  let response: Promise<Response> | undefined;
  worker()({ request: new Request('https://tandavastudio.com/assets/main-abc.js'), respondWith: value => { response = value; } });
  expect(response).toBeDefined();
  expect((await response!).status).toBe(200);
});
