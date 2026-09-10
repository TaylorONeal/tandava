import { describe, expect, it } from 'vitest';
import { normalizeHostname, resolveStudioDomain, validateStudioSlug } from './domains';
import { canTransitionProvisioning, getLaunchBlockers, type StudioReadiness } from './readiness';

describe('studio address boundaries', () => {
  it('normalizes addresses without inventing a different slug', () => {
    expect(validateStudioSlug(' Lotus-Yoga ')).toEqual({ slug: 'lotus-yoga', error: null });
    expect(normalizeHostname(' LOTUS.example.com. ')).toBe('lotus.example.com');
  });
  it.each(['admin', 'api', 'a', '-lotus', 'lotus-', 'lotus.yoga', 'lotus yoga', 'a'.repeat(64)])('rejects invalid or reserved slug %s', value => {
    expect(validateStudioSlug(value).error).not.toBeNull();
  });
  it.each(['https://lotus.example.com', 'lotus.example.com/path', 'lotus.example.com:443', 'lotus.example.com,evil.com', 'lotus..com', '*.example.com'])('rejects malformed host %s', value => {
    expect(normalizeHostname(value)).toBeNull();
  });
  const domain = { hostname: 'lotus.example.com', studioId: 'studio-a', verified: true, active: true };
  it('resolves only exact verified mappings, including later custom domains', () => {
    expect(resolveStudioDomain(domain.hostname, 'example.com', [domain])).toEqual({ kind: 'studio', studioId: 'studio-a' });
    expect(resolveStudioDomain('example.com', 'example.com', [])).toEqual({ kind: 'platform' });
    expect(resolveStudioDomain('classes.lotus.org', 'example.com', [{ ...domain, hostname: 'classes.lotus.org' }])).toEqual({ kind: 'studio', studioId: 'studio-a' });
  });
  it('does not fall back to another tenant for unknown, inactive, ambiguous or spoofed hosts', () => {
    for (const host of ['other.example.com', 'lotus.example.com.evil.com']) {
      expect(resolveStudioDomain(host, 'example.com', [domain])).toEqual({ kind: 'not_found' });
    }
    for (const entries of [[{ ...domain, active: false }], [{ ...domain, verified: false }], [domain, { ...domain, studioId: 'studio-b' }]]) {
      expect(resolveStudioDomain(domain.hostname, 'example.com', entries)).toEqual({ kind: 'not_found' });
    }
  });
});

describe('hosted launch gates', () => {
  const ready: StudioReadiness = {
    emailVerified: true, provisioning: 'ready', domainVerified: true, timezoneConfigured: true,
    hasBookableClass: true, hasPrice: true, chargesEnabled: true,
    notificationDeliveryVerified: true, bookingFlowVerified: true, hostingSubscription: 'active',
  };
  it('allows launch only when every gate is satisfied', () => {
    expect(getLaunchBlockers(ready)).toEqual([]);
    for (const key of ['emailVerified', 'domainVerified', 'timezoneConfigured', 'hasBookableClass', 'hasPrice', 'chargesEnabled', 'notificationDeliveryVerified', 'bookingFlowVerified'] as const) {
      expect(getLaunchBlockers({ ...ready, [key]: false })).toHaveLength(1);
    }
  });
  it.each(['none', 'trialing', 'past_due', 'canceled'] as const)('blocks public paid bookings for %s hosting', hostingSubscription => {
    expect(getLaunchBlockers({ ...ready, hostingSubscription })).toContain('activate_hosting');
  });
  it('keeps payment readiness independent of hosting payment', () => {
    expect(getLaunchBlockers({ ...ready, chargesEnabled: false })).toEqual(['enable_payments']);
  });
  it('requires completed provisioning and supports recoverable retries', () => {
    expect(getLaunchBlockers({ ...ready, provisioning: 'failed' })).toContain('finish_provisioning');
    expect(canTransitionProvisioning('failed', 'provisioning')).toBe(true);
    expect(canTransitionProvisioning('provisioning', 'provisioning')).toBe(true);
    expect(canTransitionProvisioning('requested', 'ready')).toBe(false);
    expect(canTransitionProvisioning('ready', 'requested')).toBe(false);
  });
});
