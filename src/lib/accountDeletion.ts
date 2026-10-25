/** Isolated Supabase adapter until this workflow is added to other backend providers. */
import { supabase } from '@/lib/supabase';

export interface DeletionRequest { id: string; requested_at: string; status: 'pending' | 'processing' | 'completed' }
export function parseDeletionRequest(value: unknown): DeletionRequest {
  if (!value || typeof value !== 'object') throw new Error('Deletion request could not be verified. Refresh before retrying.');
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.requested_at !== 'string' || !Number.isFinite(Date.parse(String(row.requested_at))) || !['pending', 'processing', 'completed'].includes(String(row.status))) {
    throw new Error('Deletion request could not be verified. Refresh before retrying.');
  }
  return row as unknown as DeletionRequest;
}
// New RPC is deliberately isolated from generated schema until regeneration.
const client = supabase as unknown as {
  rpc(name: string, args: Record<string, string>): Promise<{ data: unknown; error: { message: string } | null }>;
  from(name: string): { select(columns: string): { maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }> } };
};
export async function getDeletionRequest(): Promise<DeletionRequest | null> {
  const { data, error } = await client.from('account_deletion_requests').select('id,requested_at,status').maybeSingle();
  if (error) throw new Error('Deletion requests are unavailable. Please try again later.');
  return data ? parseDeletionRequest(data) : null;
}
export async function requestAccountDeletion(confirmation: string): Promise<DeletionRequest> {
  if (confirmation !== 'DELETE') throw new Error('Type DELETE to confirm');
  const { data, error } = await client.rpc('request_account_deletion', { p_confirmation: confirmation });
  if (error) throw new Error(error.message);
  return parseDeletionRequest(data);
}
