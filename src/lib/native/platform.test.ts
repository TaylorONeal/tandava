import { describe, it, expect } from 'vitest';
import { nativeHome, nativeLink, parseNativeApp, blocksNativePayment, authRedirectOrigin } from './platform';
describe('native app separation', () => {
  it('keeps members in member flows even when also an owner', () => {
    expect(nativeHome('member', true, true, true)).toBe('/my-schedule');
    expect(nativeHome('member', false, false, false)).toBe('/discover');
  });
  it('routes active studio roles without inventing access', () => {
    expect(nativeHome('studio', false, false, false)).toContain('/auth/login');
    expect(nativeHome('studio', true, true, false)).toBe('/manage');
    expect(nativeHome('studio', true, false, true)).toBe('/teach/schedule');
    expect(nativeHome('studio', true, false, false)).toBe('/account');
  });
  it('rejects arbitrary deep link hosts, schemes and privileged routes', () => {
    for (const url of ['javascript:alert(1)','https://evil.test/s/studio','https://tandavastudio.com/manage','https://user@tandavastudio.com/s/studio']) expect(nativeLink(url)).toBeNull();
    expect(nativeLink('https://tandavastudio.com/s/studio?class=abc')).toBe('/s/studio?class=abc');
    expect(parseNativeApp('wrong')).toBeNull();
  });
});

it('sends native email recovery and confirmation to a reachable hosted origin', () => {
  for (const app of ['member', 'studio'] as const) {
    expect(authRedirectOrigin(app, 'capacitor://localhost')).toBe('https://tandavastudio.com');
    expect(authRedirectOrigin(app, 'null')).toBe('https://tandavastudio.com');
  }
  expect(authRedirectOrigin(null, 'https://self-hosted.example')).toBe('https://self-hosted.example');
  expect(authRedirectOrigin(null, 'http://localhost:8080')).toBe('http://localhost:8080');
});

it('blocks ambiguous native payments without disabling web or other APIs', () => {
  for (const target of ['member', 'studio'] as const) {
    for (const endpoint of ['stripe-checkout', 'express-book', 'stripe-portal']) {
      expect(blocksNativePayment(target, endpoint)).toBe(true);
      expect(blocksNativePayment(null, endpoint)).toBe(false);
    }
    expect(blocksNativePayment(target, 'cancel-class')).toBe(false);
  }
});
