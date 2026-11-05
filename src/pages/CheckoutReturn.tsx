import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { checkoutReturnScheme } from '@/lib/native/checkout';
import { parseNativeApp } from '@/lib/native/platform';

export function CheckoutReturn() {
  const [params] = useSearchParams();
  const app = parseNativeApp(params.get('app'));
  return <main className="min-h-dvh bg-background px-6 flex items-center justify-center">
    <SEOHead noindex />
    <div className="max-w-sm text-center space-y-5">
      <p className="text-sm text-muted-foreground">Tandava</p>
      <h1 className="text-3xl font-semibold">Return to your practice</h1>
      <p className="text-muted-foreground">Your booking and purchase status are in the app. Payment confirmation can take a moment.</p>
      {app && <Button asChild className="w-full"><a href={checkoutReturnScheme(app)}>Return to {app === 'studio' ? 'Tandava Studio' : 'Tandava'}</a></Button>}
      <p className="text-sm text-muted-foreground">You can also tap Done to close this window and return to the app.</p>
    </div>
  </main>;
}

export function CheckoutStatus() {
  const queryClient = useQueryClient();
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    void queryClient.invalidateQueries({ queryKey: ['my-entitlements'] });
  }, [queryClient]);
  return <main className="min-h-dvh bg-background px-6 flex items-center justify-center">
    <SEOHead noindex />
    <div className="max-w-sm space-y-5 text-center">
      <h1 className="text-3xl font-semibold">Check your purchase</h1>
      <p className="text-muted-foreground">Your confirmed bookings appear in My Schedule. Packs and memberships appear in your account once payment is processed. If you just paid, confirmation may take a moment.</p>
      <Button asChild className="w-full"><Link to="/my-schedule">View my schedule</Link></Button>
      <Button asChild variant="outline" className="w-full"><Link to="/account">View packs and memberships</Link></Button>
      <Button asChild variant="ghost"><Link to="/discover">Keep exploring</Link></Button>
    </div>
  </main>;
}
