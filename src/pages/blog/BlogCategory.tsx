/**
 * Blog category landing page — `/blog/category/:category`.
 *
 * These pages create topical SEO silos and give each category a crawlable,
 * linkable hub.
 */

import { Link, useParams, Navigate } from "react-router-dom";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogCard } from "@/components/blog/BlogCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { breadcrumbSchema, blogSchema } from "@/lib/structured-data";
import { getPostsByCategory, getCategoryDef, BLOG_PUBLISHED } from "@/lib/blog";
import { ChevronRight } from "lucide-react";

const BlogCategory = () => {
  const { category = "" } = useParams();
  const def = getCategoryDef(category);

  // Unknown category → send to the blog index.
  if (!def) {
    return <Navigate to="/blog" replace />;
  }

  const posts = getPostsByCategory(category);

  return (
    <BlogLayout activeCategory={category}>
      <SEOHead
        title={`${def.name} | Tandava Blog`}
        description={def.description}
        canonical={`/blog/category/${category}`}
        ogType="website"
        noindex={!BLOG_PUBLISHED}
        structuredData={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: def.name, path: `/blog/category/${category}` },
          ]),
          blogSchema(
            posts.map((p) => ({
              title: p.title,
              slug: p.slug,
              description: p.description,
            })),
          ),
        ]}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <Link to="/blog" className="transition-colors hover:text-foreground">
          Blog
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-foreground">{def.name}</span>
      </nav>

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {def.name}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{def.description}</p>
      </header>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No posts in this topic yet. Check back soon.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </BlogLayout>
  );
};

export default BlogCategory;
