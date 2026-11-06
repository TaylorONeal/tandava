/**
 * Shared chrome for the public marketing doors (For studios, landing pages,
 * Open source, Support, legal, and Discover).
 *
 * Three audiences, three doors, one nav:
 *   /discover      students who want a class
 *   /              studio owners who want the hosted product
 *   /open-source   developers and self-hosters
 * See docs/plans/AUDIENCES_AND_COPY.md.
 *
 * Look: the studio front door style from the Tandava Studio store art, light
 * only (index.css `.mkt`). Discover passes `classic` and keeps the app theme
 * until it gets its own pass.
 */
import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { LEGAL_LINKS } from "@/content/legal";
import { STUDIO_SIGNUP_HREF } from "@/lib/audience";

const NAV = [
  { to: "/", label: "For studios", end: true },
  { to: "/studio-app", label: "Studio app" },
  { to: "/discover", label: "Find a class" },
  { to: "/open-source", label: "Open source" },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className={`flex h-8 w-8 items-center justify-center rounded-lg font-brand text-lg font-extrabold leading-none ${
          dark ? "bg-lime text-ink" : "bg-ink text-lime"
        }`}
      >
        t
      </span>
      <span className="font-brand text-xl font-extrabold tracking-tight">Tandava</span>
    </span>
  );
}

export function MarketingShell({
  children,
  maxWidth = "max-w-6xl",
  classic = false,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  classic?: boolean;
}) {
  useEffect(() => {
    const root = document.documentElement;
    if (classic) {
      root.classList.remove("mkt-page");
      return;
    }
    root.classList.add("mkt-page");
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previous = meta?.content;
    if (meta) meta.content = "#FFF8EE";
    return () => {
      root.classList.remove("mkt-page");
      if (meta && previous) meta.content = previous;
    };
  }, [classic]);

  return (
    <div className={`min-h-screen bg-background text-foreground ${classic ? "" : "mkt"}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow-md"
      >
        Skip to main content
      </a>
      <header className={classic ? "border-b border-border" : "border-b border-ink/10"}>
        <div className={`${maxWidth} mx-auto flex items-center justify-between gap-4 px-6 py-4`}>
          <Link to="/" aria-label="Tandava home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `hidden md:inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold transition-colors hover:bg-foreground/5 ${
                    isActive ? "bg-ink/[0.06] text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link
              to="/auth/login"
              className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            >
              Sign in
            </Link>
            {!classic && (
              <Link
                to={STUDIO_SIGNUP_HREF}
                className="ms-1 inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-bold text-paper hover:bg-plum"
              >
                Set up<span className="hidden sm:inline">&nbsp;your studio</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="mt-20 bg-ink text-paper">
        <div className={`${maxWidth} mx-auto px-6 py-10`}>
          <Logo dark />
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-paper/70">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-paper">{n.label}</Link>
            ))}
            <Link to="/blog" className="hover:text-paper">Blog</Link>
            {LEGAL_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-paper">{l.label}</Link>
            ))}
          </div>
          <p className="mt-6 font-brand-mono text-xs uppercase tracking-[0.2em] text-paper/60">
            Purafield Studio, Austin, Texas
          </p>
        </div>
      </footer>
    </div>
  );
}
