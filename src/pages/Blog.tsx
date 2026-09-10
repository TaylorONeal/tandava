/**
 * Blog index — hero, featured post, topic browser, and the post grid.
 */

import { Link } from "react-router-dom";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogCard } from "@/components/blog/BlogCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { blogSchema, breadcrumbSchema } from "@/lib/structured-data";
import {
  getAllPosts,
  getFeaturedPost,
  getCategoriesWithCounts,
  BLOG_PUBLISHED,
} from "@/lib/blog";
import { ArrowRight } from "lucide-react";

const Blog = () => {
  const posts = getAllPosts();
  const featured = getFeaturedPost();
  const categories = getCategoriesWithCounts();
  const rest = posts.filter((p) => p.slug !== featured?.slug);

  const description =
    "Practical guides, studio growth playbooks, and product updates from Tandava — open-source studio management for yoga, pilates, and movement studios.";

  return (
    <BlogLayout>
      <SEOHead
        title="Blog | Studio Growth, Guides & Product Updates"
        description={description}
        canonical="/blog"
        ogType="website"
        noindex={!BLOG_PUBLISHED}
        structuredData={[
          blogSchema(
            posts.slice(0, 10).map((p) => ({
              title: p.title,
              slug: p.slug,
              description: p.description,
            })),
          ),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          The Tandava Blog
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      </section>

      {posts.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No posts published yet. Drafts you add to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            src/content/blog/
          </code>{" "}
          will appear here.
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <section className="mt-12" aria-labelledby="featured-heading">
              <h2 id="featured-heading" className="sr-only">
                Featured post
              </h2>
              <BlogCard post={featured} featured />
            </section>
          )}

          {/* Topic browser */}
          {categories.length > 0 && (
            <section className="mt-14" aria-labelledby="topics-heading">
              <h2
                id="topics-heading"
                className="font-display text-2xl font-semibold"
              >
                Browse by topic
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/blog/category/${cat.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {cat.name}
                    <span className="text-xs text-muted-foreground">
                      {cat.count}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent posts grid */}
          {rest.length > 0 && (
            <section className="mt-14" aria-labelledby="recent-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="recent-heading"
                  className="font-display text-2xl font-semibold"
                >
                  Latest articles
                </h2>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA */}
      <section className="mt-20 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent-teal/10 p-8 text-center md:p-12">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">
          Run your studio on software you own
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tandava is open source. Self-host it, customize it, and never pay
          per-member fees again.
        </p>
        <Link
          to="/demo"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Explore the demo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </BlogLayout>
  );
};

export default Blog;
