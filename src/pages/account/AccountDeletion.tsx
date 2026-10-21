import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDeletionRequest, requestAccountDeletion } from '@/lib/accountDeletion';

export function AccountDeletion({ userId }: { userId: string }) {
  const client = useQueryClient();
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = ['account-deletion', userId];
  const request = useQuery({ queryKey: key, queryFn: getDeletionRequest, retry: false });
  const submit = async () => {
    setBusy(true); setError('');
    try { client.setQueryData(key, await requestAccountDeletion(confirmation)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Request could not be verified. Refresh before retrying.'); }
    finally { setBusy(false); }
  };
  return <Card>
    <CardHeader><CardTitle>Delete account</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm">Request deletion of your Tandava account and personal data. Financial and legally required records may need to be retained. This request does not cancel studio subscriptions or upcoming bookings; manage these separately before requesting deletion.</p>
      {request.data ? <div role="status" className="text-sm">
        <p>Deletion request: {request.data.status}. Reference: {request.data.id}</p>
        <p>Submitted {new Date(request.data.requested_at).toLocaleDateString()}. {request.data.status !== 'completed' && 'Your account remains active until processing is complete.'}</p>
      </div> : <>
        <p className="text-sm">Sign in again before confirming. Sole studio owners must first transfer ownership to another active owner.</p>
        {request.isError ? <p role="alert">Deletion requests are unavailable. Please try again later.</p> : <>
          <Label htmlFor="deletion-confirmation">Type DELETE to request account deletion</Label>
          <Input id="deletion-confirmation" autoComplete="off" value={confirmation} onChange={e => setConfirmation(e.target.value)} />
          <Button variant="destructive" disabled={busy || request.isLoading || confirmation !== 'DELETE'} onClick={submit}>{busy ? 'Submitting…' : 'Request account deletion'}</Button>
        </>}
      </>}
      {error && <p role="alert">{error}</p>}
    </CardContent>
  </Card>;
}
