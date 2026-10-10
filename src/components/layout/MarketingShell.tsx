/**
 * Shared chrome for the public marketing doors (Discover, For studios, Open source).
 *
 * Three audiences, three doors, one nav:
 *   /discover      students who want a class
 *   /for-studios   studio owners who want the hosted product
 *   /open-source   developers and self-hosters
 * See docs/plans/AUDIENCES_AND_COPY.md.
 */
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LEGAL_LINKS } from "@/content/legal";

const NAV = [
  { to: "/discover", label: "Find a class" },
  { to: "/for-studios", label: "For studios" },
  { to: "/open-source", label: "Open source" },
];

export function MarketingShell({ children, maxWidth = "max-w-5xl" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow-md"
      >
        Skip to main content
      </a>
      <header className="border-b border-border">
        <div className={`${maxWidth} mx-auto px-6 py-4 flex items-center justify-between gap-4`}>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">T</span>
            <span className="font-semibold tracking-tight">Tandava</span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `hidden sm:inline-flex h-9 items-center rounded-md px-3 text-sm transition-colors hover:bg-accent ${
                    isActive ? "font-medium text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Button asChild variant="ghost" size="sm"><Link to="/auth/login">Sign in</Link></Button>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-border mt-16">
        <div className={`${maxWidth} mx-auto px-6 py-6 text-sm text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2`}>
          <span>Tandava</span>
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="hover:underline">{n.label}</Link>
          ))}
          <Link to="/blog" className="hover:underline">Blog</Link>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:underline">{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
