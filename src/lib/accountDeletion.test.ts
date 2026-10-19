import { describe, expect, it, vi, beforeEach } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({ supabase: { rpc } }));
import { parseDeletionRequest, requestAccountDeletion } from './accountDeletion';
describe('account deletion initiation', () => {
  beforeEach(() => { rpc.mockReset(); });
  it('requires explicit confirmation before calling server', async () => {
    await expect(requestAccountDeletion('delete')).rejects.toThrow('Type DELETE');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('does not claim completion after server rejection', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Sign in again' } });
    await expect(requestAccountDeletion('DELETE')).rejects.toThrow('Sign in again');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('does not automatically retry ambiguous outcomes', async () => {
    rpc.mockImplementation(async () => { throw new Error('Network error'); });
    await expect(requestAccountDeletion('DELETE')).rejects.toThrow('Network error');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('sends no client-selected user ID or processing status', async () => {
    const result = { id: 'ref', requested_at: '2026-10-19T00:00:00Z', status: 'pending' };
    rpc.mockResolvedValue({ data: result, error: null });
    expect(await requestAccountDeletion('DELETE')).toEqual(result);
    expect(rpc).toHaveBeenCalledWith('request_account_deletion', { p_confirmation: 'DELETE' });
  });
  it('rejects unverified success payloads', () => {
    for (const result of [null, {}, { id: 'ref', requested_at: 'date', status: 'deleted' }]) {
      expect(() => parseDeletionRequest(result)).toThrow('could not be verified');
    }
  });
});
