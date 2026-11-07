import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from './apiError';
describe('API error explanations', () => {
  it('shows the reason a native purchase was rejected', async () => {
    expect(await apiErrorMessage({ message: 'non-2xx status', context: new Response(JSON.stringify({ error: 'Only confirmed in-person services can be purchased in the app' }), { status: 409 }) })).toBe('Only confirmed in-person services can be purchased in the app');
  });
  it('falls back for invalid bodies without hiding the original failure', async () => {
    for (const body of ['not json', '{}', '{"error":{}}', JSON.stringify({ error: 'x'.repeat(501) })]) {
      expect(await apiErrorMessage({ message: 'Request failed', context: new Response(body) })).toBe('Request failed');
    }
    expect(await apiErrorMessage({ message: 'Offline' })).toBe('Offline');
  });
});
