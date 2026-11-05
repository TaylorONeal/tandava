import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Tag, Share2, Settings, Code2, Workflow } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Button } from '@/components/ui/button';
import { useMyAdminStudio } from '@/hooks/useAttribution';
import { canOpenLiveStudioRoute } from '@/lib/hosted/studioRoutes';

const actions = [
  { href: '/manage/offerings', title: 'Classes & pricing', detail: 'Set class details, drop-in prices, packs and memberships.', icon: Tag },
  { href: '/manage/share', title: 'Share your classes', detail: 'Copy booking links for your community.', icon: Share2 },
  { href: '/manage/embed', title: 'Your website', detail: 'Add your schedule and booking flow to your site.', icon: Code2 },
  { href: '/manage/automations', title: 'Member follow-up', detail: 'Manage your welcome and return-visit emails.', icon: Workflow },
  { href: '/manage/settings', title: 'Studio settings', detail: 'Update your details, booking page and payouts.', icon: Settings },
];

export default function LiveDashboard() {
  const { permissions } = useAuth();
  const { data: studio, isLoading, isError, refetch } = useMyAdminStudio();
  return (
    <ManageLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="space-y-2">
          <p className="text-sm text-primary">Your studio</p>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Keep your classes running and make it easy to book.</p>
        </header>
        {isLoading ? <p role="status">Loading your studio…</p> : isError ? (
          <div role="alert" className="space-y-3 rounded-xl border p-6">
            <p>We couldn't load your studio. Please try again.</p>
            <Button variant="outline" onClick={() => void refetch()}>Try again</Button>
          </div>
        ) : !studio ? (
          <section className="space-y-4 rounded-2xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Let's set up your studio</h2>
            <p className="text-muted-foreground">Add your location, first class and pricing to get started.</p>
            <Button asChild><Link to="/manage/onboarding">Set up your studio</Link></Button>
          </section>
        ) : <>
          <section className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-6 sm:p-8">
            <Calendar className="h-7 w-7 text-primary" aria-hidden="true" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Make room for a great class</h2>
              <p className="max-w-xl text-muted-foreground">Manage {studio.name}'s weekly schedule and upcoming classes in one place.</p>
            </div>
            <Button asChild><Link to="/manage/schedule">Open schedule <ArrowRight className="ms-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          </section>
          <section aria-label="Studio tools" className="grid gap-3 sm:grid-cols-2">
            {actions.filter(action => canOpenLiveStudioRoute(action.href, permissions)).map(({ href, title, detail, icon: Icon }) => (
              <Link key={href} to={href} className="group flex gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="space-y-1"><h2 className="font-semibold">{title}</h2><p className="text-sm leading-relaxed text-muted-foreground">{detail}</p></div>
              </Link>
            ))}
          </section>
        </>}
      </div>
    </ManageLayout>
  );
}
