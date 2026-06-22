/**
 * BlogLayout — a clean, brand-level shell for the blog section.
 *
 * Intentionally separate from `AppLayout` (the studio app chrome): the blog is
 * a public, SEO-facing marketing surface, so it gets its own lightweight header
 * and footer rather than the logged-in studio navigation.
 */

import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getCategoriesWithCounts } from "@/lib/blog";

interface BlogLayoutProps {
  children: ReactNode;
  /** Active category slug, for highlighting the nav. */
  activeCategory?: string;
}

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

export function BlogLayout({ children, activeCategory }: BlogLayoutProps) {
  const { pathname } = useLocation();
  // Only surface categories that actually have published posts.
  const categories = getCategoriesWithCounts();

  // Reset scroll to the top on navigation between blog pages — otherwise
  // clicking a related post from the bottom of an article lands mid-page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#blog-main"
        className="sr-only absolute left-4 top-4 z-[70] rounded-md bg-card px-3 py-2 text-sm font-medium shadow-md focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            to="/blog"
            className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <TandavaMark className="h-8 w-8 text-primary" />
            <span className="text-xl font-display font-bold tracking-tight">
              Tandava{" "}
              <span className="font-normal text-muted-foreground">Blog</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Blog categories">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/blog/category/${cat.slug}`}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <Link
            to="/demo"
            className="hidden shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex"
          >
            Try the demo
          </Link>
        </div>
      </header>

      <main id="blog-main" className="container flex-1 py-10 md:py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-10">
        <div className="container flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <TandavaMark className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">Tandava</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Open-source studio management for yoga, pilates, and movement
              studios. Insights for studio owners, teachers, and operators.
            </p>
          </div>

          <nav aria-label="Blog footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            <span className="col-span-2 font-semibold text-foreground">Topics</span>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/blog/category/${cat.slug}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="container mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Tandava. Open source studio software.</span>
          <Link to="/open-source" className="transition-colors hover:text-foreground">
            About Tandava
          </Link>
        </div>
      </footer>
    </div>
  );
}
