/**
 * ToolLayout — shell for the public, free tool pages.
 *
 * Same reasoning as BlogLayout: these are public, SEO-facing surfaces rather
 * than logged-in studio screens, so they get a lightweight marketing header and
 * footer instead of AppLayout's studio navigation.
 */

import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const TandavaMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
    <path
      d="M16 8C16 8 12 12 12 16C12 20 16 24 16 24C16 24 20 20 20 16C20 12 16 8 16 8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="2" fill="currentColor" />
  </svg>
);

export function ToolLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#tool-main"
        className="sr-only absolute start-4 top-4 z-[70] rounded-md bg-card px-3 py-2 text-sm font-medium shadow-md focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <TandavaMark className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold tracking-tight">
              Tandava{" "}
              <span className="font-normal text-muted-foreground">Tools</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/blog"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex"
            >
              Blog
            </Link>
            <Link
              to="/demo"
              className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </header>

      <main id="tool-main" className="container flex-1 py-8 md:py-12">
        {children}
      </main>

      <footer className="border-t border-border bg-card/50 py-10">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} Tandava. Open source studio software.
          </span>
          <nav aria-label="Tool footer" className="flex gap-5">
            <Link to="/open-source" className="transition-colors hover:text-foreground">
              About Tandava
            </Link>
            <a
              href="https://github.com/TaylorONeal/tandava"
              className="transition-colors hover:text-foreground"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
