import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ManageLayout } from './ManageLayout';
import { isLiveStudioRoute } from '@/lib/hosted/studioRoutes';

export function StudioFeatureBoundary({ children }: { children: ReactNode }) {
  const { isDemoMode } = useAuth();
  const { pathname } = useLocation();
  if (isDemoMode || isLiveStudioRoute(pathname)) return <>{children}</>;
  return (
    <ManageLayout>
      <div className="mx-auto max-w-xl space-y-4 py-12">
        <h1 className="text-2xl font-semibold">This tool is not available yet</h1>
        <p className="text-muted-foreground">You can manage your classes, pricing and booking links from your dashboard.</p>
        <Button asChild><Link to="/manage">Back to dashboard</Link></Button>
      </div>
    </ManageLayout>
  );
}
